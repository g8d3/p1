import streamlit as st
import vectorbt as vbt
import pandas as pd
import numpy as np
from datetime import datetime

# Load the data
@st.cache_data
def load_data():
    df = pd.read_csv('solana_4h_ohlc.csv', parse_dates=['timestamp'], index_col='timestamp')
    return df

data = load_data()
close = data['close']
open_price = data['open']  # For more accurate entry/exit pricing if available

# App title
st.title('Solana 4H Trading Strategy Backtester & Optimizer')
st.markdown('This app uses VectorBT to backtest and optimize trading strategies on 5 years of Solana 4H OHLC data. Select a strategy, adjust parameters, and run backtests or optimizations to find profitable setups.')

# Strategy selection
strategy = st.selectbox('Select Strategy', ['Moving Average Crossover', 'RSI Mean Reversion', 'Bollinger Bands'])

# Common parameters
st.sidebar.header('Backtest Settings')
init_capital = st.sidebar.number_input('Initial Capital', value=10000.0, min_value=1000.0)
fees = st.sidebar.slider('Transaction Fees (%)', 0.0, 1.0, 0.1, step=0.05) / 100
freq = '4H'

# Strategy-specific parameters and logic
if strategy == 'Moving Average Crossover':
    st.header('Moving Average Crossover Strategy')
    st.markdown('Buy when fast MA crosses above slow MA; Sell when fast MA crosses below slow MA.')

    # Manual backtest params
    fast_period = st.slider('Fast MA Period', 5, 50, 10)
    slow_period = st.slider('Slow MA Period', 10, 100, 30, help='Must be greater than fast period')

    # Run manual backtest
    if st.button('Run Backtest'):
        fast_ma = vbt.MA.run(close, window=fast_period)
        slow_ma = vbt.MA.run(close, window=slow_period)
        entries = fast_ma.ma_crossed_above(slow_ma)
        exits = fast_ma.ma_crossed_below(slow_ma)
        
        pf = vbt.Portfolio.from_signals(
            close=close,
            entries=entries,
            exits=exits,
            price=open_price,  # Use open for next bar entry/exit
            init_cash=init_capital,
            fees=fees,
            freq=freq
        )
        
        st.subheader('Backtest Results')
        st.write(pf.stats())
        
        st.subheader('Equity Curve')
        fig = pf.plot()
        st.plotly_chart(fig)
        
        st.subheader('Trades')
        st.dataframe(pf.trades.records_readable)


    # Optimization for Moving Average Crossover
    st.header('Optimize Parameters')
    # Split min/max and step into separate sliders
    fast_range = st.slider('Fast MA Range (min, max)', 5, 50, (5, 30), help='Select min and max for Fast MA')
    fast_min, fast_max = fast_range  # Unpack min and max
    fast_step = st.slider('Fast MA Step', 1, 10, 5, help='Step size for Fast MA range')

    slow_range = st.slider('Slow MA Range (min, max)', 10, 100, (10, 60), help='Select min and max for Slow MA')
    slow_min, slow_max = slow_range  # Unpack min and max
    slow_step = st.slider('Slow MA Step', 1, 10, 5, help='Step size for Slow MA range')

    if st.button('Run Optimization'):
        # Convert NumPy arrays to lists to avoid Numba hashing issue
        fast_windows = list(np.arange(fast_min, fast_max + 1, fast_step))
        slow_windows = list(np.arange(slow_min, slow_max + 1, slow_step))  
              
        ma_cross = vbt.MA.run_combs(close, window=[fast_windows, slow_windows], short_names=['fast', 'slow'])
        entries = ma_cross.fast_ma_crossed_above(ma_cross.slow_ma)
        exits = ma_cross.fast_ma_crossed_below(ma_cross.slow_ma)
        
        pf_kwargs = dict(price=open_price, fees=fees, freq=freq)
        pf = vbt.Portfolio.from_signals(close, entries, exits, init_cash=init_capital, **pf_kwargs)
        
        # Find best by total return or Sharpe
        best_idx_return = pf.total_return().idxmax()
        best_idx_sharpe = pf.sharpe_ratio().idxmax()
        
        st.subheader('Optimization Results')
        st.markdown(f'**Best by Total Return:** Fast={best_idx_return[0]}, Slow={best_idx_return[1]} - Return: {pf.total_return().max():.2%}')
        st.markdown(f'**Best by Sharpe Ratio:** Fast={best_idx_sharpe[0]}, Slow={best_idx_sharpe[1]} - Sharpe: {pf.sharpe_ratio().max():.2f}')
        
        # Heatmap of returns
        returns_heatmap = pf.total_return().vbt.heatmap(
            x_level='slow_window', y_level='fast_window', symmetric=False
        )
        st.plotly_chart(returns_heatmap)


elif strategy == 'RSI Mean Reversion':
    st.header('RSI Mean Reversion Strategy')
    st.markdown('Buy when RSI crosses below lower threshold; Sell when RSI crosses above upper threshold.')

    # Manual backtest params
    rsi_period = st.slider('RSI Period', 5, 30, 14)
    rsi_lower = st.slider('RSI Lower Threshold', 10, 50, 30)
    rsi_upper = st.slider('RSI Upper Threshold', 50, 90, 70)

    # Run manual backtest
    if st.button('Run Backtest'):
        rsi = vbt.RSI.run(close, window=rsi_period)
        entries = rsi.rsi_crossed_below(rsi_lower)
        exits = rsi.rsi_crossed_above(rsi_upper)
        
        pf = vbt.Portfolio.from_signals(
            close=close,
            entries=entries,
            exits=exits,
            price=open_price,
            init_cash=init_capital,
            fees=fees,
            freq=freq
        )
        
        st.subheader('Backtest Results')
        st.write(pf.stats())
        
        st.subheader('Equity Curve')
        fig = pf.plot()
        st.plotly_chart(fig)
        
        st.subheader('Trades')
        st.dataframe(pf.trades.records_readable)

    # Optimization for RSI
    st.header('Optimize Parameters')
    period_range = st.slider('RSI Period Range (min, max)', 5, 30, (5, 20), help='Select min and max for RSI period')
    period_min, period_max = period_range
    period_step = st.slider('RSI Period Step', 1, 5, 1, help='Step size for RSI period')

    lower_range = st.slider('Lower Threshold Range (min, max)', 10, 50, (20, 40), help='Select min and max for lower threshold')
    lower_min, lower_max = lower_range
    lower_step = st.slider('Lower Threshold Step', 1, 5, 5, help='Step size for lower threshold')

    upper_range = st.slider('Upper Threshold Range (min, max)', 50, 90, (60, 80), help='Select min and max for upper threshold')
    upper_min, upper_max = upper_range
    upper_step = st.slider('Upper Threshold Step', 1, 5, 5, help='Step size for upper threshold')

    if st.button('Run Optimization'):
        periods = list(np.arange(period_min, period_max + 1, period_step))  # Convert to list
        lowers = list(np.arange(lower_min, lower_max + 1, lower_step))      # Convert to list
        uppers = list(np.arange(upper_min, upper_max + 1, upper_step))      # Convert to list   
             
        rsi_ind = vbt.RSI.run(close, window=periods)
        param_product = vbt.ParamProduct([lowers, uppers], keys=['lower', 'upper'])
        
        entries = rsi_ind.rsi_crossed_below(param_product.lower).vbt.broadcast_to(rsi_ind.rsi)
        exits = rsi_ind.rsi_crossed_above(param_product.upper).vbt.broadcast_to(rsi_ind.rsi)
        
        pf_kwargs = dict(price=open_price, fees=fees, freq=freq)
        pf = vbt.Portfolio.from_signals(close, entries, exits, init_cash=init_capital, **pf_kwargs)
        
        best_idx_return = pf.total_return().idxmax()
        best_idx_sharpe = pf.sharpe_ratio().idxmax()
        
        st.subheader('Optimization Results')
        st.markdown(f'**Best by Total Return:** Period={best_idx_return[0]}, Lower={best_idx_return[1]}, Upper={best_idx_return[2]} - Return: {pf.total_return().max():.2%}')
        st.markdown(f'**Best by Sharpe Ratio:** Period={best_idx_sharpe[0]}, Lower={best_idx_sharpe[1]}, Upper={best_idx_sharpe[2]} - Sharpe: {pf.sharpe_ratio().max():.2f}')

elif strategy == 'Bollinger Bands':
    st.header('Bollinger Bands Strategy')
    st.markdown('Buy when price crosses below lower band; Sell when price crosses above upper band.')

    # Manual backtest params
    bb_period = st.slider('BB Period', 10, 50, 20)
    bb_std = st.slider('BB Std Dev', 1.0, 3.0, 2.0, step=0.1)

    # Run manual backtest
    if st.button('Run Backtest'):
        bb = vbt.BBANDS.run(close, window=bb_period, alpha=bb_std)
        entries = close.vbt.crossed_below(bb.lower)
        exits = close.vbt.crossed_above(bb.upper)
        
        pf = vbt.Portfolio.from_signals(
            close=close,
            entries=entries,
            exits=exits,
            price=open_price,
            init_cash=init_capital,
            fees=fees,
            freq=freq
        )
        
        st.subheader('Backtest Results')
        st.write(pf.stats())
        
        st.subheader('Equity Curve')
        fig = pf.plot()
        st.plotly_chart(fig)
        
        st.subheader('Trades')
        st.dataframe(pf.trades.records_readable)

    # Optimization for Bollinger Bands
    st.header('Optimize Parameters')
    period_range = st.slider('BB Period Range (min, max)', 10, 50, (10, 30), help='Select min and max for BB period')
    period_min, period_max = period_range
    period_step = st.slider('BB Period Step', 1, 5, 5, help='Step size for BB period')

    std_range = st.slider('Std Dev Range (min, max)', 1.0, 3.0, (1.5, 2.5), step=0.1, help='Select min and max for Std Dev')
    std_min, std_max = std_range
    std_step = st.slider('Std Dev Step', 0.1, 1.0, 0.5, step=0.1, help='Step size for Std Dev')

    if st.button('Run Optimization'):
        periods = list(np.arange(period_min, period_max + 1, period_step))  # Convert to list
        stds = list(np.arange(std_min, std_max + std_step, std_step))      # Convert to list       
         
        bb = vbt.BBANDS.run(close, window=periods, alpha=stds)
        entries = close.vbt.crossed_below(bb.lower)
        exits = close.vbt.crossed_above(bb.upper)
        
        pf_kwargs = dict(price=open_price, fees=fees, freq=freq)
        pf = vbt.Portfolio.from_signals(close, entries, exits, init_cash=init_capital, **pf_kwargs)
        
        best_idx_return = pf.total_return().idxmax()
        best_idx_sharpe = pf.sharpe_ratio().idxmax()
        
        st.subheader('Optimization Results')
        st.markdown(f'**Best by Total Return:** Period={best_idx_return[0]}, Std={best_idx_return[1]} - Return: {pf.total_return().max():.2%}')
        st.markdown(f'**Best by Sharpe Ratio:** Period={best_idx_sharpe[0]}, Std={best_idx_sharpe[1]} - Sharpe: {pf.sharpe_ratio().max():.2f}')
        
        returns_heatmap = pf.total_return().vbt.heatmap(
            x_level='bbands_alpha', y_level='bbands_window', symmetric=False
        )
        st.plotly_chart(returns_heatmap)

# Footer
st.markdown('---')
st.markdown('Note: This is for educational purposes. Past performance does not guarantee future results. Always consider risk management.')