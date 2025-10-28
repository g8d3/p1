import type { Wallet } from '../types'

// Type definitions for browser extension APIs
declare global {
  interface Window {
    ethereum?: any
    solana?: any
  }
}

export interface ExtensionInfo {
  type: 'metamask' | 'phantom'
  name: string
  chain: 'evm' | 'svm'
  isAvailable: boolean
}

export class WalletDerivationError extends Error {
  constructor(message: string, public extensionType?: string) {
    super(message)
    this.name = 'WalletDerivationError'
  }
}

/**
 * Detects available browser wallet extensions
 */
export function detectExtensions(): ExtensionInfo[] {
  const extensions: ExtensionInfo[] = []

  // Check for MetaMask (EVM)
  if (typeof window !== 'undefined' && window.ethereum) {
    extensions.push({
      type: 'metamask',
      name: 'MetaMask',
      chain: 'evm',
      isAvailable: true,
    })
  }

  // Check for Phantom (SVM)
  if (typeof window !== 'undefined' && window.solana?.isPhantom) {
    extensions.push({
      type: 'phantom',
      name: 'Phantom',
      chain: 'svm',
      isAvailable: true,
    })
  }

  return extensions
}

/**
 * Connects to MetaMask and derives wallet address
 */
export async function connectMetaMask(): Promise<Omit<Wallet, 'id' | 'name' | 'isActive' | 'createdAt' | 'updatedAt'>> {
  if (!window.ethereum) {
    throw new WalletDerivationError('MetaMask not detected')
  }

  try {
    // Request account access
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })

    if (!accounts || accounts.length === 0) {
      throw new WalletDerivationError('No accounts found in MetaMask')
    }

    const address = accounts[0]

    // Verify the connection by requesting a signature (without storing it)
    const message = `DEX Trading Terminal - Connect Wallet\nTimestamp: ${Date.now()}`
    const signature = await window.ethereum.request({
      method: 'personal_sign',
      params: [message, address],
    })

    if (!signature) {
      throw new WalletDerivationError('Failed to sign verification message')
    }

    return {
      address,
      chain: 'evm',
      derivationType: 'derived',
      extensionType: 'metamask',
    }
  } catch (error: any) {
    if (error.code === 4001) {
      throw new WalletDerivationError('User rejected the connection request', 'metamask')
    }
    throw new WalletDerivationError(`MetaMask connection failed: ${error.message}`, 'metamask')
  }
}

/**
 * Connects to Phantom and derives wallet address
 */
export async function connectPhantom(): Promise<Omit<Wallet, 'id' | 'name' | 'isActive' | 'createdAt' | 'updatedAt'>> {
  if (!window.solana?.isPhantom) {
    throw new WalletDerivationError('Phantom not detected')
  }

  try {
    // Connect to Phantom
    const response = await window.solana.connect()
    const address = response.publicKey.toString()

    // Sign a verification message
    const message = `DEX Trading Terminal - Connect Wallet\nTimestamp: ${Date.now()}`
    const encodedMessage = new TextEncoder().encode(message)
    const signedMessage = await window.solana.signMessage(encodedMessage, 'utf8')

    if (!signedMessage) {
      throw new WalletDerivationError('Failed to sign verification message')
    }

    return {
      address,
      chain: 'svm',
      derivationType: 'derived',
      extensionType: 'phantom',
    }
  } catch (error: any) {
    if (error.code === 4001) {
      throw new WalletDerivationError('User rejected the connection request', 'phantom')
    }
    throw new WalletDerivationError(`Phantom connection failed: ${error.message}`, 'phantom')
  }
}

/**
 * Generic connect function that handles both extension types
 */
export async function connectWallet(extensionType: 'metamask' | 'phantom'): Promise<Omit<Wallet, 'id' | 'name' | 'isActive' | 'createdAt' | 'updatedAt'>> {
  switch (extensionType) {
    case 'metamask':
      return connectMetaMask()
    case 'phantom':
      return connectPhantom()
    default:
      throw new WalletDerivationError(`Unsupported extension type: ${extensionType}`)
  }
}

/**
 * Checks if a wallet extension is connected and returns account info
 */
export async function getConnectedAccount(extensionType: 'metamask' | 'phantom'): Promise<string | null> {
  try {
    switch (extensionType) {
      case 'metamask':
        if (!window.ethereum) return null
        const accounts = await window.ethereum.request({ method: 'eth_accounts' })
        return accounts?.[0] || null

      case 'phantom':
        if (!window.solana?.isPhantom) return null
        if (!window.solana.isConnected) return null
        return window.solana.publicKey?.toString() || null

      default:
        return null
    }
  } catch (error) {
    console.warn(`Failed to get connected account for ${extensionType}:`, error)
    return null
  }
}