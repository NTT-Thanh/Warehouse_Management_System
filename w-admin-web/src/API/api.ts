import axios from 'axios';

// 1. Khởi tạo cấu hình axios chung cho toàn bộ ứng dụng web admin
const API_BASE_URL = 'http://localhost:3000/api'; // Thay đổi port nếu backend của bạn chạy cổng khác

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
// Thêm các hàm gọi API users vào file api.ts của bạn
export const userService = {
    getAllUsers: async () => {
        const res = await apiClient.get('/users');
        return res.data;
    },
    createUser: async (data: any) => {
        const res = await apiClient.post('/users', data);
        return res.data;
    },
    updateUser: async (id: number, data: any) => {
        const res = await apiClient.put(`/users/${id}`, data);
        return res.data;
    },
    deleteUser: async (id: number) => {
        const res = await apiClient.delete(`/users/${id}`);
        return res.data;
    }
};
    


export default apiClient;