import { getDB } from './db'
import type { ErrorLog } from '../types'

class ErrorStore {
  async logError(error: Error, context?: Record<string, any>): Promise<void> {
    try {
      const db = await getDB()
      const errorLog: ErrorLog = {
        id: Date.now().toString(),
        message: error.message,
        stack: error.stack,
        timestamp: new Date(),
        context,
      }

      await db.add('errors', errorLog)
      console.error('Error logged:', errorLog)
    } catch (dbError) {
      console.error('Failed to log error to database:', dbError)
      console.error('Original error:', error)
    }
  }

  async getErrors(limit = 50): Promise<ErrorLog[]> {
    try {
      const db = await getDB()
      const errors = await db.getAllFromIndex('errors', 'by-timestamp')
      return errors
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit)
    } catch (error) {
      console.error('Failed to get errors:', error)
      return []
    }
  }

  async clearErrors(): Promise<void> {
    try {
      const db = await getDB()
      const tx = db.transaction('errors', 'readwrite')
      await tx.store.clear()
      await tx.done
    } catch (error) {
      console.error('Failed to clear errors:', error)
    }
  }
}

export const errorStore = new ErrorStore()