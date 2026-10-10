import apiClient from '../api';
import type { AuthUser } from '../auth/AuthContext';

type LoginResponse = {
  user: AuthUser;
};

export async function loginUser(username: string, password: string) {
  const response = await apiClient.post<LoginResponse>('/users/login', {
    username,
    password,
  });

  return response.data.user;
}