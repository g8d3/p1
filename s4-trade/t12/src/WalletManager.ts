import { WalletConnector } from './WalletConnector'
import { WalletGenerator } from './WalletGenerator'
import { Storage } from './Storage'
import { Wallet, WalletManagerConfig } from './types'
import { ethers } from 'ethers'
import nacl from 'tweetnacl'
import bs58 from 'bs58'
import { Keypair } from '@solana/web3.js'

export class WalletManager {
  private connector: WalletConnector
  private storage: Storage | null = null
  private signature: string | null = null

  constructor(config: WalletManagerConfig = {}) {
    this.connector = new WalletConnector()
    if (config.encryptionKey) {
      this.storage = new Storage(config.encryptionKey)
    }
  }

  async authenticate(): Promise<string> {
    const address = await this.connector.connect()
    const message = 'Sign this message to authenticate and generate deterministic wallets. This does not cost gas and your keys stay secure.'
    this.signature = await this.connector.signMessage(message)

    if (!this.storage) {
      this.storage = new Storage(this.signature)
    }

    return address
  }

  async generateWallets(startIndex: number, count: number, network: string = 'ethereum'): Promise<Wallet[]> {
    if (!this.signature) {
      throw new Error('Must authenticate first')
    }

    const wallets = WalletGenerator.generateWallets(this.signature, startIndex, count, network)

    if (this.storage) {
      for (const wallet of wallets) {
        await this.storage.saveWallet(wallet)
      }
    }

    return wallets
  }

  async getWallets(): Promise<Wallet[]> {
    if (!this.storage) {
      throw new Error('Storage not initialized')
    }
    return await this.storage.getAllWallets()
  }

  async deleteWallet(id: string): Promise<void> {
    if (!this.storage) {
      throw new Error('Storage not initialized')
    }
    await this.storage.deleteWallet(id)
  }

  exportWallet(wallet: Wallet): { address: string; privateKey: string } {
    return {
      address: wallet.address,
      privateKey: wallet.privateKey
    }
  }

  copyAddress(address: string): void {
    navigator.clipboard.writeText(address)
  }

  async signMessage(walletId: string, message: string): Promise<string> {
    if (!this.storage) {
      throw new Error('Storage not initialized')
    }

    const wallet = await this.storage.getWallet(walletId)
    if (!wallet) {
      throw new Error('Wallet not found')
    }

    if (wallet.network === 'solana') {
      const messageBytes = new TextEncoder().encode(message)
      const secretKey = ethers.getBytes(wallet.privateKey)
      const signature = nacl.sign.detached(messageBytes, secretKey)
      return bs58.encode(signature)
    } else {
      // EVM
      const ethersWallet = new ethers.Wallet(wallet.privateKey)
      return await ethersWallet.signMessage(message)
    }
  }

  async signTransaction(walletId: string, tx: any): Promise<string> {
    if (!this.storage) {
      throw new Error('Storage not initialized')
    }

    const wallet = await this.storage.getWallet(walletId)
    if (!wallet) {
      throw new Error('Wallet not found')
    }

    if (wallet.network === 'solana') {
      // For Solana, tx is expected to be a Transaction object from @solana/web3.js
      const secretKey = ethers.getBytes(wallet.privateKey)
      const keypair = Keypair.fromSecretKey(secretKey)
      tx.sign(keypair)
      return bs58.encode(tx.serialize())
    } else {
      // EVM
      const ethersWallet = new ethers.Wallet(wallet.privateKey)
      return await ethersWallet.signTransaction(tx)
    }
  }

  async broadcastTransaction(signedTx: string, rpcUrl: string, network: string, chainId?: number): Promise<string> {
    if (network === 'solana') {
      // For Solana
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'sendTransaction',
          params: [signedTx, { encoding: 'base58' }],
        }),
      })

      const result = await response.json()
      if (result.error) {
        throw new Error(`Broadcast failed: ${result.error.message}`)
      }
      return result.result
    } else {
      // For EVM
      const provider = chainId
        ? new ethers.JsonRpcProvider(rpcUrl, chainId)
        : new ethers.JsonRpcProvider(rpcUrl)
      const txResponse = await provider.broadcastTransaction(signedTx)
      return txResponse.hash
    }
  }
}