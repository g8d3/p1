# Perp DEX Funding Rate Arbitrage App

A web app to monitor and alert on funding rate arbitrage opportunities across top perpetual DEXes.

## Features
- Fetches funding rates from multiple DEXes
- Displays rates in a dashboard
- Identifies arbitrage opportunities

## Setup
1. Clone the repo
2. Install all dependencies: `npm run install-all`
3. Run both services: `npm run dev` (or `./dev.sh` for shell script)

The app will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

### Scripts Available
- `npm run dev`: Run both services with concurrently (recommended)
- `./dev.sh`: Shell script alternative
- `npm run start`: Run backend in production mode + frontend in dev mode

### Manual Setup (Alternative)
- Backend: `cd backend && npm install && npm run dev` (runs on port 5000)
- Frontend: `cd frontend && npm install && npm run dev` (runs on port 5173)

## Deploy
- Backend: Deploy to Heroku or Railway
- Frontend: Deploy to Vercel

## DEXes Supported
- Hyperliquid
- Lighter (WebSocket)
- Paradex
- Aster
- edgeX
- Pacifica
- ApeX Protocol
- ADEN
- Jupiter (disabled - no perpetual futures)