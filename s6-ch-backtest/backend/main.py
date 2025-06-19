from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel
from typing import List
from . import db, coingecko, auth, schemas

app = FastAPI()

@app.get("/assets", response_model=List[schemas.AssetRanking])
def get_asset_rankings(token: str = Depends(auth.verify_jwt)):
    assets = db.get_latest_assets()
    return assets

@app.post("/fetch")
def fetch_and_store_assets(config: schemas.FetchConfig, token: str = Depends(auth.verify_jwt)):
    data = coingecko.fetch_assets(config.asset_ids)
    ranked = coingecko.rank_assets(data, config)
    db.store_assets(ranked)
    return {"status": "ok"}

@app.get("/config", response_model=schemas.FetchConfig)
def get_config(token: str = Depends(auth.verify_jwt)):
    return db.get_user_config()

@app.post("/config")
def set_config(config: schemas.FetchConfig, token: str = Depends(auth.verify_jwt)):
    db.set_user_config(config)
    return {"status": "ok"}

@app.get("/backtest")
def backtest(token: str = Depends(auth.verify_jwt)):
    return db.run_backtest()
