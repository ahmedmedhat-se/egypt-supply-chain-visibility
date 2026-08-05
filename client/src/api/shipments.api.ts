import apiClient from "./client";
import type {
  Shipment,
  CreateShipmentData,
  UpdateShipmentData,
  UpdateShipmentStatusData,
  ShipmentQueryParams,
} from "../types/shipment.types";

export interface ShipmentListMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ShipmentListResponse {
  data: Shipment[];
  meta: ShipmentListMeta;
}

export const shipmentsApi = {
  getAll: (params?: ShipmentQueryParams) =>
    apiClient.get<ShipmentListResponse>("/api/shipments", { params }),

  getById: (id: string) => apiClient.get<Shipment>(`/api/shipments/${id}`),

  create: (data: CreateShipmentData) =>
    apiClient.post<Shipment>("/api/shipments", data),

  update: (id: string, data: UpdateShipmentData) =>
    apiClient.put<Shipment>(`/api/shipments/${id}`, data),

  acceptShipment: (id: string) =>
    apiClient.post<Shipment>(`/api/shipments/${id}/accept`),

  assignRoute: (id: string, data: { routeId: string }) =>
    apiClient.patch<Shipment>(`/api/shipments/${id}/route`, data),

  updateStatus: (id: string, data: UpdateShipmentStatusData) =>
    apiClient.patch<Shipment>(`/api/shipments/${id}/status`, data),

  remove: (id: string) => apiClient.delete(`/api/shipments/${id}`),
};
