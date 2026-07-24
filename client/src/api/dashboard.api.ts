import apiClient from './client';
import type { DashboardStats } from '../types/admin.types';

export const dashboardApi = {
  getStats: () =>
    apiClient.get<DashboardStats>('/api/dashboard/stats'),
};
