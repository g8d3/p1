import React from 'react'
import ReactDOM from 'react-dom/client'
import { WalletTable, useWalletManager } from '../src/index'

function Demo() {
  const {
    wallets,
    authenticated,
    network,
    setNetwork,
    count,
    setCount,
    generatedCounts,
    authenticate,
    generateWallets,
    deleteWallet,
    exportWallet,
    copyAddress,
    disconnect
  } = useWalletManager()

  const handleAuthenticate = async () => {
    try {
      await authenticate()
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  const handleGenerateWallets = async () => {
    try {
      await generateWallets()
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Wallet CRUD Demo</h1>
      {!authenticated ? (
        <button onClick={handleAuthenticate}>Connect Wallet</button>
      ) : (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <button onClick={disconnect} style={{ marginRight: '10px' }}>Disconnect</button>
            <label>
              Network:
              <select value={network} onChange={(e) => setNetwork(e.target.value)}>
                <option value="ethereum">Ethereum</option>
                <option value="solana">Solana</option>
              </select>
            </label>
            <label style={{ marginLeft: '10px' }}>
              Count:
              <input
                type="number"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                min="1"
                max="100"
                style={{ width: '60px', marginLeft: '5px' }}
              />
            </label>
            <button onClick={handleGenerateWallets} style={{ marginLeft: '10px' }}>
              Generate Wallets
            </button>
            <span style={{ marginLeft: '10px' }}>
              Generated for {network}: {generatedCounts[network]?.count || 0}
            </span>
          </div>
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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Demo />
  </React.StrictMode>,
)