import streamlit as st
import vectorbt as vbt
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

st.title("Crypto RSI-based Runup & Drawdown Analysis")

# User inputs
symbols = ["BTC-USD", "ETH-USD", "SOL-USD", "ADA-USD", "XRP-USD"]
symbol = st.selectbox("Select Cryptocurrency", symbols)

timeframes = ["1d", "4h", "1h", "15m", "5m", "1m"]
tf = st.selectbox("Select Timeframe", timeframes)

period = st.text_input("Historical Period (e.g., 1y, 6mo, 1mo, 5d)", "1y")

rsi_period = st.slider("RSI Period", min_value=2, max_value=100, value=14)
lower_rsi = st.slider("Lower RSI Threshold", min_value=0, max_value=100, value=30)
upper_rsi = st.slider("Upper RSI Threshold", min_value=0, max_value=100, value=70)

if st.button("Fetch Data and Analyze"):
    try:
        # Fetch OHLCV data using vectorbt
        data = vbt.YFData.download(symbol, interval=tf, period=period)
        df = data.get()
        if df.empty:
            st.error("No data fetched. Try a shorter period or different timeframe (e.g., 1m limited to 7d).")
            st.stop()
        st.write(f"Data fetched for {symbol} on {tf} timeframe. Rows: {len(df)}")

        # Calculate RSI
        rsi = vbt.RSI.run(df['Close'], window=rsi_period).rsi

        # Find oversold and overbought periods
        oversold = rsi <= lower_rsi
        overbought = rsi >= upper_rsi

        # Initialize extrema list
        extrema = []

        # Find support points (min Low in each oversold period)
        if oversold.any():
            oversold_groups = (oversold != oversold.shift()).cumsum()
            support_candidates = df[oversold].copy()
            if not support_candidates.empty:
                support_idx = support_candidates.groupby(oversold_groups[oversold])['Low'].idxmin()
                # Filter valid indices
                support_idx = support_idx[support_idx.isin(df.index)]
                for idx in support_idx:
                    extrema.append(('support', df['Low'].loc[idx], idx))

        # Find resistance points (max High in each overbought period)
        if overbought.any():
            overbought_groups = (overbought != overbought.shift()).cumsum()
            resistance_candidates = df[overbought].copy()
            if not resistance_candidates.empty:
                resistance_idx = resistance_candidates.groupby(overbought_groups[overbought])['High'].idxmax()
                # Filter valid indices
                resistance_idx = resistance_idx[resistance_idx.isin(df.index)]
                for idx in resistance_idx:
                    extrema.append(('resistance', df['High'].loc[idx], idx))

        # Sort extrema by index
        extrema.sort(key=lambda x: x[2])

        # Calculate runups and drawdowns from each type
        runups_from_oversold = []
        drawdowns_from_oversold = []
        runups_from_overbought = []
        drawdowns_from_overbought = []
        movements = []
        for i in range(1, len(extrema)):
            prev_type, prev_price, prev_idx = extrema[i-1]
            curr_type, curr_price, curr_idx = extrema[i]

            prev_time = prev_idx
            curr_time = curr_idx

            magnitude = (curr_price - prev_price) / prev_price * 100

            mov_type = 'runup' if magnitude > 0 else 'drawdown'
            movements.append({'start_time': prev_time, 'end_time': curr_time, 'magnitude': magnitude, 'type': mov_type})

            if magnitude > 0:
                if prev_type == 'support':
                    runups_from_oversold.append(magnitude)
                else:
                    runups_from_overbought.append(magnitude)
            else:
                if prev_type == 'support':
                    drawdowns_from_oversold.append(magnitude)
                else:
                    drawdowns_from_overbought.append(magnitude)

        # Statistical analysis and plots
        if runups_from_oversold:
            df_runups_oversold = pd.DataFrame({'Runup from Oversold (%)': runups_from_oversold})
            st.subheader("Runups from Oversold Points (Reward for Long)")
            st.write(df_runups_oversold.describe())

            fig1, ax1 = plt.subplots()
            ax1.hist(runups_from_oversold, bins=20, color='green')
            ax1.set_title("Distribution of Runups from Oversold")
            ax1.set_xlabel("Runup (%)")
            ax1.set_ylabel("Frequency")
            st.pyplot(fig1)
        else:
            st.write("No runups from oversold detected. Try adjusting the RSI parameters or timeframe.")

        if drawdowns_from_oversold:
            df_drawdowns_oversold = pd.DataFrame({'Drawdown from Oversold (%)': drawdowns_from_oversold})
            st.subheader("Drawdowns from Oversold Points (Risk for Long)")
            st.write(df_drawdowns_oversold.describe())

            fig2, ax2 = plt.subplots()
            ax2.hist(drawdowns_from_oversold, bins=20, color='red')
            ax2.set_title("Distribution of Drawdowns from Oversold")
            ax2.set_xlabel("Drawdown (%)")
            ax2.set_ylabel("Frequency")
            st.pyplot(fig2)
        else:
            st.write("No drawdowns from oversold detected. Try adjusting the RSI parameters or timeframe.")

        if drawdowns_from_overbought:
            df_drawdowns_overbought = pd.DataFrame({'Drawdown from Overbought (%)': drawdowns_from_overbought})
            st.subheader("Drawdowns from Overbought Points (Reward for Short)")
            st.write(df_drawdowns_overbought.describe())

            fig3, ax3 = plt.subplots()
            ax3.hist(drawdowns_from_overbought, bins=20, color='red')
            ax3.set_title("Distribution of Drawdowns from Overbought")
            ax3.set_xlabel("Drawdown (%)")
            ax3.set_ylabel("Frequency")
            st.pyplot(fig3)
        else:
            st.write("No drawdowns from overbought detected. Try adjusting the RSI parameters or timeframe.")

        if runups_from_overbought:
            df_runups_overbought = pd.DataFrame({'Runup from Overbought (%)': runups_from_overbought})
            st.subheader("Runups from Overbought Points (Risk for Short)")
            st.write(df_runups_overbought.describe())

            fig4, ax4 = plt.subplots()
            ax4.hist(runups_from_overbought, bins=20, color='green')
            ax4.set_title("Distribution of Runups from Overbought")
            ax4.set_xlabel("Runup (%)")
            ax4.set_ylabel("Frequency")
            st.pyplot(fig4)
        else:
            st.write("No runups from overbought detected. Try adjusting the RSI parameters or timeframe.")

        # Plot OHLCV with supports, resistances, runups, and drawdowns
        if extrema:
            st.subheader("OHLCV with RSI-based Supports, Resistances, Runups, and Drawdowns")
            fig5, ax5 = plt.subplots(figsize=(12, 6))

            # Plot OHLCV (Close prices)
            ax5.plot(df.index, df['Close'], label='Close Price', color='blue', alpha=0.5)

            # Plot supports and resistances
            support_times = [ex[2] for ex in extrema if ex[0] == 'support']
            support_prices = [ex[1] for ex in extrema if ex[0] == 'support']
            resistance_times = [ex[2] for ex in extrema if ex[0] == 'resistance']
            resistance_prices = [ex[1] for ex in extrema if ex[0] == 'resistance']

            ax5.scatter(support_times, support_prices, color='green', label='Oversold Points (Supports)', marker='^', s=100)
            ax5.scatter(resistance_times, resistance_prices, color='red', label='Overbought Points (Resistances)', marker='v', s=100)

            # Plot runups and drawdowns as arrows
            for mov in movements:
                start_price = df['Close'].loc[mov['start_time']]
                end_price = df['Close'].loc[mov['end_time']]
                color = 'green' if mov['type'] == 'runup' else 'red'
                ax5.arrow(mov['start_time'], start_price, 
                         (mov['end_time'] - mov['start_time']).total_seconds() / (3600*24), 
                         end_price - start_price, 
                         color=color, width=0.1, head_width=0.5, head_length=0.05 * abs(end_price - start_price),
                         length_includes_head=True)

            ax5.set_title(f"{symbol} OHLCV with RSI-based Supports and Resistances, Runups, and Drawdowns")
            ax5.set_xlabel("Time")
            ax5.set_ylabel("Price")
            ax5.legend()
            plt.xticks(rotation=45)
            plt.tight_layout()
            st.pyplot(fig5)
        else:
            st.write("No supports or resistances detected. Try adjusting the RSI parameters or timeframe.")

    except Exception as e:
        st.error(f"Error fetching or analyzing data: {str(e)}. Try a shorter period (e.g., 7d for 1m timeframe) or different timeframe.")