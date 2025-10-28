import { create } from 'zustand';
import { db } from './db';
import { ErrorLog } from '@/types';

interface ErrorState {
  errors: ErrorLog[];
  isLoading: boolean;

  // Actions
  loadErrors: () => Promise<void>;
  addError: (error: Omit<ErrorLog, 'id' | 'timestamp'>) => Promise<void>;
  clearErrors: () => Promise<void>;
  exportErrors: () => Promise<string>;
}

export const useErrorStore = create<ErrorState>((set, get) => ({
  errors: [],
  isLoading: false,

  loadErrors: async () => {
    set({ isLoading: true });
    try {
      const errors = await db.errors.orderBy('timestamp').reverse().toArray();
      set({ errors, isLoading: false });
    } catch (error) {
      console.error('Failed to load errors:', error);
      set({ isLoading: false });
    }
  },

  addError: async (errorData) => {
    try {
      const id = crypto.randomUUID();
      const error: ErrorLog = {
        ...errorData,
        id,
        timestamp: new Date(),
      };
      await db.errors.add(error);
      const errors = await db.errors.orderBy('timestamp').reverse().toArray();
      set({ errors });
    } catch (error) {
      console.error('Failed to add error:', error);
    }
  },

  clearErrors: async () => {
    try {
      await db.errors.clear();
      set({ errors: [] });
    } catch (error) {
      console.error('Failed to clear errors:', error);
    }
  },

  exportErrors: async () => {
    const errors = get().errors;
    return JSON.stringify(errors, null, 2);
  },
}));