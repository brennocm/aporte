from pydantic import BaseModel
from typing import List, Optional, Dict

class AssetAllocation(BaseModel):
    ticker: str
    target_weight: float

class SimulationRequest(BaseModel):
    portfolio_id: str
    assets: List[AssetAllocation]
    start_date: str # "YYYY-MM-DD"
    end_date: Optional[str] = None # "YYYY-MM-DD"
    initial_capital: float = 0.0
    monthly_contribution: float
    contribution_frequency: str = "monthly" # "monthly", "weekly", "biweekly"
    drip_enabled: bool = True
    b3_strict: bool = True
    inflation_adjusted: bool = False
    benchmark: Optional[str] = None

class SimulationResponse(BaseModel):
    total_value: float
    total_return: float # (Total Value / Total Contributed) - 1
    cagr: float
    max_drawdown: float
    sharpe_ratio: float
    total_contributed: float
    total_dividends: float
    history: List[dict] # Time series data for charts
    benchmark_history: Optional[List[dict]] = None
    operations_log: List[dict]
    monthly_returns: List[dict]

class QuoteRequest(BaseModel):
    tickers: List[str]

class QuoteResponse(BaseModel):
    quotes: Dict[str, dict]
