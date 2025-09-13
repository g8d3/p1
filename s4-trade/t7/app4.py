import streamlit as st
import vectorbt as vbt
import pandas as pd
import numpy as np
from datetime import datetime
import requests
import traceback
import yfinance as yf

@st.cache_data(ttl=3600)  # Cache for 1 hour
def fetch_coingecko_symbols(category='all'):
    symbols = []
    try:
        if category in ['all', 'trending']:
            trending_resp = requests.get('https://api.coingecko.com/api/v3/search/trending', timeout=10)
            trending_resp.raise_for_status()
            trending = trending_resp.json().get('coins', [])
            trending_symbols = [c['item']['symbol'].upper() for c in trending if 'item' in c and 'symbol' in c['item']]
            symbols.extend(trending_symbols)
            st.info(f"Fetched {len(trending_symbols)} trending symbols.")

        if category in ['all', 'gainers']:
            gainers_resp = requests.get('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=percent_change_24h_desc&per_page=50&page=1', timeout=10)
            gainers_resp.raise_for_status()
            gainers = gainers_resp.json()
            gainers_symbols = [c['symbol'].upper() for c in gainers if 'symbol' in c]
            symbols.extend(gainers_symbols)
            st.info(f"Fetched {len(gainers_symbols)} gainers symbols.")

        if category in ['all', 'losers']:
            losers_resp = requests.get('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=percent_change_24h_asc&per_page=50&page=1', timeout=10)
            losers_resp.raise_for_status()
            losers = losers_resp.json()
            losers_symbols = [c['symbol'].upper() for c in losers if 'symbol' in c]
            symbols.extend(losers_symbols)
            st.info(f"Fetched {len(losers_symbols)} losers symbols.")

        unique_symbols = sorted(set(symbols))
        if not unique_symbols:
            st.warning(f"No symbols fetched for category '{category}'. API may be down or returned no data. Try again or select a different category.")
            return []

        # Validate symbols with Yahoo Finance
        valid_symbols = []
        for symbol in unique_symbols:
            ticker = f"{symbol}-USD"
            try:
                data = yf.Ticker(ticker).history(period="1d")
                if not data.empty:
                    valid_symbols.append(symbol)
            except:
                continue

        if not valid_symbols:
            st.warning(f"No valid Yahoo Finance symbols found for category '{category}'. Try a different category.")
            return []

        st.success(f"Total valid unique symbols fetched: {len(valid_symbols)}")
        return valid_symbols
    except Exception as e:
        st.error(f"Error fetching symbols for category '{category}': {str(e)}\n\nStack Trace:\n{traceback.format_exc()}")
        return []

# Initialize session state
if 'fetches' not in st.session_state:
    st.session_state.fetches = []
if 'active_fetch_index' not in st.session_state:
    st.session_state.active_fetch_index = None

st.title('Grid Strategy Backtester for Top Crypto Assets')

st.markdown("""
This Streamlit app backtests a grid trading strategy using VectorBT for cryptocurrencies from CoinGecko's trending, gainers, and losers.
- **Strategy Structure**: 
  - Arithmetic grid below reference price for buy entries (long positions): levels = ref * (1 - spacing_pct * i) for i=1 to n.
  - Geometric grid above reference price for sell entries (short positions): levels = ref * (1 + spacing_pct)^i for i=1 to n.
  - Each entry has a fixed % TP and SL.
  - Simplest implementation: one entry per grid level crossing, with fixed size, shared cash, allowing overlapping positions.
  - "Spacings" is the correct term for the intervals between grid levels.
  - SL should typically be less than spacing to avoid early stops; user can adjust.
  - For now, fixed TP/SL; trailing or multi-exit can be added later.
- Data fetched from Yahoo Finance (e.g., BTC-USD). Note: Not all CoinGecko symbols may map directly to Yahoo Finance tickers.
- Symbols are fetched dynamically from CoinGecko API with a 1-hour cache. Use the fetch button to refresh and see fetch status in the table below.
""")

# Fetch section
st.subheader('Fetch Latest Symbols from CoinGecko')
fetch_category = st.selectbox('Fetch Category', ['All', 'Trending', 'Gainers', 'Losers'])
if st.button('Fetch Now'):
    new_symbols = fetch_coingecko_symbols(fetch_category.lower())
    if new_symbols:
        st.session_state.fetches.append({
            'date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'category': fetch_category,
            'symbols': new_symbols,
            'num_symbols': len(new_symbols)
        })
        st.session_state.active_fetch_index = len(st.session_state.fetches) - 1
        st.success(f"Added new fetch with {len(new_symbols)} symbols for {fetch_category}.")
    else:
        st.error("Failed to fetch valid symbols. Please try again or select a different category.")

# Display fetches table
if st.session_state.fetches:
    fetches_df = pd.DataFrame(st.session_state.fetches)[['date', 'category', 'num_symbols']]
    fetches_df['symbols_preview'] = [', '.join(f['symbols'][:5]) + ('...' if len(f['symbols']) > 5 else '') for f in st.session_state.fetches]
    st.subheader('Fetched Symbol Lists')
    st.dataframe(fetches_df)

    # Select active fetch
    selected_index = st.selectbox('Select Active Fetch', 
                                  options=range(len(st.session_state.fetches)), 
                                  format_func=lambda i: f"{st.session_state.fetches[i]['date']} - {st.session_state.fetches[i]['category']} ({st.session_state.fetches[i]['num_symbols']} symbols)",
                                  index=st.session_state.active_fetch_index if st.session_state.active_fetch_index is not None else 0)
    st.session_state.active_fetch_index = selected_index
    current_fetch = st.session_state.fetches[selected_index]
    current_symbols = current_fetch['symbols']
    st.info(f"Active Fetch: {current_fetch['date']} - {current_fetch['category']} ({current_fetch['num_symbols']} symbols)")
else:
    current_symbols = []
    st.warning('No fetches available. Please fetch symbols to proceed.')

# User inputs
symbol_options = current_symbols if current_symbols else ['No symbols fetched']
symbol = st.selectbox('Select Crypto Symbol', symbol_options) + '-USD' if current_symbols else ''
start_date = st.date_input('Start Date', datetime(2020, 1, 1))
end_date = st.date_input('End Date', datetime.today())
timeframe = st.selectbox('Timeframe', ['1d', '4h', '1h', '15m', '5m', '1m'])
num_levels_below = st.number_input('Number of Grid Levels Below', min_value=1, value=5)
arith_spacing = st.number_input('Arithmetic Spacing Below (%)', min_value=0.01, value=3.0) / 100
num_levels_above = st.number_input('Number of Grid Levels Above', min_value=1, value=5)
geo_spacing = st.number_input('Geometric Spacing Above (%)', min_value=0.01, value=3.0) / 100
tp_pct = st.number_input('Take Profit %', min_value=0.01, value=5.0) / 100
sl_pct = st.number_input('Stop Loss % (suggest < spacing)', min_value=0.01, value=2.0) / 100
grid_price = st.number_input('Grid Reference Price (0 = use mean close)', min_value=0.0, value=0.0)
initial_cash = st.number_input('Initial Cash', min_value=100.0, value=100000.0)
size_per_trade = st.number_input('Fixed Size per Trade (e.g., 1 for 1 unit)', min_value=0.01, value=1.0)

if st.button('Run Backtest', disabled=not current_symbols or symbol == '-USD'):
    try:
        # Convert dates to strings for YFData
        start_str = start_date.strftime('%Y-%m-%d')
        end_str = end_date.strftime('%Y-%m-%d')
        
        # Download data
        data = vbt.YFData.download(symbol, start=start_str, end=end_str, interval=timeframe, missing_index='drop')
        close = data.get('Close')
        
        if close.empty:
            raise ValueError(f"No data available for {symbol} in the specified date range.")
        
        st.write(f"Downloaded data for {symbol}: {len(close)} rows")
        st.write(f"Close index: {close.index[:5].tolist()}...")  # Show first 5 index entries
        st.write(f"Close values (first 5): {close.head().tolist()}")
        
        # Ensure close index is timezone-naive
        close.index = close.index.tz_localize(None)
        
        if grid_price == 0.0:
            grid_price = close.mean()
        
        # Generate grid levels
        buy_levels = grid_price * (1 - arith_spacing * np.arange(1, num_levels_below + 1))
        sell_levels = grid_price * (1 + geo_spacing) ** np.arange(1, num_levels_above + 1)
        
        # Prepare signals
        long_entries = pd.DataFrame(index=close.index, dtype=bool)
        short_entries = pd.DataFrame(index=close.index, dtype=bool)
        sizes = pd.DataFrame(index=close.index, dtype=float)
        
        for i, level in enumerate(buy_levels):
            col = f'buy_level_{i+1}_{level:.2f}'
            entry_sig = close < level
            long_entries[col] = entry_sig
            sizes[col] = size_per_trade * entry_sig.astype(float)
        
        for i, level in enumerate(sell_levels):
            col = f'sell_level_{i+1}_{level:.2f}'
            entry_sig = close > level
            short_entries[col] = entry_sig
            sizes[col] = size_per_trade * entry_sig.astype(float)
        
        # Ensure all DataFrames are aligned and timezone-naive
        long_entries.index = long_entries.index.tz_localize(None)
        short_entries.index = short_entries.index.tz_localize(None)
        sizes.index = sizes.index.tz_localize(None)
        
        # Debug: Display DataFrame info
        st.write(f"Long entries columns: {long_entries.columns.tolist()}")
        st.write(f"Short entries columns: {short_entries.columns.tolist()}")
        st.write(f"Sizes columns: {sizes.columns.tolist()}")
        st.write(f"Long entries index (first 5): {long_entries.index[:5].tolist()}")
        st.write(f"Short entries index (first 5): {short_entries.index[:5].tolist()}")
        st.write(f"Sizes index (first 5): {sizes.index[:5].tolist()}")
        
        # Combine sizes for long and short entries
        combined_sizes = sizes.where(long_entries | short_entries, 0.0)
        
        # Debug: Display combined sizes
        st.write(f"Combined sizes columns: {combined_sizes.columns.tolist()}")
        st.write(f"Combined sizes index (first 5): {combined_sizes.index[:5].tolist()}")
        
        # Run backtest
        pf = vbt.Portfolio.from_signals(
            close=close,
            long_entries=long_entries,
            short_entries=short_entries,
            size=combined_sizes,
            direction='both',
            sl_stop=sl_pct,
            tp_stop=tp_pct,
            freq=timeframe,
            init_cash=initial_cash,
            cash_sharing=True,
            fees=0.001  # Assume 0.1% trading fee
        )
        
        st.subheader('Backtest Statistics')
        stats = pf.stats()
        st.dataframe(stats)
        
        st.subheader('Equity Curve')
        fig_equity = pf.plot_equity()
        st.plotly_chart(fig_equity)
        
        st.subheader('Trades')
        trades = pf.trades.records_readable
        st.dataframe(trades)
        
    except Exception as e:
        st.error(f"Error fetching data or running backtest for {symbol}: {str(e)}\n\nStack Trace:\n{traceback.format_exc()}")