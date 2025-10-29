import { getDB } from './db'
import type { Aggregator } from '../types'
import { encrypt } from '../utils/crypto'

class AggregatorStore {
  async getAll(): Promise<Aggregator[]> {
    const db = await getDB()
    return db.getAll('aggregators')
  }

  async getById(id: string): Promise<Aggregator | undefined> {
    const db = await getDB()
    return db.get('aggregators', id)
  }

  async getActive(): Promise<Aggregator[]> {
    const db = await getDB()
    const aggregators = await db.getAll('aggregators')
    return aggregators.filter(agg => agg.isActive).sort((a, b) => a.priority - b.priority)
  }

  async create(aggregator: Omit<Aggregator, 'id' | 'createdAt' | 'updatedAt'>): Promise<Aggregator> {
    const db = await getDB()
    const now = new Date()
    const newAggregator: Aggregator = {
      ...aggregator,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      apiKey: aggregator.apiKey ? encrypt(aggregator.apiKey) : undefined,
    }

    await db.add('aggregators', newAggregator)
    return newAggregator
  }

  async update(id: string, updates: Partial<Omit<Aggregator, 'id' | 'createdAt'>>): Promise<Aggregator | undefined> {
    const db = await getDB()
    const existing = await db.get('aggregators', id)
    if (!existing) return undefined

    const updated: Aggregator = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
      apiKey: updates.apiKey !== undefined
        ? (updates.apiKey ? encrypt(updates.apiKey) : undefined)
        : existing.apiKey,
    }

    await db.put('aggregators', updated)
    return updated
  }

  async delete(id: string): Promise<void> {
    const db = await getDB()
    await db.delete('aggregators', id)
  }

  async initializeDefaultAggregators(): Promise<void> {
    // Create default aggregators, ignore if they already exist
    const defaults = [
      {
        name: '1inch',
        type: '1inch' as const,
        isActive: true,
        priority: 1,
      },
      {
        name: 'Jupiter',
        type: 'jupiter' as const,
        isActive: true,
        priority: 2,
      },
    ]

    for (const config of defaults) {
      try {
        await this.create(config)
      } catch (error) {
        // If it already exists, that's fine - ignore the error
      }
    }
  }

  async setActive(id: string, isActive: boolean): Promise<Aggregator | undefined> {
    return this.update(id, { isActive })
  }

  async setPriority(id: string, priority: number): Promise<Aggregator | undefined> {
    return this.update(id, { priority })
  }
}

export const aggregatorStore = new AggregatorStore()