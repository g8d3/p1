import React from 'react'
import { WalletTable, useWalletManager } from '../index'

interface WalletDemoProps {
  title?: string
  networks?: string[]
  defaultNetwork?: string
  defaultCount?: number
}

export const WalletDemo: React.FC<WalletDemoProps> = ({
  title = 'Wallet CRUD Demo',
  networks = ['ethereum', 'solana'],
  defaultNetwork = 'ethereum',
  defaultCount = 5
}) => {
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
    signMessage,
    signTransaction,
    disconnect
  } = useWalletManager()

  // Initialize defaults
  React.useEffect(() => {
    if (!authenticated) {
      setNetwork(defaultNetwork)
      setCount(defaultCount)
    }
  }, [authenticated, defaultNetwork, defaultCount, setNetwork, setCount])

  const handleAuthenticate = async () => {
    try {
      await authenticate()
    } catch (error) {
      alert('Error: ' + (error as Error).message)
    }
  }

  const handleGenerateWallets = async () => {
    try {
      await generateWallets()
    } catch (error) {
      alert('Error: ' + (error as Error).message)
    }
  }

  const handleSignMessage = async (walletId: string) => {
    const message = prompt('Enter message to sign:')
    if (message) {
      await signMessage(walletId, message)
    }
  }

  const handleSignTransaction = async (walletId: string) => {
    const txJson = prompt('Enter transaction JSON to sign:')
    if (txJson) {
      try {
        const tx = JSON.parse(txJson)
        await signTransaction(walletId, tx)
      } catch (error) {
        alert('Invalid JSON: ' + (error as Error).message)
      }
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>{title}</h1>
      {!authenticated ? (
        <button onClick={handleAuthenticate}>Connect Wallet</button>
      ) : (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <button onClick={disconnect} style={{ marginRight: '10px' }}>Disconnect</button>
            <label>
              Network:
              <select value={network} onChange={(e) => setNetwork(e.target.value)}>
                {networks.map(net => (
                  <option key={net} value={net}>{net.charAt(0).toUpperCase() + net.slice(1)}</option>
                ))}
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
            onSignMessage={handleSignMessage}
            onSignTransaction={handleSignTransaction}
          />
        </div>
      )}
    </div>
  )
}