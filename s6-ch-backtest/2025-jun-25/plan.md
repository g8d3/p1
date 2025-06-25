# Plan for ClickHouse Playground (Browser-based, Web3 Auth)

## 1. Overview
- Build a browser-based playground for managing data and schema in ClickHouse.
- Allow users to connect to multiple ClickHouse databases by configuring connection settings in the browser.
- Store sensitive connection information encrypted in browser storage.
- Authenticate users via Web3 wallet (e.g., MetaMask).

## 2. Features

### Connection Management
- Add, edit, and remove ClickHouse database connections.
- Store connection details (host, port, user, etc.) encrypted in browser storage.
- Select active connection for operations.

### Authentication
- Require Web3 wallet authentication for access.
- Optionally associate saved connections with wallet addresses.

### Schema Management
- List tables and schemas from the selected ClickHouse connection.
- Create new tables (define columns, types, primary keys).
- Edit table schema (add/remove columns).
- Drop tables.

### Data Management
- Browse table data (pagination, filtering).
- Insert new records.
- Edit existing records.
- Delete records.

### Query Interface
- Run custom SQL queries against the selected connection.
- Display results in a table.

## 3. Tech Stack
- Frontend: HTML, JavaScript (React recommended), UI library (Ant Design or Material UI)
- Browser DB: IndexedDB or dexie (with encryption, e.g., using CryptoJS).  
    - **Encryption Key:** The encryption key for browser storage can be derived from the user's Web3 wallet. For example, after authenticating with a wallet (e.g., MetaMask), the app can request the user to sign a message. The resulting signature or a key derived from the wallet's private key (using a key derivation function) can be used as the encryption/decryption key. This ensures only the authenticated wallet owner can access the stored data.
- ClickHouse Client: clickhouse-js (browser version) or HTTP API
- Web3: ethers.js or web3.js for wallet integration
- Web3 Authentication Helpers:  
    - [WalletConnect](https://walletconnect.com/) – enables users to connect with a wide range of wallets, not just MetaMask.  
    - [Privy](https://privy.io/) – provides simplified wallet authentication and user management for web3 apps.

## 4. Security
- Encrypt all sensitive data in browser storage.
- Authenticate users via Web3 wallet signature.
- Validate all user inputs and sanitize SQL queries.

## 5. Milestones
1. Implement Web3 wallet authentication.
2. Build encrypted connection manager (IndexedDB).
3. Integrate ClickHouse HTTP API for schema/data CRUD.
4. Develop frontend for schema and data management.
5. Add custom query interface and result viewer.
6. Testing and documentation.

## 6. Future Enhancements
- User roles/permissions mapped to wallet addresses.
- Data export/import.
- Visualization tools.
- Audit logs and activity tracking.
