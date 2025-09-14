# app.py
import streamlit as st
import pandas as pd
import numpy as np
import requests
from datetime import datetime
import vectorbt as vbt

# -----------------------------
# CoinGecko API Helper Functions
# -----------------------------

@st.cache_data(ttl=600)  # Cache for 10 minutes
def fetch_top_cryptos():
    url = "https://api.coingecko.com/api/v3/coins/markets"
    params = {
        "vs_currency": "usd",
        "order": "market_cap_desc",
        "per_page": 100,
        "page": 1,
        "sparkline": False
    }
    resp = requests.get(url, params=params)
    if resp.status_code != 200:
        return []
    data = resp.json()
    return [{
        "symbol": d["symbol"].upper(),
        "name": d["name"],
        "current_price": d["current_price"],
        "price_change_24h": d["price_change_percentage_24h"],
        "fetch_date": datetime.now().isoformat()
    } for d in data]

@st.cache_data(ttl=600)
def fetch_trending_cryptos():
    url = "https://api.coingecko.com/api/v3/search/trending"
    resp = requests.get(url)
    if resp.status_code != 200:
        return []
    data = resp.json()
    items = data.get("coins", [])
    return [{
        "symbol": c["item"]["symbol"].upper(),
        "name": c["item"]["name"],
        "score": c["item"]["score"],
        "fetch_date": datetime.now().isoformat()
    } for c in items]

@st.cache_data(ttl=600)
def fetch_gainers_losers():
    url = "https://api.coingecko.com/api/v3/coins/markets"
    params = {
        "vs_currency": "usd",
        "order": "price_change_24h_desc",
        "per_page": 100,
        "page": 1,
        "sparkline": False,
        "price_change_percentage": "24h"
    }
    resp = requests.get(url, params=params)
    if resp.status_code != 200:
        return []
    data = resp.json()
    return [{
        "symbol": d["symbol"].upper(),
        "name": d["name"],
        "price_change_24h": d["price_change_percentage_24h"],
        "current_price": d["current_price"],
        "fetch_date": datetime.now().isoformat()
    } for d in data]

# -----------------------------
# Streamlit UI
# -----------------------------
st.title("📊 Grid Trading Strategy Backtester")
st.write("Backtest a grid strategy with take-profit and stop-loss at each level.")

# --- Asset Fetching Section ---
st.sidebar.header("🔍 Fetch Assets")
source = st.sidebar.selectbox(
    "Select Data Source",
    ["Top Cryptos", "Trending Cryptos", "Gainers & Losers"]
)

if st.sidebar.button("Fetch Assets"):
    with st.spinner(f"Fetching {source}..."):
        if source == "Top Cryptos":
            assets = fetch_top_cryptos()
            key = "top"
        elif source == "Trending Cryptos":
            assets = fetch_trending_cryptos()
            key = "trending"
        else:
            assets = fetch_gainers_losers()
            key = "gainers"

        # Save to session state with fetch time
        if 'fetched_assets' not in st.session_state:
            st.session_state.fetched_assets = {}
        st.session_state.fetched_assets[key] = {
            "data": assets,
            "fetch_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "source": source
        }
        st.success(f"Fetched {len(assets)} assets from {source}")

# Display fetched assets
if 'fetched_assets' in st.session_state:
    st.sidebar.subheader("Fetched Asset Groups")
    selected_groups = st.sidebar.multiselect(
        "Select groups to include in asset pool",
        options=list(st.session_state.fetched_assets.keys()),
        default=list(st.session_state.fetched_assets.keys())
    )

    # Build combined DataFrame
    combined = []
    for group_key in selected_groups:
        group = st.session_state.fetched_assets[group_key]
        df = pd.DataFrame(group["data"])
        df["source_group"] = group["source"]
        df["fetch_time"] = group["fetch_time"]
        combined.append(df)

    if combined:
        full_df = pd.concat(combined, ignore_index=True)
        full_df = full_df.drop_duplicates(subset="symbol")

        st.dataframe(full_df)

        # Allow user to filter symbols to include
        available_symbols = sorted(full_df['symbol'].unique())
        selected_symbols = st.sidebar.multiselect(
            "Choose Assets to Backtest",
            options=available_symbols,
            default=available_symbols[:5]
        )
    else:
        selected_symbols = []
else:
    selected_symbols = []
    st.info("👈 Fetch some assets to begin.")

# --- Backtesting Parameters ---
if not selected_symbols:
    st.stop()

st.sidebar.header("⚙️ Strategy Parameters")
start_date = st.sidebar.date_input("Start Date", value=pd.to_datetime("2023-01-01"))
end_date = st.sidebar.date_input("End Date", value=pd.to_datetime("2024-01-01"))

n_grids = st.sidebar.slider("Number of Grid Levels", 3, 20, 10)
grid_upper = st.sidebar.number_input("Upper Price Bound (%)", -100.0, 100.0, 20.0) / 100
grid_lower = st.sidebar.number_input("Lower Price Bound (%)", -100.0, 100.0, -20.0) / 100
tp_pct = st.sidebar.number_input("Take Profit per Level (%)", 0.0, 50.0, 2.0) / 100
sl_pct = st.sidebar.number_input("Stop Loss per Level (%)", 0.0, 50.0, 3.0) / 100

# --- Download & Backtest ---
st.header("📈 Backtest Results")

for symbol in selected_symbols:
    st.subheader(f"Backtesting {symbol}")

    try:
        # Use yfinance or coingecko for OHLC data
        price = vbt.YFData.download(
            f"{symbol}-USD",
            start=start_date,
            end=end_date
        ).get('Close')

        if price.empty:
            st.warning(f"No price data for {symbol}")
            continue

        # Normalize initial price
        p0 = price.iloc[0]
        lower_bound = p0 * (1 + grid_lower)
        upper_bound = p0 * (1 + grid_upper)

        # Create grid levels
        grid_levels = np.linspace(lower_bound, upper_bound, n_grids)

        # Initialize entries and exits
        entries = []
        exits = []

        position_size = 1 / n_grids  # Equal allocation per grid
        in_position = [False] * len(grid_levels)
        tp_level = [lvl * (1 + tp_pct) for lvl in grid_levels]
        sl_level = [lvl * (1 - sl_pct) for lvl in grid_levels]

        # Simulate grid trading
        for i, (idx, px) in enumerate(price.items()):
            for j, lvl in enumerate(grid_levels):
                if not in_position[j] and px <= lvl:
                    entries.append((idx, position_size))
                    in_position[j] = True
                elif in_position[j]:
                    if px >= tp_level[j] or px <= sl_level[j]:
                        exits.append((idx, position_size))
                        in_position[j] = False

        # Convert to vectorbt signals
        entry_arr = pd.Series([amt for _, amt in entries], index=[t[0] for t in entries])
        exit_arr = pd.Series([amt for _, amt in exits], index=[t[0] for t in exits])

        # Align with price
        entry_signals = (~entry_arr.index.duplicated()).astype(int)
        exit_signals = (~exit_arr.index.duplicated()).astype(int)
        entry_signals = entry_signals.reindex(price.index, fill_value=0)
        exit_signals = exit_signals.reindex(price.index, fill_value=0)

        # Run vectorbt portfolio
        portfolio = vbt.Portfolio.from_signals(
            price,
            entries=entry_signals,
            exits=exit_signals,
            size=1,
            upon_opposite_entry=vbt.PF_CONSTANTS.keep_opposite_shares_close
        )

        # Show metrics
        st.write(f"### {symbol} Results")
        stats = portfolio.stats()
        st.write(stats[['Total Return [%]', 'Win Rate [%]', 'Total Trades', 'Profit Factor']])

        # Plot
        fig = portfolio.plot()
        st.plotly_chart(fig, use_container_width=True)

    except Exception as e:
        st.error(f"Error processing {symbol}: {e}")