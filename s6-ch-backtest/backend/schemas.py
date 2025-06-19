from pydantic import BaseModel
from typing import List, Optional

class FetchConfig(BaseModel):
    asset_ids: List[str] = []
    weight_change: float = 0.5
    weight_volume: float = 0.5
    outlier_percentile: float = 0.95

class AssetRanking(BaseModel):
    asset_id: str
    name: str
    symbol: str
    relevance_score: float
    price_change_24h: float
    volume_24h: float
