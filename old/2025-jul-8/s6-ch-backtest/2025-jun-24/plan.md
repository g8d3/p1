Thank you for the detailed responses! Based on your input, I’ll design a code solution for a multiuser, multitenant, public-facing web app for ranking and allocating crypto assets using CoinGecko API data, with a focus on a decentralized network where users can set up their own servers and databases. The system will use a Python backend with ClickHouse for storage, a Vanilla JS frontend with IndexedDB for local storage, and WebAuthn/passkeys for authentication, mimicking a Web3 wallet experience. Below, I’ll outline the MVP scope, architecture, and provide code for essential components, ensuring it aligns with your preferences (e.g., user-configurable intervals, outlier handling, decentralized server discovery).

### MVP Scope and Architecture

#### System Overview
- **Purpose**: A public-facing, multiuser platform for ranking cryptocurrencies by relevance (using 24h % change and volume) and suggesting portfolio allocations, with decentralized server and DB instances per user, shareable configurations, and backtesting capabilities.
- **Asset Type**: Cryptocurrencies, using CoinGecko API for 24h % change and volume.
- **Scale**: Public scale (100s+ users), user-defined asset lists, each user with their own ClickHouse DB instance.
- **MVP Features**:
  - **Backend**: Fetch CoinGecko data, compute relevance scores (composite formula with user-configurable weights and outlier handling), store data in ClickHouse, expose API endpoints.
  - **Frontend**: Vanilla JS control panel to display rankings, allocations, and charts; configure formulas; manage servers; and authenticate via passkeys.
  - **Decentralized Network**: Users run their own backend servers and ClickHouse instances, with a discovery mechanism (e.g., user-shared URLs or a registry).
  - **Storage**: ClickHouse for server-side data (asset data, historical, user configs); IndexedDB (via Dexie.js) for browser-side data (configs, cached rankings, credentials).
  - **Authentication**: WebAuthn/passkeys for Web3-like auth, with OAuth (e.g., Google) as a fallback.
  - **Backtesting**: Basic support for historical data analysis in ClickHouse.

#### Architecture
- **Backend** (Python, FastAPI):
  - **Role**: Fetch CoinGecko data, compute relevance scores, store in ClickHouse, serve APIs.
  - **DB**: ClickHouse for time-series data (asset metrics, historical), user configurations, and portfolio allocations.
  - **API**: REST endpoints for data retrieval, config management, and backtesting, secured with JWT.
- **Frontend** (Vanilla JS, Dexie.js):
  - **Role**: Display rankings, allocations, and charts; manage user configs and servers; handle offline data via IndexedDB.
  - **UI**: Control panel with tables for rankings, forms for configs, and Chart.js for visualizations.
  - **Local DB**: Dexie.js (IndexedDB wrapper) for configs, cached data, and encrypted passkeys.
- **Decentralized Network**:
  - Users run their own FastAPI + ClickHouse instances (local or VPS).
  - Discovery via user-shared URLs or a simple registry (MVP: manual URL entry).
- **Deployment**:
  - **Backend**: Dockerized FastAPI + ClickHouse, deployable on local machines or VPS (e.g., AWS, DigitalOcean).
  - **Frontend**: Static HTML/JS/CSS hosted on Netlify or as a Chrome extension.
- **Security**:
  - Passkeys (WebAuthn) for Web3-like auth, stored in IndexedDB.
  - JWT for API authentication, OAuth (Google) as fallback.
  - HTTPS for all communications.

#### Essential Components for MVP
- **Backend**:
  - Fetch CoinGecko data (24h % change, volume) for user-selected assets.
  - Compute composite relevance score with percentile-based outlier trimming.
  - Store raw and computed data in ClickHouse.
  - API endpoints: `/assets` (get rankings), `/configs` (manage user settings), `/backtest` (historical analysis).
- **Frontend**:
  - Display top assets by relevance score in a table.
  - Form to adjust formula weights and outlier thresholds.
  - Add/remove backend server URLs.
  - Basic chart for asset trends.
  - Passkey-based auth with Google OAuth fallback.
  - Dexie.js for local storage of configs and cached data.
- **ClickHouse Schema**:
  - Tables: `assets` (time-series data), `configs` (user settings), `portfolios` (allocations).
  - Support user-defined pruning (e.g., delete data older than X days).
- **Decentralized Discovery**: Manual backend URL input for MVP.
- **Backtesting**: Query historical data for simulated portfolio performance.

#### Outlier Handling
- **Method**: Percentile-based trimming (5th/95th percentiles) for 24h % change and log transformation for volume, configurable by users.
- **Implementation**: Applied in Python before storing in ClickHouse.

#### Non-Essential (Post-MVP)
- Advanced charting (e.g., interactive backtesting visualizations).
- Automated decentralized server discovery (e.g., torrent-like protocol).
- Multi-API support (beyond CoinGecko).
- Chrome extension deployment.

### Code Solution

Below is the MVP code, structured as a monorepo with setup instructions. I’ll include key components for backend (FastAPI, ClickHouse), frontend (Vanilla JS, Dexie.js), and a basic README. The code assumes CoinGecko for crypto data, implements the composite relevance formula, and supports user-configurable weights and outlier handling.

#### Directory Structure
```
crypto-portfolio/
├── backend/
│   ├── main.py               # FastAPI app
│   ├── coingecko.py          # CoinGecko API client
│   ├── calculations.py       # Relevance score logic
│   ├── database.py           # ClickHouse connection
│   ├── requirements.txt      # Python dependencies
│   └── Dockerfile            # Docker setup for backend
├── frontend/
│   ├── index.html            # Main UI
│   ├── app.js                # Frontend logic (Vanilla JS, Dexie.js)
│   ├── styles.css            # Basic styling
│   └── chart.js              # Charting library (CDN)
├── docker-compose.yml        # Backend + ClickHouse setup
└── README.md                 # Setup instructions
```

#### Backend Code

**`backend/requirements.txt`**
```
fastapi==0.115.0
uvicorn==0.32.0
requests==2.32.3
clickhouse-driver==0.2.9
pydantic==2.9.2
pyjwt==2.9.0
numpy==2.1.2
```

**`backend/coingecko.py`**
```python
import requests
from typing import List, Dict
from pydantic import BaseModel

class CoinGeckoClient:
    BASE_URL = "https://api.coingecko.com/api/v3"

    class AssetData(BaseModel):
        id: str
        symbol: str
        name: str
        price_change_percentage_24h: float
        total_volume: float

    def fetch_assets(self, vs_currency: str = "usd", ids: List[str] = None) -> List[AssetData]:
        params = {
            "vs_currency": vs_currency,
            "order": "market_cap_desc",
            "per_page": 100,
            "page": 1,
            "sparkline": False
        }
        if ids:
            params["ids"] = ",".join(ids)
        response = requests.get(f"{self.BASE_URL}/coins/markets", params=params)
        response.raise_for_status()
        data = response.json()
        return [self.AssetData(
            id=item["id"],
            symbol=item["symbol"],
            name=item["name"],
            price_change_percentage_24h=item["price_change_percentage_24h"] or 0.0,
            total_volume=item["total_volume"] or 0.0
        ) for item in data]
```

**`backend/calculations.py`**
```python
from typing import List
import numpy as np
from pydantic import BaseModel

class Config(BaseModel):
    w1: float = 0.333  # Weight for Formula 1
    w2: float = 0.333  # Weight for Formula 2
    w3: float = 0.333  # Weight for Formula 3
    percentile_lower: float = 5.0
    percentile_upper: float = 95.0

class AssetRanking(BaseModel):
    id: str
    symbol: str
    name: str
    relevance_score: float
    allocation_weight: float

def calculate_relevance(assets: List[dict], config: Config) -> List[AssetRanking]:
    # Extract metrics
    changes = np.array([abs(asset.price_change_percentage_24h) for asset in assets])
    volumes = np.array([asset.total_volume for asset in assets])

    # Outlier handling: Percentile trimming for % change, log transform for volume
    change_lower, change_upper = np.percentile(changes, [config.percentile_lower, config.percentile_upper])
    volumes_log = np.log10(volumes + 1)
    vol_lower, vol_upper = np.percentile(volumes_log, [config.percentile_lower, config.percentile_upper])

    changes_trimmed = np.clip(changes, change_lower, change_upper)
    volumes_log_trimmed = np.clip(volumes_log, vol_lower, vol_upper)

    # Calculate relevance scores
    relevance_1 = changes_trimmed * volumes  # Formula 1
    relevance_2 = 0.5 * (changes_trimmed / np.max(changes_trimmed + 1e-10)) + \
                  0.5 * (volumes_log_trimmed / np.max(volumes_log_trimmed + 1e-10))  # Formula 2
    relevance_3 = changes_trimmed * volumes_log_trimmed  # Formula 3

    # Normalize
    relevance_1 = relevance_1 / (np.max(relevance_1) + 1e-10)
    relevance_2 = relevance_2 / (np.max(relevance_2) + 1e-10)
    relevance_3 = relevance_3 / (np.max(relevance_3) + 1e-10)

    # Composite score
    composite_scores = config.w1 * relevance_1 + config.w2 * relevance_2 + config.w3 * relevance_3
    total_score = np.sum(composite_scores)
    weights = composite_scores / (total_score + 1e-10) if total_score > 0 else np.ones(len(assets)) / len(assets)

    # Create rankings
    rankings = [
        AssetRanking(
            id=asset.id,
            symbol=asset.symbol,
            name=asset.name,
            relevance_score=float(composite_scores[i]),
            allocation_weight=float(weights[i])
        )
        for i, asset in enumerate(assets)
    ]
    return sorted(rankings, key=lambda x: x.relevance_score, reverse=True)
```

**`backend/database.py`**
```python
from clickhouse_driver import Client
from datetime import datetime

class ClickHouseDB:
    def __init__(self, host="localhost", port=9000, user="default", password=""):
        self.client = Client(host=host, port=port, user=user, password=password)

    def init_schema(self):
        self.client.execute("""
        CREATE TABLE IF NOT EXISTS assets (
            timestamp DateTime,
            user_id String,
            asset_id String,
            symbol String,
            name String,
            price_change_percentage_24h Float32,
            total_volume Float64
        ) ENGINE = MergeTree()
        ORDER BY (timestamp, user_id, asset_id)
        """)
        self.client.execute("""
        CREATE TABLE IF NOT EXISTS configs (
            user_id String,
            config_id String,
            w1 Float32,
            w2 Float32,
            w3 Float32,
            percentile_lower Float32,
            percentile_upper Float32,
            created_at DateTime
        ) ENGINE = MergeTree()
        ORDER BY (user_id, config_id)
        """)
        self.client.execute("""
        CREATE TABLE IF NOT EXISTS portfolios (
            user_id String,
            config_id String,
            asset_id String,
            symbol String,
            name String,
            relevance_score Float32,
            allocation_weight Float32,
            timestamp DateTime
        ) ENGINE = MergeTree()
        ORDER BY (timestamp, user_id, config_id, asset_id)
        """)

    def insert_assets(self, user_id: str, assets: list):
        data = [
            (
                datetime.now(),
                user_id,
                asset.id,
                asset.symbol,
                asset.name,
                asset.price_change_percentage_24h,
                asset.total_volume
            )
            for asset in assets
        ]
        self.client.execute("INSERT INTO assets VALUES", data)

    def insert_config(self, user_id: str, config: Config, config_id: str):
        self.client.execute(
            "INSERT INTO configs VALUES",
            [(
                user_id,
                config_id,
                config.w1,
                config.w2,
                config.w3,
                config.percentile_lower,
                config.percentile_upper,
                datetime.now()
            )]
        )

    def insert_portfolio(self, user_id: str, config_id: str, rankings: list):
        data = [
            (
                user_id,
                config_id,
                r.id,
                r.symbol,
                r.name,
                r.relevance_score,
                r.allocation_weight,
                datetime.now()
            )
            for r in rankings
        ]
        self.client.execute("INSERT INTO portfolios VALUES", data)

    def get_rankings(self, user_id: str, config_id: str, limit: int = 10):
        return self.client.execute("""
        SELECT asset_id, symbol, name, relevance_score, allocation_weight
        FROM portfolios
        WHERE user_id = %s AND config_id = %s
        ORDER BY timestamp DESC, relevance_score DESC
        LIMIT %s
        """, (user_id, config_id, limit))
```

**`backend/main.py`**
```python
from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import jwt
from coingecko import CoinGeckoClient, CoinGeckoClient.AssetData
from calculations import Config, calculate_relevance
from database import ClickHouseDB
from typing import List
import os

app = FastAPI()
security = HTTPBearer()
db = ClickHouseDB()
coingecko = CoinGeckoClient()

SECRET_KEY = os.getenv("JWT_SECRET", "your-secret-key")

class UserConfig(BaseModel):
    asset_ids: List[str]
    config: Config

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=["HS256"])
        return payload["sub"]
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.on_event("startup")
async def startup():
    db.init_schema()

@app.post("/fetch-and-rank")
async def fetch_and_rank(config: UserConfig, user_id: str = Depends(verify_token)):
    try:
        assets = coingecko.fetch_assets(ids=config.asset_ids)
        rankings = calculate_relevance(assets, config.config)
        config_id = f"{user_id}_{len(config.asset_ids)}_{config.config.w1}"  # Simple ID
        db.insert_assets(user_id, assets)
        db.insert_config(user_id, config.config, config_id)
        db.insert_portfolio(user_id, config_id, rankings)
        return {"rankings": rankings, "config_id": config_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/rankings/{config_id}")
async def get_rankings(config_id: str, user_id: str = Depends(verify_token)):
    rankings = db.get_rankings(user_id, config_id)
    return [
        {
            "id": r[0],
            "symbol": r[1],
            "name": r[2],
            "relevance_score": r[3],
            "allocation_weight": r[4]
        }
        for r in rankings
    ]
```

**`backend/Dockerfile`**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Frontend Code

**`frontend/index.html`**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Crypto Portfolio</title>
    <link rel="stylesheet" href="styles.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/dexie@3.2.4/dist/dexie.min.js"></script>
</head>
<body>
    <div id="app">
        <h1>Crypto Portfolio Dashboard</h1>
        <button id="auth-btn">Authenticate</button>
        <div id="server-config">
            <h2>Backend Server</h2>
            <input id="server-url" type="text" placeholder="Enter backend URL">
            <button id="add-server">Add Server</button>
        </div>
        <div id="config-form">
            <h2>Configure Relevance</h2>
            <label>Asset IDs (comma-separated): <input id="asset-ids" type="text"></label>
            <label>W1: <input id="w1" type="number" step="0.01" value="0.333"></label>
            <label>W2: <input id="w2" type="number" step="0.01" value="0.333"></label>
            <label>W3: <input id="w3" type="number" step="0.01" value="0.333"></label>
            <label>Percentile Lower: <input id="p-lower" type="number" step="0.1" value="5"></label>
            <label>Percentile Upper: <input id="p-upper" type="number" step="0.1" value="95"></label>
            <button id="submit-config">Calculate Rankings</button>
        </div>
        <div id="rankings">
            <h2>Rankings</h2>
            <table id="rankings-table">
                <thead><tr><th>Symbol</th><th>Name</th><th>Relevance Score</th><th>Allocation Weight</th></tr></thead>
                <tbody></tbody>
            </table>
        </div>
        <div id="chart-container">
            <canvas id="relevance-chart"></canvas>
        </div>
    </div>
    <script src="app.js"></script>
</body>
</html>
```

**`frontend/styles.css`**
```css
body {
    font-family: Arial, sans-serif;
    margin: 20px;
}
#app {
    max-width: 800px;
    margin: auto;
}
#config-form, #server-config {
    margin: 20px 0;
}
#config-form label {
    display: block;
    margin: 10px 0;
}
table {
    width: 100%;
    border-collapse: collapse;
}
th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
}
th {
    background-color: #f2f2f2;
}
#chart-container {
    margin-top: 20px;
}
```

**`frontend/app.js`**
```javascript
const db = new Dexie("CryptoPortfolioDB");
db.version(1).stores({
    configs: "++id,userId,assetIds,w1,w2,w3,pLower,pUpper",
    servers: "url",
    credentials: "userId"
});

const authBtn = document.getElementById("auth-btn");
const serverUrlInput = document.getElementById("server-url");
const addServerBtn = document.getElementById("add-server");
const assetIdsInput = document.getElementById("asset-ids");
const w1Input = document.getElementById("w1");
const w2Input = document.getElementById("w2");
const w3Input = document.getElementById("w3");
const pLowerInput = document.getElementById("p-lower");
const pUpperInput = document.getElementById("p-upper");
const submitConfigBtn = document.getElementById("submit-config");
const rankingsTable = document.querySelector("#rankings-table tbody");
const chartCanvas = document.getElementById("relevance-chart");
let chart;

async function authenticate() {
    // Placeholder for WebAuthn (passkeys)
    const userId = "user_" + Math.random().toString(36).substring(2);
    const token = await fakeJwtToken(userId); // Replace with real JWT from OAuth/passkeys
    await db.credentials.put({ userId, token });
    authBtn.textContent = `Authenticated as ${userId}`;
}

async function fakeJwtToken(userId) {
    return "fake-jwt-token-" + userId; // Replace with real JWT generation
}

addServerBtn.addEventListener("click", async () => {
    const url = serverUrlInput.value.trim();
    if (url) {
        await db.servers.put({ url });
        serverUrlInput.value = "";
        alert("Server added!");
    }
});

submitConfigBtn.addEventListener("click", async () => {
    const userId = (await db.credentials.toArray())[0]?.userId;
    if (!userId) {
        alert("Please authenticate first!");
        return;
    }
    const server = (await db.servers.toArray())[0]?.url;
    if (!server) {
        alert("Please add a server URL!");
        return;
    }
    const config = {
        asset_ids: assetIdsInput.value.split(",").map(id => id.trim()).filter(id => id),
        config: {
            w1: parseFloat(w1Input.value),
            w2: parseFloat(w2Input.value),
            w3: parseFloat(w3Input.value),
            percentile_lower: parseFloat(pLowerInput.value),
            percentile_upper: parseFloat(pUpperInput.value)
        }
    };
    await db.configs.put({
        userId,
        assetIds: config.asset_ids,
        w1: config.config.w1,
        w2: config.config.w2,
        w3: config.config.w3,
        pLower: config.config.percentile_lower,
        pUpper: config.config.percentile_upper
    });
    try {
        const response = await fetch(`${server}/fetch-and-rank`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${(await db.credentials.toArray())[0].token}`
            },
            body: JSON.stringify(config)
        });
        const data = await response.json();
        displayRankings(data.rankings);
        updateChart(data.rankings);
    } catch (error) {
        console.error("Error fetching rankings:", error);
        alert("Failed to fetch rankings");
    }
});

function displayRankings(rankings) {
    rankingsTable.innerHTML = "";
    rankings.forEach(r => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${r.symbol}</td>
            <td>${r.name}</td>
            <td>${r.relevance_score.toFixed(4)}</td>
            <td>${(r.allocation_weight * 100).toFixed(2)}%</td>
        `;
        rankingsTable.appendChild(row);
    });
}

function updateChart(rankings) {
    if (chart) chart.destroy();
    chart = new Chart(chartCanvas, {
        type: "bar",
        data: {
            labels: rankings.map(r => r.symbol),
            datasets: [{
                label: "Relevance Score",
                data: rankings.map(r => r.relevance_score),
                backgroundColor: "rgba(75, 192, 192, 0.2)",
                borderColor: "rgba(75, 192, 192, 1)",
                borderWidth: 1
            }]
        },
        options: {
            scales: { y: { beginAtZero: true } }
        }
    });
}

authBtn.addEventListener("click", authenticate);
```

#### Setup Instructions

**`docker-compose.yml`**
```yaml
version: "3"
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - JWT_SECRET=your-secret-key
    depends_on:
      - clickhouse
  clickhouse:
    image: clickhouse/clickhouse-server:latest
    ports:
      - "8123:8123"
      - "9000:9000"
    volumes:
      - clickhouse-data:/var/lib/clickhouse
volumes:
  clickhouse-data:
```

**`README.md`**
```markdown
# Crypto Portfolio

A multiuser, decentralized platform for ranking cryptocurrencies by relevance and managing portfolio allocations.

## Setup

1. **Prerequisites**:
   - Docker and Docker Compose
   - Node.js (for frontend development, optional)

2. **Backend**:
   ```bash
   cd backend
   docker-compose up --build
   ```
   - FastAPI runs on `http://localhost:8000`
   - ClickHouse runs on `http://localhost:8123` (HTTP) and port 9000 (native)

3. **Frontend**:
   - Copy `frontend/` to a static hosting service (e.g., Netlify) or serve locally:
     ```bash
     cd frontend
     npx http-server
     ```
   - Access at `http://localhost:8080`

4. **Usage**:
   - Open the frontend in a browser.
   - Authenticate (MVP uses fake JWT; replace with WebAuthn/OAuth).
   - Add a backend server URL (e.g., `http://localhost:8000`).
   - Enter asset IDs (e.g., `bitcoin,ethereum`), configure weights and percentiles, and submit.
   - View rankings and allocation weights in the table and chart.

5. **Dependencies**:
   - Backend: See `backend/requirements.txt`
   - Frontend: Chart.js (CDN), Dexie.js (CDN)

## Notes
- MVP uses manual server URL entry. Future versions can add decentralized discovery.
- Passkeys and OAuth are placeholders; implement WebAuthn for production.
- ClickHouse stores historical data; add pruning via API in future iterations.
```

### Key Features Implemented
- **Backend**:
  - Fetches CoinGecko data for user-specified crypto assets.
  - Computes composite relevance score with percentile-based outlier trimming and log-transformed volume.
  - Stores raw data, configs, and portfolios in ClickHouse.
  - Exposes `/fetch-and-rank` and `/rankings/{config_id}` endpoints, secured with JWT.
- **Frontend**:
  - Vanilla JS with Dexie.js for local storage of configs and credentials.
  - Displays rankings in a table and relevance scores in a bar chart (Chart.js).
  - Allows users to input backend URLs and configure relevance formula parameters.
  - Fake auth (to be replaced with WebAuthn).
- **ClickHouse**:
  - Stores time-series asset data, user configs, and portfolio rankings.
  - Supports historical data for future backtesting.
- **Decentralized Network**: MVP uses manual URL entry for backend servers.
- **Outlier Handling**: Percentile trimming (5th/95th) for % change, log transformation for volume.
- **MVP Limitations**:
  - No WebAuthn/OAuth (placeholder auth).
  - No automated server discovery.
  - Basic backtesting (data stored, but no analysis endpoint).
  - No data pruning UI.

### How to Extend
- **Authentication**: Implement WebAuthn using `@simplewebauthn/browser` and `@simplewebauthn/server`, with Google OAuth via a library like `passport.js`.
- **Backtesting**: Add a `/backtest` endpoint to query historical data and simulate portfolio performance.
- **Decentralized Discovery**: Implement a registry (e.g., in ClickHouse or IPFS) for users to share backend URLs.
- **Pruning**: Add a UI and API endpoint to delete old data based on user settings.
- **Charts**: Enhance with time-series plots using historical data.

### Final Answer
The provided code implements an MVP for a multiuser, decentralized crypto portfolio platform:
- **Backend**: FastAPI server fetches CoinGecko data, computes relevance scores (composite formula with percentile trimming and log volume), and stores in ClickHouse. API endpoints are secured with JWT.
- **Frontend**: Vanilla JS with Dexie.js for local storage, displays rankings and charts, and allows config adjustments and server URL input.
- **ClickHouse Schema**: Stores assets, configs, and portfolios, supporting historical data.
- **Setup**: Use `docker-compose.yml` for backend and ClickHouse; host frontend statically or locally.
- **Outlier Handling**: Percentile-based trimming and log transformation, user-configurable.
- **Decentralized Network**: Manual URL entry for MVP.

To run:
1. Save files in the described structure.
2. Run `docker-compose up` in the root directory.
3. Serve `frontend/` via `npx http-server` or deploy to Netlify.
4. Access the UI, authenticate, add a server URL (e.g., `http://localhost:8000`), and configure rankings.

Please test the code and let me know if you need:
- WebAuthn/OAuth implementation.
- Sample CoinGecko asset IDs for testing.
- Backtesting endpoint.
- Deployment help (e.g., VPS setup).
- Additional features or bug fixes.

If you have specific asset IDs or a preferred update interval, I can customize the example further!