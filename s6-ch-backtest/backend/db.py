import clickhouse_connect
from typing import List
from . import schemas

client = clickhouse_connect.get_client(host='localhost')

def get_latest_assets() -> List[schemas.AssetRanking]:
    # Query latest asset rankings
    return []

def store_assets(ranked_assets: List[schemas.AssetRanking]):
    # Store ranked assets in ClickHouse
    pass

def get_user_config() -> schemas.FetchConfig:
    # Fetch user config from ClickHouse
    return schemas.FetchConfig()

def set_user_config(config: schemas.FetchConfig):
    # Store user config in ClickHouse
    pass

def run_backtest():
    # Run backtest logic
    return {}
