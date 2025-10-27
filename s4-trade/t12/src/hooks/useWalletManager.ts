import { useState, useCallback } from 'react'
import { WalletManager, Wallet, Signature, RPCConfig, TransactionTemplate } from '../index'

export interface WalletStats {
  count: number
  maxIndex: number
}

export const useWalletManager = () => {
  const [manager] = useState(() => new WalletManager())
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [authenticated, setAuthenticated] = useState(false)
  const [network, setNetwork] = useState('ethereum')
  const [count, setCount] = useState(5)
  const [generatedCounts, setGeneratedCounts] = useState<{ [key: string]: WalletStats }>({})
  const [signatures, setSignatures] = useState<Signature[]>([])
  const [rpcConfigs, setRpcConfigs] = useState<RPCConfig[]>([
    { id: 'eth-mainnet', name: 'Ethereum Mainnet', url: 'https://eth.llamarpc.com', network: 'ethereum', chainId: 1 },
    { id: 'eth-sepolia', name: 'Ethereum Sepolia', url: 'https://rpc.sepolia.org', network: 'ethereum', chainId: 11155111 },
    { id: 'sol-mainnet', name: 'Solana Mainnet', url: 'https://api.mainnet-beta.solana.com', network: 'solana' },
    { id: 'sol-devnet', name: 'Solana Devnet', url: 'https://api.devnet.solana.com', network: 'solana' }
  ])
  const [selectedRpc, setSelectedRpc] = useState<string>('eth-mainnet')

  const loadWallets = useCallback(async () => {
    const w = await manager.getWallets()
    setWallets(w)
    // Update generated counts and max indices
    const stats: { [key: string]: WalletStats } = {}
    w.forEach(wallet => {
      const index = parseInt(wallet.id.split('-').pop()!)
      if (!stats[wallet.network]) {
        stats[wallet.network] = { count: 0, maxIndex: -1 }
      }
      stats[wallet.network].count++
      stats[wallet.network].maxIndex = Math.max(stats[wallet.network].maxIndex, index)
    })
    setGeneratedCounts(stats)
  }, [manager])

  const authenticate = useCallback(async () => {
    try {
      await manager.authenticate()
      setAuthenticated(true)
      loadWallets()
    } catch (error) {
      throw error
    }
  }, [manager, loadWallets])

  const generateWallets = useCallback(async () => {
    try {
      const stats = generatedCounts[network] || { count: 0, maxIndex: -1 }
      const startIndex = stats.maxIndex + 1
      await manager.generateWallets(startIndex, count, network)
      loadWallets()
    } catch (error) {
      throw error
    }
  }, [manager, network, count, generatedCounts, loadWallets])

  const deleteWallet = useCallback(async (id: string) => {
    await manager.deleteWallet(id)
    loadWallets()
  }, [manager, loadWallets])

  const exportWallet = useCallback((wallet: Wallet) => {
    const data = manager.exportWallet(wallet)
    navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    alert('Copied to clipboard')
  }, [manager])

  const copyAddress = useCallback((address: string) => {
    manager.copyAddress(address)
    alert('Address copied')
  }, [manager])

  const signMessage = useCallback(async (walletId: string, message: string) => {
    try {
      const signature = await manager.signMessage(walletId, message)
      const newSignature: Signature = {
        id: `msg-${Date.now()}`,
        type: 'message',
        walletId,
        input: message,
        output: signature,
        timestamp: new Date()
      }
      setSignatures(prev => [newSignature, ...prev])
      return signature
    } catch (error) {
      const errorSignature: Signature = {
        id: `msg-error-${Date.now()}`,
        type: 'message',
        walletId,
        input: message,
        output: '',
        timestamp: new Date(),
        error: (error as Error).message
      }
      setSignatures(prev => [errorSignature, ...prev])
      throw error
    }
  }, [manager])

  const signTransaction = useCallback(async (walletId: string, txInput: string) => {
    try {
      const tx = JSON.parse(txInput)
      const signedTx = await manager.signTransaction(walletId, tx)
      const newSignature: Signature = {
        id: `tx-${Date.now()}`,
        type: 'transaction',
        walletId,
        input: txInput,
        output: signedTx,
        timestamp: new Date()
      }
      setSignatures(prev => [newSignature, ...prev])
      return signedTx
    } catch (error) {
      const errorSignature: Signature = {
        id: `tx-error-${Date.now()}`,
        type: 'transaction',
        walletId,
        input: txInput,
        output: '',
        timestamp: new Date(),
        error: (error as Error).message
      }
      setSignatures(prev => [errorSignature, ...prev])
      throw error
    }
  }, [manager])

  const broadcastTransaction = useCallback(async (signedTx: string, rpcId: string): Promise<string> => {
    const rpcConfig = rpcConfigs.find(rpc => rpc.id === rpcId)
    if (!rpcConfig) {
      throw new Error('RPC configuration not found')
    }
    return await manager.broadcastTransaction(signedTx, rpcConfig.url, rpcConfig.network)
  }, [manager, rpcConfigs])

  const buildTransaction = useCallback(async (walletId: string, template: TransactionTemplate): Promise<any> => {
    const wallet = wallets.find(w => w.id === walletId)
    if (!wallet) {
      throw new Error('Wallet not found')
    }

    if (wallet.network === 'solana') {
      // For Solana transactions
      // This is a simplified implementation - in a real app you'd use @solana/web3.js
      throw new Error('Solana transaction building not implemented yet')
    } else {
      // For EVM transactions
      const tx: any = {}

      if (template.to) tx.to = template.to
      if (template.value) tx.value = template.value
      if (template.data) tx.data = template.data
      if (template.gasLimit) tx.gasLimit = template.gasLimit
      if (template.gasPrice) tx.gasPrice = template.gasPrice
      if (template.maxFeePerGas) tx.maxFeePerGas = template.maxFeePerGas
      if (template.maxPriorityFeePerGas) tx.maxPriorityFeePerGas = template.maxPriorityFeePerGas

      return tx
    }
  }, [wallets])

  const signAndBroadcastTransaction = useCallback(async (walletId: string, template: TransactionTemplate): Promise<string> => {
    try {
      const tx = await buildTransaction(walletId, template)
      const txJson = JSON.stringify(tx)
      const signedTx = await signTransaction(walletId, txJson)
      const txHash = await broadcastTransaction(signedTx, selectedRpc)

      // Add to signatures table
      const broadcastSignature: Signature = {
        id: `broadcast-${Date.now()}`,
        type: 'transaction',
        walletId,
        input: txJson,
        output: txHash,
        timestamp: new Date()
      }
      setSignatures(prev => [broadcastSignature, ...prev])

      return txHash
    } catch (error) {
      const errorSignature: Signature = {
        id: `broadcast-error-${Date.now()}`,
        type: 'transaction',
        walletId,
        input: JSON.stringify(template),
        output: '',
        timestamp: new Date(),
        error: (error as Error).message
      }
      setSignatures(prev => [errorSignature, ...prev])
      throw error
    }
  }, [buildTransaction, signTransaction, broadcastTransaction, selectedRpc])

  const disconnect = useCallback(() => {
    setAuthenticated(false)
    setWallets([])
    setGeneratedCounts({})
  }, [])

  return {
    wallets,
    authenticated,
    network,
    setNetwork,
    count,
    setCount,
    generatedCounts,
    signatures,
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
    broadcastTransaction,
    buildTransaction,
    signAndBroadcastTransaction,
    disconnect
  }
}