import clickhouse_connect
from typing import List
from . import schemas
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
client = clickhouse_connect.get_client(
    host=os.getenv('CLICKHOUSE_HOST', 'localhost'),
    port=int(os.getenv('CLICKHOUSE_PORT', 8123)),
    username=os.getenv('CLICKHOUSE_USER', 'default'),
    password=os.getenv('CLICKHOUSE_PASSWORD', ''),
    database=os.getenv('CLICKHOUSE_DATABASE', 'default')
)

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
