import streamlit as st
import pandas as pd
import numpy as np
import vectorbt as vbt
import requests
from datetime import datetime, timedelta
import time

# Set page configuration
st.set_page_config(
    page_title="Grid Strategy Backtester",
    page_icon="📊",
    layout="wide"
)

# Initialize session state variables
if 'fetched_assets' not in st.session_state:
    st.session_state.fetched_assets = pd.DataFrame()
if 'selected_assets' not in st.session_state:
    st.session_state.selected_assets = []
if 'asset_options' not in st.session_state:
    st.session_state.asset_options = []

# Function to fetch top crypto assets
def fetch_top_crypto():
    url = "https://api.coingecko.com/api/v3/coins/markets"
    params = {
        "vs_currency": "usd",
        "order": "market_cap_desc",
        "per_page": 100,
        "page": 1,
        "sparkline": "false"
    }
    response = requests.get(url, params=params)
    data = response.json()
    df = pd.DataFrame(data)
    df = df[['id', 'symbol', 'name']]
    df['fetch_date'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    return df

# Function to fetch trending crypto assets
def fetch_trending_crypto():
    url = "https://api.coingecko.com/api/v3/search/trending"
    response = requests.get(url)
    data = response.json()
    coins = data['coins']
    df = pd.DataFrame([coin['item'] for coin in coins])
    df = df[['id', 'symbol', 'name']]
    df['fetch_date'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    return df

# Function to fetch gainers/losers
def fetch_gainers_losers():
    url = "https://api.coingecko.com/api/v3/coins/markets"
    params = {
        "vs_currency": "usd",
        "order": "percent_change_24h_desc",
        "per_page": 100,
        "page": 1,
        "sparkline": "false"
    }
    response = requests.get(url, params=params)
    data = response.json()
    df = pd.DataFrame(data)
    df = df[['id', 'symbol', 'name']]
    df['fetch_date'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    return df

# Function to fetch price data
def fetch_price_data(coin_id, days=365):
    url = f"https://api.coingecko.com/api/v3/coins/{coin_id}/market_chart"
    params = {
        "vs_currency": "usd",
        "days": days,
        "interval": "daily"
    }
    response = requests.get(url, params=params)
    data = response.json()
    prices = data['prices']
    df = pd.DataFrame(prices, columns=['timestamp', 'price'])
    df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
    df.set_index('timestamp', inplace=True)
    return df

# Function to run grid strategy backtest
def run_grid_strategy(price_data, grid_levels, grid_spacing, tp_pct, sl_pct, initial_capital=10000):
    # Calculate grid levels
    start_price = price_data['price'].iloc[0]
    grid_prices = []
    
    # Create grid levels above and below start price
    for i in range(-grid_levels, grid_levels + 1):
        grid_price = start_price * (1 + grid_spacing * i)
        grid_prices.append(grid_price)
    
    # Create entry signals
    entries = pd.DataFrame(index=price_data.index, columns=range(len(grid_prices)))
    exits = pd.DataFrame(index=price_data.index, columns=range(len(grid_prices)))
    
    # Generate entry and exit signals for each grid level
    for i, grid_price in enumerate(grid_prices):
        # Entry signal: price crosses grid level
        entries[i] = (price_data['price'] <= grid_price) & (price_data['price'].shift(1) > grid_price)
        
        # Exit signals: TP or SL
        tp_price = grid_price * (1 + tp_pct)
        sl_price = grid_price * (1 - sl_pct)
        
        exits[i] = (price_data['price'] >= tp_price) | (price_data['price'] <= sl_price)
    
    # Create portfolio
    pf = vbt.Portfolio.from_signals(
        close=price_data['price'],
        entries=entries,
        exits=exits,
        init_cash=initial_capital,
        freq='D'
    )
    
    return pf

# Main app
def main():
    st.title("Grid Strategy Backtester with TP/SL")
    st.markdown("Backtest a grid trading strategy with take profit and stop loss at each grid level.")
    
    # Section 1: Fetch assets
    st.header("1. Fetch Crypto Assets")
    
    col1, col2 = st.columns(2)
    
    with col1:
        source = st.selectbox(
            "Select asset source:",
            ["Top Crypto Assets", "Trending Crypto", "Crypto Gainers/Losers"]
        )
    
    with col2:
        if st.button("Fetch Assets", type="primary"):
            with st.spinner("Fetching assets..."):
                try:
                    if source == "Top Crypto Assets":
                        st.session_state.fetched_assets = fetch_top_crypto()
                    elif source == "Trending Crypto":
                        st.session_state.fetched_assets = fetch_trending_crypto()
                    else:
                        st.session_state.fetched_assets = fetch_gainers_losers()
                    st.success(f"Fetched {len(st.session_state.fetched_assets)} assets!")
                except Exception as e:
                    st.error(f"Error fetching assets: {e}")
    
    # Display fetched assets
    if not st.session_state.fetched_assets.empty:
        st.subheader("Fetched Assets")
        
        # Add a selection column
        if 'selected' not in st.session_state.fetched_assets.columns:
            st.session_state.fetched_assets['selected'] = False
        
        # Let user select assets
        edited_df = st.data_editor(
            st.session_state.fetched_assets,
            column_config={
                "selected": st.column_config.CheckboxColumn(
                    "Select",
                    help="Select assets to include in the asset selector",
                    default=False,
                )
            },
            disabled=["id", "symbol", "name", "fetch_date"],
            hide_index=True,
        )
        
        # Update selected assets
        if st.button("Update Asset Selector"):
            selected_rows = edited_df[edited_df['selected']]
            st.session_state.selected_assets = selected_rows['id'].tolist()
            st.session_state.asset_options = list(zip(selected_rows['id'], selected_rows['symbol']))
            st.success(f"Updated asset selector with {len(st.session_state.selected_assets)} assets!")
    
    # Section 2: Backtest grid strategy
    st.header("2. Backtest Grid Strategy")
    
    if st.session_state.asset_options:
        # Asset selection
        col1, col2 = st.columns(2)
        
        with col1:
            asset_id = st.selectbox(
                "Select asset to backtest:",
                options=[opt[0] for opt in st.session_state.asset_options],
                format_func=lambda x: next(opt[1] for opt in st.session_state.asset_options if opt[0] == x)
            )
        
        with col2:
            days = st.slider("Historical data period (days):", 30, 730, 365)
        
        # Fetch price data
        with st.spinner(f"Fetching price data for {asset_id}..."):
            try:
                price_data = fetch_price_data(asset_id, days)
                st.success(f"Fetched {len(price_data)} days of price data!")
            except Exception as e:
                st.error(f"Error fetching price data: {e}")
                return
        
        # Display price chart
        st.subheader(f"Price Chart: {asset_id}")
        st.line_chart(price_data['price'])
        
        # Grid strategy parameters
        st.subheader("Grid Strategy Parameters")
        
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            grid_levels = st.number_input("Grid Levels (each side):", min_value=1, max_value=20, value=5)
        
        with col2:
            grid_spacing = st.number_input("Grid Spacing (%):", min_value=0.1, max_value=10.0, value=1.0, step=0.1) / 100
        
        with col3:
            tp_pct = st.number_input("Take Profit (%):", min_value=0.1, max_value=10.0, value=0.5, step=0.1) / 100
        
        with col4:
            sl_pct = st.number_input("Stop Loss (%):", min_value=0.1, max_value=10.0, value=1.0, step=0.1) / 100
        
        initial_capital = st.number_input("Initial Capital ($):", min_value=100, max_value=100000, value=10000, step=1000)
        
        # Run backtest
        if st.button("Run Backtest", type="primary"):
            with st.spinner("Running backtest..."):
                try:
                    pf = run_grid_strategy(
                        price_data, 
                        grid_levels, 
                        grid_spacing, 
                        tp_pct, 
                        sl_pct, 
                        initial_capital
                    )
                    
                    # Display results
                    st.subheader("Backtest Results")
                    
                    # Performance metrics
                    col1, col2, col3 = st.columns(3)
                    
                    with col1:
                        st.metric("Total Return", f"{pf.total_return():.2%}")
                        st.metric("Sharpe Ratio", f"{pf.sharpe_ratio():.2f}")
                    
                    with col2:
                        st.metric("Max Drawdown", f"{pf.max_drawdown():.2%}")
                        st.metric("Win Rate", f"{pf.trades.win_rate():.2%}")
                    
                    with col3:
                        st.metric("Total Trades", pf.trades.count())
                        st.metric("Final Equity", f"${pf.value():.2f}")
                    
                    # Equity curve
                    st.subheader("Equity Curve")
                    st.line_chart(pf.value())
                    
                    # Trade history
                    st.subheader("Trade History")
                    trades_df = pf.trades.records_readable
                    st.dataframe(trades_df)
                    
                    # Drawdown
                    st.subheader("Drawdown")
                    st.line_chart(pf.drawdown())
                    
                except Exception as e:
                    st.error(f"Error running backtest: {e}")
    else:
        st.info("Please fetch and select assets to backtest.")

if __name__ == "__main__":
    main()