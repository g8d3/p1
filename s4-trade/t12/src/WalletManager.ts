import { WalletConnector } from './WalletConnector'
import { WalletGenerator } from './WalletGenerator'
import { Storage } from './Storage'
import { Wallet, WalletManagerConfig } from './types'

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

  async generateWallets(count: number, network: string = 'ethereum'): Promise<Wallet[]> {
    if (!this.signature) {
      throw new Error('Must authenticate first')
    }

    const wallets = WalletGenerator.generateWallets(this.signature, count, network)

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
}