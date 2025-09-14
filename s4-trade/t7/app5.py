import streamlit as st
import pandas as pd
import requests
from bs4 import BeautifulSoup
import plotly.graph_objects as go
from datetime import datetime, timedelta
import vectorbt as vbt
from typing import Dict, List, Tuple
import numpy as np

# Page config
st.set_page_config(page_title="Grid Strategy Backtester", layout="wide")

# Session state initialization
if 'fetched_assets' not in st.session_state:
    st.session_state.fetched_assets = []

# Helper to get coin id
@st.cache_data(ttl=3600)
def get_coin_id(name, symbol):
    if pd.isna(name) or pd.isna(symbol):
        return None
    query = f"{name} {symbol}"
    url = "https://api.coingecko.com/api/v3/search"
    params = {'query': query}
    try:
        resp = requests.get(url, params=params)
        if resp.status_code == 200:
            data = resp.json()
            if data['coins']:
                return data['coins'][0]['id']
    except:
        pass
    return None

# Function to fetch top cryptos using API
@st.cache_data(ttl=3600)
def fetch_top_cryptos(limit=50):
    url = "https://api.coingecko.com/api/v3/coins/markets"
    params = {
        'vs_currency': 'usd',
        'order': 'market_cap_desc',
        'per_page': limit,
        'page': 1,
        'sparkline': False
    }
    try:
        response = requests.get(url, params=params)
        if response.status_code == 200:
            data = response.json()
            df = pd.DataFrame(data)
            df['symbol'] = df['symbol'].str.upper()
            df['type'] = 'top'
            df['fetch_date'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            return df[['id', 'symbol', 'name', 'type', 'fetch_date', 'current_price', 'market_cap']]
    except:
        pass
    return pd.DataFrame()

# Function to fetch trending using scrape
@st.cache_data(ttl=1800)
def fetch_trending(limit=20):
    url = "https://www.coingecko.com/en/highlights/trending-crypto"
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
    try:
        response = requests.get(url, headers=headers)
        df_list = pd.read_html(response.text)
        trending_df = pd.DataFrame()
        for df in df_list:
            if len(df.columns) > 5 and str(df.columns[0]).strip() == '#':
                trending_df = df
                break
        if trending_df.empty:
            return pd.DataFrame()
        
        # Assume columns: 0:#, 1:Coin, 2:empty, 3:Price, 4:1h, 5:24h, 6:7d, 7:Volume, 8:Market Cap, 9:Chart
        coin_col = trending_df.iloc[:, 1]
        names = []
        symbols = []
        for coin in coin_col:
            if pd.isna(coin):
                continue
            coin_str = str(coin).strip()
            # Split to get name and symbol (last upper word)
            parts = coin_str.rsplit(' ', 1)
            if len(parts) == 2 and parts[1].isupper():
                names.append(parts[0])
                symbols.append(parts[1])
            else:
                names.append(coin_str)
                symbols.append('')
        
        trending_df['name'] = names
        trending_df['symbol'] = [s.upper() for s in symbols]
        trending_df['coin_id'] = [get_coin_id(n, s) for n, s in zip(names, symbols)]
        
        # Current price
        price_col = trending_df.iloc[:, 3].astype(str).str.replace('$', '').str.replace(',', '').str.extract(r'(\d+\.?\d*)').astype(float)
        trending_df['current_price'] = price_col.iloc[:, 0]
        
        # Market cap
        mcap_col = trending_df.iloc[:, 8].astype(str).str.replace('$', '').str.replace(',', '').str.extract(r'(\d+\.?\d*)').astype(float)
        trending_df['market_cap'] = mcap_col.iloc[:, 0]
        
        trending_df = trending_df[['coin_id', 'symbol', 'name', 'type', 'fetch_date', 'current_price', 'market_cap']].dropna(subset=['coin_id']).head(limit)
        trending_df['type'] = 'trending'
        trending_df['fetch_date'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        return trending_df
    except:
        return pd.DataFrame()

# Function to fetch gainers using scrape
@st.cache_data(ttl=1800)
def fetch_gainers(limit=20):
    url = "https://www.coingecko.com/en/crypto-gainers-losers"
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
    try:
        response = requests.get(url, headers=headers)
        df_list = pd.read_html(response.text)
        # Assume first table is gainers
        gainers_df = df_list[0]
        if gainers_df.empty or len(gainers_df.columns) < 5:
            return pd.DataFrame()
        
        # Columns: 0:#, 1:Name, 2:Price, 3:Volume, 4:24h
        coin_col = gainers_df.iloc[:, 1]
        names = []
        symbols = []
        for coin in coin_col:
            if pd.isna(coin):
                continue
            coin_str = str(coin).strip()
            words = coin_str.split()
            if len(words) >= 2 and words[0].isupper() and words[-1].isupper() and words[0] != words[-1]:
                symbols.append(words[0])
                names.append(' '.join(words[1:-1]))
            else:
                # Fallback
                parts = coin_str.rsplit(' ', 1)
                if len(parts) == 2 and parts[1].isupper():
                    names.append(parts[0])
                    symbols.append(parts[1])
                else:
                    names.append(coin_str)
                    symbols.append('')
        
        gainers_df['name'] = names
        gainers_df['symbol'] = [s.upper() for s in symbols]
        gainers_df['coin_id'] = [get_coin_id(n, s) for n, s in zip(names, symbols)]
        
        # Price
        price_col = gainers_df.iloc[:, 2].astype(str).str.replace('$', '').str.replace(',', '').str.extract(r'(\d+\.?\d*)').astype(float)
        gainers_df['current_price'] = price_col.iloc[:, 0]
        
        # 24h %
        change_col = gainers_df.iloc[:, 4].astype(str).str.replace('%', '').astype(float)
        gainers_df['price_change_percentage_24h'] = change_col / 100
        
        gainers_df = gainers_df[gainers_df['coin_id'].notna()][['coin_id', 'symbol', 'name', 'current_price', 'price_change_percentage_24h']].head(limit)
        gainers_df['type'] = 'gainers'
        gainers_df['fetch_date'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        gainers_df['market_cap'] = np.nan  # Not in table
        return gainers_df[['coin_id', 'symbol', 'name', 'type', 'fetch_date', 'current_price', 'market_cap', 'price_change_percentage_24h']]
    except:
        return pd.DataFrame()

# Function to fetch losers using scrape
@st.cache_data(ttl=1800)
def fetch_losers(limit=20):
    url = "https://www.coingecko.com/en/crypto-gainers-losers"
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
    try:
        response = requests.get(url, headers=headers)
        df_list = pd.read_html(response.text)
        # Assume second table is losers
        if len(df_list) < 2:
            return pd.DataFrame()
        losers_df = df_list[1]
        if losers_df.empty or len(losers_df.columns) < 5:
            return pd.DataFrame()
        
        # Same as gainers
        coin_col = losers_df.iloc[:, 1]
        names = []
        symbols = []
        for coin in coin_col:
            if pd.isna(coin):
                continue
            coin_str = str(coin).strip()
            words = coin_str.split()
            if len(words) >= 2 and words[0].isupper() and words[-1].isupper() and words[0] != words[-1]:
                symbols.append(words[0])
                names.append(' '.join(words[1:-1]))
            else:
                parts = coin_str.rsplit(' ', 1)
                if len(parts) == 2 and parts[1].isupper():
                    names.append(parts[0])
                    symbols.append(parts[1])
                else:
                    names.append(coin_str)
                    symbols.append('')
        
        losers_df['name'] = names
        losers_df['symbol'] = [s.upper() for s in symbols]
        losers_df['coin_id'] = [get_coin_id(n, s) for n, s in zip(names, symbols)]
        
        # Price
        price_col = losers_df.iloc[:, 2].astype(str).str.replace('$', '').str.replace(',', '').str.extract(r'(\d+\.?\d*)').astype(float)
        losers_df['current_price'] = price_col.iloc[:, 0]
        
        # 24h %
        change_col = losers_df.iloc[:, 4].astype(str).str.replace('%', '').astype(float)
        losers_df['price_change_percentage_24h'] = change_col / 100
        
        losers_df = losers_df[losers_df['coin_id'].notna()][['coin_id', 'symbol', 'name', 'current_price', 'price_change_percentage_24h']].head(limit)
        losers_df['type'] = 'losers'
        losers_df['fetch_date'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        losers_df['market_cap'] = np.nan
        return losers_df[['coin_id', 'symbol', 'name', 'type', 'fetch_date', 'current_price', 'market_cap', 'price_change_percentage_24h']]
    except:
        return pd.DataFrame()

# Function to fetch OHLCV data
@st.cache_data
def fetch_ohlcv(coin_id: str, days: int = 365):
    url = f"https://api.coingecko.com/api/v3/coins/{coin_id}/market_chart"
    params = {
        'vs_currency': 'usd',
        'days': days,
        'interval': 'daily'
    }
    try:
        response = requests.get(url, params=params)
        if response.status_code == 200:
            data = response.json()
            prices = pd.DataFrame(data['prices'], columns=['timestamp', 'close'])
            prices['timestamp'] = pd.to_datetime(prices['timestamp'], unit='ms')
            prices.set_index('timestamp', inplace=True)
            volumes = pd.DataFrame(data['total_volumes'], columns=['timestamp', 'volume'])
            volumes['timestamp'] = pd.to_datetime(volumes['timestamp'], unit='ms')
            volumes.set_index('timestamp', inplace=True)
            prices['volume'] = volumes['volume']
            prices['open'] = prices['close']  # Approximate
            prices['high'] = prices['close']
            prices['low'] = prices['close']
            return prices
    except:
        pass
    return pd.DataFrame()

# Grid Strategy Implementation with VectorBT
def run_grid_backtest(close: pd.Series, num_grids: int, grid_spacing: float, tp_pct: float, sl_pct: float, initial_capital: float = 10000):
    entry_size = initial_capital / num_grids
    
    mean_price = close.mean()
    grid_levels = np.linspace(mean_price * (1 - grid_spacing), mean_price * (1 + grid_spacing * (num_grids - 1)), num_grids)
    
    entries = pd.Series(False, index=close.index)
    exits = pd.Series(False, index=close.index)
    
    position_entries = []
    
    for i in range(1, len(close)):
        price = close.iloc[i]
        prev_price = close.iloc[i-1]
        
        # Entry: cross below grid level
        for level in grid_levels:
            if len(position_entries) < num_grids and prev_price >= level > price:
                entries.iloc[i] = True
                position_entries.append(level)
                break
        
        # Exits
        new_active = []
        for entry_price in position_entries:
            tp_price = entry_price * (1 + tp_pct)
            sl_price = entry_price * (1 - sl_pct)
            if price >= tp_price or price <= sl_price:
                exits.iloc[i] = True
            else:
                new_active.append(entry_price)
        position_entries = new_active
    
    pf = vbt.Portfolio.from_signals(
        close, entries, exits,
        size=entry_size / close,
        init_cash=initial_capital,
        fees=0.001,
        freq='D'
    )
    
    return pf

# Streamlit App
st.title("Grid Trading Strategy Backtester with TP/SL")

# Sidebar for fetching
st.sidebar.header("Fetch Assets")

col1, col2 = st.sidebar.columns(2)
with col1:
    if st.button("Fetch Top Cryptos"):
        df = fetch_top_cryptos(20)
        if not df.empty:
            st.session_state.fetched_assets.append(df)
            st.rerun()

with col2:
    if st.button("Fetch Trending"):
        df = fetch_trending(20)
        if not df.empty:
            st.session_state.fetched_assets.append(df)
            st.rerun()

col3, col4 = st.sidebar.columns(2)
with col3:
    if st.button("Fetch Gainers"):
        df = fetch_gainers(20)
        if not df.empty:
            st.session_state.fetched_assets.append(df)
            st.rerun()

with col4:
    if st.button("Fetch Losers"):
        df = fetch_losers(20)
        if not df.empty:
            st.session_state.fetched_assets.append(df)
            st.rerun()

# Display fetched assets table
if st.session_state.fetched_assets:
    st.subheader("Fetched Assets")
    all_assets_list = []
    for df in st.session_state.fetched_assets:
        df_copy = df.copy()
        if 'price_change_percentage_24h' not in df_copy.columns:
            df_copy['price_change_percentage_24h'] = np.nan
        if 'market_cap' not in df_copy.columns:
            df_copy['market_cap'] = np.nan
        df_copy = df_copy.rename(columns={'id': 'coin_id'})  # Standardize column name
        all_assets_list.append(df_copy)
    all_assets = pd.concat(all_assets_list, ignore_index=True)
    
    # Dedup by symbol
    all_assets = all_assets.drop_duplicates(subset=['symbol'])
    
    # Add selected if not
    if 'selected' not in all_assets.columns:
        all_assets['selected'] = False
    
    edited_df = st.data_editor(
        all_assets[['selected', 'symbol', 'name', 'type', 'fetch_date', 'current_price', 'market_cap', 'price_change_percentage_24h']],
        column_config={
            "selected": st.column_config.CheckboxColumn("Include", default=False),
            "market_cap": st.column_config.NumberColumn("Market Cap", format="$%.0f"),
            "current_price": st.column_config.NumberColumn("Price", format="$%.4f"),
            "price_change_percentage_24h": st.column_config.NumberColumn("24h %", format="%.2f%%")
        },
        use_container_width=True,
        hide_index=False
    )
    
    selected_rows = edited_df[edited_df['selected']]
    available_symbols = selected_rows['symbol'].tolist()
    selected_rows = selected_rows.merge(all_assets[['symbol', 'coin_id']], on='symbol', how='left')
    available_ids = dict(zip(selected_rows['symbol'], selected_rows['coin_id']))
else:
    st.info("Fetch some assets first.")
    available_symbols = []
    available_ids = {}

# Main section
if available_symbols:
    st.subheader("Select Asset")
    selected_symbol = st.selectbox("Choose asset:", available_symbols)
    coin_id = available_ids.get(selected_symbol)
    
    if coin_id:
        days = st.slider("Backtest period (days)", 30, 730, 365)
        data = fetch_ohlcv(coin_id, days)
        
        if not data.empty:
            st.subheader(f"{selected_symbol} Price Data")
            st.line_chart(data['close'])
            
            # Strategy params
            st.subheader("Grid Strategy Parameters")
            col_a, col_b, col_c = st.columns(3)
            with col_a:
                num_grids = st.slider("Number of Grids", 3, 20, 5)
            with col_b:
                grid_spacing = st.slider("Grid Spacing (%)", 0.5, 10.0, 2.0) / 100
            with col_c:
                initial_capital = st.number_input("Initial Capital ($)", 1000, 100000, 10000)
            
            col_d, col_e = st.columns(2)
            with col_d:
                tp_pct = st.slider("Take Profit (%)", 1.0, 20.0, 5.0) / 100
            with col_e:
                sl_pct = st.slider("Stop Loss (%)", 1.0, 20.0, 3.0) / 100
            
            if st.button("Run Backtest"):
                pf = run_grid_backtest(data['close'], num_grids, grid_spacing, tp_pct, sl_pct, initial_capital)
                
                # Results
                st.subheader("Backtest Results")
                
                # Stats
                stats = pf.stats()
                st.write(stats)
                
                # Equity curve
                fig = go.Figure()
                fig.add_trace(go.Scatter(x=pf.portfolio.index, y=pf.portfolio, name='Portfolio Value'))
                buy_hold_value = initial_capital * (data['close'] / data['close'].iloc[0])
                fig.add_trace(go.Scatter(x=data.index, y=buy_hold_value, name='Buy & Hold'))
                fig.update_layout(title=f"{selected_symbol} Grid Strategy vs Buy & Hold")
                st.plotly_chart(fig, use_container_width=True)
                
                # Trades
                trades = pf.trades.records_readable
                if not trades.empty:
                    st.subheader("Trades")
                    st.dataframe(trades)
                else:
                    st.info("No trades generated.")
        else:
            st.error("Failed to fetch price data.")
    else:
        st.error("Coin ID not found.")
else:
    st.info("Select assets from the table to enable selection.")