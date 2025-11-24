/**
 * Custom hook for handling API calls with loading and error states
 */

import { useState, useCallback } from 'react';
import { getErrorMessage } from '../utils/errorHandler';

interface UseApiCallOptions<T> {
    onSuccess?: (data: T) => void;
    onError?: (error: string) => void;
}

export const useApiCall = <T, P = void>(apiFunction: (params: P) => Promise<T>, options?: UseApiCallOptions<T>) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<T | null>(null);

    const execute = useCallback(
        async (params: P) => {
            try {
                setLoading(true);
                setError(null);
                const result = await apiFunction(params);
                setData(result);
                options?.onSuccess?.(result);
                return result;
            } catch (err) {
                const errorMessage = getErrorMessage(err);
                setError(errorMessage);
                options?.onError?.(errorMessage);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [apiFunction, options]
    );

    const reset = useCallback(() => {
        setError(null);
        setData(null);
    }, []);

    return {
        execute,
        loading,
        error,
        data,
        reset,
    };
};

