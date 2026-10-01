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

    


export default apiClient;