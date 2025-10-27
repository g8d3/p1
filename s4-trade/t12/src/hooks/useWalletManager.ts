import { useState, useCallback, useMemo } from 'react'
import { WalletManager, Wallet, Signature, RPCConfig, TransactionTemplate, Notification } from '../index'
import { PublicKey, SystemProgram, Transaction, Connection } from '@solana/web3.js'

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
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random()}`,
      timestamp: new Date()
    }
    setNotifications(prev => [newNotification, ...prev])

    // Auto-hide success notifications after 5 seconds
    if (newNotification.autoHide !== false && newNotification.type === 'success') {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id))
      }, newNotification.duration || 5000)
    }
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const [rpcConfigs, setRpcConfigs] = useState<RPCConfig[]>([
    { id: 'eth-mainnet', name: 'Ethereum Mainnet', url: 'https://eth.llamarpc.com', network: 'ethereum', chainId: 1 },
    { id: 'eth-sepolia', name: 'Ethereum Sepolia', url: 'https://rpc.sepolia.org', network: 'ethereum', chainId: 11155111 },
    { id: 'sol-mainnet', name: 'Solana Mainnet', url: 'https://api.mainnet-beta.solana.com', network: 'solana' },
    { id: 'sol-devnet', name: 'Solana Devnet', url: 'https://api.devnet.solana.com', network: 'solana' }
  ])
  const [selectedRpc, setSelectedRpc] = useState<string>('eth-mainnet')

  // Memoize current RPC config to prevent unnecessary re-renders
  const currentRpcConfig = useMemo(() => {
    return rpcConfigs.find(rpc => rpc.id === selectedRpc)
  }, [rpcConfigs, selectedRpc])

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
    addNotification({
      type: 'success',
      title: 'Wallet Exported',
      message: `Wallet "${wallet.address}" data copied to clipboard`
    })
  }, [manager, addNotification])

  const copyAddress = useCallback((address: string) => {
    manager.copyAddress(address)
    addNotification({
      type: 'success',
      title: 'Address Copied',
      message: `${address} copied to clipboard`
    })
  }, [manager, addNotification])

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
      addNotification({
        type: 'success',
        title: 'Message Signed',
        message: `Message signed successfully with wallet ${walletId}`
      })
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
      addNotification({
        type: 'error',
        title: 'Message Signing Failed',
        message: (error as Error).message,
        autoHide: false
      })
      throw error
    }
  }, [manager, addNotification])

  const signTransaction = useCallback(async (walletId: string, txInput: string | any) => {
    try {
      let tx: any
      let inputString: string

      // Check if txInput is already a Solana Transaction object or needs parsing
      if (typeof txInput === 'string') {
        tx = JSON.parse(txInput)
        inputString = txInput
      } else {
        // Assume it's already a transaction object (Solana Transaction)
        tx = txInput
        inputString = 'Solana Transaction Object'
      }

      const signedTx = await manager.signTransaction(walletId, tx)
      const newSignature: Signature = {
        id: `tx-${Date.now()}`,
        type: 'transaction',
        walletId,
        input: inputString,
        output: signedTx,
        timestamp: new Date()
      }
      setSignatures(prev => [newSignature, ...prev])
      addNotification({
        type: 'success',
        title: 'Transaction Signed',
        message: `Transaction signed successfully with wallet ${walletId}`
      })
      return signedTx
    } catch (error) {
      const inputString = typeof txInput === 'string' ? txInput : 'Solana Transaction Object'
      const errorSignature: Signature = {
        id: `tx-error-${Date.now()}`,
        type: 'transaction',
        walletId,
        input: inputString,
        output: '',
        timestamp: new Date(),
        error: (error as Error).message
      }
      setSignatures(prev => [errorSignature, ...prev])
      addNotification({
        type: 'error',
        title: 'Transaction Signing Failed',
        message: (error as Error).message,
        autoHide: false
      })
      throw error
    }
  }, [manager, addNotification])

  const broadcastTransaction = useCallback(async (signedTx: string, rpcId: string): Promise<string> => {
    const rpcConfig = rpcConfigs.find(rpc => rpc.id === rpcId)
    if (!rpcConfig) {
      throw new Error('RPC configuration not found')
    }
    return await manager.broadcastTransaction(signedTx, rpcConfig.url, rpcConfig.network, rpcConfig.chainId)
  }, [manager, rpcConfigs])

  const buildTransaction = useCallback(async (walletId: string, template: TransactionTemplate, rpcUrl?: string, chainId?: number): Promise<any> => {
    const wallet = wallets.find(w => w.id === walletId)
    if (!wallet) {
      throw new Error('Wallet not found')
    }

    if (wallet.network === 'solana') {
      // For Solana transactions
      if (template.type === 'transfer') {
        if (!template.to || !template.value) {
          throw new Error('Solana transfer requires "to" address and "value" (in lamports)')
        }

        // Use provided RPC URL or current config
        const solanaRpcUrl = rpcUrl || (currentRpcConfig?.network === 'solana' ? currentRpcConfig.url : undefined)
        if (!solanaRpcUrl) {
          throw new Error('No Solana RPC URL found')
        }

        // Use @solana/web3.js Connection to get recent blockhash
        const connection = new Connection(solanaRpcUrl)
        const { blockhash } = await connection.getLatestBlockhash()
        const recentBlockhash = blockhash

        const transaction = new Transaction({
          recentBlockhash,
          feePayer: new PublicKey(wallet.address)
        })

        transaction.add(
          SystemProgram.transfer({
            fromPubkey: new PublicKey(wallet.address),
            toPubkey: new PublicKey(template.to),
            lamports: BigInt(template.value)
          })
        )

        return transaction
      } else {
        throw new Error(`Solana transaction type "${template.type}" not implemented yet`)
      }
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

      // Include chainId for EVM transactions to prevent "invalid chain ID" errors
      if (chainId) {
        tx.chainId = chainId
      } else if (currentRpcConfig?.chainId) {
        tx.chainId = currentRpcConfig.chainId
      }

      return tx
    }
  }, [wallets, currentRpcConfig])

  const signAndBroadcastTransaction = useCallback(async (walletId: string, template: TransactionTemplate): Promise<string> => {
    try {
      const wallet = wallets.find(w => w.id === walletId)
      if (!wallet) {
        throw new Error('Wallet not found')
      }

      const tx = await buildTransaction(walletId, template)
      let signedTx: string

      if (wallet.network === 'solana') {
        // For Solana, pass the Transaction object directly
        signedTx = await signTransaction(walletId, tx)
      } else {
        // For EVM, stringify the transaction object
        const txJson = JSON.stringify(tx)
        signedTx = await signTransaction(walletId, txJson)
      }

      const txHash = await broadcastTransaction(signedTx, selectedRpc)

      // Add to signatures table
      const broadcastSignature: Signature = {
        id: `broadcast-${Date.now()}`,
        type: 'transaction',
        walletId,
        input: wallet.network === 'solana' ? 'Solana Transaction Object' : JSON.stringify(tx),
        output: txHash,
        timestamp: new Date()
      }
      setSignatures(prev => [broadcastSignature, ...prev])

      addNotification({
        type: 'success',
        title: 'Transaction Broadcast',
        message: `Transaction broadcast successfully. Hash: ${txHash}`
      })

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
      addNotification({
        type: 'error',
        title: 'Transaction Broadcast Failed',
        message: (error as Error).message,
        autoHide: false
      })
      throw error
    }
  }, [wallets, buildTransaction, signTransaction, broadcastTransaction, selectedRpc])

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
    broadcastTransaction,
    buildTransaction,
    signAndBroadcastTransaction,
    disconnect
  }
}