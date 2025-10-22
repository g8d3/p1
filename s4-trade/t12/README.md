# Browser Wallet CRUD Library

A library for building browser-based CRUD applications for managing wallets without a server. Supports any EVM-compatible wallet, deterministic wallet generation using signatures, and encrypted storage.

## Features

- Connect to any EVM-compatible wallet (MetaMask, etc.)
- Generate deterministic wallets for EVM (Ethereum) and Solana networks using signature as seed
- Encrypted storage using IndexedDB
- CRUD operations for wallets
- Export private keys
- Copy addresses
- React component with dark/light theme

## Installation

```bash
npm install browser-wallet-crud
```

## Demo

To run a demo of the library:

```bash
npm run demo
```

This will start a development server with a demo application showcasing the wallet CRUD functionality.

## Testing

Run automated e2e tests to verify functionality:

```bash
npm run test
```

Tests cover all demo use cases, including wallet connection, generation, signing, and UI interactions. See [TESTING.md](TESTING.md) for details on testing approaches and [use-cases.md](use-cases.md) for documented user flows with time estimates.

## Usage

```typescript
import { WalletManager, WalletTable } from 'browser-wallet-crud'
import React, { useState, useEffect } from 'react'

function App() {
  const [manager] = useState(() => new WalletManager())
  const [wallets, setWallets] = useState([])
  const [authenticated, setAuthenticated] = useState(false)

  const handleAuthenticate = async () => {
    try {
      await manager.authenticate()
      setAuthenticated(true)
      loadWallets()
    } catch (error) {
      console.error(error)
    }
  }

  const loadWallets = async () => {
    const w = await manager.getWallets()
    setWallets(w)
  }

  const generateWallets = async () => {
    await manager.generateWallets(5, 'ethereum') // or 'solana'
    loadWallets()
  }

  const deleteWallet = async (id) => {
    await manager.deleteWallet(id)
    loadWallets()
  }

  const exportWallet = (wallet) => {
    const data = manager.exportWallet(wallet)
    console.log('Exported:', data)
  }

  const copyAddress = (address) => {
    manager.copyAddress(address)
  }

  return (
    <div>
      {!authenticated ? (
        <button onClick={handleAuthenticate}>Connect Wallet</button>
      ) : (
        <div>
          <button onClick={generateWallets}>Generate 5 Wallets</button>
          <WalletTable
            wallets={wallets}
            onDelete={deleteWallet}
            onExport={exportWallet}
            onCopy={copyAddress}
          />
        </div>
      )}
    </div>
  )
}
```

## API

### WalletManager

- `authenticate()`: Connect wallet and sign message
- `generateWallets(count, network)`: Generate wallets
- `getWallets()`: Get all stored wallets
- `deleteWallet(id)`: Delete a wallet
- `exportWallet(wallet)`: Export wallet data
- `copyAddress(address)`: Copy address to clipboard

### WalletTable

React component for displaying wallets with actions.

## Security

- Private keys are encrypted before storage
- Deterministic generation ensures same signature produces same wallets
- No server communication - all data stays in browser