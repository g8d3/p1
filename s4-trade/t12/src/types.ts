export interface Wallet {
  id: string
  address: string
  privateKey: string
  network: string
  createdAt: Date
}

export interface WalletManagerConfig {
  encryptionKey?: string
}