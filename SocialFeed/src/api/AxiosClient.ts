import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, STORAGE_KEYS, ROUTES } from '../config/constants';
import { isAuthError } from '../utils/errorHandler';

const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 seconds timeout
});

// Request interceptor: Automatically add the Token to every request
axiosClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor: Handle authentication errors globally
axiosClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        // If it's an auth error, clear storage and redirect to login
        if (isAuthError(error)) {
            localStorage.removeItem(STORAGE_KEYS.TOKEN);
            localStorage.removeItem(STORAGE_KEYS.USER);
            // Only redirect if we're not already on login/register page
            if (!window.location.pathname.includes(ROUTES.LOGIN) && !window.location.pathname.includes(ROUTES.REGISTER)) {
                window.location.href = ROUTES.LOGIN;
            }
        }
        return Promise.reject(error);
    }
);

export default axiosClient;