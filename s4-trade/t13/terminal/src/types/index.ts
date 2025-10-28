export interface Wallet {
  id: string;
  alias: string;
  chain: 'EVM' | 'SVM';
  address: string;
  encryptedPrivateKey: string;
  iv: string;
  salt: string;
  balance?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TradePreset {
  id: string;
  name: string;
  slippage: number;
  entries: TradeEntry[];
  exits: TradeExit[];
  executionMode: 'sequential' | 'parallel' | 'conditional';
  cooldown: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TradeEntry {
  price: string;
  volume: string;
  slippage?: number;
}

export interface TradeExit {
  price: string;
  volume: string;
  slippage?: number;
}

export interface RPC {
  id: string;
  chain: 'EVM' | 'SVM';
  url: string;
  name: string;
  latency?: number;
  successRate?: number;
  blockHeight?: number;
  isHealthy: boolean;
  isDefault: boolean;
}

export interface ErrorLog {
  id: string;
  timestamp: Date;
  level: 'error' | 'warn' | 'info';
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
  component?: string;
}

export interface TradeExecution {
  id: string;
  presetId: string;
  walletId: string;
  pair: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  fills: TradeFill[];
  startedAt: Date;
  completedAt?: Date;
}

export interface TradeFill {
  entryIndex: number;
  txHash: string;
  price: string;
  volume: string;
  slippage: number;
  timestamp: Date;
}