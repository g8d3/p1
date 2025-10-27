import React, { useState } from 'react'
import { WalletTable, SignaturesTable, NotificationTable, RPCConfigComponent, TransactionBuilder, useWalletManager } from '../index'

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
  const [activeTab, setActiveTab] = useState<'wallets' | 'transactions' | 'rpc'>('wallets')

  const {
    wallets,
    authenticated,
    network,
    setNetwork,
    count,
    setCount,
    generatedCounts,
    signatures,
    notifications,
    addNotification,
    removeNotification,
    rpcConfigs,
    setRpcConfigs,
    selectedRpc,
    setSelectedRpc,
    authenticate,
    generateWallets,
    deleteWallet,
    exportWallet,
    copyAddress,
    signMessage,
    signTransaction,
    signAndBroadcastTransaction,
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
      addNotification({
        type: 'success',
        title: 'Wallet Connected',
        message: 'Successfully connected to wallet'
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Connection Failed',
        message: (error as Error).message,
        autoHide: false
      })
    }
  }

  const handleGenerateWallets = async () => {
    try {
      await generateWallets()
      addNotification({
        type: 'success',
        title: 'Wallets Generated',
        message: `Successfully generated ${count} wallets for ${network}`
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Wallet Generation Failed',
        message: (error as Error).message,
        autoHide: false
      })
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
      try {
        await signTransaction(walletId, txJson)
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Transaction Signing Failed',
          message: (error as Error).message,
          autoHide: false
        })
      }
    }
  }

  const handleAddRpc = (rpc: any) => {
    const newRpc = { ...rpc, id: `rpc-${Date.now()}` }
    setRpcConfigs([...rpcConfigs, newRpc])
    addNotification({
      type: 'success',
      title: 'RPC Added',
      message: `Added RPC "${rpc.name}" for ${rpc.network} network`
    })
  }

  const handleRemoveRpc = (rpcId: string) => {
    const rpcToRemove = rpcConfigs.find(rpc => rpc.id === rpcId)
    setRpcConfigs(rpcConfigs.filter(rpc => rpc.id !== rpcId))
    if (rpcToRemove) {
      addNotification({
        type: 'info',
        title: 'RPC Removed',
        message: `Removed RPC "${rpcToRemove.name}"`
      })
    }
  }

  const handleBuildTransaction = (template: any) => {
    addNotification({
      type: 'info',
      title: 'Transaction Template Built',
      message: `Transaction template created: ${JSON.stringify(template, null, 2)}`,
      autoHide: false
    })
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

          {/* Tab Navigation */}
          <div style={{ marginBottom: '20px', borderBottom: '1px solid #ddd' }}>
            <button
              onClick={() => setActiveTab('wallets')}
              style={{
                padding: '10px 20px',
                marginRight: '5px',
                backgroundColor: activeTab === 'wallets' ? '#007bff' : '#f8f9fa',
                color: activeTab === 'wallets' ? 'white' : 'black',
                border: 'none',
                borderRadius: '5px 5px 0 0'
              }}
            >
              Wallets
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              style={{
                padding: '10px 20px',
                marginRight: '5px',
                backgroundColor: activeTab === 'transactions' ? '#007bff' : '#f8f9fa',
                color: activeTab === 'transactions' ? 'white' : 'black',
                border: 'none',
                borderRadius: '5px 5px 0 0'
              }}
            >
              Transactions
            </button>
            <button
              onClick={() => setActiveTab('rpc')}
              style={{
                padding: '10px 20px',
                backgroundColor: activeTab === 'rpc' ? '#007bff' : '#f8f9fa',
                color: activeTab === 'rpc' ? 'white' : 'black',
                border: 'none',
                borderRadius: '5px 5px 0 0'
              }}
            >
              RPC Config
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'wallets' && (
            <div>
              <NotificationTable
                notifications={notifications}
                onRemove={removeNotification}
                onCopy={handleCopy}
              />
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

          {activeTab === 'transactions' && (
            <div>
              <NotificationTable
                notifications={notifications}
                onRemove={removeNotification}
                onCopy={handleCopy}
              />
              <RPCConfigComponent
                rpcConfigs={rpcConfigs}
                selectedRpc={selectedRpc}
                onSelectRpc={setSelectedRpc}
                onAddRpc={handleAddRpc}
                onRemoveRpc={handleRemoveRpc}
              />
              <TransactionBuilder
                wallets={wallets}
                onBuildTransaction={handleBuildTransaction}
                onSignAndBroadcast={signAndBroadcastTransaction}
              />
            </div>
          )}

          {activeTab === 'rpc' && (
            <div>
              <NotificationTable
                notifications={notifications}
                onRemove={removeNotification}
                onCopy={handleCopy}
              />
              <RPCConfigComponent
                rpcConfigs={rpcConfigs}
                selectedRpc={selectedRpc}
                onSelectRpc={setSelectedRpc}
                onAddRpc={handleAddRpc}
                onRemoveRpc={handleRemoveRpc}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}