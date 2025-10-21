import { openDB, DBSchema, IDBPDatabase } from 'idb'
import CryptoJS from 'crypto-js'
import { Wallet } from './types'

interface WalletDB extends DBSchema {
  wallets: {
    key: string
    value: {
      id: string
      address: string
      encryptedPrivateKey: string
      network: string
      createdAt: string
    }
  }
}

export class Storage {
  private db: IDBPDatabase<WalletDB> | null = null
  private encryptionKey: string

  constructor(encryptionKey: string) {
    this.encryptionKey = encryptionKey
  }

  async init(): Promise<void> {
    this.db = await openDB<WalletDB>('wallet-crud-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('wallets')) {
          db.createObjectStore('wallets', { keyPath: 'id' })
        }
      }
    })
  }

  private encrypt(text: string): string {
    return CryptoJS.AES.encrypt(text, this.encryptionKey).toString()
  }

  private decrypt(ciphertext: string): string {
    const bytes = CryptoJS.AES.decrypt(ciphertext, this.encryptionKey)
    return bytes.toString(CryptoJS.enc.Utf8)
  }

  async saveWallet(wallet: Wallet): Promise<void> {
    if (!this.db) await this.init()

    const encryptedPrivateKey = this.encrypt(wallet.privateKey)
    await this.db!.put('wallets', {
      id: wallet.id,
      address: wallet.address,
      encryptedPrivateKey,
      network: wallet.network,
      createdAt: wallet.createdAt.toISOString()
    })
  }

  async getWallet(id: string): Promise<Wallet | null> {
    if (!this.db) await this.init()

    const stored = await this.db!.get('wallets', id)
    if (!stored) return null

    return {
      id: stored.id,
      address: stored.address,
      privateKey: this.decrypt(stored.encryptedPrivateKey),
      network: stored.network,
      createdAt: new Date(stored.createdAt)
    }
  }

  async getAllWallets(): Promise<Wallet[]> {
    if (!this.db) await this.init()

    const storedWallets = await this.db!.getAll('wallets')
    return storedWallets.map(stored => ({
      id: stored.id,
      address: stored.address,
      privateKey: this.decrypt(stored.encryptedPrivateKey),
      network: stored.network,
      createdAt: new Date(stored.createdAt)
    }))
  }

  async deleteWallet(id: string): Promise<void> {
    if (!this.db) await this.init()
    await this.db!.delete('wallets', id)
  }

  async clearAll(): Promise<void> {
    if (!this.db) await this.init()
    await this.db!.clear('wallets')
  }
}