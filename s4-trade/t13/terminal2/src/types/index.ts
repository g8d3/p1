export interface Wallet {
  id: string;
  name: string;
  address: string;
  chain: 'evm' | 'svm';
  encryptedPrivateKey?: string; // Only for imported wallets, not derived
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Preset {
  id: string;
  name: string;
  slippage: number; // percentage
  entries: Entry[];
  exits: Exit[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Entry {
  id: string;
  price: PriceValue;
  slippage?: number; // optional, uses preset slippage if not set
  volume: VolumeValue;
}

export interface Exit {
  id: string;
  price: PriceValue;
  slippage?: number; // optional, uses preset slippage if not set
  volume: VolumeValue;
}

export interface PriceValue {
  type: 'absolute' | 'percentage';
  value: number; // absolute price or percentage from current price
}

export interface VolumeValue {
  type: 'absolute' | 'percentage';
  value: number; // absolute amount or percentage of total assets (entries) or assets in trade (exits)
}

export interface RPC {
  id: string;
  name: string;
  url: string;
  chain: 'evm' | 'svm';
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Aggregator {
  id: string;
  name: string;
  type: '1inch' | 'jupiter';
  apiKey?: string;
  isActive: boolean;
}

export interface ErrorLog {
  id: string;
  message: string;
  stack?: string;
  timestamp: Date;
  context?: Record<string, any>;
}

export interface Trade {
  id: string;
  walletId: string;
  presetId: string;
  aggregatorId: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  entries: TradeEntry[];
  exits: TradeExit[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TradeEntry {
  id: string;
  price: number;
  slippage: number;
  volume: number;
  txHash?: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
}

export interface TradeExit {
  id: string;
  price: number;
  slippage: number;
  volume: number;
  txHash?: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
}