import axiosClient from '../api/AxiosClient';
import { STORAGE_KEYS } from '../config/constants';

// Types matching your Backend DTOs
export interface RegisterRequest {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    email: string;
    fullName: string;
    profileImageUrl?: string | null;
}

export const authService = {
    register: async (data: RegisterRequest): Promise<AuthResponse> => {
        const response = await axiosClient.post<AuthResponse>('/auth/register', data);
        return response.data;
    },

    login: async (data: LoginRequest): Promise<AuthResponse> => {
        const response = await axiosClient.post<AuthResponse>('/auth/login', data);
        return response.data;
    },

    logout: (): void => {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
    },
};