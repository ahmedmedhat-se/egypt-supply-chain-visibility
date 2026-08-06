import apiClient from "./client";
import type {
  Checkpoint,
  CreateCheckpointData,
  UpdateCheckpointData,
} from "../types/checkpoint.types";
import type { PaginatedResponse } from "../types/pagination.types";

export const checkpointsApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) =>
    apiClient.get<PaginatedResponse<Checkpoint>>("/api/checkpoints", {
      params,
    }),

  getById: (id: string) => apiClient.get<Checkpoint>(`/api/checkpoints/${id}`),

  create: (data: CreateCheckpointData) =>
    apiClient.post<Checkpoint>("/api/checkpoints", data),

  update: (id: string, data: UpdateCheckpointData) =>
    apiClient.put<Checkpoint>(`/api/checkpoints/${id}`, data),

  remove: (id: string) => apiClient.delete(`/api/checkpoints/${id}`),

  activate: (id: string) =>
    apiClient.patch<Checkpoint>(`/api/checkpoints/${id}/activate`),

  deactivate: (id: string) =>
    apiClient.patch<Checkpoint>(`/api/checkpoints/${id}/deactivate`),
};
