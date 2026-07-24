import apiClient from './client';
import type {
  AdminDashboardData,
  AdminUser,
  AdminOrganization,
  AuditLogEntry,
  PaginatedResponse,
  BulkActionData,
} from '../types/admin.types';

export const adminApi = {
  getDashboard: () =>
    apiClient.get<{ success: boolean; data: AdminDashboardData }>('/api/admin/dashboard'),

  getUsers: (params?: { page?: number; limit?: number; search?: string; role?: string; isActive?: boolean }) =>
    apiClient.get<PaginatedResponse<AdminUser>>('/api/admin/users', { params }),

  getUser: (id: string) =>
    apiClient.get<{ success: boolean; data: AdminUser }>(`/api/admin/users/${id}`),

  updateUser: (id: string, data: Record<string, unknown>) =>
    apiClient.patch<{ success: boolean; data: AdminUser }>(`/api/admin/users/${id}`, data),

  deactivateUser: (id: string) =>
    apiClient.patch<{ success: boolean; message: string }>(`/api/admin/users/${id}/deactivate`),

  activateUser: (id: string) =>
    apiClient.patch<{ success: boolean; message: string }>(`/api/admin/users/${id}/activate`),

  deleteUser: (id: string) =>
    apiClient.delete<{ success: boolean; message: string }>(`/api/admin/users/${id}`),

  getOrganizations: (params?: { page?: number; limit?: number; search?: string; type?: string; isActive?: boolean }) =>
    apiClient.get<PaginatedResponse<AdminOrganization>>('/api/admin/organizations', { params }),

  getOrganization: (id: string) =>
    apiClient.get<{ success: boolean; data: AdminOrganization }>(`/api/admin/organizations/${id}`),

  updateOrganization: (id: string, data: Record<string, unknown>) =>
    apiClient.patch<{ success: boolean; data: AdminOrganization }>(`/api/admin/organizations/${id}`, data),

  deactivateOrganization: (id: string) =>
    apiClient.patch<{ success: boolean; message: string }>(`/api/admin/organizations/${id}/deactivate`),

  getAuditLogs: (params?: { resourceType?: string; resourceId?: string; limit?: number }) =>
    apiClient.get<{ success: boolean; data: AuditLogEntry[] }>('/api/admin/audit-logs', { params }),

  bulkAction: (data: BulkActionData) =>
    apiClient.post<{ success: boolean; message: string }>('/api/admin/bulk-action', data),
};
