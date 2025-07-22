# Backend for Crypto Ranking & Allocation MVP

This FastAPI app fetches CoinGecko data, computes relevance scores, stores data in ClickHouse, and exposes REST APIs.

## Features
- Fetch CoinGecko data (24h % change, volume) for user-selected assets
- Compute composite relevance score with outlier trimming
- Store and retrieve data from ClickHouse
- JWT-secured API endpoints

## Quickstart
1. Install dependencies: `uv pip install -r requirements.txt`
2. Start ClickHouse (Docker recommended)
3. Run: `uvicorn main:app --reload`

---

## File Structure
- `main.py` — FastAPI app entry point
- `db.py` — ClickHouse connection and queries
- `coingecko.py` — CoinGecko API client
- `auth.py` — JWT authentication
- `schemas.py` — Pydantic models
- `requirements.txt` — Python dependencies
