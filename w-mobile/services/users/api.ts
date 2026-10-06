import apiClient from '../api';
import type { AuthUser } from '../auth/AuthContext';

type LoginResponse = {
  success: boolean;
  message?: string;
  data: AuthUser;
};

export async function loginUser(username: string, password: string) {
  const response = await apiClient.post<LoginResponse>('/users/login', {
    username,
    password,
  });

  if (!response.data.success) {
    throw new Error(response.data.message || 'Đăng nhập thất bại.');
  }

  return response.data.data;
}