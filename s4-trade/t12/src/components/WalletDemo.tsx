import React from 'react'
import { WalletTable, SignaturesTable, useWalletManager } from '../index'

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
    signatures,
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
      // Error will be handled by the hook and displayed in signatures table
    }
  }

  const handleGenerateWallets = async () => {
    try {
      await generateWallets()
    } catch (error) {
      // Error will be handled by the hook and displayed in signatures table
    }
  }

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
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
      await signTransaction(walletId, txJson)
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
           <SignaturesTable
             signatures={signatures}
             onCopy={handleCopy}
           />
        </div>
      )}
    </div>
  )
}