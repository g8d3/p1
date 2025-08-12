import pandas as pd
import numpy as np

def backtest_strategy(df, short_window, long_window, cash_allocation_percentage=0.9, transaction_cost_pct=0.001, stop_loss_pct=0.05, take_profit_pct=0.10):
    # Calculate moving averages
    df['SMA'] = df['Close'].rolling(window=short_window).mean()
    df['LMA'] = df['Close'].rolling(window=long_window).mean()

    # Generate signals
    df['Signal'] = 0
    df.loc[df['SMA'] > df['LMA'], 'Signal'] = 1  # Buy signal
    df.loc[df['SMA'] < df['LMA'], 'Signal'] = -1 # Sell signal

    # Remove NaN values created by rolling means (initial periods)
    df.dropna(inplace=True)

    # Initialize portfolio
    initial_capital = 10000.0
    cash = initial_capital
    btc_holdings = 0.0
    entry_price = 0.0 # To track the price at which BTC was last bought

    portfolio_history = []

    for i, row in df.iterrows():
        current_close_price = row['Close']
        signal = row['Signal']

        # Previous signal to detect crossovers
        prev_signal = df.loc[df.index < i, 'Signal'].iloc[-1] if not df.loc[df.index < i].empty else 0

        # Check for Stop-Loss or Take-Profit conditions if holding BTC
        if btc_holdings > 0 and entry_price > 0:
            # Calculate current profit/loss percentage
            current_profit_loss_pct = (current_close_price - entry_price) / entry_price

            # Stop-Loss
            if current_profit_loss_pct <= -stop_loss_pct:
                usd_received = btc_holdings * current_close_price
                cash += usd_received * (1 - transaction_cost_pct) # Deduct transaction cost
                # print(f"Stop-Loss Sell at {i}: {btc_holdings:.4f} BTC for {usd_received:.2f} USD @ {current_close_price:.2f} (Loss: {current_profit_loss_pct:.2%})")
                btc_holdings = 0.0
                entry_price = 0.0

            # Take-Profit
            elif current_profit_loss_pct >= take_profit_pct:
                usd_received = btc_holdings * current_close_price
                cash += usd_received * (1 - transaction_cost_pct) # Deduct transaction cost
                # print(f"Take-Profit Sell at {i}: {btc_holdings:.4f} BTC for {usd_received:.2f} USD @ {current_close_price:.2f} (Profit: {current_profit_loss_pct:.2%})")
                btc_holdings = 0.0
                entry_price = 0.0

        # Buy signal (SMA crosses above LMA) and not currently holding BTC
        if signal == 1 and prev_signal != 1 and btc_holdings == 0:
            amount_to_invest = cash * cash_allocation_percentage
            if amount_to_invest > 0:
                btc_bought = amount_to_invest / current_close_price
                cash -= amount_to_invest
                cash -= amount_to_invest * transaction_cost_pct # Deduct transaction cost
                btc_holdings += btc_bought
                entry_price = current_close_price # Record entry price
                # print(f"Buy at {i}: {amount_to_invest:.2f} USD worth of BTC ({btc_bought:.4f} BTC) @ {current_close_price:.2f}")

        # Sell signal (SMA crosses below LMA) and currently holding BTC
        elif signal == -1 and prev_signal != -1 and btc_holdings > 0:
            usd_received = btc_holdings * current_close_price
            cash += usd_received * (1 - transaction_cost_pct) # Deduct transaction cost
            # print(f"Sell at {i}: {btc_holdings:.4f} BTC for {usd_received:.2f} USD @ {current_close_price:.2f}")
            btc_holdings = 0.0
            entry_price = 0.0

        current_holdings_usd = btc_holdings * current_close_price
        total_value = cash + current_holdings_usd

        portfolio_history.append({
            'Open time': i,
            'Cash': cash,
            'BTC Holdings': btc_holdings,
            'Holdings USD': current_holdings_usd,
            'Total Value': total_value
        })

    portfolio_df = pd.DataFrame(portfolio_history).set_index('Open time')
    portfolio_df['Returns'] = portfolio_df['Total Value'].pct_change()

    return portfolio_df

# Function to calculate performance metrics
def calculate_metrics(portfolio_df, initial_capital):
    total_return = (portfolio_df['Total Value'].iloc[-1] - initial_capital) / initial_capital * 100

    # Annualized Return (CAGR)
    # Assuming 1-hour data, 24 hours/day, 365 days/year
    num_years = (portfolio_df.index[-1] - portfolio_df.index[0]).days / 365.25
    if num_years > 0:
        cagr = ((portfolio_df['Total Value'].iloc[-1] / initial_capital) ** (1 / num_years)) - 1
    else:
        cagr = np.nan

    # Max Drawdown
    # Calculate the running maximum
    running_max = portfolio_df['Total Value'].cummax()
    # Calculate the daily drawdown
    drawdown = (portfolio_df['Total Value'] / running_max) - 1
    max_drawdown = drawdown.min() * 100

    # Sharpe Ratio (assuming risk-free rate is 0 for simplicity)
    # Daily returns for Sharpe Ratio
    daily_returns = portfolio_df['Total Value'].pct_change().dropna()
    if daily_returns.std() != 0:
        sharpe_ratio = daily_returns.mean() / daily_returns.std() * np.sqrt(252 * 24) # 252 trading days, 24 hours/day
    else:
        sharpe_ratio = np.nan

    return {
        "Total Return": total_return,
        "CAGR": cagr,
        "Max Drawdown": max_drawdown,
        "Sharpe Ratio": sharpe_ratio
    }

if __name__ == "__main__":
    df = pd.read_csv("BTCUSDT_1h.csv", parse_dates=['Open time'])
    df.set_index('Open time', inplace=True)
    df['Close'] = pd.to_numeric(df['Close'])

    short_window = 20 # 20-hour SMA
    long_window = 50  # 50-hour SMA

    print(f"Backtesting Moving Average Crossover Strategy (SMA: {short_window}, LMA: {long_window})...")
    portfolio = backtest_strategy(df.copy(), short_window, long_window, cash_allocation_percentage=0.9, transaction_cost_pct=0.001, stop_loss_pct=0.05, take_profit_pct=0.10)

    # Calculate and print metrics
    if not portfolio.empty:
        metrics = calculate_metrics(portfolio, initial_capital=10000.0)
        print(f"Total Return: {metrics['Total Return']:.2f}%")
        print(f"CAGR: {metrics['CAGR']:.2%}")
        print(f"Max Drawdown: {metrics['Max Drawdown']:.2f}%")
        print(f"Sharpe Ratio: {metrics['Sharpe Ratio']:.2f}")
    else:
        print("Could not calculate metrics (portfolio is empty).")

    print("\nPortfolio Snapshot (last 5 entries):")
    print(portfolio.tail())