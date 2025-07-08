import ccxt.async_support as ccxt
import asyncio

async def test_websocket():
    exchange = ccxt.binance({"enableRateLimit": True})
    try:
        data = await exchange.watch_ohlcv('BTC/USDT', '1h')
        print(data)
    except Exception as e:
        print(f"WebSocket error: {str(e)}")
    await exchange.close()

asyncio.run(test_websocket())