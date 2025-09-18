import streamlit as st
import pandas as pd
import vectorbt as vbt
import numpy as np
from datetime import datetime
import traceback

# Set page config
st.set_page_config(page_title="Solana Backtesting Dashboard", layout="wide")

# Title
st.title("🚀 Solana 4H Backtesting Dashboard")
st.markdown("Backtesting trading strategies on Solana OHLC data using VectorBT")

# Load data
@st.cache_data
def load_data():
    df = pd.read_csv('solana_4h_ohlc.csv')
    df['datetime'] = pd.to_datetime(df['datetime'])
    df.set_index('datetime', inplace=True)
    return df

try:
    data = load_data()
    st.success("✅ Data loaded successfully!")
    st.write(f"Data shape: {data.shape}")
    st.write(f"Date range: {data.index.min()} to {data.index.max()}")

    # Display raw data
    with st.expander("📊 Raw Data Preview"):
        st.dataframe(data.head(20))

    # Strategy selection
    st.header("🎯 Strategy Configuration")

    col1, col2, col3 = st.columns(3)

    with col1:
        strategy_type = st.selectbox(
            "Strategy Type",
            ["SMA Crossover", "RSI", "Bollinger Bands", "MACD"]
        )

    with col2:
        initial_cash = st.number_input("Initial Cash ($)", value=10000, min_value=1000)

    with col3:
        commission = st.slider("Commission (%)", 0.0, 1.0, 0.1) / 100

    # Stop-loss and Take-profit
    col1, col2 = st.columns(2)
    with col1:
        stop_loss_pct = st.slider("Stop Loss (%)", 0.0, 20.0, 5.0) / 100
    with col2:
        take_profit_pct = st.slider("Take Profit (%)", 0.0, 50.0, 10.0) / 100

    # Strategy parameters
    st.subheader("Strategy Parameters")

    # Initialize variables
    fast_ma = slow_ma = rsi_period = rsi_oversold = rsi_overbought = 0
    bb_period = bb_std = bb_exit_threshold = 0.0
    macd_fast = macd_slow = macd_signal = 0
    macd_exit_threshold = 0.0

    if strategy_type == "SMA Crossover":
        col1, col2 = st.columns(2)
        with col1:
            fast_ma = st.slider("Fast MA Period", 5, 50, 10)
        with col2:
            slow_ma = st.slider("Slow MA Period", 10, 100, 30)

    elif strategy_type == "RSI":
        col1, col2, col3 = st.columns(3)
        with col1:
            rsi_period = st.slider("RSI Period", 5, 30, 14)
        with col2:
            rsi_oversold = st.slider("Oversold Level", 10, 40, 30)
        with col3:
            rsi_overbought = st.slider("Overbought Level", 60, 90, 70)

    elif strategy_type == "Bollinger Bands":
        col1, col2, col3 = st.columns(3)
        with col1:
            bb_period = st.slider("BB Period", 10, 50, 20)
        with col2:
            bb_std = st.slider("BB Std Dev", 1.0, 3.0, 2.0)
        with col3:
            bb_exit_threshold = st.slider("Exit Threshold", 0.0, 1.0, 0.5)

    elif strategy_type == "MACD":
        col1, col2, col3, col4 = st.columns(4)
        with col1:
            macd_fast = st.slider("Fast Period", 5, 20, 12)
        with col2:
            macd_slow = st.slider("Slow Period", 15, 40, 26)
        with col3:
            macd_signal = st.slider("Signal Period", 5, 15, 9)
        with col4:
            macd_exit_threshold = st.slider("Exit Threshold", 0.0, 1.0, 0.0)

    # Run backtest button
    if st.button("🚀 Run Backtest", type="primary"):
        with st.spinner("Running backtest..."):
            try:
                # Prepare data for vectorbt
                price = data['close']

                # Define strategy
                if strategy_type == "SMA Crossover":
                    fast_ma_series = vbt.MA.run(price, window=fast_ma)
                    slow_ma_series = vbt.MA.run(price, window=slow_ma)

                    # Generate signals
                    entries = fast_ma_series.ma_above(slow_ma_series)
                    exits = fast_ma_series.ma_below(slow_ma_series)

                elif strategy_type == "RSI":
                    rsi_indicator = vbt.RSI.run(price, window=rsi_period)
                    entries = rsi_indicator.rsi_below(rsi_oversold)
                    exits = rsi_indicator.rsi_above(rsi_overbought)

                elif strategy_type == "Bollinger Bands":
                    bb_indicator = vbt.BBANDS.run(price, window=bb_period, nbdevup=bb_std, nbdevdn=bb_std)
                    entries = price < bb_indicator.lower
                    exits = price > bb_indicator.upper * (1 + bb_exit_threshold)

                elif strategy_type == "MACD":
                    macd_indicator = vbt.MACD.run(price, fast_window=macd_fast, slow_window=macd_slow, signal_window=macd_signal)
                    entries = macd_indicator.histogram_above(0)
                    exits = macd_indicator.histogram_below(macd_exit_threshold)

                # Create portfolio
                pf = vbt.Portfolio.from_signals(
                    price,
                    entries,
                    exits,
                    init_cash=initial_cash,
                    fees=commission,
                    sl_stop=stop_loss_pct if stop_loss_pct > 0 else None,
                    tp_stop=take_profit_pct if take_profit_pct > 0 else None,
                    freq='4h'
                )

                # Display results
                st.header("📈 Backtest Results")

                # Key metrics
                col1, col2, col3, col4 = st.columns(4)

                total_return = pf.total_return()
                max_drawdown = pf.max_drawdown()
                sharpe_ratio = pf.sharpe_ratio()
                win_rate = pf.trades.win_rate()
                total_trades = len(pf.trades.records)

                with col1:
                    st.metric("Total Return", f"{total_return:.2%}")

                with col2:
                    st.metric("Max Drawdown", f"{max_drawdown:.2%}")

                with col3:
                    st.metric("Sharpe Ratio", f"{sharpe_ratio:.2f}")

                with col4:
                    st.metric("Win Rate", f"{win_rate:.2%}")

                # Prepare results for export
                results_df = pd.DataFrame({
                    'Metric': ['Total Return', 'Max Drawdown', 'Sharpe Ratio', 'Win Rate', 'Total Trades'],
                    'Value': [total_return, max_drawdown, sharpe_ratio, win_rate, total_trades]
                })

                csv = results_df.to_csv(index=False)
                st.download_button(
                    label="📥 Download Results as CSV",
                    data=csv,
                    file_name=f"backtest_results_{strategy_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
                    mime="text/csv"
                )

                # Performance chart
                st.subheader("Portfolio Value Over Time")
                st.line_chart(pf.value())

                # Drawdown chart
                st.subheader("Drawdown")
                st.area_chart(pf.drawdown())

                # Trade analysis
                st.header("📊 Trade Analysis")

                trades_df = pf.trades.records_readable
                if not trades_df.empty:
                    st.dataframe(trades_df)

                    # Trade statistics
                    col1, col2, col3 = st.columns(3)

                    with col1:
                        st.metric("Total Trades", len(trades_df))

                    with col2:
                        st.metric("Winning Trades", len(trades_df[trades_df['Return'] > 0]))

                    with col3:
                        st.metric("Losing Trades", len(trades_df[trades_df['Return'] <= 0]))

                    # Trade return distribution
                    st.subheader("Trade Return Distribution")
                    st.bar_chart(trades_df['Return'])
                else:
                    st.info("No trades were executed with the current parameters.")

                # Strategy signals chart
                st.header("🎯 Strategy Signals")

                # Create a chart with price and signals
                chart_data = pd.DataFrame({
                    'Close': price,
                    'Entries': entries.astype(int),
                    'Exits': exits.astype(int)
                })

                # Plot with vectorbt
                fig = price.vbt.plot()
                st.plotly_chart(fig)

            except Exception as e:
                st.error(f"Error running backtest: {traceback.format_exc()}")
                st.info("Try adjusting the strategy parameters or check the data format.")

except FileNotFoundError:
    st.error("❌ Could not find 'solana_4h_ohlc.csv'. Please ensure the file is in the same directory.")
except Exception as e:
    st.error(f"❌ Error loading data: {str(e)}")

# Footer
st.markdown("---")
st.markdown("Built with ❤️ using Streamlit and VectorBT")
st.markdown("Data source: Solana 4H OHLC")