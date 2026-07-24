import apiClient from './client';
import type {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  AuthRefreshResponse,
  ForgotPasswordData,
  AcceptInvitationData,
  ApiUser,
} from '../types/auth.types';

export const authApi = {
  login: (credentials: LoginCredentials) =>
    apiClient.post<AuthResponse>('/api/auth/login', {
      email: credentials.email,
      password: credentials.password,
    }),

  register: (data: RegisterData) =>
    apiClient.post<AuthResponse>('/api/auth/register', {
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.organizationType,
      phone: data.phone || undefined,
      organizationName: data.organizationName,
      organizationType: data.organizationType,
      organizationEmail: data.organizationEmail,
      organizationCountry: data.organizationCountry || 'Egypt',
    }),

  logout: () => apiClient.post('/api/auth/logout'),

  refreshToken: () =>
    apiClient.post<AuthRefreshResponse>('/api/auth/refresh', {}),

  forgotPassword: (data: ForgotPasswordData) =>
    apiClient.post('/api/auth/forgot-password', data),

  acceptInvitation: (data: AcceptInvitationData) =>
    apiClient.post<AuthResponse>('/api/auth/accept-invitation', data),

  getCurrentUser: () => apiClient.get<ApiUser>('/api/auth/me'),

  getInvitation: (token: string) =>
    apiClient.get<{ email: string; role: string; organizationName: string }>(
      `/api/auth/invitation?token=${token}`,
    ),
};
