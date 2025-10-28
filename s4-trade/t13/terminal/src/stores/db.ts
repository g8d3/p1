import Dexie, { Table } from 'dexie';
import { Wallet, TradePreset, RPC, ErrorLog, TradeExecution } from '@/types';

export class AppDB extends Dexie {
  wallets!: Table<Wallet>;
  presets!: Table<TradePreset>;
  rpcs!: Table<RPC>;
  errors!: Table<ErrorLog>;
  executions!: Table<TradeExecution>;

  constructor() {
    super('DexTradingTerminal');
    this.version(1).stores({
      wallets: 'id, alias, chain, address, isActive, createdAt, updatedAt',
      presets: 'id, name, createdAt, updatedAt',
      rpcs: 'id, chain, url, name, isHealthy, isDefault',
      errors: 'id, timestamp, level, component',
      executions: 'id, presetId, walletId, pair, status, startedAt, completedAt',
    });
  }
}

export const db = new AppDB();