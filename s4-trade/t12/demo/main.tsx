import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import { WalletManager, WalletTable } from '../src/index'

function Demo() {
  const [manager] = useState(() => new WalletManager())
  const [wallets, setWallets] = useState<any[]>([])
  const [authenticated, setAuthenticated] = useState(false)
  const [network, setNetwork] = useState('ethereum')
  const [count, setCount] = useState(5)

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
  }

  const generateWallets = async () => {
    try {
      await manager.generateWallets(count, network)
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

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Wallet CRUD Demo</h1>
      {!authenticated ? (
        <button onClick={handleAuthenticate}>Connect Wallet</button>
      ) : (
        <div>
          <div style={{ marginBottom: '20px' }}>
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