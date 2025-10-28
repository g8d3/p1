import { create } from 'zustand';
import { db } from './db';
import { RPC } from '@/types';

interface RPCState {
  rpcs: RPC[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadRPCs: () => Promise<void>;
  addRPC: (rpc: Omit<RPC, 'id'>) => Promise<void>;
  updateRPC: (id: string, updates: Partial<RPC>) => Promise<void>;
  deleteRPC: (id: string) => Promise<void>;
  checkHealth: (id: string) => Promise<void>;
}

export const useRPCStore = create<RPCState>((set, get) => ({
  rpcs: [],
  isLoading: false,
  error: null,

  loadRPCs: async () => {
    set({ isLoading: true, error: null });
    try {
      let rpcs = await db.rpcs.toArray();
      if (rpcs.length === 0) {
        // Add default RPCs
        const defaults: Omit<RPC, 'id'>[] = [
          { chain: 'EVM', url: 'https://mainnet.infura.io/v3/YOUR_KEY', name: 'Infura', isHealthy: true, isDefault: true },
          { chain: 'EVM', url: 'https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY', name: 'Alchemy', isHealthy: true, isDefault: false },
          { chain: 'SVM', url: 'https://api.mainnet-beta.solana.com', name: 'Solana Mainnet', isHealthy: true, isDefault: true },
        ];
        for (const rpc of defaults) {
          const id = crypto.randomUUID();
          await db.rpcs.add({ ...rpc, id });
        }
        rpcs = await db.rpcs.toArray();
      }
      set({ rpcs, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addRPC: async (rpcData) => {
    set({ isLoading: true, error: null });
    try {
      const id = crypto.randomUUID();
      const rpc: RPC = {
        ...rpcData,
        id,
      };
      await db.rpcs.add(rpc);
      const rpcs = await db.rpcs.toArray();
      set({ rpcs, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateRPC: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      await db.rpcs.update(id, updates);
      const rpcs = await db.rpcs.toArray();
      set({ rpcs, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  deleteRPC: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await db.rpcs.delete(id);
      const rpcs = await db.rpcs.toArray();
      set({ rpcs, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  checkHealth: async (id) => {
    // Mock health check
    const rpc = get().rpcs.find(r => r.id === id);
    if (!rpc) return;

    try {
      // Simulate latency
      const latency = Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, latency));

      await get().updateRPC(id, {
        latency,
        successRate: Math.random() * 100,
        blockHeight: Math.floor(Math.random() * 1000000),
        isHealthy: Math.random() > 0.1,
      });
    } catch {
      await get().updateRPC(id, { isHealthy: false });
    }
  },
}));