import yfinance as yf
import pandas as pd
import requests
from typing import List, Dict, Optional
import redis
import os
import logging
import json # For caching complex objects

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("fetcher")

# Shared list of supported cryptocurrencies for suffix appends
SUPPORTED_CRYPTOS = ["BTC", "ETH", "SOL", "XRP", "BNB", "ADA", "DOGE", "DOT", "MATIC", "LINK"]

# Initialize Redis client. We use the container name "redis" from docker-compose.
# Fallback to localhost if running outside docker.
REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))

try:
    cache = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=0, decode_responses=True)
    cache.ping() # Test connection
except redis.ConnectionError:
    cache = None
    logger.warning("Redis cache not available. Falling back to direct fetching.")

def fetch_historical_data(ticker: str, start_date: str) -> pd.DataFrame:
    """
    Simplified fetcher for historical quotes and dividends
    For B3 (Brazil), the ticker usually needs the '.SA' suffix
    """
    if ticker.endswith("-USD") or ticker.startswith("^") or "." in ticker:
        # Already has a suffix or is an index
        pass
    elif any(crypto in ticker.upper() for crypto in SUPPORTED_CRYPTOS):
        # It's a crypto, append -USD if not there
        if not ticker.endswith("-USD"):
            ticker = f"{ticker}-USD"
    else:
        # Default to B3 (Brazil)
        ticker = f"{ticker}.SA"
        
    cache_key = f"hist:{ticker}:{start_date}"
    
    # Try fetching from cache first
    if cache:
        cached_data = cache.get(cache_key)
        if cached_data:
            logger.info(f"CACHE HIT: Using cached data for {ticker} since {start_date}")
            df = pd.read_json(cached_data, orient='split')
            # Ensure the index is timezone-naive
            if df.index.tz is not None:
                df.index = df.index.tz_localize(None)
            return df
            
    logger.info(f"CACHE MISS: Fetching data from Yahoo Finance for {ticker} since {start_date}...")
    
    asset = yf.Ticker(ticker)
    
    # Download history
    hist = asset.history(start=start_date, auto_adjust=False)
    
    if hist is None or hist.empty:
        raise ValueError(f"Ticker '{ticker}' não encontrado ou sem dados a partir de {start_date}. Verifique o código.")
        
    df = hist[['Close', 'Dividends']].copy()
    df['Dividends'] = df['Dividends'].fillna(0)
    
    # Enforce tz-naive index to prevent bugs reading/writing cache and pandas alignment
    if df.index.tz is not None:
        df.index = df.index.tz_localize(None)
    
    # Save to cache for 24 hours (86400 seconds) to prevent memory bloat
    if cache:
        try:
            # We use 'split' orientation to preserve the DatetimeIndex perfectly
            cache.setex(cache_key, 86400, df.to_json(orient='split'))
        except Exception as e:
            logger.error(f"Failed to cache data for {ticker}: {e}")
            
    return df

def fetch_ipca_data(start_date: str) -> pd.Series:
    """
    Fetches monthly IPCA (inflation) from BCB API (Series 433).
    Returns a Series of monthly rates (e.g. 0.005 for 0.5%).
    """
    # BCB API works with DD/MM/YYYY
    start_dt = pd.to_datetime(start_date)
    formatted_start = start_dt.strftime("%d/%m/%Y")
    
    cache_key = f"ipca:{start_date}"
    
    if cache:
        cached = cache.get(cache_key)
        if cached:
            # When reading from JSON, pandas might recreate the timezone or keep it naive.
            # We enforce tz-naive to match yfinance (which we will also enforce)
            s = pd.read_json(cached, typ='series')
            if s.index.tz is not None:
                s.index = s.index.tz_localize(None)
            return s

    url = f"https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados?formato=json&dataInicial={formatted_start}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        
        # Convert to Series with DatetimeIndex
        df = pd.DataFrame(data)
        df['data'] = pd.to_datetime(df['data'], dayfirst=True).dt.tz_localize(None)
        df['valor'] = df['valor'].astype(float) / 100.0 # Convert from percentage to decimal
        
        series = df.set_index('data')['valor']
        # Resample to end of month to match our engine
        series = series.resample("ME").last()
        
        if cache:
            cache.setex(cache_key, 604800, series.to_json()) # Cache for 1 week
            
        return series
    except Exception as e:
        logger.error(f"Failed to fetch IPCA: {e}")
        return pd.Series(dtype=float)

def fetch_selic_data(start_date: str) -> pd.Series:
    """
    Fetches daily Selic rates from BCB API (Series 11).
    Returns a Series of daily rates (e.g. 0.0001 for 0.01%).
    """
    start_dt = pd.to_datetime(start_date)
    formatted_start = start_dt.strftime("%d/%m/%Y")
    
    cache_key = f"selic:{start_date}"
    
    if cache:
        cached = cache.get(cache_key)
        if cached:
            s = pd.read_json(cached, typ='series')
            if s.index.tz is not None:
                s.index = s.index.tz_localize(None)
            return s

    # Series 11 is Selic actual rate
    url = f"https://api.bcb.gov.br/dados/serie/bcdata.sgs.11/dados?formato=json&dataInicial={formatted_start}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        
        df = pd.DataFrame(data)
        df['data'] = pd.to_datetime(df['data'], dayfirst=True)
        df['valor'] = df['valor'].astype(float) / 100.0 # Convert from percentage to decimal
        
        series = df.set_index('data')['valor']
        
        if cache:
            cache.setex(cache_key, 604800, series.to_json()) # Cache for 1 week
            
        return series
    except Exception as e:
        logger.error(f"Failed to fetch Selic: {e}")
        return pd.Series(dtype=float)

def fetch_current_quotes(tickers: List[str]) -> Dict[str, dict]:
    """
    Fetches real-time prices using yfinance.
    Tries to use cache for 5 minutes (300s).
    """
    results = {}
    to_fetch = []
    
    for t in tickers:
        raw_t = t
        if t.endswith("-USD") or t.startswith("^") or "." in t:
            pass
        elif any(crypto in t.upper() for crypto in SUPPORTED_CRYPTOS):
            if not t.endswith("-USD"):
                t = f"{t}-USD"
        else:
            t = f"{t}.SA"
        
        cache_key = f"quote:{t}"
        if cache:
            cached = cache.get(cache_key)
            if cached:
                results[raw_t] = json.loads(cached)
                continue
        
        to_fetch.append((raw_t, t))

    if to_fetch:
        for raw_t, t in to_fetch:
            try:
                asset = yf.Ticker(t)
                # Use history(period="1d") as it's more reliable than fast_info for current price
                # and doesn't require slow info property access
                df = asset.history(period="1d")
                if not df.empty:
                    current_price = float(df['Close'].iloc[-1])
                    prev_close = float(asset.info.get('previousClose', current_price))
                    change = current_price - prev_close
                    change_pct = (change / prev_close) * 100 if prev_close != 0 else 0
                    
                    data = {
                        "ticker": raw_t,
                        "price": current_price,
                        "change": change,
                        "change_pct": change_pct,
                        "timestamp": df.index[-1].isoformat()
                    }
                    results[raw_t] = data
                    
                    if cache:
                        cache.setex(f"quote:{t}", 300, json.dumps(data))
                else:
                    results[raw_t] = {"error": "No data found"}
            except Exception as e:
                logger.error(f"Error fetching quote for {t}: {e}")
                results[raw_t] = {"error": str(e)}

    return results

def align_assets(tickers: List[str], start_date: str) -> Dict[str, pd.DataFrame]:
    """
    Fetches history for multiple assets and aligns them (same date index).
    This is crucial for the rebalancing engine.
    """
    data = {}
    for t in tickers:
        data[t] = fetch_historical_data(t, start_date)
        
    return data

if __name__ == "__main__":
    # Quick Test
    df_itub = fetch_historical_data("ITUB3", "2020-01-01")
    logger.info(df_itub.head())
    
    ipca = fetch_ipca_data("2020-01-01")
    logger.info("IPCA Head:\n%s", ipca.head())
