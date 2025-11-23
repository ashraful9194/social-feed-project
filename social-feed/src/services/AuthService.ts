import axiosClient from '../api/AxiosClient';

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
}

export const authService = {
    register: async (data: RegisterRequest) => {
        const response = await axiosClient.post<AuthResponse>('/auth/register', data);
        return response.data;
    },

    login: async (data: LoginRequest) => {
        const response = await axiosClient.post<AuthResponse>('/auth/login', data);
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
};