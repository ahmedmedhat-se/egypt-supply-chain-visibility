import apiClient from './client';
import type { DashboardStats, AuditLog, BulkActionData } from '../types/admin.types';
import type { Shipment, ShipmentStatus } from '../types/shipment.types';
import type { User } from '../store/auth.store';
import type { Organization } from '../types/organization.types';

export const adminApi = {
  getDashboard: () =>
    apiClient.get<DashboardStats>('/api/admin/dashboard'),

  getUsers: (params?: { page?: number; limit?: number; search?: string; role?: string }) =>
    apiClient.get<{ data: User[]; meta: { total: number } }>('/api/admin/users', { params }),

  getUser: (id: string) =>
    apiClient.get<User>(`/api/admin/users/${id}`),

  updateUser: (id: string, data: Partial<User>) =>
    apiClient.patch<User>(`/api/admin/users/${id}`, data),

  deactivateUser: (id: string) =>
    apiClient.patch(`/api/admin/users/${id}/deactivate`),

  activateUser: (id: string) =>
    apiClient.patch(`/api/admin/users/${id}/activate`),

  deleteUser: (id: string) =>
    apiClient.delete(`/api/admin/users/${id}`),

  getOrganizations: (params?: { page?: number; limit?: number; search?: string }) =>
    apiClient.get<{ data: Organization[]; meta: { total: number } }>('/api/admin/organizations', { params }),

  getOrganization: (id: string) =>
    apiClient.get<Organization>(`/api/admin/organizations/${id}`),

  updateOrganization: (id: string, data: Partial<Organization>) =>
    apiClient.patch<Organization>(`/api/admin/organizations/${id}`, data),

  deactivateOrganization: (id: string) =>
    apiClient.patch(`/api/admin/organizations/${id}/deactivate`),

  getShipments: (params?: { page?: number; limit?: number; status?: ShipmentStatus }) =>
    apiClient.get<{ data: Shipment[]; meta: { total: number } }>('/api/admin/shipments', { params }),

  getShipment: (id: string) =>
    apiClient.get<Shipment>(`/api/admin/shipments/${id}`),

  updateShipmentStatus: (id: string, status: ShipmentStatus) =>
    apiClient.patch(`/api/admin/shipments/${id}/status`, { status }),

  bulkAction: (data: BulkActionData) =>
    apiClient.post('/api/admin/bulk-action', data),

  getAuditLogs: (params?: { resourceType?: string; resourceId?: string; limit?: number }) =>
    apiClient.get<AuditLog[]>('/api/admin/audit-logs', { params }),
};
