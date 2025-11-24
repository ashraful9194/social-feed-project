/**
 * Custom hook for authentication state and operations
 */

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { STORAGE_KEYS, ROUTES } from '../config/constants';
import { authService } from '../services/AuthService';
import { getErrorMessage } from '../utils/errorHandler';

interface User {
    name: string;
    email: string;
}

export const useAuth = () => {
    const navigate = useNavigate();

    const getToken = useCallback((): string | null => {
        return localStorage.getItem(STORAGE_KEYS.TOKEN);
    }, []);

    const getUser = useCallback((): User | null => {
        const userStr = localStorage.getItem(STORAGE_KEYS.USER);
        if (!userStr) return null;
        try {
            return JSON.parse(userStr) as User;
        } catch {
            return null;
        }
    }, []);

    const isAuthenticated = useCallback((): boolean => {
        return getToken() !== null;
    }, [getToken]);

    const logout = useCallback(() => {
        authService.logout();
        navigate(ROUTES.LOGIN);
    }, [navigate]);

    const handleAuthError = useCallback((error: unknown): string => {
        const message = getErrorMessage(error);
        // If it's an auth error, logout the user
        if (message.includes('Authentication') || message.includes('401') || message.includes('403')) {
            logout();
        }
        return message;
    }, [logout]);

    return {
        getToken,
        getUser,
        isAuthenticated,
        logout,
        handleAuthError,
    };
};

