import axios from 'axios';
// Ví dụ: Lấy IP bằng lệnh `ipconfig` (Windows) hoặc `ifconfig` (Mac/Linux)
const BASE_URL = 'http://192.168.1.17:3000/api'; 

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // Thời gian chờ request tối đa (10 giây)
  headers: {
    'Content-Type': 'application/json',
  },
});

// (Tùy chọn nâng cao) Interceptor để tự động đính kèm Token đăng nhập vào Header nếu có
apiClient.interceptors.request.use(
  async (config) => {
    // Nếu bạn lưu JWT Token ở AsyncStorage, có thể lấy ra gắn vào đây
    // const token = await AsyncStorage.getItem('user_token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;