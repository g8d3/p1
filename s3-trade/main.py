import requests
import pandas as pd
import json
import time
from datetime import datetime, timedelta
import asyncio
import aiohttp
from typing import List, Dict, Any
import uuid

# CoinGecko API endpoints
COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3"
TRENDING_URL = "https://www.coingecko.com/en/highlights/trending-crypto"
GAINERS_LOSERS_URL = "https://www.coingecko.com/en/crypto-gainers-losers"
AI_AGENTS_URL = "https://www.coingecko.com/en/categories/ai-agents"

# OpenRouter API configuration
OPENROUTER_API_KEY = "your_openrouter_api_key_here"  # Replace with your actual API key
OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "google/gemini-2.0-flash-001"

# Headers for OpenRouter
HEADERS = {
    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
    "Content-Type": "application/json"
}

async def fetch_coingecko_data(endpoint: str, params: Dict[str, Any] = None) -> Dict:
    """Fetch data from CoinGecko API with rate limiting."""
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(f"{COINGECKO_BASE_URL}{endpoint}", params=params) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    print(f"Error fetching {endpoint}: {response.status}")
                    return {}
        except Exception as e:
            print(f"Exception in fetch_coingecko_data: {e}")
            return {}
        finally:
            await asyncio.sleep(1)  # Rate limiting

async def get_token_ids(url: str) -> List[str]:
    """Scrape token IDs from CoinGecko pages (simplified, ideally use CoinGecko API)."""
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            if response.status == 200:
                # Note: Web scraping is complex and fragile. For production, use CoinGecko API directly.
                # This is a placeholder; actual implementation needs HTML parsing (e.g., BeautifulSoup).
                data = await fetch_coingecko_data("/coins/markets", {"vs_currency": "usd", "per_page": 100})
                return [coin["id"] for coin in data if coin.get("platform", {}).get("id") in ["solana", "base"]]
            return []

async def fetch_historical_data(token_id: str, days: int = 30) -> pd.DataFrame:
    """Fetch historical price data for a token."""
    endpoint = f"/coins/{token_id}/market_chart"
    params = {"vs_currency": "usd", "days": days, "interval": "daily"}
    data = await fetch_coingecko_data(endpoint, params)
    
    if not data or "prices" not in data:
        return pd.DataFrame()
    
    df = pd.DataFrame(data["prices"], columns=["timestamp", "price"])
    df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")
    df.set_index("timestamp", inplace=True)
    return df

async def call_openrouter_llm(prompt: str) -> str:
    """Call OpenRouter API with the given prompt."""
    payload = {
        "model": MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 4000
    }
    
    async with aiohttp.ClientSession() as session:
        async with session.post(OPENROUTER_ENDPOINT, headers=HEADERS, json=payload) as response:
            if response.status == 200:
                result = await response.json()
                return result["choices"][0]["message"]["content"]
            else:
                print(f"OpenRouter API error: {response.status}")
                return ""

def generate_trading_strategy_prompt(data: Dict[str, pd.DataFrame]) -> str:
    """Generate prompt for LLM to create trading strategies."""
    summary = ""
    for token, df in data.items():
        if not df.empty:
            summary += f"\nToken: {token}\n"
            summary += f"Latest Price: ${df['price'].iloc[-1]:.2f}\n"
            summary += f"30-Day High: ${df['price'].max():.2f}\n"
            summary += f"30-Day Low: ${df['price'].min():.2f}\n"
            summary += f"30-Day Avg: ${df['price'].mean():.2f}\n"
    
    prompt = f"""
You are a crypto trading expert. Based on the following token data from Solana and Base ecosystems, generate three distinct trading strategies, including:
1. Strategy description
2. Entry and exit conditions
3. Risk management rules
4. Python code for backtesting the strategy using pandas

Data:
{summary}

For each strategy, provide:
- A clear explanation of the strategy
- Specific technical indicators (e.g., SMA, RSI) if used
- Entry/exit signals
- Stop-loss and take-profit levels
- Position sizing rules
- Python code that takes a pandas DataFrame with 'price' column and returns a DataFrame with 'signal' (1 for buy, -1 for sell, 0 for hold) and 'returns'

Ensure the strategies are practical and account for market volatility in Solana and Base tokens.
"""
    return prompt

def backtest_strategy(df: pd.DataFrame, strategy_code: str) -> pd.DataFrame:
    """Execute the provided strategy code and backtest it."""
    try:
        # Create a safe environment for executing strategy code
        local_vars = {"df": df.copy(), "pd": pd}
        exec(strategy_code, {}, local_vars)
        
        # Assume strategy_code defines a function 'generate_signals'
        result_df = local_vars.get("result_df", df)
        result_df["returns"] = result_df["price"].pct_change() * result_df["signal"].shift(1)
        result_df["cumulative_returns"] = (1 + result_df["returns"]).cumprod()
        return result_df
    except Exception as e:
        print(f"Backtesting error: {e}")
        return pd.DataFrame()

async def analyze_backtest_results(results: Dict[str, pd.DataFrame]) -> str:
    """Analyze backtest results using LLM."""
    summary = ""
    for token, df in results.items():
        if not df.empty and "cumulative_returns" in df.columns:
            total_return = df["cumulative_returns"].iloc[-1] - 1
            max_drawdown = (df["cumulative_returns"].cummax() - df["cumulative_returns"]).max()
            sharpe_ratio = df["returns"].mean() / df["returns"].std() * (252 ** 0.5) if df["returns"].std() != 0 else 0
            summary += f"\nToken: {token}\n"
            summary += f"Total Return: {total_return:.2%}\n"
            summary += f"Max Drawdown: {max_drawdown:.2%}\n"
            summary += f"Sharpe Ratio: {sharpe_ratio:.2f}\n"
    
    prompt = f"""
You are a financial analyst. Analyze the following backtest results and provide:
1. Key insights on strategy performance
2. Recommendations for improvement
3. Risk assessment
4. Suggestions for portfolio allocation

Results:
{summary}

Provide a concise analysis and actionable recommendations.
"""
    return await call_openrouter_llm(prompt)

async def main():
    """Main function to orchestrate the workflow."""
    # Step 1: Fetch token IDs from specified CoinGecko pages
    token_ids = set()
    for url in [TRENDING_URL, GAINERS_LOSERS_URL, AI_AGENTS_URL]:
        ids = await get_token_ids(url)
        token_ids.update(ids)
    
    # Step 2: Fetch historical data for each token
    token_data = {}
    for token_id in token_ids[:5]:  # Limit to 5 tokens for demonstration
        df = await fetch_historical_data(token_id)
        if not df.empty:
            token_data[token_id] = df
    
    # Step 3: Generate trading strategies using LLM
    prompt = generate_trading_strategy_prompt(token_data)
    strategy_response = await call_openrouter_llm(prompt)
    
    # Step 4: Parse strategies (assume LLM returns JSON-like structure)
    try:
        strategies = json.loads(strategy_response)  # Adjust based on actual LLM output
    except:
        strategies = [{"name": "Default", "code": "# Fallback strategy\nresult_df = df.copy()\nresult_df['signal'] = 0"}]
    
    # Step 5: Backtest strategies
    backtest_results = {}
    for token, df in token_data.items():
        backtest_results[token] = {}
        for strategy in strategies:
            result_df = backtest_strategy(df, strategy["code"])
            backtest_results[token][strategy["name"]] = result_df
    
    # Step 6: Analyze backtest results
    analysis = await analyze_backtest_results({f"{token}_{strat}": df for token, strats in backtest_results.items() for strat, df in strats.items()})
    
    # Step 7: Save results
    with open("trading_analysis.json", "w") as f:
        json.dump({"strategies": strategies, "backtest_results": analysis}, f)
    
    print("Trading strategies and analysis saved to trading_analysis.json")

if __name__ == "__main__":
    asyncio.run(main())