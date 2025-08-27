'use client';

import { useState, useCallback } from 'react';

interface ErrorState {
  error: Error | null;
  isError: boolean;
}

interface UseErrorHandlerReturn extends ErrorState {
  setError: (error: Error | null) => void;
  clearError: () => void;
  handleAsync: <T>(asyncFn: () => Promise<T>) => Promise<T | null>;
}

export const useErrorHandler = (): UseErrorHandlerReturn => {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isError: false,
  });

  const setError = useCallback((error: Error | null) => {
    setErrorState({
      error,
      isError: !!error,
    });
  }, []);

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isError: false,
    });
  }, []);

  const handleAsync = useCallback(async <T>(
    asyncFn: () => Promise<T>
  ): Promise<T | null> => {
    try {
      clearError();
      const result = await asyncFn();
      return result;
    } catch (error) {
      const errorInstance = error instanceof Error ? error : new Error(String(error));
      setError(errorInstance);
      return null;
    }
  }, [clearError, setError]);

  return {
    ...errorState,
    setError,
    clearError,
    handleAsync,
  };
};
