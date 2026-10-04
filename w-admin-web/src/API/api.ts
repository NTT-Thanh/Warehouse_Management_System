import axios from 'axios';

// 1. Khởi tạo cấu hình axios chung cho toàn bộ ứng dụng web admin
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? `http://${window.location.hostname}:3000/api`;

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 2. Định nghĩa các hàm gọi API thông qua apiClient vừa tạo
export const apiService = {
    searchInventoryByItem: async (keyword: string) => {
        const response = await apiClient.get(`/inventory/search-by-item?keyword=${encodeURIComponent(keyword)}`);
        return response.data; // Trả về { success: true, data: [...] }
    },

    searchInventoryByLoc: async (locationCode: string) => {
        const response = await apiClient.get(`/inventory/search-by-loc?code=${encodeURIComponent(locationCode)}`);
        return response.data; // Trả về { success: true, data: [...] }
    }
};
export type UserPayload = {
    username: string;
    password?: string;
    full_name: string;
    role: 'admin' | 'staff' | 'manager';
};

export type SignedInUser = {
    id: number;
    username: string;
    full_name: string | null;
    role: UserPayload['role'];
};

export const authService = {
    login: async (username: string, password: string): Promise<SignedInUser> => {
        const response = await apiClient.post('/users/login', { username, password });
        return response.data.user;
    },
};

export const userService = {
    getAllUsers: async (): Promise<{
        id: number;
        username: string;
        full_name: string;
        role: UserPayload['role'];
        created_at: string;
    }[]> => {
        const res = await apiClient.get('/users');
        return res.data;
    },
    createUser: async (data: UserPayload) => {
        const res = await apiClient.post('/users', data);
        return res.data;
    },
    updateUser: async (id: number, data: UserPayload) => {
        const res = await apiClient.put(`/users/${id}`, data);
        return res.data;
    },
    deleteUser: async (id: number) => {
        const res = await apiClient.delete(`/users/${id}`);
        return res.data;
    }
};
    


export default apiClient;