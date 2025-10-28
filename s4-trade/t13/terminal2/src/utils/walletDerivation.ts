import { ethers } from 'ethers'
import { Keypair } from '@solana/web3.js'
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
 * Connects to MetaMask and derives a new wallet address from signature
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

    const mainAddress = accounts[0]

    // Request signature for derivation
    const message = `DEX Trading Terminal - Derive Trading Wallet\nTimestamp: ${Date.now()}\nMain Address: ${mainAddress}`
    const signature = await window.ethereum.request({
      method: 'personal_sign',
      params: [message, mainAddress],
    })

    if (!signature) {
      throw new WalletDerivationError('Failed to sign derivation message')
    }

    // Derive new wallet from signature
    const derivedWallet = await deriveFromSignature(signature, 'evm')

    return {
      address: derivedWallet.address,
      chain: 'evm',
      derivationType: 'derived',
      extensionType: 'metamask',
      encryptedPrivateKey: derivedWallet.privateKey, // Store the derived private key
    }
  } catch (error: any) {
    if (error.code === 4001) {
      throw new WalletDerivationError('User rejected the connection request', 'metamask')
    }
    throw new WalletDerivationError(`MetaMask connection failed: ${error.message}`, 'metamask')
  }
}

/**
 * Connects to Phantom and derives a new wallet address from signature
 */
export async function connectPhantom(): Promise<Omit<Wallet, 'id' | 'name' | 'isActive' | 'createdAt' | 'updatedAt'>> {
  if (!window.solana?.isPhantom) {
    throw new WalletDerivationError('Phantom not detected')
  }

  try {
    // Connect to Phantom
    const response = await window.solana.connect()
    const mainAddress = response.publicKey.toString()

    // Sign a derivation message
    const message = `DEX Trading Terminal - Derive Trading Wallet\nTimestamp: ${Date.now()}\nMain Address: ${mainAddress}`
    const encodedMessage = new TextEncoder().encode(message)
    const signedMessage = await window.solana.signMessage(encodedMessage, 'utf8')

    if (!signedMessage) {
      throw new WalletDerivationError('Failed to sign derivation message')
    }

    // Derive new wallet from signature
    const derivedWallet = await deriveFromSignature(signedMessage.signature, 'svm')

    return {
      address: derivedWallet.address,
      chain: 'svm',
      derivationType: 'derived',
      extensionType: 'phantom',
      encryptedPrivateKey: derivedWallet.privateKey, // Store the derived private key
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
 * Derives a new wallet from a signature
 */
export async function deriveFromSignature(signature: string | Uint8Array, chain: 'evm' | 'svm'): Promise<{ address: string; privateKey: string }> {
  try {
    // Convert signature to bytes
    const signatureBytes = typeof signature === 'string'
      ? ethers.getBytes(signature)
      : signature

    // Hash the signature to create entropy
    const entropy = ethers.keccak256(signatureBytes)

    if (chain === 'evm') {
      // Create EVM wallet from entropy
      const wallet = ethers.Wallet.createRandom()
      // Mix entropy with random wallet for additional security
      const mixedEntropy = ethers.keccak256(ethers.concat([entropy, ethers.getBytes(wallet.privateKey)]))
      const derivedWallet = new ethers.Wallet(mixedEntropy)

      return {
        address: derivedWallet.address,
        privateKey: derivedWallet.privateKey,
      }
    } else if (chain === 'svm') {
      // Create SVM wallet from entropy
      const entropyBuffer = Buffer.from(entropy.slice(2), 'hex') // Remove 0x prefix
      const keypair = Keypair.fromSeed(entropyBuffer.slice(0, 32)) // Use first 32 bytes as seed

      return {
        address: keypair.publicKey.toString(),
        privateKey: Buffer.from(keypair.secretKey).toString('hex'),
      }
    } else {
      throw new Error(`Unsupported chain: ${chain}`)
    }
  } catch (error) {
    throw new WalletDerivationError(`Failed to derive wallet from signature: ${error}`)
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