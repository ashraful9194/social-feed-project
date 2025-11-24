/**
 * Centralized error handling utilities
 */

import axios, { type AxiosError } from 'axios';

export interface ApiError {
    message: string;
    statusCode?: number;
    errors?: Record<string, string[]>;
}

/**
 * Extracts a user-friendly error message from an API error
 */
export const getErrorMessage = (error: unknown): string => {
    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message?: string; errors?: Record<string, string[]> }>;
        
        if (axiosError.response) {
            const data = axiosError.response.data;
            
            // Handle validation errors
            if (data?.errors && typeof data.errors === 'object') {
                const errorMessages = Object.values(data.errors).flat();
                return errorMessages.join(', ') || 'Validation failed';
            }
            
            // Handle single message
            if (data?.message) {
                return data.message;
            }
            
            // Handle status-based messages
            switch (axiosError.response.status) {
                case 400:
                    return 'Invalid request. Please check your input.';
                case 401:
                    return 'Authentication required. Please log in.';
                case 403:
                    return 'You do not have permission to perform this action.';
                case 404:
                    return 'Resource not found.';
                case 500:
                    return 'Server error. Please try again later.';
                default:
                    return 'An error occurred. Please try again.';
            }
        }
        
        if (axiosError.request) {
            return 'Network error. Please check your connection.';
        }
    }
    
    if (error instanceof Error) {
        return error.message;
    }
    
    return 'An unexpected error occurred.';
};

/**
 * Checks if an error is an authentication error
 */
export const isAuthError = (error: unknown): boolean => {
    if (axios.isAxiosError(error)) {
        return error.response?.status === 401 || error.response?.status === 403;
    }
    return false;
};

