import { getDB } from './db'
import type { Wallet } from '../types'
import { encrypt } from '../utils/crypto'

class WalletStore {
  async getAll(): Promise<Wallet[]> {
    const db = await getDB()
    return db.getAll('wallets')
  }

  async getById(id: string): Promise<Wallet | undefined> {
    const db = await getDB()
    return db.get('wallets', id)
  }

  async getActive(): Promise<Wallet | undefined> {
    const db = await getDB()
    const wallets = await db.getAll('wallets')
    return wallets.find(wallet => wallet.isActive)
  }

  async create(wallet: Omit<Wallet, 'id' | 'createdAt' | 'updatedAt'>): Promise<Wallet> {
    const db = await getDB()
    const now = new Date()
    const newWallet: Wallet = {
      ...wallet,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      encryptedPrivateKey: wallet.encryptedPrivateKey ? encrypt(wallet.encryptedPrivateKey) : undefined,
    }

    await db.add('wallets', newWallet)
    return newWallet
  }

  async update(id: string, updates: Partial<Omit<Wallet, 'id' | 'createdAt'>>): Promise<Wallet | undefined> {
    const db = await getDB()
    const existing = await db.get('wallets', id)
    if (!existing) return undefined

    const updated: Wallet = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
      encryptedPrivateKey: updates.encryptedPrivateKey !== undefined
        ? encrypt(updates.encryptedPrivateKey)
        : existing.encryptedPrivateKey,
    }

    await db.put('wallets', updated)
    return updated
  }

  async delete(id: string): Promise<void> {
    const db = await getDB()
    await db.delete('wallets', id)
  }

  async setActive(id: string): Promise<void> {
    const db = await getDB()
    const tx = db.transaction('wallets', 'readwrite')

    // Set all wallets to inactive
    const wallets = await tx.store.getAll()
    for (const wallet of wallets) {
      if (wallet.id !== id && wallet.isActive) {
        await tx.store.put({ ...wallet, isActive: false, updatedAt: new Date() })
      }
    }

    // Set the selected wallet to active
    const wallet = await tx.store.get(id)
    if (wallet) {
      await tx.store.put({ ...wallet, isActive: true, updatedAt: new Date() })
    }

    await tx.done
  }
}

export const walletStore = new WalletStore()