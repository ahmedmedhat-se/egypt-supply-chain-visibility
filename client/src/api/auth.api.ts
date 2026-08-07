import apiClient from "./client";
import type {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  AuthRefreshResponse,
  ForgotPasswordData,
  AcceptInvitationData,
  ApiUser,
} from "../types/auth.types";
import type { PaginatedResponse } from "../types/pagination.types";
import type { AuthSession } from "../types/session.types";

export const authApi = {
  login: (credentials: LoginCredentials) =>
    apiClient.post<AuthResponse>("/api/auth/login", {
      email: credentials.email,
      password: credentials.password,
    }),

  register: (data: RegisterData) =>
    apiClient.post<AuthResponse>("/api/auth/register", {
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.organizationType,
      phone: data.phone || undefined,
      organizationName: data.organizationName,
      organizationType: data.organizationType,
      organizationEmail: data.organizationEmail,
      organizationCountry: data.organizationCountry || "Egypt",
    }),

  logout: () => apiClient.post("/api/auth/logout"),

  refreshToken: () =>
    apiClient.post<AuthRefreshResponse>("/api/auth/refresh", {}),

  forgotPassword: (data: ForgotPasswordData) =>
    apiClient.post("/api/auth/forgot-password", data),

  acceptInvitation: (data: AcceptInvitationData) =>
    apiClient.post<AuthResponse>("/api/auth/accept-invitation", data),

  getCurrentUser: () => apiClient.get<ApiUser>("/api/auth/me"),

  updateProfile: (data: { firstName?: string; lastName?: string; phoneNumber?: string }) =>
    apiClient.patch<ApiUser>("/api/auth/me", data),

  updatePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient.patch<{ message: string }>("/api/auth/me/password", data),

  /** List active sessions for the current user (paginated) */
  getSessions: (params?: { page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<AuthSession>>("/api/auth/sessions", {
      params,
    }),

  /** Revoke a single session (e.g. a lost device) */
  revokeSession: (sessionId: string) =>
    apiClient.delete(`/api/auth/sessions/${sessionId}`),

  /** Revoke every session except the current one */
  revokeAllSessions: () => apiClient.delete("/api/auth/sessions"),

  getInvitation: (token: string) =>
    apiClient.get<{ email: string; role: string; organizationName: string }>(
      `/api/auth/invitation?token=${token}`,
    ),
};
