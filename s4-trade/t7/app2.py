import streamlit as st
import vectorbt as vbt
import numpy as np
from scipy.signal import argrelextrema
import matplotlib.pyplot as plt
import pandas as pd

st.title("Crypto Support/Resistance Runup & Drawdown Analysis")

# User inputs
symbols = ["BTC-USD", "ETH-USD", "SOL-USD", "ADA-USD", "XRP-USD"]
symbol = st.selectbox("Select Cryptocurrency", symbols)

timeframes = ["1d", "4h", "1h", "15m", "5m", "1m"]
tf = st.selectbox("Select Timeframe", timeframes)

period = st.text_input("Historical Period (e.g., 1y, 6mo, 1mo, 5d)", "1y")

order = st.slider("Lookback Order for S/R Detection", min_value=5, max_value=100, value=20)

if st.button("Fetch Data and Analyze"):
    try:
        # Fetch OHLCV data using vectorbt
        data = vbt.YFData.download(symbol, interval=tf, period=period)
        df = data.get()
        st.write(f"Data fetched for {symbol} on {tf} timeframe. Rows: {len(df)}")

        # Calculate supports (local lows) and resistances (local highs)
        low_idx = argrelextrema(df['Low'].values, np.less_equal, order=order)[0]
        high_idx = argrelextrema(df['High'].values, np.greater_equal, order=order)[0]

        # Combine and sort extrema indices
        all_extrema_idx = np.sort(np.unique(np.concatenate((low_idx, high_idx))))

        # Create list of extrema with types
        extrema = []
        for idx in all_extrema_idx:
            if idx in low_idx:
                extrema.append(('support', df['Low'].iloc[idx], idx))
            if idx in high_idx:
                extrema.append(('resistance', df['High'].iloc[idx], idx))

        # Sort by index
        extrema.sort(key=lambda x: x[2])

        # Calculate runups and drawdowns
        runups = []
        drawdowns = []
        movements = []
        for i in range(1, len(extrema)):
            prev_type, prev_price, prev_idx = extrema[i-1]
            curr_type, curr_price, curr_idx = extrema[i]

            prev_time = df.index[prev_idx]
            curr_time = df.index[curr_idx]

            if prev_type == 'support' and curr_type == 'resistance':
                # Runup from support to resistance
                magnitude = (curr_price - prev_price) / prev_price * 100
                runups.append(magnitude)
                movements.append({'start_time': prev_time, 'end_time': curr_time, 'magnitude': magnitude, 'type': 'runup'})
            elif prev_type == 'resistance' and curr_type == 'support':
                # Drawdown from resistance to support
                magnitude = (curr_price - prev_price) / prev_price * 100
                drawdowns.append(magnitude)
                movements.append({'start_time': prev_time, 'end_time': curr_time, 'magnitude': magnitude, 'type': 'drawdown'})

        # Statistical analysis and plots
        if runups:
            runup_df = pd.DataFrame({'Runup (%)': runups})
            st.subheader("Runup Statistics")
            st.write(runup_df.describe())

            fig1, ax1 = plt.subplots()
            ax1.hist(runups, bins=20, color='green')
            ax1.set_title("Distribution of Runups")
            ax1.set_xlabel("Runup (%)")
            ax1.set_ylabel("Frequency")
            st.pyplot(fig1)
        else:
            st.write("No runups detected. Try adjusting the lookback order.")

        if drawdowns:
            drawdown_df = pd.DataFrame({'Drawdown (%)': drawdowns})
            st.subheader("Drawdown Statistics")
            st.write(drawdown_df.describe())

            fig2, ax2 = plt.subplots()
            ax2.hist(drawdowns, bins=20, color='red')
            ax2.set_title("Distribution of Drawdowns")
            ax2.set_xlabel("Drawdown (%)")
            ax2.set_ylabel("Frequency")
            st.pyplot(fig2)
        else:
            st.write("No drawdowns detected. Try adjusting the lookback order.")

        # Plot OHLCV with supports, resistances, runups, and drawdowns
        if extrema:
            st.subheader("OHLCV with Supports, Resistances, Runups, and Drawdowns")
            fig3, ax3 = plt.subplots(figsize=(12, 6))

            # Plot OHLCV (Close prices)
            ax3.plot(df.index, df['Close'], label='Close Price', color='blue', alpha=0.5)

            # Plot supports and resistances
            support_times = [df.index[ex[2]] for ex in extrema if ex[0] == 'support']
            support_prices = [ex[1] for ex in extrema if ex[0] == 'support']
            resistance_times = [df.index[ex[2]] for ex in extrema if ex[0] == 'resistance']
            resistance_prices = [ex[1] for ex in extrema if ex[0] == 'resistance']

            ax3.scatter(support_times, support_prices, color='green', label='Supports', marker='^', s=100)
            ax3.scatter(resistance_times, resistance_prices, color='red', label='Resistances', marker='v', s=100)

            # Plot runups and drawdowns as arrows
            for mov in movements:
                start_price = df['Close'][mov['start_time']]
                end_price = df['Close'][mov['end_time']]
                color = 'green' if mov['type'] == 'runup' else 'red'
                ax3.arrow(mov['start_time'], start_price, 
                         (mov['end_time'] - mov['start_time']).total_seconds() / (3600*24), 
                         end_price - start_price, 
                         color=color, width=0.1, head_width=0.5, head_length=0.05 * abs(end_price - start_price),
                         length_includes_head=True)

            ax3.set_title(f"{symbol} OHLCV with Supports, Resistances, Runups, and Drawdowns")
            ax3.set_xlabel("Time")
            ax3.set_ylabel("Price")
            ax3.legend()
            plt.xticks(rotation=45)
            plt.tight_layout()
            st.pyplot(fig3)
        else:
            st.write("No supports or resistances detected. Try adjusting the lookback order.")

    except Exception as e:
        st.error(f"Error fetching or analyzing data: {str(e)}. Note: Some timeframes/periods may not be supported by Yahoo Finance (e.g., 1m limited to 7d).")
