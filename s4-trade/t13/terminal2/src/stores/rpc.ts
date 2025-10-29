import { getDB } from './db'
import type { RPC } from '../types'

class RPCStore {
  async getAll(): Promise<RPC[]> {
    const db = await getDB()
    return db.getAll('rpcs')
  }

  async getByChain(chain: 'evm' | 'svm'): Promise<RPC[]> {
    const db = await getDB()
    return db.getAllFromIndex('rpcs', 'by-chain', chain)
  }

  async getActive(chain: 'evm' | 'svm'): Promise<RPC | undefined> {
    const db = await getDB()
    const rpcs = await db.getAllFromIndex('rpcs', 'by-chain', chain)
    return rpcs.find(rpc => rpc.isActive)
  }

  async getById(id: string): Promise<RPC | undefined> {
    const db = await getDB()
    return db.get('rpcs', id)
  }

  async create(rpc: Omit<RPC, 'id' | 'createdAt' | 'updatedAt'>): Promise<RPC> {
    const db = await getDB()
    const now = new Date()
    const newRPC: RPC = {
      ...rpc,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    }

    await db.add('rpcs', newRPC)
    return newRPC
  }

  async update(id: string, updates: Partial<Omit<RPC, 'id' | 'createdAt'>>): Promise<RPC | undefined> {
    const db = await getDB()
    const existing = await db.get('rpcs', id)
    if (!existing) return undefined

    const updated: RPC = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    }

    await db.put('rpcs', updated)
    return updated
  }

  async delete(id: string): Promise<void> {
    const db = await getDB()
    await db.delete('rpcs', id)
  }

  async setActive(id: string): Promise<void> {
    const db = await getDB()
    const rpc = await db.get('rpcs', id)
    if (!rpc) return

    const tx = db.transaction('rpcs', 'readwrite')

    // Set all RPCs of the same chain to inactive
    const chainRPCs = await tx.store.getAll()
    for (const chainRpc of chainRPCs) {
      if (chainRpc.chain === rpc.chain && chainRpc.id !== id && chainRpc.isActive) {
        await tx.store.put({ ...chainRpc, isActive: false, updatedAt: new Date() })
      }
    }

    // Set the selected RPC to active
    await tx.store.put({ ...rpc, isActive: true, updatedAt: new Date() })

    await tx.done
  }

  async initializeDefaultRPCs(): Promise<void> {
    // First, clean up any duplicates
    await this.removeDuplicates()

    const db = await getDB()

    const defaultRPCs: Omit<RPC, 'id' | 'createdAt' | 'updatedAt'>[] = [
      // EVM RPCs
      { name: 'Ethereum Mainnet', url: 'https://eth.llamarpc.com', chain: 'evm', isDefault: true, isActive: true },
      { name: 'Polygon Mainnet', url: 'https://polygon.llamarpc.com', chain: 'evm', isDefault: true, isActive: false },
      { name: 'BSC Mainnet', url: 'https://bsc.llamarpc.com', chain: 'evm', isDefault: true, isActive: false },
      { name: 'Arbitrum One', url: 'https://arbitrum.llamarpc.com', chain: 'evm', isDefault: true, isActive: false },

      // SVM RPCs
      { name: 'Solana Mainnet', url: 'https://api.mainnet-beta.solana.com', chain: 'svm', isDefault: true, isActive: true },
      { name: 'Solana Devnet', url: 'https://api.devnet.solana.com', chain: 'svm', isDefault: true, isActive: false },
    ]

    for (const rpc of defaultRPCs) {
      const existing = await db.getAllFromIndex('rpcs', 'by-chain', rpc.chain)
      if (existing.length === 0) {
        await this.create(rpc)
      }
    }
  }

  async removeDuplicates(): Promise<void> {
    const db = await getDB()
    const all = await db.getAll('rpcs')

    // Group by name and keep only the first occurrence of each
    const seen = new Set<string>()
    const duplicates: string[] = []

    for (const rpc of all) {
      if (seen.has(rpc.name)) {
        duplicates.push(rpc.id)
      } else {
        seen.add(rpc.name)
      }
    }

    // Delete duplicates
    for (const id of duplicates) {
      await db.delete('rpcs', id)
    }

    if (duplicates.length > 0) {
      console.log(`Removed ${duplicates.length} duplicate RPCs`)
    }
  }
}

export const rpcStore = new RPCStore()