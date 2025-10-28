import { useCallback } from 'react'
import { errorStore } from '../stores/errors'
import { useToast } from './use-toast'

export function useErrorHandler() {
  const { toast } = useToast()

  const handleError = useCallback(async (error: Error, context?: Record<string, any>) => {
    // Log to database
    await errorStore.logError(error, context)

    // Show toast notification
    toast({
      title: 'Error',
      description: error.message,
      variant: 'destructive',
    })

    // Log to console for development
    console.error('Handled error:', error, context)
  }, [toast])

  const handleAsyncError = useCallback(async (fn: () => Promise<void>) => {
    try {
      await fn()
    } catch (error) {
      await handleError(error as Error)
    }
  }, [handleError])

  return { handleError, handleAsyncError }
}