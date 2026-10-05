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

export type Shipping = {
    id: number;
    name: string;
    phone: string | null;
    contact_person: string | null;
    created_at: string;
};

export type ShippingPayload = {
    name: string;
    phone: string | null;
    contact_person: string | null;
};

export const shippingService = {
    getAll: async (): Promise<Shipping[]> => {
        const response = await apiClient.get<Shipping[]>('/shippings');
        return response.data;
    },
    search: async (keyword: string): Promise<Shipping[]> => {
        const response = await apiClient.get<Shipping[]>('/shippings/search', { params: { keyword } });
        return response.data;
    },
    create: async (payload: ShippingPayload) => {
        const response = await apiClient.post<{ id: number }>('/shippings', payload);
        return response.data;
    },
    update: async (id: number, payload: ShippingPayload) => {
        const response = await apiClient.put(`/shippings/${id}`, payload);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await apiClient.delete(`/shippings/${id}`);
        return response.data;
    },
};

export type Supplier = {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    created_at: string;
};

export type SupplierPayload = {
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
};

export const supplierService = {
    getAll: async (): Promise<Supplier[]> => {
        const response = await apiClient.get<Supplier[]>('/suppliers');
        return response.data;
    },
    search: async (keyword: string): Promise<Supplier[]> => {
        const response = await apiClient.get<Supplier[]>('/suppliers/search', { params: { keyword } });
        return response.data;
    },
    create: async (payload: SupplierPayload) => {
        const response = await apiClient.post<{ id: number }>('/suppliers', payload);
        return response.data;
    },
    update: async (id: number, payload: SupplierPayload) => {
        const response = await apiClient.put(`/suppliers/${id}`, payload);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await apiClient.delete(`/suppliers/${id}`);
        return response.data;
    },
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

export type ApiRecord = Record<string, string | number | null>;
export type ApiResource =
    | 'products'
    | 'locations'
    | 'inbound_receipts'
    | 'inbound_details'
    | 'outbound_orders'
    | 'outbound_details'
    | 'picking_tasks'
    | 'inventory'
    | 'categories'
    | 'bins'
    | 'suppliers'
    | 'shippings'
    | 'batches'
    | 'users';

export const dataService = {
    getAll: async <T,>(resource: ApiResource): Promise<T[]> => {
        const response = await apiClient.get<T[]>(`/${resource}`);
        return response.data;
    },
    create: async (resource: ApiResource, data: ApiRecord) => {
        const response = await apiClient.post<{ id: number }>(`/${resource}`, data);
        return response.data;
    },
    update: async (resource: ApiResource, id: number, data: ApiRecord) => {
        const response = await apiClient.put(`/${resource}/${id}`, data);
        return response.data;
    },
    delete: async (resource: ApiResource, id: number) => {
        const response = await apiClient.delete(`/${resource}/${id}`);
        return response.data;
    },
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