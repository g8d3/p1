# Architectural Plan: Pump.fun Clone

## 1. Project Overview

This document outlines the architecture for a decentralized application that clones the core functionality of pump.fun. The platform enables users to launch new meme coins without seed liquidity. Tokens are launched on a bonding curve, ensuring fair distribution and price discovery. The project includes a user-facing interface for creating and trading tokens, and a self-contained admin interface for on-the-fly configuration without relying on environment variables.

## 2. Technology Stack

| Component         | Technology                                | Justification                                                                                                                            |
| ----------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**      | **Next.js (React)**, **Tailwind CSS**, **viem** | Next.js provides a robust framework for server-rendered React applications, improving performance and SEO. Tailwind CSS allows for rapid UI development. viem is a modern and lightweight TypeScript interface for Ethereum. |
| **Backend**       | **Node.js** with **Express.js** or **NestJS** | A Node.js backend is ideal for handling API requests, managing the admin interface, and caching blockchain data. Express.js is lightweight, while NestJS offers a more structured, modular architecture. |
| **Smart Contracts**| **Solidity**, **Hardhat** / **Foundry**   | Solidity is the industry standard for EVM-compatible chains. Hardhat and Foundry are comprehensive development environments for compiling, testing, and deploying smart contracts. |
| **Database**      | **SQLite** or **PostgreSQL**              | SQLite is a simple, file-based database perfect for storing application configuration without requiring a separate database server. PostgreSQL can be used if more complex data storage needs arise in the future. |

## 3. Application Architecture

The application follows a three-tier architecture:

1.  **Frontend (Client-side):** A Next.js application that users interact with. It communicates with the backend for non-critical data and directly with the blockchain for transactions via a browser wallet like MetaMask.
2.  **Backend (Server-side):** A Node.js API that serves cached blockchain data, provides endpoints for the admin UI, and manages application configuration stored in the database.
3.  **Blockchain (Smart Contracts):** Solidity smart contracts deployed on an EVM-compatible blockchain that govern the core logic of token creation, bonding curve mechanics, and trading.

```mermaid
graph TD
    subgraph User Device
        A[Browser - Next.js App]
    end

    subgraph Server
        B[Backend - Node.js API]
        C[Database - SQLite]
    end

    subgraph Blockchain (EVM)
        D[Smart Contracts - Solidity]
    end

    A -- HTTPS (API Calls) --> B
    A -- RPC (Wallet) --> D
    B -- DB Connection --> C
    B -- RPC (Data Fetching) --> D
```

## 4. Smart Contract Design

The core logic will be encapsulated in two main smart contracts:

*   **`TokenFactory.sol`**:
    *   A factory contract responsible for deploying new meme coins.
    *   A single entry point `createToken(name, symbol, description, image)` will deploy a new `BondingCurve` contract and its associated ERC-20 token.
    *   It will emit an event `TokenCreated(address token, address bondingCurve)` for easier off-chain tracking.

*   **`BondingCurve.sol`**:
    *   Each token will have its own `BondingCurve` contract that holds the reserve asset (e.g., ETH).
    *   It manages the token's price based on a predefined bonding curve formula (e.g., `y = mx^2`).
    *   **`buy(amount)`**: Allows users to buy tokens by sending ETH. The contract mints new tokens and sends them to the buyer.
    *   **`sell(amount)`**: Allows users to sell tokens. The contract burns the tokens and sends the corresponding amount of ETH to the seller.
    *   The contract will take a small fee on each trade, which is sent to a configurable treasury address.

## 5. Backend Design

The backend will expose a REST API with the following endpoints:

*   `GET /api/tokens`: Fetches a list of all tokens created on the platform.
*   `GET /api/tokens/:address`: Fetches detailed information for a specific token, including its price history and trading volume.
*   `GET /api/config`: Retrieves the current application configuration for the frontend.
*   `POST /admin/api/login`: Authenticates an administrator.
*   `GET /admin/api/config`: Retrieves the configuration for the admin interface.
*   `POST /admin/api/config`: Updates the application configuration (protected endpoint).

## 6. Database Schema

A simple `configuration` table will store key-value pairs for the admin-configurable settings.

**Table: `configuration`**

| Column | Type    | Constraints      | Description                               |
| ------ | ------- | ---------------- | ----------------------------------------- |
| `id`   | INTEGER | PRIMARY KEY      | Unique identifier for the setting.        |
| `key`  | TEXT    | UNIQUE, NOT NULL | The name of the configuration setting.    |
| `value`| TEXT    | NOT NULL         | The value of the configuration setting.   |

**Example Data:**

| key               | value                   |
| ----------------- | ----------------------- |
| `fee_recipient`   | `0x...`                 |
| `trading_fee_bps` | `100`                   |
| `rpc_url`         | `https://mainnet.base.org`|
| `site_title`      | `My Pump Clone`         |

## 7. Admin Interface

The admin interface will be a secure area of the frontend application, accessible via a route like `/admin`.

*   **Authentication:** A login page will protect the admin interface from unauthorized access.
*   **Configuration Management:** A form will allow the administrator to view and edit all settings stored in the `configuration` table.
*   **Functionality:**
    *   Update trading fees.
    *   Change the fee recipient address.
    *   Update the site title and other metadata.
    *   Feature or delist tokens from the main page.
*   A "Save" button will submit the changes to the backend via the `/admin/api/config` endpoint.

## 8. Project Structure

A monorepo structure is recommended to manage the different parts of the project.

```
s3-web3-w/t2/
├── backend/
│   ├── src/
│   │   ├── api/
│   │   ├── index.js
│   │   └── db.js
│   └── package.json
├── contracts/
│   ├── contracts/
│   │   ├── BondingCurve.sol
│   │   └── TokenFactory.sol
│   ├── scripts/
│   │   └── deploy.js
│   └── hardhat.config.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── lib/
│   │   └── pages/
│   │       ├── _app.js
│   │       ├── index.js
│   │       └── admin.js
│   ├── public/
│   └── package.json
└── plan.md