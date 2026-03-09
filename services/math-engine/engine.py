"""
Aporte Simulation Engine
-----------------------------
Main backtesting loop that simulates month by month:
- Recurring monthly contributions
- Rebalancing via contributions (buys the asset furthest from target weight)
- DRIP (dividend reinvestment) or accumulating cash
- Strict B3 Mode (integer shares only) or Fractional
- Inflation discount (IPCA)
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Tuple
from dataclasses import dataclass, field


@dataclass
class AssetState:
    """State of an individual asset in the portfolio."""
    ticker: str
    target_weight: float
    shares: float = 0.0
    last_price: float = 0.0

    @property
    def value(self) -> float:
        return self.shares * self.last_price


@dataclass
class PortfolioSnapshot:
    """Monthly portfolio snapshot for charts."""
    date: str
    total_value: float
    cash: float
    contribution_cumulative: float
    dividends_cumulative: float


def run_backtest(
    price_data: Dict[str, pd.DataFrame],
    allocations: List[Dict],
    monthly_contribution: float,
    initial_capital: float = 0.0,
    end_date: str = None,
    drip_enabled: bool = True,
    b3_strict: bool = True,
    inflation_rates: pd.Series = None,
    contribution_frequency: str = "monthly",
    selic_rates: pd.Series = None,
) -> Dict:
    """
    Executes the complete backtest.

    Args:
        price_data: Dict mapping ticker to DataFrame with ['Close', 'Dividends'] columns
        allocations: List of {'ticker': str, 'target_weight': float}
        monthly_contribution: Total monthly contribution amount in BRL
        drip_enabled: If True, reinvests dividends in the origin asset
        b3_strict: If True, buys only integer shares (minimum lot = 1)
        inflation_rates: Monthly Series with inflation rate (e.g., IPCA)
        contribution_frequency: "monthly", "weekly", "biweekly"
        selic_rates: Daily Series with Selic rate for CDI benchmarking

    Returns:
        Dict with results: history, metrics, etc.
    """

    # ── Initialize asset states ──
    assets: Dict[str, AssetState] = {}
    for alloc in allocations:
        assets[alloc["ticker"]] = AssetState(
            ticker=alloc["ticker"],
            target_weight=alloc["target_weight"],
        )

    # ── Align dates: get the common range (DAILY is better for flexible contributions) ──
    common_dates = None
    for ticker, df in price_data.items():
        if common_dates is None:
            common_dates = df.index
        else:
            common_dates = common_dates.intersection(df.index)

    if common_dates is not None and end_date:
        end_ts = pd.to_datetime(end_date).tz_localize(None)
        common_dates = common_dates[common_dates <= end_ts]

    if common_dates is None or len(common_dates) == 0:
        raise ValueError("No common dates found for the selected assets in the period.")

    # ── Freq logic ──
    contribution_amount = monthly_contribution
    if contribution_frequency == "weekly":
        contribution_amount = monthly_contribution / 4.33 # Avg weeks per month
    elif contribution_frequency == "biweekly":
        contribution_amount = monthly_contribution / 2.0

    # ── Control variables ──
    cash = initial_capital
    total_contributed = initial_capital
    total_dividends = 0.0
    history: List[Dict] = []
    operations_log: List[Dict] = []
    peak_value = 0.0
    max_drawdown = 0.0
    monthly_returns: List[Dict] = []

    prev_month_total = 0.0
    last_contribution_date = None
    last_snapshot_month = -1

    for i, date in enumerate(sorted(common_dates)):
        date_str = date.strftime("%Y-%m-%d")
        
        # ── 1. Receive contributions based on frequency ──
        should_contribute = False
        if last_contribution_date is None:
            should_contribute = True
        elif contribution_frequency == "monthly":
            # First day of business month in our data? Or first appearance of the month
            if date.month != last_contribution_date.month:
                should_contribute = True
        elif contribution_frequency == "weekly":
            if (date - last_contribution_date).days >= 7:
                should_contribute = True
        elif contribution_frequency == "biweekly":
            if (date - last_contribution_date).days >= 14:
                should_contribute = True

        if should_contribute:
            cash += contribution_amount
            total_contributed += contribution_amount
            last_contribution_date = date

        # ── 2. Update prices and process dividends ──
        for ticker, asset in assets.items():
            day_data = price_data[ticker].loc[date]
            current_price = day_data["Close"]
            if not np.isnan(current_price) and current_price > 0:
                asset.last_price = current_price
            
            # Dividends on this day
            div = day_data.get("Dividends", 0)
            if div > 0 and asset.shares > 0:
                div_received = div * asset.shares
                total_dividends += div_received
                if drip_enabled:
                    if asset.last_price > 0:
                        new_shares = div_received / asset.last_price
                        if b3_strict and "-USD" not in ticker and "BTC" not in ticker:
                            new_shares = int(new_shares)
                            cash += div_received - (new_shares * asset.last_price)
                        asset.shares += new_shares
                else:
                    cash += div_received

        # ── 3. Rebalance via contributions (Aporte's magic) ──
        # We rebalance whenever we have a contribution
        if should_contribute and cash > 0:
            total_portfolio_value = sum(a.shares * a.last_price for a in assets.values()) + cash
            if total_portfolio_value > 0:
                weights = {t: (a.shares * a.last_price) / total_portfolio_value for t, a in assets.items()}
                target_ticker = max(assets.keys(), key=lambda t: assets[t].target_weight - weights.get(t, 0))
                
                if target_ticker and assets[target_ticker].last_price > 0:
                    price = assets[target_ticker].last_price
                    is_crypto = "-USD" in target_ticker or "BTC" in target_ticker
                    
                    if b3_strict and not is_crypto:
                        shares_to_buy = int(cash / price)
                        cost = shares_to_buy * price
                    else:
                        shares_to_buy = cash / price
                        cost = cash

                    if shares_to_buy > 0:
                        assets[target_ticker].shares += shares_to_buy
                        cash -= cost
                        operations_log.append({
                            "date": date_str,
                            "action": "BUY",
                            "ticker": target_ticker,
                            "shares": round(shares_to_buy, 4),
                            "price": round(price, 2),
                            "total_cost": round(cost, 2)
                        })

        # ── 4. Calculate total portfolio value ──
        total_value = sum(a.shares * a.last_price for a in assets.values()) + cash

        # ── 5. Drawdown ──
        if total_value > peak_value: peak_value = total_value
        if peak_value > 0:
            dd = (total_value - peak_value) / peak_value
            if dd < max_drawdown: max_drawdown = dd

        # ── 6. Monthly returns record (end of month) ──
        is_last_day_of_month = (i == len(common_dates) - 1) or (common_dates[i+1].month != date.month)
        if is_last_day_of_month:
            if prev_month_total > 0:
                monthly_returns.append({"date": date.strftime("%Y-%m"), "return": (total_value - prev_month_total) / prev_month_total})
            prev_month_total = total_value

        # ── 7. Inflation adjustment (monthly) ──
        if inflation_rates is not None and is_last_day_of_month:
            mask = (inflation_rates.index.year == date.year) & (inflation_rates.index.month == date.month)
            if mask.any():
                inf = inflation_rates[mask].iloc[0]
                total_value /= (1 + inf)
                cash /= (1 + inf)
                total_contributed /= (1 + inf)
                total_dividends /= (1 + inf)
                for asset in assets.values(): asset.last_price /= (1 + inf)

        # ── 8. Save snapshot (End of Month to keep history compact) ──
        if is_last_day_of_month:
            current_allocations = {t: (a.shares * a.last_price) / total_value if total_value > 0 else 0 for t, a in assets.items()}
            if total_value > 0: current_allocations["Cash"] = cash / total_value
            history.append({
                "date": date_str,
                "value": round(total_value, 2),
                "cash": round(cash, 2),
                "contributed": round(total_contributed, 2),
                "dividends": round(total_dividends, 2),
                "allocations": current_allocations
            })

    # Metrics
    final_value = history[-1]["value"] if history else 0
    total_return = ((final_value / total_contributed) - 1) * 100 if total_contributed > 0 else 0.0
    n_years = len(common_dates) / 252 # Trading days
    cagr = ((final_value / total_contributed) ** (1 / n_years) - 1) * 100 if total_contributed > 0 and n_years > 0 else 0.0

    returns_arr = [m["return"] for m in monthly_returns]
    sharpe_ratio = 0.0
    if len(returns_arr) > 1:
        stdev = np.std(returns_arr, ddof=1)
        mean_ret = np.mean(returns_arr)
        if stdev > 0:
            sharpe_ratio = (mean_ret / stdev) * np.sqrt(12)

    return {
        "total_value": round(final_value, 2),
        "total_return": round(total_return, 2),
        "cagr": round(cagr, 2),
        "max_drawdown": round(max_drawdown * 100, 2),
        "total_contributed": round(total_contributed, 2),
        "total_dividends": round(total_dividends, 2),
        "history": history,
        "operations_log": operations_log,
        "monthly_returns": monthly_returns,
        "sharpe_ratio": round(sharpe_ratio, 2)
    }
