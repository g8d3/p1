import { useErrorStore } from '@/stores/errors';

export const useErrorHandler = () => {
  const addError = useErrorStore(state => state.addError);

  const handleError = (error: Error, context?: Record<string, unknown>, component?: string) => {
    addError({
      level: 'error',
      message: error.message,
      stack: error.stack,
      context,
      component,
    });
  };

  const handleWarning = (message: string, context?: Record<string, unknown>, component?: string) => {
    addError({
      level: 'warn',
      message,
      context,
      component,
    });
  };

  const handleInfo = (message: string, context?: Record<string, unknown>, component?: string) => {
    addError({
      level: 'info',
      message,
      context,
      component,
    });
  };

  return { handleError, handleWarning, handleInfo };
};