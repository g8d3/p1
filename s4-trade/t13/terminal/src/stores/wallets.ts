import { create } from 'zustand';
import { db } from './db';
import { Wallet } from '@/types';
import { deriveKey, encrypt, generateSalt, arrayBufferToBase64 } from '@/utils/crypto';

interface WalletState {
  wallets: Wallet[];
  activeWallet: Wallet | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadWallets: () => Promise<void>;
  createWallet: (wallet: Omit<Wallet, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateWallet: (id: string, updates: Partial<Wallet>) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
  setActiveWallet: (wallet: Wallet | null) => void;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  wallets: [],
  activeWallet: null,
  isLoading: false,
  error: null,

  loadWallets: async () => {
    set({ isLoading: true, error: null });
    try {
      const wallets = await db.wallets.toArray();
      set({ wallets, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createWallet: async (walletData) => {
    set({ isLoading: true, error: null });
    try {
      const passphrase = 'demo'; // TODO: get from user
      const salt = generateSalt();
      const key = await deriveKey(passphrase, salt);
      const { encrypted, iv } = await encrypt(walletData.encryptedPrivateKey, key);

      const id = crypto.randomUUID();
      const wallet: Wallet = {
        ...walletData,
        encryptedPrivateKey: arrayBufferToBase64(encrypted),
        iv: arrayBufferToBase64(iv.buffer),
        salt: arrayBufferToBase64(salt.buffer),
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.wallets.add(wallet);
      const wallets = await db.wallets.toArray();
      set({ wallets, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateWallet: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      await db.wallets.update(id, { ...updates, updatedAt: new Date() });
      const wallets = await db.wallets.toArray();
      const activeWallet = get().activeWallet?.id === id ? wallets.find(w => w.id === id) || null : get().activeWallet;
      set({ wallets, activeWallet, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  deleteWallet: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await db.wallets.delete(id);
      const wallets = await db.wallets.toArray();
      const activeWallet = get().activeWallet?.id === id ? null : get().activeWallet;
      set({ wallets, activeWallet, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  setActiveWallet: (wallet) => {
    set({ activeWallet: wallet });
  },
}));