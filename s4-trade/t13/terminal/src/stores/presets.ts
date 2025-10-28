import { create } from 'zustand';
import { db } from './db';
import { TradePreset } from '@/types';

interface PresetState {
  presets: TradePreset[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadPresets: () => Promise<void>;
  createPreset: (preset: Omit<TradePreset, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePreset: (id: string, updates: Partial<TradePreset>) => Promise<void>;
  deletePreset: (id: string) => Promise<void>;
}

export const usePresetStore = create<PresetState>((set) => ({
  presets: [],
  isLoading: false,
  error: null,

  loadPresets: async () => {
    set({ isLoading: true, error: null });
    try {
      const presets = await db.presets.toArray();
      set({ presets, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createPreset: async (presetData) => {
    set({ isLoading: true, error: null });
    try {
      const id = crypto.randomUUID();
      const preset: TradePreset = {
        ...presetData,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.presets.add(preset);
      const presets = await db.presets.toArray();
      set({ presets, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updatePreset: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      await db.presets.update(id, { ...updates, updatedAt: new Date() });
      const presets = await db.presets.toArray();
      set({ presets, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  deletePreset: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await db.presets.delete(id);
      const presets = await db.presets.toArray();
      set({ presets, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
}));