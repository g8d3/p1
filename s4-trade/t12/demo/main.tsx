import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import { WalletManager, WalletTable } from '../src/index'

function Demo() {
  const [manager] = useState(() => new WalletManager())
  const [wallets, setWallets] = useState<any[]>([])
  const [authenticated, setAuthenticated] = useState(false)
  const [network, setNetwork] = useState('ethereum')
  const [count, setCount] = useState(5)
  const [generatedCounts, setGeneratedCounts] = useState<{ [key: string]: { count: number, maxIndex: number } }>({})

  const handleAuthenticate = async () => {
    try {
      await manager.authenticate()
      setAuthenticated(true)
      loadWallets()
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  const loadWallets = async () => {
    const w = await manager.getWallets()
    setWallets(w)
    // Update generated counts and max indices
    const stats: { [key: string]: { count: number, maxIndex: number } } = {}
    w.forEach(wallet => {
      const index = parseInt(wallet.id.split('-').pop()!)
      if (!stats[wallet.network]) {
        stats[wallet.network] = { count: 0, maxIndex: -1 }
      }
      stats[wallet.network].count++
      stats[wallet.network].maxIndex = Math.max(stats[wallet.network].maxIndex, index)
    })
    setGeneratedCounts(stats)
  }

  const generateWallets = async () => {
    try {
      const stats = generatedCounts[network] || { count: 0, maxIndex: -1 }
      const startIndex = stats.maxIndex + 1
      await manager.generateWallets(startIndex, count, network)
      loadWallets()
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  const deleteWallet = async (id: string) => {
    await manager.deleteWallet(id)
    loadWallets()
  }

  const exportWallet = (wallet: any) => {
    const data = manager.exportWallet(wallet)
    navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    alert('Copied to clipboard')
  }

  const copyAddress = (address: string) => {
    manager.copyAddress(address)
    alert('Address copied')
  }

  const disconnect = () => {
    setAuthenticated(false)
    setWallets([])
    setGeneratedCounts({})
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
            <button onClick={generateWallets} style={{ marginLeft: '10px' }}>
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