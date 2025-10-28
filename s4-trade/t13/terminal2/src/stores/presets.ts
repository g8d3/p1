import { getDB } from './db'
import type { Preset } from '../types'

class PresetStore {
  async getAll(): Promise<Preset[]> {
    const db = await getDB()
    return db.getAll('presets')
  }

  async getById(id: string): Promise<Preset | undefined> {
    const db = await getDB()
    return db.get('presets', id)
  }

  async create(preset: Omit<Preset, 'id' | 'createdAt' | 'updatedAt'>): Promise<Preset> {
    const db = await getDB()
    const now = new Date()
    const newPreset: Preset = {
      ...preset,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    }

    await db.add('presets', newPreset)
    return newPreset
  }

  async update(id: string, updates: Partial<Omit<Preset, 'id' | 'createdAt'>>): Promise<Preset | undefined> {
    const db = await getDB()
    const existing = await db.get('presets', id)
    if (!existing) return undefined

    const updated: Preset = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    }

    await db.put('presets', updated)
    return updated
  }

  async delete(id: string): Promise<void> {
    const db = await getDB()
    await db.delete('presets', id)
  }
}

export const presetStore = new PresetStore()