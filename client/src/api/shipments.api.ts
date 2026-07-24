import apiClient from './client';
import type {
  Shipment,
  CreateShipmentData,
  UpdateShipmentData,
  UpdateShipmentStatusData,
  ShipmentQueryParams,
} from '../types/shipment.types';

export const shipmentsApi = {
  getAll: (params?: ShipmentQueryParams) =>
    apiClient.get<{ data: Shipment[]; meta: { total: number } }>('/api/shipments', { params }),

  getById: (id: string) =>
    apiClient.get<Shipment>(`/api/shipments/${id}`),

  create: (data: CreateShipmentData) =>
    apiClient.post<Shipment>('/api/shipments', data),

  update: (id: string, data: UpdateShipmentData) =>
    apiClient.put<Shipment>(`/api/shipments/${id}`, data),

  updateStatus: (id: string, data: UpdateShipmentStatusData) =>
    apiClient.patch<Shipment>(`/api/shipments/${id}/status`, data),

  remove: (id: string) =>
    apiClient.delete(`/api/shipments/${id}`),
};
