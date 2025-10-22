import { useState, useCallback } from 'react'
import { WalletManager, Wallet } from '../index'

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
    authenticate,
    generateWallets,
    deleteWallet,
    exportWallet,
    copyAddress,
    disconnect
  }
}