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

export interface Signature {
  id: string
  type: 'message' | 'transaction'
  walletId: string
  input: string
  output: string
  timestamp: Date
  error?: string
}