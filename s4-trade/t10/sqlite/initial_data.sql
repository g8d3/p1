-- Converted for SQLite compatibility.

-- Initial Configuration Data
-- Insert core system configs
INSERT INTO System_Configuration (config_key, config_value, data_type, description) VALUES
('maintenance_mode', '0', 'boolean', 'Global maintenance mode toggle'),
('global_max_leverage', '10', 'integer', 'Maximum leverage allowed across all strategies'),
('default_notification_service', 'twilio_sms', 'string', 'Default service for user notifications');

-- Insert sample services (DEXs, etc.)
INSERT INTO Services (service_name, service_type, config_json) VALUES
('dYdX', 'DEX', '{"rpc_url": "https://api.dydx.exchange/v3", "chain_id": 1}'),
('Binance', 'DEX', '{"api_key": "encrypted_key", "base_url": "https://api.binance.com"}'),
('Infura', 'RPC_PROVIDER', '{"url": "https://mainnet.infura.io/v3/...", "project_id": "encrypted"}'),
('Twilio', 'NOTIFICATION', '{"account_sid": "encrypted", "auth_token": "encrypted"}');

-- Insert roles
INSERT INTO Roles (role_name) VALUES
('Admin'),
('Trader'),
('Quant'),
('Auditor');

-- Insert permissions
INSERT INTO Permissions (permission_name, description) VALUES
('strategy:create', 'Create new strategies'),
('strategy:execute', 'Execute strategies'),
('user:manage', 'Manage user accounts'),
('system_config:edit', 'Edit system configurations'),
('logs:view', 'View application logs');

-- Link roles to permissions
INSERT INTO Role_Permissions (role_id, permission_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5),
(2, 1), (2, 2),
(3, 1),
(4, 5);

-- Insert sample markets
INSERT INTO Markets (service_id, market_symbol, base_asset, quote_asset, metadata_json) VALUES
(1, 'ETH-PERP', 'ETH', 'USD', '{"tick_size": 0.01, "step_size": 0.1}'),
(2, 'BTC-USDT', 'BTC', 'USDT', '{"tick_size": 0.001, "max_order_size": 100}');

-- Insert sample data endpoints
INSERT INTO Data_Endpoints (market_id, data_type, source_type, connection_details_json, parser_logic_json, update_frequency_ms) VALUES
(1, 'funding_rate', 'REST', '{"path": "/funding", "method": "GET"}', '{"path": "$.result[0].rate"}', 30000),
(1, 'index_price', 'WEBSOCKET', '{"url": "wss://api.dydx.exchange/ws"}', '{"path": "$.price"}', NULL);

-- Insert execution algorithms
INSERT INTO Execution_Algorithms (algo_name, description, parameters_json) VALUES
('TWAP', 'Time-Weighted Average Price execution', '{"chunk_size_usd": 1000, "delay_between_chunks_ms": 5000}'),
('Instant', 'Immediate market order', '{"slippage_tolerance_pct": 0.5}');

-- Insert sample UI views
INSERT INTO UI_Views (view_name, route_path) VALUES
('Dashboard', '/dashboard'),
('StrategyEditor', '/strategies/edit'),
('UserManagement', '/admin/users');

-- Link views to roles
INSERT INTO View_Role_Access (view_id, role_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4),
(2, 1), (2, 2), (2, 3),
(3, 1);

-- Insert sample UI components (for dashboard)
INSERT INTO UI_Components (view_id, component_type, grid_position_json, config_json) VALUES
(1, 'TABLE', '{"x": 0, "y": 0, "width": 12, "height": 6}', '{"title": "Live Opportunities", "source_table": "Discovered_Opportunities", "columns": ["strategy_id", "calculated_apr", "max_size_usd"], "sort": {"field": "calculated_apr", "direction": "desc"}}'),
(1, 'BUTTON', '{"x": 0, "y": 6, "width": 3, "height": 2}', '{"label": "Deposit", "action": "allocate_funds"}');

-- Insert sample users
INSERT INTO Users (username, is_active) VALUES
('0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B', 1),
('0x742d35Cc6634C0532925a3b8D3D8f8e8b98a1E', 1);

-- Assign roles to users
INSERT INTO User_Roles (user_id, role_id) VALUES
(1, 2),
(2, 1);

-- Insert sample user wallets
INSERT INTO User_Wallets (user_id, wallet_address, chain) VALUES
(1, '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B', 'Ethereum'),
(2, '0x742d35Cc6634C0532925a3b8D3D8f8e8e8b98a1E', 'Arbitrum');

-- Insert sample strategies
INSERT INTO Strategies (strategy_name, description, created_by_user_id, is_active, execution_algo_id) VALUES
('ETH Funding Rate Arb', 'Arbitrage between dYdX and GMX funding rates for ETH-PERP', 1, 1, 1),
('BTC Cross-DEX Basis', 'Basis trade BTC between Binance and dYdX', 1, 0, 2);

-- Insert strategy parameters
INSERT INTO Strategy_Parameters (strategy_id, param_name, data_type, default_value, description) VALUES
(1, 'min_rate_spread', 'decimal', '0.0001', 'Minimum funding rate difference to trigger entry'),
(1, 'max_slippage_pct', 'decimal', '0.5', 'Maximum acceptable slippage percentage'),
(1, 'position_size_usd', 'decimal', '10000', 'Default position size in USD'),
(2, 'min_rate_spread', 'decimal', '0.00005', 'Minimum spread for BTC basis'),
(2, 'leverage', 'integer', '5', 'Leverage multiplier for the position');

-- Insert sample strategy rules
INSERT INTO Strategy_Rules (strategy_id, rule_group, execution_order, left_operand_type, left_operand_value, operator, right_operand_type, right_operand_value, action_on_true) VALUES
(1, 'ENTRY_CONDITION', 1, 'FUNCTION', 'calculate_spread(dydx_eth, gmx_eth)', 'GT', 'PARAMETER', 'min_rate_spread', 'OPEN_POSITION'),
(1, 'EXIT_PROFIT', 1, 'FUNCTION', 'current_spread(dydx_eth, gmx_eth)', 'LT', 'PARAMETER', 'min_rate_spread', 'CLOSE_POSITION'),
(1, 'STOP_LOSS', 1, 'FIELD', 'net_pnl_usd', 'LT', 'CONSTANT', '-500', 'CLOSE_POSITION');

-- Insert sample discovered opportunities
INSERT INTO Discovered_Opportunities (strategy_id, market_a_id, market_b_id, calculated_apr, max_size_usd, expires_at) VALUES
(1, 1, 1, 0.085, 50000, datetime('now', '+1 hour')),
(2, 2, 1, 0.042, 25000, datetime('now', '+30 minutes'));

-- Insert sample user portfolio
INSERT INTO User_Portfolios (user_id, portfolio_name, total_capital, asset_symbol, allocation_rules_json, is_active, is_public, public_description) VALUES
(1, 'Aggressive ETH Arb Fund', 100000, 'USDT', '[{"rule": "max_pct_per_trade", "value": 0.25}, {"rule": "min_apr", "value": 60}]', 1, 1, 'Automated allocation to high-yield ETH funding arbs.');

-- Insert sample portfolio stats
INSERT INTO Portfolio_Stats_History (portfolio_id, timestamp, pnl_pct, aum_usd, sharpe_ratio) VALUES
(1, '2025-10-12 00:00:00', 0.015, 101500, 1.8),
(1, '2025-10-13 00:00:00', 0.008, 102000, 1.9);

-- Insert sample backtest session
INSERT INTO Backtest_Sessions (strategy_id, user_id, start_time, end_time, initial_capital, status, results_summary_json) VALUES
(1, 1, '2025-09-01 00:00:00', '2025-10-01 00:00:00', 50000, 'COMPLETED', '{"total_pnl": 4523.5, "sharpe_ratio": 2.1, "max_drawdown": -0.08}');

-- Insert sample logs
INSERT INTO Execution_Logs (strategy_id, log_level, message, details_json) VALUES
(1, 'INFO', 'Strategy activated successfully', '{"user_id": 1}'),
(1, 'WARN', 'Opportunity expired without execution', '{"opportunity_id": 1}');
