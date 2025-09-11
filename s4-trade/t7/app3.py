import streamlit as st
import vectorbt as vbt
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

st.title("Crypto RSI Trading Backtest with Risk-Reward Analysis")

# User inputs
symbols = ["BTC-USD", "ETH-USD", "SOL-USD", "ADA-USD", "XRP-USD"]
symbol = st.selectbox("Select Cryptocurrency", symbols)

timeframes = ["1d", "4h", "1h", "15m", "5m", "1m"]
tf = st.selectbox("Select Timeframe", timeframes)

period = st.text_input("Historical Period (e.g., 1y, 6mo, 1mo, 5d)", "1y")

rsi_period = st.slider("RSI Period", min_value=2, max_value=100, value=14)
lower_rsi = st.slider("Lower RSI Threshold (for Long Entries)", min_value=0, max_value=100, value=30)
upper_rsi = st.slider("Upper RSI Threshold (for Short Entries)", min_value=0, max_value=100, value=70)

if st.button("Fetch Data and Analyze"):
    try:
        # Fetch OHLCV data using vectorbt
        data = vbt.YFData.download(symbol, interval=tf, period=period)
        df = data.get()
        if df.empty:
            st.error("No data fetched. Try a shorter period or different timeframe (e.g., 1m limited to 7d).")
            st.stop()
        st.write(f"Data fetched for {symbol} on {tf} timeframe. Rows: {len(df)}")

        # Map timeframe to pandas frequency
        timeframe_map = {
            "1d": "1D",
            "4h": "4H",
            "1h": "1H",
            "15m": "15T",
            "5m": "5T",
            "1m": "1T"
        }
        freq = timeframe_map.get(tf, "1D")

        # Calculate RSI
        rsi = vbt.RSI.run(df['Close'], window=rsi_period)

        # Generate entry signals
        # Long: RSI crosses above lower_rsi (exiting oversold upwards)
        # Short: RSI crosses below upper_rsi (exiting overbought downwards)
        long_entries = rsi.rsi.crossed_above(lower_rsi)
        short_entries = rsi.rsi.crossed_below(upper_rsi)

        # Hardcoded TP percentages and RR ratios
        tp_percentages = [1, 2, 3, 4]
        rr_ratios = [1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3]

        # Collect results
        results = []
        for tp in tp_percentages:
            for rr in rr_ratios:
                sl_pct = tp / rr
                tp_frac = tp / 100
                sl_frac = sl_pct / 100

                # Simulate portfolio with SL/TP
                pf = vbt.Portfolio.from_signals(
                    close=df['Close'],
                    entries=long_entries,
                    short_entries=short_entries,
                    tp_stop=tp_frac,
                    sl_stop=sl_frac,
                    direction='both',
                    freq=freq
                )

                # Compute MAE for each trade
                def compute_mae(row):
                    start = row['entry_idx']
                    end = row['exit_idx']
                    entry_price = row['entry_price']
                    slice_df = df.iloc[start:end + 1]
                    if row['direction'] == 0:  # long
                        min_price = slice_df['Low'].min()
                        mae = (min_price - entry_price) / entry_price
                    else:  # short
                        max_price = slice_df['High'].max()
                        mae = (entry_price - max_price) / entry_price
                    return mae

                if not pf.trades.records.empty:
                    pf.trades.records['mae'] = pf.trades.records.apply(compute_mae, axis=1)
                    winners = pf.trades.records[pf.trades.records['return'] > 0]
                    avg_mae = winners['mae'].mean() if not winners.empty else np.nan
                else:
                    avg_mae = np.nan

                win_rate = pf.trades.win_rate() * 100 if pf.trades.count() > 0 else 0
                ann_return = pf.stats()['Ann. Return [%]']

                results.append({
                    'TP (%)': tp,
                    'RR': rr,
                    'SL (%)': round(sl_pct, 2),
                    'Win Rate (%)': round(win_rate, 2),
                    'Ann. Return (%)': round(ann_return, 2),
                    'Avg MAE for Winners (%)': round(avg_mae * 100, 2) if not np.isnan(avg_mae) else 'N/A'
                })

        # Display results table
        if results:
            results_df = pd.DataFrame(results)
            st.subheader("Backtest Results for Different TP and RR")
            st.write(results_df)
        else:
            st.write("No trades detected. Try adjusting the RSI parameters or timeframe.")

        # Plot OHLCV with entry signals
        if long_entries.any() or short_entries.any():
            st.subheader("OHLCV with Long and Short Entry Signals")
            fig, ax = plt.subplots(figsize=(12, 6))
            ax.plot(df.index, df['Close'], label='Close Price', color='blue', alpha=0.5)
            ax.scatter(df.index[long_entries], df['Close'][long_entries], color='green', label='Long Entries', marker='^', s=100)
            ax.scatter(df.index[short_entries], df['Close'][short_entries], color='red', label='Short Entries', marker='v', s=100)
            ax.set_title(f"{symbol} Price with RSI Entry Signals")
            ax.set_xlabel("Time")
            ax.set_ylabel("Price")
            ax.legend()
            plt.xticks(rotation=45)
            plt.tight_layout()
            st.pyplot(fig)
        else:
            st.write("No entry signals detected. Try adjusting the RSI parameters or timeframe.")

    except Exception as e:
        st.error(f"Error fetching or analyzing data: {str(e)}. Try a shorter period (e.g., 7d for 1m timeframe) or different timeframe.")