import apiClient from './client';
import type { 
  LoginCredentials, 
  RegisterData, 
  AuthResponse,
  ForgotPasswordData,
  ResetPasswordData 
} from '../types/auth.types';

export const authApi = {
  login: (credentials: LoginCredentials) => 
    apiClient.post<AuthResponse>('/auth/login', credentials),

  register: (data: RegisterData) => 
    apiClient.post<AuthResponse>('/auth/register', data),

  logout: () => 
    apiClient.post('/auth/logout'),

  refreshToken: (refreshToken: string) => 
    apiClient.post<{ accessToken: string }>('/auth/refresh', { refreshToken }),

  forgotPassword: (data: ForgotPasswordData) => 
    apiClient.post('/auth/forgot-password', data),

  resetPassword: (data: ResetPasswordData) => 
    apiClient.post('/auth/reset-password', data),

  verifyEmail: (token: string) => 
    apiClient.get(`/auth/verify-email/${token}`),

  getCurrentUser: () => 
    apiClient.get<AuthResponse['user']>('/auth/me'),
};