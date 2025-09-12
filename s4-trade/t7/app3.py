import streamlit as st
import vectorbt as vbt
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import traceback

st.title("Crypto RSI Trading Backtest with MAE-Adjusted Entries")

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
            st.error("No data fetched. Ensure the period is valid for the selected timeframe (e.g., 1m limited to 7d).")
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
        rsi = vbt.RSI.run(df['Close'], window=rsi_period).rsi

        # Generate base entry signals for first backtest
        long_entries_base = (rsi.shift(1) < lower_rsi) & (rsi >= lower_rsi)
        short_entries_base = (rsi.shift(1) > upper_rsi) & (rsi <= upper_rsi)
        st.write(f"First Backtest - Number of Long Entry Signals: {long_entries_base.sum()}, Short Entry Signals: {short_entries_base.sum()}")

        # Hardcoded TP percentages and RR ratios
        tp_percentages = [1, 2, 3, 4]
        rr_ratios = [1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3]

        # First backtest: Collect results and compute average MAE
        results_first = []
        mae_long_list = []
        mae_short_list = []
        num_winners = 0

        for tp in tp_percentages:
            for rr in rr_ratios:
                sl_pct = tp / rr
                tp_frac = tp / 100
                sl_frac = sl_pct / 100

                # Simulate portfolio with base signals
                pf = vbt.Portfolio.from_signals(
                    close=df['Close'],
                    entries=long_entries_base,
                    short_entries=short_entries_base,
                    tp_stop=tp_frac,
                    sl_stop=sl_frac,
                    direction='both',
                    freq=freq,
                    init_cash=10000,
                    accumulate=False
                )

                # Compute MAE for each trade
                def compute_mae(row):
                    try:
                        start = int(row['entry_idx'])
                        end = int(row['exit_idx'])
                        if start < 0 or end >= len(df) or start > end:
                            raise ValueError(f"Invalid indices: start={start}, end={end}, df_len={len(df)}")
                        entry_price = row['entry_price']
                        slice_df = df.iloc[start:end + 1]
                        if row['direction'] == 'long':
                            min_price = slice_df['Low'].min()
                            mae = (min_price - entry_price) / entry_price * 100
                            if mae == 0:
                                st.warning(f"Zero MAE for long trade at index {start}. Check price data.")
                        else:  # short
                            max_price = slice_df['High'].max()
                            mae = (entry_price - max_price) / entry_price * 100
                            if mae == 0:
                                st.warning(f"Zero MAE for short trade at index {start}. Check price data.")
                        return mae if not np.isnan(mae) else np.nan
                    except Exception as inner_e:
                        st.error(f"Error in MAE computation at line 93: {str(inner_e)}\n{traceback.format_exc()}")
                        return np.nan

                if not pf.trades.records.empty:
                    trades_df = pf.trades.records.copy()
                    trades_df['mae'] = np.nan
                    trades_df['mae'] = trades_df.apply(compute_mae, axis=1)
                    winners = trades_df[trades_df['return'] > 0]
                    losers = trades_df[trades_df['return'] <= 0]
                    avg_mae = winners['mae'].mean() if not winners.empty else np.nan
                    min_mae = winners['mae'].min() if not winners.empty else np.nan
                    max_mae = winners['mae'].max() if not winners.empty else np.nan
                    std_mae = winners['mae'].std() if not winners.empty else np.nan
                    avg_mae_losers = losers['mae'].mean() if not losers.empty else np.nan
                    min_mae_losers = losers['mae'].min() if not losers.empty else np.nan
                    max_mae_losers = losers['mae'].max() if not losers.empty else np.nan
                    std_mae_losers = losers['mae'].std() if not losers.empty else np.nan
                    num_trades = len(trades_df)
                    num_winners += len(winners)
                    # Collect MAE for long and short winners, excluding zeros
                    if not winners.empty:
                        long_maes = winners[winners['direction'] == 'long']['mae'].dropna()
                        short_maes = winners[winners['direction'] == 'short']['mae'].dropna()
                        mae_long_list.extend(long_maes[long_maes != 0])
                        mae_short_list.extend(short_maes[short_maes != 0])
                else:
                    avg_mae = min_mae = max_mae = std_mae = np.nan
                    avg_mae_losers = min_mae_losers = max_mae_losers = std_mae_losers = np.nan
                    num_trades = 0

                win_rate = pf.trades.win_rate() * 100 if pf.trades.count() > 0 else 0
                total_return = pf.total_return()
                time_delta = (df.index[-1] - df.index[0]).total_seconds() / (365 * 24 * 3600)
                ann_return = ((1 + total_return) ** (1 / time_delta) - 1) * 100 if time_delta > 0 else 0

                results_first.append({
                    'TP (%)': tp,
                    'RR': rr,
                    'SL (%)': round(sl_pct, 2),
                    'Win Rate (%)': round(win_rate, 2),
                    'Ann. Return (%)': round(ann_return, 2),
                    'Avg MAE for Winners (%)': round(avg_mae, 2) if not np.isnan(avg_mae) else 'N/A',
                    'Min MAE for Winners (%)': round(min_mae, 2) if not np.isnan(min_mae) else 'N/A',
                    'Max MAE for Winners (%)': round(max_mae, 2) if not np.isnan(max_mae) else 'N/A',
                    'Std MAE for Winners (%)': round(std_mae, 2) if not np.isnan(std_mae) else 'N/A',
                    'Avg MAE for Losers (%)': round(avg_mae_losers, 2) if not np.isnan(avg_mae_losers) else 'N/A',
                    'Min MAE for Losers (%)': round(min_mae_losers, 2) if not np.isnan(min_mae_losers) else 'N/A',
                    'Max MAE for Losers (%)': round(max_mae_losers, 2) if not np.isnan(max_mae_losers) else 'N/A',
                    'Std MAE for Losers (%)': round(std_mae_losers, 2) if not np.isnan(std_mae_losers) else 'N/A',
                    'Number of Trades': num_trades
                })

        # Calculate average MAE for long and short from first backtest
        avg_mae_long = np.mean(mae_long_list) if mae_long_list else 0
        avg_mae_short = np.mean(mae_short_list) if mae_short_list else 0
        st.write(f"First Backtest - Total Winning Trades: {num_winners}")
        st.write(f"Average MAE for Winning Long Trades: {round(avg_mae_long, 2)}%")
        st.write(f"Average MAE for Winning Short Trades: {round(avg_mae_short, 2)}%")
        if num_winners == 0:
            st.warning("No winning trades in first backtest. Adjust RSI parameters or timeframe to generate winning trades.")

        # Second backtest: Adjust entries based on average MAE
        long_entries_adjusted = pd.Series(False, index=df.index)
        short_entries_adjusted = pd.Series(False, index=df.index)

        for idx in df.index[long_entries_base]:
            try:
                start_idx = df.index.get_loc(idx)
                if start_idx + 1 < len(df):
                    future_prices = df['Close'].iloc[start_idx + 1:]
                    entry_price = df['Close'].loc[idx]
                    target_price = entry_price * (1 - abs(avg_mae_long) / 100) if avg_mae_long != 0 else entry_price
                    crosses = future_prices <= target_price
                    if crosses.any():
                        first_true_loc = future_prices.index.get_loc(crosses[crosses].index[0])
                        first_true_idx = df.index[start_idx + 1 + first_true_loc]
                        long_entries_adjusted.loc[first_true_idx] = True
            except Exception as inner_e:
                st.error(f"Error adjusting long entry at line 134: {str(inner_e)}\n{traceback.format_exc()}")

        for idx in df.index[short_entries_base]:
            try:
                start_idx = df.index.get_loc(idx)
                if start_idx + 1 < len(df):
                    future_prices = df['Close'].iloc[start_idx + 1:]
                    entry_price = df['Close'].loc[idx]
                    target_price = entry_price * (1 + abs(avg_mae_short) / 100) if avg_mae_short != 0 else entry_price
                    crosses = future_prices >= target_price
                    if crosses.any():
                        first_true_loc = future_prices.index.get_loc(crosses[crosses].index[0])
                        first_true_idx = df.index[start_idx + 1 + first_true_loc]
                        short_entries_adjusted.loc[first_true_idx] = True
            except Exception as inner_e:
                st.error(f"Error adjusting short entry at line 146: {str(inner_e)}\n{traceback.format_exc()}")

        st.write(f"Second Backtest - Number of Long Entry Signals: {long_entries_adjusted.sum()}, Short Entry Signals: {short_entries_adjusted.sum()}")

        # Second backtest: Run with adjusted entries
        results_second = []
        num_winners_second = 0
        for tp in tp_percentages:
            for rr in rr_ratios:
                sl_pct = tp / rr
                tp_frac = tp / 100
                sl_frac = sl_pct / 100

                pf = vbt.Portfolio.from_signals(
                    close=df['Close'],
                    entries=long_entries_adjusted,
                    short_entries=short_entries_adjusted,
                    tp_stop=tp_frac,
                    sl_stop=sl_frac,
                    direction='both',
                    freq=freq,
                    init_cash=10000,
                    accumulate=False
                )

                if not pf.trades.records.empty:
                    trades_df = pf.trades.records.copy()
                    trades_df['mae'] = np.nan
                    trades_df['mae'] = trades_df.apply(compute_mae, axis=1)
                    winners = trades_df[trades_df['return'] > 0]
                    losers = trades_df[trades_df['return'] <= 0]
                    avg_mae = winners['mae'].mean() if not winners.empty else np.nan
                    min_mae = winners['mae'].min() if not winners.empty else np.nan
                    max_mae = winners['mae'].max() if not winners.empty else np.nan
                    std_mae = winners['mae'].std() if not winners.empty else np.nan
                    avg_mae_losers = losers['mae'].mean() if not losers.empty else np.nan
                    min_mae_losers = losers['mae'].min() if not losers.empty else np.nan
                    max_mae_losers = losers['mae'].max() if not losers.empty else np.nan
                    std_mae_losers = losers['mae'].std() if not losers.empty else np.nan
                    num_trades = len(trades_df)
                    num_winners_second += len(winners)
                else:
                    avg_mae = min_mae = max_mae = std_mae = np.nan
                    avg_mae_losers = min_mae_losers = max_mae_losers = std_mae_losers = np.nan
                    num_trades = 0

                win_rate = pf.trades.win_rate() * 100 if pf.trades.count() > 0 else 0
                total_return = pf.total_return()
                time_delta = (df.index[-1] - df.index[0]).total_seconds() / (365 * 24 * 3600)
                ann_return = ((1 + total_return) ** (1 / time_delta) - 1) * 100 if time_delta > 0 else 0

                results_second.append({
                    'TP (%)': tp,
                    'RR': rr,
                    'SL (%)': round(sl_pct, 2),
                    'Win Rate (%)': round(win_rate, 2),
                    'Ann. Return (%)': round(ann_return, 2),
                    'Avg MAE for Winners (%)': round(avg_mae, 2) if not np.isnan(avg_mae) else 'N/A',
                    'Min MAE for Winners (%)': round(min_mae, 2) if not np.isnan(min_mae) else 'N/A',
                    'Max MAE for Winners (%)': round(max_mae, 2) if not np.isnan(max_mae) else 'N/A',
                    'Std MAE for Winners (%)': round(std_mae, 2) if not np.isnan(std_mae) else 'N/A',
                    'Avg MAE for Losers (%)': round(avg_mae_losers, 2) if not np.isnan(avg_mae_losers) else 'N/A',
                    'Min MAE for Losers (%)': round(min_mae_losers, 2) if not np.isnan(min_mae_losers) else 'N/A',
                    'Max MAE for Losers (%)': round(max_mae_losers, 2) if not np.isnan(max_mae_losers) else 'N/A',
                    'Std MAE for Losers (%)': round(std_mae_losers, 2) if not np.isnan(std_mae_losers) else 'N/A',
                    'Number of Trades': num_trades
                })

        # Display results
        if results_first:
            st.subheader("First Backtest Results (Base RSI Entries)")
            results_df_first = pd.DataFrame(results_first)
            st.write(results_df_first)

            st.subheader("Second Backtest Results (MAE-Adjusted Entries)")
            results_df_second = pd.DataFrame(results_second)
            st.write(results_df_second)
            st.write(f"Second Backtest - Total Winning Trades: {num_winners_second}")

            # Plot win rates comparison
            st.subheader("Win Rates Comparison: Base vs MAE-Adjusted")
            fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 6), sharey=True)
            for tp in tp_percentages:
                subset_first = results_df_first[results_df_first['TP (%)'] == tp]
                ax1.plot(subset_first['RR'], subset_first['Win Rate (%)'], marker='o', label=f"TP {tp}%")
                subset_second = results_df_second[results_df_second['TP (%)'] == tp]
                ax2.plot(subset_second['RR'], subset_second['Win Rate (%)'], marker='o', label=f"TP {tp}%")
            ax1.set_title("Base RSI Entries")
            ax1.set_xlabel("Risk-Reward Ratio")
            ax1.set_ylabel("Win Rate (%)")
            ax1.legend()
            ax1.grid(True)
            ax2.set_title("MAE-Adjusted Entries")
            ax2.set_xlabel("Risk-Reward Ratio")
            ax2.legend()
            ax2.grid(True)
            plt.tight_layout()
            st.pyplot(fig)

        else:
            st.write("No trades detected in first backtest. Try adjusting the RSI parameters or timeframe.")

        # Plot OHLCV with RSI and entry signals for both backtests
        if long_entries_base.any() or short_entries_base.any() or long_entries_adjusted.any() or short_entries_adjusted.any():
            st.subheader("OHLCV and RSI with Entry Signals")
            fig = plt.figure(figsize=(12, 10))
            
            # Price plot
            ax1 = fig.add_subplot(2, 1, 1)
            ax1.plot(df.index, df['Close'], label='Close Price', color='blue', alpha=0.5)
            ax1.scatter(df.index[long_entries_base], df['Close'][long_entries_base], color='green', label='Long Entries', marker='^', s=100)
            ax1.scatter(df.index[short_entries_base], df['Close'][short_entries_base], color='red', label='Short Entries', marker='v', s=100)
            ax1.set_title(f"{symbol} Price with Base RSI Entry Signals")
            ax1.set_ylabel("Price")
            ax1.legend()
            ax1.grid(True)

            # RSI plot
            ax2 = fig.add_subplot(2, 1, 2, sharex=ax1)
            ax2.plot(df.index, rsi, label='RSI', color='purple', alpha=0.7)
            ax2.axhline(y=lower_rsi, color='green', linestyle='--', label=f'Lower RSI ({lower_rsi})')
            ax2.axhline(y=upper_rsi, color='red', linestyle='--', label=f'Upper RSI ({upper_rsi})')
            ax2.scatter(df.index[long_entries_base], rsi[long_entries_base], color='green', label='Long Entries', marker='^', s=100)
            ax2.scatter(df.index[short_entries_base], rsi[short_entries_base], color='red', label='Short Entries', marker='v', s=100)
            ax2.set_title("RSI with Entry Signals")
            ax2.set_xlabel("Time")
            ax2.set_ylabel("RSI")
            ax2.legend()
            ax2.grid(True)

            plt.xticks(rotation=45)
            plt.tight_layout()
            st.pyplot(fig)

            # MAE-adjusted signals plot
            fig = plt.figure(figsize=(12, 10))
            
            # Price plot
            ax3 = fig.add_subplot(2, 1, 1)
            ax3.plot(df.index, df['Close'], label='Close Price', color='blue', alpha=0.5)
            ax3.scatter(df.index[long_entries_adjusted], df['Close'][long_entries_adjusted], color='green', label='Long Entries (MAE-Adjusted)', marker='^', s=100)
            ax3.scatter(df.index[short_entries_adjusted], df['Close'][short_entries_adjusted], color='red', label='Short Entries (MAE-Adjusted)', marker='v', s=100)
            ax3.set_title(f"{symbol} Price with MAE-Adjusted Entry Signals")
            ax3.set_ylabel("Price")
            ax3.legend()
            ax3.grid(True)

            # RSI plot
            ax4 = fig.add_subplot(2, 1, 2, sharex=ax3)
            ax4.plot(df.index, rsi, label='RSI', color='purple', alpha=0.7)
            ax4.axhline(y=lower_rsi, color='green', linestyle='--', label=f'Lower RSI ({lower_rsi})')
            ax4.axhline(y=upper_rsi, color='red', linestyle='--', label=f'Upper RSI ({upper_rsi})')
            ax4.scatter(df.index[long_entries_adjusted], rsi[long_entries_adjusted], color='green', label='Long Entries (MAE-Adjusted)', marker='^', s=100)
            ax4.scatter(df.index[short_entries_adjusted], rsi[short_entries_adjusted], color='red', label='Short Entries (MAE-Adjusted)', marker='v', s=100)
            ax4.set_title("RSI with MAE-Adjusted Entry Signals")
            ax4.set_xlabel("Time")
            ax4.set_ylabel("RSI")
            ax4.legend()
            ax4.grid(True)

            plt.xticks(rotation=45)
            plt.tight_layout()
            st.pyplot(fig)
        else:
            st.write("No entry signals detected. Try adjusting the RSI parameters or timeframe.")

    except Exception as e:
        error_msg = f"Error at line 200: {str(e)}\n{traceback.format_exc()}. Check RSI parameters, timeframe, or period for compatibility."
        st.error(error_msg)