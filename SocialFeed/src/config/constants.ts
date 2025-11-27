/**
 * Application-wide constants
 */

export const API_BASE_URL = 'https://social-feed-api-410016778898.us-central1.run.app/api'; // for development make it http://localhost:5287/api

export const STORAGE_KEYS = {
    TOKEN: 'token',
    USER: 'user',
} as const;

export const ROUTES = {
    LOGIN: '/login',
    REGISTER: '/register',
    FEED: '/feed',
    ROOT: '/',
} as const;

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

export const DEFAULT_AVATAR = '/assets/images/Avatar.png';

export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 20,
} as const;

