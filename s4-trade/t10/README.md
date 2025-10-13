# DEX Funding Rate Arbitrage Web App

A metaprogrammed web application for DEX funding rate arbitrage, where the entire app logic (auth, UI, business rules, etc.) is defined in a PostgreSQL database. The web app code is a generic engine that renders based on DB content.

## Features
- **Wallet-Only Auth**: Sign up/login via wallet signature (no email/password).
- **RBAC**: Roles like Admin, Trader, Quant with granular permissions.
- **Strategy Definition**: Configurable arbitrage strategies via DB rules (e.g., funding rate spreads between dYdX/GMX).
- **Automated Allocation**: "Set & Forget" portfolios with rules for capital distribution across opportunities.
- **Copy Trading**: Share public portfolios; followers allocate capital to copy.
- **Execution Algorithms**: TWAP/VWAP to minimize slippage on large delta-neutral orders.
- **Live Opportunities**: Real-time table of arb chances, sorted by APR, with deposit buttons.
- **Backtesting**: Simulate strategies on historical data.
- **Logging & Monitoring**: Full audit trails with error URLs (integrate Sentry).
- **Dynamic UI**: Frontend layout/components defined in DB for different roles.

All config (including business logic) is in the DB—no hardcoding in app code.

## Tech Stack
- **Database**: PostgreSQL (schema in `schema.sql`, initial data in `initial_data.sql`).
- **Backend Engine**: Directus (auto-generates CRUD API/admin UI from schema).
- **Frontend**: Custom build on Directus API (or use Directus' built-in for admin; extend for trader dashboard).
- **Execution**: Node.js/TS engine for strategy eval, trade execution (integrate with DEX SDKs like ethers.js).
- **Notifications**: Twilio/Slack (configurable via DB).

## Quick Setup
1. **Prerequisites**:
   - PostgreSQL 14+ (localhost:5432).
   - Node.js 20+.
   - Wallet for testing (e.g., MetaMask).

2. **Database Setup**:
   ```bash
   # Edit setup.sh with your DB_PASS
   chmod +x setup.sh && ./setup.sh
   ```
   This creates DB `dex_arb`, runs schema/initial data, sets up Directus.

3. **Run Directus (Admin UI)**:
   ```bash
   cd directus-app && npm run dev
   ```
   Access at http://localhost:8055. Login: admin@directus.io / password. Configure roles/permissions via UI.

4. **Custom Engine/Frontend**:
   - Use Directus API for data (REST/GraphQL).
   - Implement engine logic: Query DB for rules/UI, evaluate strategies, execute trades.
   - Example: For wallet auth, verify signature against `Users.username` (wallet address).

5. **Production**:
   - Deploy DB to RDS/Aurora.
   - Host Directus on Vercel/Render.
   - Secure secrets in DB (`is_encrypted` flag).
   - Integrate real DEX APIs (add to `Services` table).
   - Run background jobs for opportunity discovery/portfolio rebalancing.

## Database Schema Overview
- **Core Tables**: `System_Configuration`, `Users`, `Roles`, `Permissions`.
- **Strategies**: `Strategies`, `Strategy_Rules`, `Strategy_Parameters`.
- **Operations**: `Positions`, `Trades`, `User_Wallets`, `User_Portfolios`.
- **UI**: `UI_Views`, `UI_Components`.
- **Monitoring**: `Execution_Logs`, `Action_Logs`.
- Full schema: See `schema.sql`.

## User Stories
- **Trader**: View opportunities table (APR-sorted), create automated portfolio (e.g., $100k USDT, max 25% per trade), share for followers.
- **Developer**: Use Directus for CRUD; extend engine for custom logic (no per-table code).
- **Execution**: Break large orders into chunks (TWAP) to fill delta-neutral positions without slippage.

## Debugging
- Errors logged to `Execution_Logs` with `error_report_url` (integrate Sentry).
- View logs in Directus UI.

## Next Steps
- Implement strategy evaluation engine (query `Data_Endpoints`, eval `Strategy_Rules`).
- Build trader frontend: Query `Discovered_Opportunities`, render via `UI_Components`.
- Add DEX integrations (e.g., ethers.js for on-chain trades).
- Test: Run backtests via `Backtest_Sessions`.

For issues: https://github.com/sst/opencode/issues  
Built with opencode AI assistant.