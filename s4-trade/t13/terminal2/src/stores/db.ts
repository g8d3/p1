import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface DexTerminalDB extends DBSchema {
  wallets: {
    key: string
    value: import('../types').Wallet
    indexes: { 'by-chain': string }
  }
  presets: {
    key: string
    value: import('../types').Preset
  }
  rpcs: {
    key: string
    value: import('../types').RPC
    indexes: { 'by-chain': string }
  }
  aggregators: {
    key: string
    value: import('../types').Aggregator
  }
  errors: {
    key: string
    value: import('../types').ErrorLog
    indexes: { 'by-timestamp': Date }
  }
  trades: {
    key: string
    value: import('../types').Trade
    indexes: { 'by-wallet': string, 'by-status': string }
  }
}

let db: IDBPDatabase<DexTerminalDB> | null = null

export async function initDB(): Promise<IDBPDatabase<DexTerminalDB>> {
  if (db) return db

  db = await openDB<DexTerminalDB>('dex-terminal', 2, {
    upgrade(db, oldVersion, newVersion, transaction) {
      console.log(`Upgrading database from ${oldVersion} to ${newVersion}`)

      // Only create stores that don't exist
      if (!db.objectStoreNames.contains('wallets')) {
        const walletStore = db.createObjectStore('wallets', { keyPath: 'id' })
        walletStore.createIndex('by-chain', 'chain')
      }

      if (!db.objectStoreNames.contains('presets')) {
        db.createObjectStore('presets', { keyPath: 'id' })
      }

      if (!db.objectStoreNames.contains('rpcs')) {
        const rpcStore = db.createObjectStore('rpcs', { keyPath: 'id' })
        rpcStore.createIndex('by-chain', 'chain')
      }

      if (!db.objectStoreNames.contains('aggregators')) {
        db.createObjectStore('aggregators', { keyPath: 'id' })
      }

      if (!db.objectStoreNames.contains('errors')) {
        const errorStore = db.createObjectStore('errors', { keyPath: 'id' })
        errorStore.createIndex('by-timestamp', 'timestamp')
      }

      if (!db.objectStoreNames.contains('trades')) {
        const tradeStore = db.createObjectStore('trades', { keyPath: 'id' })
        tradeStore.createIndex('by-wallet', 'walletId')
        tradeStore.createIndex('by-status', 'status')
      }
    },
  })

  return db
}

export async function getDB(): Promise<IDBPDatabase<DexTerminalDB>> {
  if (!db) {
    return initDB()
  }
  return db
}