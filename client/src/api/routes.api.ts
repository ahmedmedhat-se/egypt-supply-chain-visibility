import apiClient from './client';
import type {
  Route,
  CreateRouteData,
  UpdateRouteData,
  AddRouteCheckpointData,
} from '../types/route.types';

export const routesApi = {
  getAll: (params?: { isActive?: boolean }) =>
    apiClient.get<{ data: Route[]; meta: { total: number } }>('/api/routes', { params }),

  getById: (id: string) =>
    apiClient.get<Route>(`/api/routes/${id}`),

  create: (data: CreateRouteData) =>
    apiClient.post<Route>('/api/routes', data),

  update: (id: string, data: UpdateRouteData) =>
    apiClient.put<Route>(`/api/routes/${id}`, data),

  remove: (id: string) =>
    apiClient.delete(`/api/routes/${id}`),

  addCheckpoint: (routeId: string, data: AddRouteCheckpointData) =>
    apiClient.post(`/api/routes/${routeId}/checkpoints`, data),

  removeCheckpoint: (routeId: string, checkpointId: string) =>
    apiClient.delete(`/api/routes/${routeId}/checkpoints/${checkpointId}`),
};
