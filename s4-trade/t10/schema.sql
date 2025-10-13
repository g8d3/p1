-- Assuming PostgreSQL. Run this script to create the schema.
-- Initial data can be inserted separately.

-- 1. System & Core Configuration
CREATE TABLE System_Configuration (
    config_key VARCHAR(255) PRIMARY KEY,
    config_value TEXT NOT NULL,
    data_type VARCHAR(50) NOT NULL CHECK (data_type IN ('boolean', 'integer', 'string', 'json')),
    description TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE
);

CREATE TABLE Services (
    service_id SERIAL PRIMARY KEY,
    service_name VARCHAR(255) NOT NULL UNIQUE,
    service_type VARCHAR(50) NOT NULL,
    config_json JSONB
);

-- 2. Users, Authentication & Authorization (RBAC)
CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,  -- Will store wallet address for wallet-only signup
    hashed_password TEXT,  -- Nullable for wallet-only
    email VARCHAR(255),
    mfa_secret_encrypted TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE Roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE Permissions (
    permission_id SERIAL PRIMARY KEY,
    permission_name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE User_Roles (
    user_id INTEGER REFERENCES Users(user_id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES Roles(role_id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE Role_Permissions (
    role_id INTEGER REFERENCES Roles(role_id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES Permissions(permission_id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 3. Connectivity & Data Ingestion
CREATE TABLE Markets (
    market_id SERIAL PRIMARY KEY,
    service_id INTEGER REFERENCES Services(service_id),
    market_symbol VARCHAR(100) NOT NULL,
    base_asset VARCHAR(20),
    quote_asset VARCHAR(20),
    metadata_json JSONB
);

CREATE TABLE Data_Endpoints (
    endpoint_id SERIAL PRIMARY KEY,
    market_id INTEGER REFERENCES Markets(market_id) ON DELETE CASCADE,
    data_type VARCHAR(100) NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    connection_details_json JSONB,
    parser_logic_json JSONB,
    update_frequency_ms INTEGER
);

-- 4. Business Logic & Strategy Definition
CREATE TABLE Strategies (
    strategy_id SERIAL PRIMARY KEY,
    strategy_name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by_user_id INTEGER REFERENCES Users(user_id),
    is_active BOOLEAN DEFAULT FALSE,
    execution_algo_id INTEGER  -- FK added later
);

CREATE TABLE Strategy_Parameters (
    param_id SERIAL PRIMARY KEY,
    strategy_id INTEGER REFERENCES Strategies(strategy_id) ON DELETE CASCADE,
    param_name VARCHAR(255) NOT NULL,
    data_type VARCHAR(50) NOT NULL,
    default_value TEXT,
    description TEXT
);

CREATE TABLE Strategy_Rules (
    rule_id SERIAL PRIMARY KEY,
    strategy_id INTEGER REFERENCES Strategies(strategy_id) ON DELETE CASCADE,
    rule_group VARCHAR(100) NOT NULL,
    execution_order INTEGER NOT NULL,
    left_operand_type VARCHAR(50) NOT NULL,
    left_operand_value TEXT NOT NULL,
    operator VARCHAR(10) NOT NULL CHECK (operator IN ('GT', 'LT', 'EQ', 'GTE', 'LTE')),
    right_operand_type VARCHAR(50) NOT NULL,
    right_operand_value TEXT NOT NULL,
    conjunction VARCHAR(10) CHECK (conjunction IN ('AND', 'OR')),
    action_on_true VARCHAR(100) NOT NULL
);

-- 5. Execution & Operations
CREATE TABLE User_Wallets (
    wallet_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES Users(user_id) ON DELETE CASCADE,
    wallet_address VARCHAR(255) NOT NULL,
    encrypted_private_key TEXT,
    chain VARCHAR(50)
);

CREATE TABLE Positions (
    position_id SERIAL PRIMARY KEY,
    strategy_id INTEGER REFERENCES Strategies(strategy_id),
    user_id INTEGER REFERENCES Users(user_id),
    status VARCHAR(50) NOT NULL,
    net_pnl_usd DECIMAL(18, 8) DEFAULT 0,
    opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP
);

CREATE TABLE Trades (
    trade_id SERIAL PRIMARY KEY,
    position_id INTEGER REFERENCES Positions(position_id) ON DELETE CASCADE,
    market_id INTEGER REFERENCES Markets(market_id),
    trade_direction VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL CHECK (side IN ('LONG', 'SHORT')),
    amount DECIMAL(18, 8) NOT NULL,
    price DECIMAL(18, 8),
    status VARCHAR(50) NOT NULL,
    tx_hash VARCHAR(255)
);

-- 6. Monitoring, Auditing & Logging
CREATE TABLE Action_Logs (
    log_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES Users(user_id),
    permission_name INTEGER REFERENCES Permissions(permission_id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details_json JSONB
);

CREATE TABLE Execution_Logs (
    log_id SERIAL PRIMARY KEY,
    strategy_id INTEGER REFERENCES Strategies(strategy_id),
    position_id INTEGER REFERENCES Positions(position_id),
    log_level VARCHAR(20) NOT NULL CHECK (log_level IN ('INFO', 'WARN', 'ERROR', 'CRITICAL')),
    message TEXT NOT NULL,
    details_json JSONB,
    error_report_url TEXT,  -- New column
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Testing & Simulation
CREATE TABLE Backtest_Sessions (
    session_id SERIAL PRIMARY KEY,
    strategy_id INTEGER REFERENCES Strategies(strategy_id),
    user_id INTEGER REFERENCES Users(user_id),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    initial_capital DECIMAL(18, 8),
    status VARCHAR(20) NOT NULL,
    results_summary_json JSONB
);

-- 8. UI & Frontend Configuration
CREATE TABLE UI_Views (
    view_id SERIAL PRIMARY KEY,
    view_name VARCHAR(255) NOT NULL,
    route_path VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE View_Role_Access (
    view_id INTEGER REFERENCES UI_Views(view_id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES Roles(role_id) ON DELETE CASCADE,
    PRIMARY KEY (view_id, role_id)
);

CREATE TABLE UI_Components (
    component_id SERIAL PRIMARY KEY,
    view_id INTEGER REFERENCES UI_Views(view_id) ON DELETE CASCADE,
    component_type VARCHAR(100) NOT NULL,
    grid_position_json JSONB,
    config_json JSONB
);

-- Additions from User Stories
CREATE TABLE Discovered_Opportunities (
    opportunity_id SERIAL PRIMARY KEY,
    strategy_id INTEGER REFERENCES Strategies(strategy_id),
    market_a_id INTEGER REFERENCES Markets(market_id),
    market_b_id INTEGER REFERENCES Markets(market_id),
    calculated_apr DECIMAL(10, 6),
    max_size_usd DECIMAL(18, 2),
    expires_at TIMESTAMP
);

CREATE TABLE User_Portfolios (
    portfolio_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES Users(user_id) ON DELETE CASCADE,
    portfolio_name VARCHAR(255) NOT NULL,
    total_capital DECIMAL(18, 2) NOT NULL,
    asset_symbol VARCHAR(10) NOT NULL,
    allocation_rules_json JSONB,
    is_active BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    public_description TEXT
);

CREATE TABLE Portfolio_Followers (
    portfolio_id INTEGER REFERENCES User_Portfolios(portfolio_id) ON DELETE CASCADE,
    follower_user_id INTEGER REFERENCES Users(user_id) ON DELETE CASCADE,
    capital_allocated DECIMAL(18, 2),
    PRIMARY KEY (portfolio_id, follower_user_id)
);

CREATE TABLE Portfolio_Stats_History (
    stat_id SERIAL PRIMARY KEY,
    portfolio_id INTEGER REFERENCES User_Portfolios(portfolio_id) ON DELETE CASCADE,
    timestamp TIMESTAMP NOT NULL,
    pnl_pct DECIMAL(10, 6),
    aum_usd DECIMAL(18, 2),
    sharpe_ratio DECIMAL(10, 6)
);

CREATE TABLE Execution_Algorithms (
    algo_id SERIAL PRIMARY KEY,
    algo_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    parameters_json JSONB
);

-- Add FK to Strategies
ALTER TABLE Strategies ADD CONSTRAINT fk_execution_algo
FOREIGN KEY (execution_algo_id) REFERENCES Execution_Algorithms(algo_id);

-- Indexes for performance
CREATE INDEX idx_users_username ON Users(username);
CREATE INDEX idx_strategies_active ON Strategies(is_active);
CREATE INDEX idx_positions_user_status ON Positions(user_id, status);
CREATE INDEX idx_execution_logs_timestamp ON Execution_Logs(timestamp);
CREATE INDEX idx_discovered_opportunities_expires ON Discovered_Opportunities(expires_at);