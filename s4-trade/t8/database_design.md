### Database Design for EVM Trading Terminal

I'll propose a relational database schema (e.g., PostgreSQL) with tables, key fields, relationships, and indexes. Assumptions: Users authenticate via Web3 (wallet address as primary key). "Records" for sharing include strategies, trades, RPC/indexer/LLM configs. Admins have elevated permissions (e.g., view all user data, manage shares). Paywalls use a simple price field (in ETH or USD).

#### Tables and Fields

1. **users**
   - `wallet_address` (VARCHAR(42), PRIMARY KEY) - Ethereum address for Web3 auth
   - `username` (VARCHAR(50), UNIQUE, NULLABLE) - Optional display name
   - `email` (VARCHAR(100), NULLABLE) - For notifications
   - `role` (ENUM: 'user', 'admin') - Default 'user'; admins can manage all
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)
   - Indexes: `wallet_address` (unique), `role`

2. **rpc_servers**
   - `id` (SERIAL, PRIMARY KEY)
   - `user_wallet` (VARCHAR(42), FK to users.wallet_address) - Owner
   - `name` (VARCHAR(100))
   - `url` (VARCHAR(200))
   - `chain_id` (INT) - E.g., 1 for Ethereum mainnet
   - `is_active` (BOOLEAN, DEFAULT TRUE)
   - `created_at` (TIMESTAMP)
   - Indexes: `user_wallet`, `chain_id`

3. **indexer_servers**
   - `id` (SERIAL, PRIMARY KEY)
   - `user_wallet` (VARCHAR(42), FK to users.wallet_address)
   - `name` (VARCHAR(100))
   - `url` (VARCHAR(200))
   - `type` (ENUM: 'defillama', 'dune', 'rpc_aggregated', 'custom') - Data source type
   - `chain_id` (INT, NULLABLE)
   - `is_active` (BOOLEAN, DEFAULT TRUE)
   - `created_at` (TIMESTAMP)
   - Indexes: `user_wallet`, `type`, `chain_id`

4. **llm_servers**
   - `id` (SERIAL, PRIMARY KEY)
   - `user_wallet` (VARCHAR(42), FK to users.wallet_address)
   - `name` (VARCHAR(100))
   - `url` (VARCHAR(200))
   - `type` (ENUM: 'openai', 'anthropic', 'custom') - LLM provider type
   - `api_key` (VARCHAR(200), NULLABLE) - Encrypted or hashed
   - `is_active` (BOOLEAN, DEFAULT TRUE)
   - `created_at` (TIMESTAMP)
   - Indexes: `user_wallet`, `type`

5. **strategies**
   - `id` (SERIAL, PRIMARY KEY)
   - `user_wallet` (VARCHAR(42), FK to users.wallet_address)
   - `name` (VARCHAR(100))
   - `description` (TEXT, NULLABLE)
   - `parameters` (JSONB) - E.g., {"risk_level": "high", "tokens": ["ETH", "USDC"]}
   - `is_active` (BOOLEAN, DEFAULT TRUE)
   - `created_at` (TIMESTAMP)
   - Indexes: `user_wallet`, `is_active`

6. **trades**
   - `id` (SERIAL, PRIMARY KEY)
   - `strategy_id` (INT, FK to strategies.id)
   - `token_in` (VARCHAR(42)) - ERC20 address
   - `token_out` (VARCHAR(42))
   - `amount_in` (DECIMAL(36,18)) - Wei/ether units
   - `amount_out` (DECIMAL(36,18))
   - `price` (DECIMAL(36,18), NULLABLE) - USD or ETH price at trade time
   - `tx_hash` (VARCHAR(66), UNIQUE) - Ethereum transaction hash
   - `block_number` (BIGINT)
   - `timestamp` (TIMESTAMP)
   - `status` (ENUM: 'pending', 'confirmed', 'failed')
   - Indexes: `strategy_id`, `tx_hash`, `timestamp`, `status`

7. **shares**
   - `id` (SERIAL, PRIMARY KEY)
   - `owner_wallet` (VARCHAR(42), FK to users.wallet_address) - Who shared
   - `record_type` (ENUM: 'strategy', 'trade', 'rpc_server', 'indexer_server', 'llm_server') - What is shared
   - `record_id` (INT) - FK to the respective table's id
   - `paywall_price` (DECIMAL(36,18), NULLABLE) - Cost in ETH; NULL for free
   - `paywall_currency` (VARCHAR(10), DEFAULT 'ETH') - E.g., 'ETH' or 'USD'
   - `is_public` (BOOLEAN, DEFAULT FALSE) - Visible to all or specific users
   - `shared_at` (TIMESTAMP)
   - Indexes: `owner_wallet`, `record_type`, `is_public`

#### Relationships
- Users → RPC Servers (1:many)
- Users → Indexer Servers (1:many)
- Users → LLM Servers (1:many)
- Users → Strategies (1:many)
- Strategies → Trades (1:many)
- Users → Shares (1:many, via owner_wallet)

#### Additional Notes
- **Admin Capabilities**: Admins (role='admin') can query all tables, delete/modify shares, and view user data. Implement via app logic (e.g., middleware checks).
- **Security**: Use wallet signatures for auth. Encrypt sensitive fields like api_key.
- **Extensions**: Add tables for tokens (ERC20 metadata), portfolios (user balances), or notifications if required.
- **Indexes Rationale**: Optimize queries for user-specific data, time-based trade lookups, and share visibility. Use composite indexes where queries filter by multiple fields (e.g., user + type).

This design supports the described features. Let me know if you need ER diagrams, migrations, or adjustments!