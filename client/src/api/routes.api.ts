import apiClient from "./client";
import type {
  Route,
  CreateRouteData,
  UpdateRouteData,
  AddRouteCheckpointData,
} from "../types/route.types";
import type { PaginatedResponse } from "../types/pagination.types";

export const routesApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }) => apiClient.get<PaginatedResponse<Route>>("/api/routes", { params }),

  getById: (id: string) => apiClient.get<Route>(`/api/routes/${id}`),

  create: (data: CreateRouteData) => apiClient.post<Route>("/api/routes", data),

  update: (id: string, data: UpdateRouteData) =>
    apiClient.put<Route>(`/api/routes/${id}`, data),

  remove: (id: string) => apiClient.delete(`/api/routes/${id}`),

  addCheckpoint: (routeId: string, data: AddRouteCheckpointData) =>
    apiClient.post(`/api/routes/${routeId}/checkpoints`, data),

  removeCheckpoint: (routeId: string, checkpointId: string) =>
    apiClient.delete(`/api/routes/${routeId}/checkpoints/${checkpointId}`),

  activate: (id: string) =>
    apiClient.patch<Route>(`/api/routes/${id}/activate`),

  deactivate: (id: string) =>
    apiClient.patch<Route>(`/api/routes/${id}/deactivate`),
};
