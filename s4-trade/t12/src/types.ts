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

export interface RPCConfig {
  id: string
  name: string
  url: string
  network: string
  chainId?: number
}

export interface TransactionTemplate {
  type: 'transfer' | 'contract_call' | 'custom'
  to?: string
  value?: string
  data?: string
  gasLimit?: string
  gasPrice?: string
  maxFeePerGas?: string
  maxPriorityFeePerGas?: string
}