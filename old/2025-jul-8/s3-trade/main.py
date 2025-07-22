import requests
import json
import time
import os
from datetime import datetime, timedelta
import numpy as np
from collections import defaultdict
import pandas as pd
from dotenv import load_dotenv

# Load environment variables from .env file (if present)
load_dotenv()

# Configuration variables
HELIUS_API_KEY = os.getenv("HELIUS_API_KEY")
RAYDIUM_PROGRAM_ID = os.getenv("RAYDIUM_PROGRAM_ID", "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8")  # Default Raydium program ID
N_DAYS = int(os.getenv("N_DAYS", 7))  # Default to 7 days

# Validate required variables
if not HELIUS_API_KEY:
    raise ValueError("HELIUS_API_KEY is not set. Please set it in .env or environment variables.")

# Helius API endpoints
HELIUS_API_URL = "https://api.helius.xyz/v1/transactions"
HELIUS_PRICE_URL = "https://api.helius.xyz/v1/token-price"

def get_token_price(token_mint):
    """Fetch current USD price for a token using Helius token price API."""
    try:
        params = {"api-key": HELIUS_API_KEY, "mint": token_mint}
        response = requests.get(HELIUS_PRICE_URL, params=params)
        response.raise_for_status()
        data = response.json()
        return data.get("price", 0)  # Returns price in USD or 0 if unavailable
    except Exception as e:
        print(f"Error fetching price for {token_mint}: {e}")
        return 0

def fetch_dex_trades(start_time, end_time, limit=1000):
    """Fetch Raydium DEX trades within a time range using Helius Enhanced Transaction API."""
    trades = []
    last_signature = None
    
    while True:
        params = {
            "api-key": HELIUS_API_KEY,
            "programIds": [RAYDIUM_PROGRAM_ID],
            "startTime": int(start_time.timestamp()),
            "endTime": int(end_time.timestamp()),
            "limit": limit,
            "types": ["SWAP"]
        }
        if last_signature:
            params["before"] = last_signature
        
        try:
            response = requests.get(HELIUS_API_URL, params=params)
            response.raise_for_status()
            data = response.json()
            
            if not data:
                break
                
            trades.extend(data)
            last_signature = data[-1]["signature"] if data else None
            
            if len(data) < limit:
                break
                
            time.sleep(0.5)  # Respect rate limits
        except Exception as e:
            print(f"Error fetching trades: {e}")
            break
    
    return trades

def calculate_trade_pl(trade):
    """Calculate profit/loss for a single trade in USD."""
    try:
        # Extract token transfers from swap event
        transfers = trade.get("tokenTransfers", [])
        if len(transfers) < 2:  # Expect at least one token in, one out
            return 0, None
        
        # Assume first transfer is token sold, second is token bought
        token_sold = transfers[0]
        token_bought = transfers[1]
        
        # Get USD prices for tokens
        price_sold = get_token_price(token_sold["mint"])
        price_bought = get_token_price(token_bought["mint"])
        
        # Calculate P/L: (Value of token bought - Value of token sold)
        amount_sold = token_sold["amount"] / (10 ** token_sold["decimals"])
        amount_bought = token_bought["amount"] / (10 ** token_bought["decimals"])
        pl_usd = (amount_bought * price_bought) - (amount_sold * price_sold)
        
        # Get trader's wallet (user initiating the swap)
        trader = trade.get("source", None)
        
        return pl_usd, trader
    except Exception as e:
        print(f"Error calculating P/L for trade: {e}")
        return 0, None

def compute_sharpe_ratio(daily_pl):
    """Calculate Sharpe Ratio for a trader's daily P/L series."""
    if not daily_pl or len(daily_pl) < 2:
        return 0
    
    # Convert to numpy array
    returns = np.array(daily_pl)
    
    # Calculate mean daily return and volatility (std dev)
    mean_return = np.mean(returns)
    volatility = np.std(returns, ddof=1)
    
    # Sharpe Ratio: (Mean Return - Risk-Free Rate) / Volatility
    # Assume risk-free rate = 0 for simplicity
    if volatility == 0:
        return 0
    return mean_return / volatility

def get_top_traders(n_days=N_DAYS):
    """Fetch and rank top traders by risk-adjusted returns over n days."""
    # Define time range
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(days=n_days)
    
    # Fetch DEX trades
    print(f"Fetching Raydium trades from {start_time} to {end_time}...")
    trades = fetch_dex_trades(start_time, end_time)
    print(f"Fetched {len(trades)} trades.")
    
    # Aggregate P/L by trader and day
    trader_daily_pl = defaultdict(lambda: defaultdict(list))
    for trade in trades:
        pl_usd, trader = calculate_trade_pl(trade)
        if pl_usd == 0 or not trader:
            continue
        
        # Get trade timestamp and convert to date
        timestamp = trade.get("timestamp", 0)
        trade_date = datetime.utcfromtimestamp(timestamp).date()
        
        # Store P/L by trader and date
        trader_daily_pl[trader][trade_date].append(pl_usd)
    
    # Calculate Sharpe Ratio for each trader
    trader_metrics = []
    for trader, daily_pl_dict in trader_daily_pl.items():
        # Sum P/L for each day
        daily_pl = []
        for date in (start_time + timedelta(days=i) for i in range(n_days)):
            date = date.date()
            total_pl = sum(daily_pl_dict.get(date, []))
            daily_pl.append(total_pl)
        
        # Compute Sharpe Ratio
        sharpe = compute_sharpe_ratio(daily_pl)
        total_pl = sum(sum(pls) for pls in daily_pl_dict.values())
        
        trader_metrics.append({
            "trader": trader,
            "total_pl_usd": total_pl,
            "sharpe_ratio": sharpe
        })
    
    # Sort by Sharpe Ratio (descending)
    trader_metrics.sort(key=lambda x: x["sharpe_ratio"], reverse=True)
    
    # Return top 10 traders
    return trader_metrics[:10]

def main():
    """Main function to run the analysis and save results."""
    top_traders = get_top_traders()
    
    # Save results to JSON
    output = {
        "n_days": N_DAYS,
        "timestamp": datetime.utcnow().isoformat(),
        "top_traders": top_traders
    }
    
    with open("top_traders.json", "w") as f:
        json.dump(output, f, indent=2)
    
    print("Top traders saved to top_traders.json")
    for trader in top_traders:
        print(f"Trader: {trader['trader'][:8]}..., P/L: ${trader['total_pl_usd']:.2f}, Sharpe: {trader['sharpe_ratio']:.2f}")

if __name__ == "__main__":
    main()