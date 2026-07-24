import apiClient from './client';
import type {
  Checkpoint,
  CreateCheckpointData,
  UpdateCheckpointData,
} from '../types/checkpoint.types';

export const checkpointsApi = {
  getAll: (params?: { isActive?: boolean }) =>
    apiClient.get<{ data: Checkpoint[]; meta: { total: number } }>('/api/checkpoints', { params }),

  getById: (id: string) =>
    apiClient.get<Checkpoint>(`/api/checkpoints/${id}`),

  create: (data: CreateCheckpointData) =>
    apiClient.post<Checkpoint>('/api/checkpoints', data),

  update: (id: string, data: UpdateCheckpointData) =>
    apiClient.put<Checkpoint>(`/api/checkpoints/${id}`, data),

  remove: (id: string) =>
    apiClient.delete(`/api/checkpoints/${id}`),
};
