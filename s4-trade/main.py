import asyncio
import ccxt.async_support as ccxt
import pandas as pd
from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Dict
import jwt
from datetime import datetime, timedelta
from passlib.context import CryptContext
import aiohttp
from questdb.ingress import Sender, IngressError
import json
import uuid

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "your-secret-key"  # Replace with secure key
ALGORITHM = "HS256"

# User model and authentication
users_db = {}  # In-memory user store (replace with proper DB in production)

class User(BaseModel):
    username: str
    password: str

class OHLCVRequest(BaseModel):
    exchange: str
    symbol: str
    timeframe: str
    limit: int = 100

# QuestDB configuration
QUESTDB_HOST = "localhost"
QUESTDB_PORT = 9000
QUESTDB_HTTP_PORT = 9009

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None or username not in users_db:
            raise HTTPException(status_code=401, detail="Invalid authentication")
        return username
    except jwt.PyJWTError as e:
        print(f"JWT decode error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid authentication")

@app.post("/register")
async def register(user: User):
    if user.username in users_db:
        raise HTTPException(status_code=400, detail="Username already registered")
    users_db[user.username] = {
        "username": user.username,
        "hashed_password": get_password_hash(user.password)
    }
    return {"message": "User registered successfully"}

@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = users_db.get(form_data.username)
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token_expires = timedelta(minutes=30)
    access_token = jwt.encode(
        {"sub": form_data.username, "exp": datetime.utcnow() + access_token_expires},
        SECRET_KEY,
        algorithm=ALGORITHM
    )
    return {"access_token": access_token, "token_type": "bearer"}

async def check_duplicate_ohlcv(symbol: str, timeframe: str, timestamp: int) -> bool:
    async with aiohttp.ClientSession() as session:
        query = f"SELECT count(*) FROM ohlcv WHERE symbol='{symbol}' AND timeframe='{timeframe}' AND timestamp={timestamp}"
        try:
            async with session.get(f"http://{QUESTDB_HOST}:{QUESTDB_HTTP_PORT}/exec?query={query}") as resp:
                result = await resp.json()
                return result["dataset"][0][0] > 0
        except Exception as e:
            print(f"Error checking duplicates in QuestDB: {str(e)}")
            return False

async def save_to_questdb(ohlcv_data: List[Dict], symbol: str, timeframe: str):
    try:
        async with Sender(QUESTDB_HOST, QUESTDB_PORT) as sender:
            for data in ohlcv_data:
                if not await check_duplicate_ohlcv(symbol, timeframe, data["timestamp"]):
                    sender.row(
                        "ohlcv",
                        symbols={"symbol": symbol, "timeframe": timeframe},
                        columns={
                            "timestamp": data["timestamp"],
                            "open": data["open"],
                            "high": data["high"],
                            "low": data["low"],
                            "close": data["close"],
                            "volume": data["volume"]
                        },
                        at=data["timestamp"]
                    )
    except IngressError as e:
        print(f"Error saving to QuestDB: {e}")

@app.post("/fetch-ohlcv")
async def fetch_ohlcv(request: OHLCVRequest, username: str = Depends(get_current_user)):
    try:
        exchange_class = getattr(ccxt, request.exchange.lower(), None)
        if not exchange_class:
            raise HTTPException(status_code=400, detail=f"Invalid exchange: {request.exchange}")
        exchange = exchange_class({"enableRateLimit": True})
        print(f"Instantiated exchange: {request.exchange}")
        try:
            ohlcv = await exchange.fetch_ohlcv(request.symbol, request.timeframe, limit=request.limit)
            ohlcv_data = [
                {
                    "timestamp": int(row[0]),
                    "open": float(row[1]),
                    "high": float(row[2]),
                    "low": float(row[3]),
                    "close": float(row[4]),
                    "volume": float(row[5])
                } for row in ohlcv
            ]
            await save_to_questdb(ohlcv_data, request.symbol, request.timeframe)
            return ohlcv_data
        finally:
            await exchange.close()
    except Exception as e:
        print(f"Error in fetch_ohlcv: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching OHLCV: {str(e)}")

@app.get("/", response_class=HTMLResponse)
async def get_index():
    with open("static/index.html", "r") as f:
        return HTMLResponse(content=f.read())