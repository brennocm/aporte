from fastapi import FastAPI, HTTPException
from schemas import SimulationRequest, SimulationResponse, QuoteRequest, QuoteResponse
from engine import run_backtest
from fetcher import fetch_historical_data, fetch_ipca_data, fetch_selic_data, logger, fetch_current_quotes
from typing import Dict
import pandas as pd

app = FastAPI(title="Aporte Math Engine")


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "math-engine"}


@app.post("/simulate", response_model=SimulationResponse)
def run_simulation(req: SimulationRequest):
    """
    Executes a complete backtest.
    """
    logger.info(f"Starting simulation for portfolio {req.portfolio_id} | Freq: {req.contribution_frequency}")

    # Fetch historical data
    price_data = {}
    try:
        for asset in req.assets:
            price_data[asset.ticker] = fetch_historical_data(asset.ticker, req.start_date)
    except ValueError as e:
        logger.warning(f"Invalid input: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error fetching data: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch asset data from market API")

    # Fetch inflation data if requested OR if IPCA benchmark is needed
    inflation_rates = None
    if req.inflation_adjusted or (req.benchmark and "IPCA" in req.benchmark):
        logger.info("Fetching IPCA data...")
        inflation_rates = fetch_ipca_data(req.start_date)

    # Fetch Selic data if CDI benchmark is needed
    selic_rates = None
    if req.benchmark == "CDI":
        logger.info("Fetching Selic data for CDI benchmark...")
        selic_rates = fetch_selic_data(req.start_date)

    # Build allocations
    allocations = [{"ticker": a.ticker, "target_weight": a.target_weight} for a in req.assets]

    # Run engine for the portfolio
    result = run_backtest(
        price_data=price_data,
        allocations=allocations,
        monthly_contribution=req.monthly_contribution,
        initial_capital=req.initial_capital,
        end_date=req.end_date,
        drip_enabled=req.drip_enabled,
        b3_strict=req.b3_strict,
        inflation_rates=inflation_rates,
        contribution_frequency=req.contribution_frequency,
        selic_rates=selic_rates
    )

    # Run benchmark if requested
    benchmark_history = None
    BENCHMARK_TICKERS = {
        "IBOV": "^BVSP",
        "S&P 500": "^GSPC",
        "BITCOIN": "BTC-USD"
    }

    if req.benchmark:
        try:
            bench_price = None
            bench_alloc = None
            
            if req.benchmark in BENCHMARK_TICKERS:
                ticker = BENCHMARK_TICKERS[req.benchmark]
                bench_price = {ticker: fetch_historical_data(ticker, req.start_date)}
                bench_alloc = [{"ticker": ticker, "target_weight": 1.0}]
            elif req.benchmark == "CDI" and selic_rates is not None:
                # Synthesize a price series for CDI
                dates = selic_rates.index
                prices = (1 + selic_rates).cumprod() * 100.0 # Start at 100
                bench_price = {"CDI": pd.DataFrame({"Close": prices, "Dividends": 0.0}, index=dates)}
                bench_alloc = [{"ticker": "CDI", "target_weight": 1.0}]
            elif req.benchmark == "IPCA + 6%" and inflation_rates is not None:
                # Use Monthly IPCA + 6% APY (approx 0.4867% per month)
                spread_monthly = (1.06 ** (1/12)) - 1
                dates = inflation_rates.index
                prices = (1 + inflation_rates + spread_monthly).cumprod() * 100.0
                bench_price = {"IPCA_6": pd.DataFrame({"Close": prices, "Dividends": 0.0}, index=dates)}
                bench_alloc = [{"ticker": "IPCA_6", "target_weight": 1.0}]

            if bench_price:
                # Resample bench_price to daily if it was monthly (IPCA) to work with our engine's daily loop
                for k in bench_price:
                    bench_price[k] = bench_price[k].resample("D").ffill()

                bench_res = run_backtest(
                    price_data=bench_price,
                    allocations=bench_alloc,
                    monthly_contribution=req.monthly_contribution,
                    initial_capital=req.initial_capital,
                    end_date=req.end_date,
                    drip_enabled=True,
                    b3_strict=False,
                    inflation_rates=inflation_rates,
                    contribution_frequency=req.contribution_frequency
                )
                benchmark_history = bench_res["history"]
        except Exception as be:
            logger.warning(f"Benchmark simulation failed: {be}")

    return SimulationResponse(
        total_value=result["total_value"],
        total_return=result["total_return"],
        cagr=result["cagr"],
        max_drawdown=result["max_drawdown"],
        sharpe_ratio=result["sharpe_ratio"],
        total_contributed=result["total_contributed"],
        total_dividends=result["total_dividends"],
        history=result["history"],
        benchmark_history=benchmark_history,
        operations_log=result["operations_log"],
        monthly_returns=result["monthly_returns"],
    )


@app.post("/quote", response_model=QuoteResponse)
def get_quotes(req: QuoteRequest):
    """
    Fetches current price and daily variation for a list of tickers.
    """
    logger.info(f"Fetching quotes for: {req.tickers}")
    quotes = fetch_current_quotes(req.tickers)
    return QuoteResponse(quotes=quotes)
