import streamlit as st
import vectorbt as vbt
import yfinance as yf
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import inspect
from typing import Any, Dict, Optional

st.set_page_config(page_title="VectorBT Playground", layout="wide")

st.title("🛝 VectorBT Playground")
st.markdown("Explore VectorBT's indicators, signals, and backtesting with an interactive UI.")

# Session state initialization
for key in ['data', 'close', 'high', 'low', 'volume', 'result', 'entries', 'exits']:
    if key not in st.session_state:
        st.session_state[key] = None

# Sidebar for data loading
st.sidebar.header("📊 Load Data")
ticker = st.sidebar.text_input("Ticker (e.g., AAPL, BTC-USD)", value="AAPL")
start_date = st.sidebar.date_input("Start Date", value=pd.to_datetime("2020-01-01"))
end_date = st.sidebar.date_input("End Date", value=pd.to_datetime("2023-01-01"))

if st.sidebar.button("Load Data"):
    try:
        # Fetch data with yfinance, forcing single ticker
        raw_data = yf.download(ticker, start=start_date, end=end_date, progress=False)

        # Validate data
        if raw_data.empty:
            st.error("No data returned for the specified ticker and date range.")
        elif not all(col in raw_data.columns for col in ['Open', 'High', 'Low', 'Close', 'Volume']):
            st.error("Data is missing required columns (Open, High, Low, Close, Volume).")
        else:
            # Ensure single-level columns (handle MultiIndex explicitly)
            if isinstance(raw_data.columns, pd.MultiIndex):
                raw_data.columns = raw_data.columns.get_level_values(0)
            elif isinstance(raw_data.index, pd.MultiIndex):
                raw_data = raw_data.xs(ticker, level='Symbol', drop_level=True)

            # Standardize column names for VectorBT
            raw_data = raw_data[['Open', 'High', 'Low', 'Close', 'Volume']]

            # Initialize VectorBT data with explicit column mapping
            st.session_state.data = vbt.YFData.from_data(raw_data)
            st.session_state.close = raw_data['Close']
            st.session_state.high = raw_data['High']
            st.session_state.low = raw_data['Low']
            st.session_state.volume = raw_data['Volume']
            st.success(f"Loaded {ticker} data ({len(raw_data)} rows)")
    except Exception as e:
        st.error(f"Error: {str(e)}")

if st.session_state.close is not None:
    col1, col2 = st.columns(2)
    with col1:
        st.metric("Data Points", len(st.session_state.close))
    with col2:
        st.metric("Date Range", f"{st.session_state.close.index[0].date()} to {st.session_state.close.index[-1].date()}")

    fig = go.Figure()
    fig.add_trace(go.Scatter(y=st.session_state.close, name='Close', line=dict(color='#1f77b4')))
    fig.update_layout(title=f"{ticker} Close Price", xaxis_title="Date", yaxis_title="Price", template="plotly_dark")
    st.plotly_chart(fig, use_container_width=True)
else:
    st.warning("Load data to start.")
    st.stop()

# Dynamic UI for function parameters
def dynamic_ui_for_func(func: callable, prefix: str = "") -> Dict[str, Any]:
    sig = inspect.signature(func)
    inputs = {}
    st.subheader(f"{func.__name__} Parameters")
    for param_name, param in sig.parameters.items():
        if param_name in ['self', 'close', 'high', 'low', 'volume', 'open', 'ohlcv']:
            continue
        default_val = param.default if param.default != inspect.Parameter.empty else (
            14 if 'window' in param_name else 0.02 if 'std' in param_name else False)
        param_type = param.annotation
        label = param_name.replace('_', ' ').title()
        if param_type == bool:
            inputs[param_name] = st.checkbox(label, value=default_val, key=f"{prefix}_{param_name}")
        elif param_type == int or 'window' in param_name:
            inputs[param_name] = st.number_input(label, value=default_val, min_value=1, step=1, key=f"{prefix}_{param_name}")
        elif param_type == float or 'factor' in param_name:
            inputs[param_name] = st.number_input(label, value=default_val, min_value=0.0, step=0.01, format="%.2f", key=f"{prefix}_{param_name}")
        else:
            inputs[param_name] = st.text_input(label, value=str(default_val), key=f"{prefix}_{param_name}")
    return inputs

def run_indicator(ind_class: Any, close: pd.Series, **kwargs):
    try:
        return ind_class.run(close, **kwargs)
    except Exception as e:
        st.error(f"Error running indicator: {e}")
        return None

def generate_signals(ind_result: Any, signal_type: str = "cross"):
    if ind_result is None:
        return None, None
    if hasattr(ind_result, 'rsi'):
        entries = ind_result.rsi_crossed_below(70)
        exits = ind_result.rsi_crossed_above(30)
    elif signal_type == "MA Crossover" and hasattr(ind_result, 'ma'):
        slow_ma = vbt.MA.run(st.session_state.close, window=max(ind_result.window, 50))
        entries = ind_result.ma_crossed_above(slow_ma)
        exits = ind_result.ma_crossed_below(slow_ma)
    else:
        threshold = st.sidebar.slider("Threshold", 0.0, 1.0, 0.5, key="signal_threshold")
        entries = ind_result > threshold
        exits = ind_result < threshold
    return entries, exits

# Category selection
category = st.sidebar.selectbox("🔍 Category", ["Overview", "Indicators", "Signals", "Portfolio", "Advanced"])

if category == "Overview":
    st.markdown("""
    ### Welcome to VectorBT Playground
    - **Indicators**: Choose from RSI, MACD, Bollinger Bands, and more.
    - **Signals**: Generate buy/sell signals from indicators.
    - **Portfolio**: Backtest strategies with metrics like Sharpe Ratio.
    - **Advanced**: Explore parameter sweeps and custom indicators.

    Start by selecting a category in the sidebar.
    """)

elif category == "Indicators":
    ind_options = {
        "RSI": vbt.indicators.basic.RSI,
        "MA": vbt.indicators.basic.MA,
        "MACD": vbt.indicators.basic.MACD,
        "BBANDS": vbt.indicators.basic.BBANDS,
        "ATR": vbt.indicators.basic.ATR,
        "STOCH": vbt.indicators.basic.STOCH,
        "OBV": vbt.indicators.basic.OBV,
        "MSTD": vbt.indicators.basic.MSTD
    }
    selected_ind = st.selectbox("Indicator", list(ind_options.keys()), key="indicator_select")
    ind_class = ind_options[selected_ind]

    inputs = dynamic_ui_for_func(ind_class.run, prefix=selected_ind)

    if st.button(f"Run {selected_ind}", key="run_indicator"):
        kwargs = {k: v for k, v in inputs.items() if v is not None and v != ""}
        result = run_indicator(ind_class, st.session_state.close, **kwargs)
        if result is not None:
            st.session_state.result = result
            fig = go.Figure()
            fig.add_trace(go.Scatter(y=st.session_state.close, name='Close', line=dict(color='#1f77b4')))
            if hasattr(result, 'rsi'):
                fig.add_trace(go.Scatter(y=result.rsi, name='RSI', line=dict(color='#ff7f0e')))
            elif hasattr(result, 'macd'):
                fig.add_trace(go.Scatter(y=result.macd, name='MACD', line=dict(color='#ff7f0e')))
                fig.add_trace(go.Scatter(y=result.signal, name='Signal', line=dict(color='#2ca02c')))
            elif hasattr(result, 'upperband'):
                fig.add_trace(go.Scatter(y=result.upperband, name='Upper Band', line=dict(color='#ff7f0e')))
                fig.add_trace(go.Scatter(y=result.lowerband, name='Lower Band', line=dict(color='#2ca02c')))
            else:
                fig.add_trace(go.Scatter(y=result.iloc[:, 0] if result.ndim > 1 else result, name=selected_ind, line=dict(color='#ff7f0e')))
            fig.update_layout(title=f"{selected_ind} for {ticker}", xaxis_title="Date", yaxis_title="Value", template="plotly_dark")
            st.plotly_chart(fig, use_container_width=True)
            st.subheader("Stats")
            st.dataframe(result.stats() if hasattr(result, 'stats') else result.describe())

elif category == "Signals":
    if st.session_state.result is None:
        st.warning("Run an indicator first.")
    else:
        signal_type = st.selectbox("Signal Type", ["Threshold Cross", "RSI Levels", "MA Crossover"], key="signal_type")
        if st.button("Generate Signals", key="generate_signals"):
            entries, exits = generate_signals(st.session_state.result, signal_type)
            if entries is not None:
                st.session_state.entries = entries
                st.session_state.exits = exits
                fig = go.Figure()
                fig.add_trace(go.Scatter(y=st.session_state.close, name='Close', line=dict(color='#1f77b4')))
                fig.add_trace(go.Scatter(y=st.session_state.close.where(entries), mode='markers', name='Buy', marker=dict(color='green', size=10)))
                fig.add_trace(go.Scatter(y=st.session_state.close.where(exits), mode='markers', name='Sell', marker=dict(color='red', size=10)))
                fig.update_layout(title=f"Signals for {ticker}", xaxis_title="Date", yaxis_title="Price", template="plotly_dark")
                st.plotly_chart(fig, use_container_width=True)

elif category == "Portfolio":
    if 'entries' not in st.session_state or st.session_state.entries is None:
        st.warning("Generate signals first.")
    else:
        init_cash = st.number_input("Initial Cash", value=100000, min_value=1000, step=1000, key="init_cash")
        fees = st.number_input("Fees (%)", value=0.1, min_value=0.0, max_value=1.0, step=0.01, format="%.2f", key="fees")
        freq = st.selectbox("Frequency", ["1D", "1H"], index=0, key="freq")

        if st.button("Run Backtest", key="run_backtest"):
            pf = vbt.Portfolio.from_signals(
                st.session_state.close,
                st.session_state.entries,
                st.session_state.exits,
                init_cash=init_cash,
                fees=fees/100,
                freq=freq
            )
            st.subheader("Portfolio Metrics")
            col1, col2, col3, col4 = st.columns(4)
            with col1:
                st.metric("Total Return", f"{pf.total_return():.2%}")
            with col2:
                st.metric("Sharpe Ratio", f"{pf.sharpe_ratio():.2f}")
            with col3:
                st.metric("Max Drawdown", f"{pf.max_drawdown():.2%}")
            with col4:
                st.metric("Win Rate", f"{pf.win_rate():.2%}")

            fig = pf.plot()
            fig.update_layout(template="plotly_dark")
            st.plotly_chart(fig, use_container_width=True)
            st.subheader("Trades")
            st.dataframe(pf.trades.records_readable)

elif category == "Advanced":
    st.markdown("""
    ### Advanced Exploration
    Try parameter sweeps or custom indicators. Example:
    ```python
    import numpy as np
    windows = np.arange(10, 30, 5)
    ma = vbt.MA.run_combs(close, window=windows)
    entries = ma.ma_crossed_above(vbt.MA.run(close, window=50))
    ```
    Run in your own script or extend this app!
    """)
