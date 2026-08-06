import api from "./client";
import type { PaginatedResponse } from "../types/pagination.types";

export interface Alert {
  alert_id: string;
  alert_type: string;
  alert_severity: string;
  alert_title: string;
  alert_message: string;
  shipment_id: string | null;
  alert_created_at: string;
  shipment?: {
    shipment_reference_number: string;
    shipment_status: string;
  };
}

export interface UserAlert {
  user_alert_id: string;
  is_read: boolean;
  notified_at: string;
  read_at: string | null;
  alert: Alert;
}

export interface AlertsQueryParams {
  page?: number;
  limit?: number;
  isRead?: string;
  severity?: string;
  search?: string;
}

export const alertsApi = {
  getAlerts: async (params?: AlertsQueryParams) => {
    return api.get<PaginatedResponse<UserAlert>>("/api/alerts", { params });
  },

  getUnreadCount: async () => {
    return api.get<{ count: number }>("/api/alerts/unread-count");
  },

  markAsRead: async (id: string) => {
    return api.patch(`/api/alerts/${id}/read`);
  },

  markAllAsRead: async () => {
    return api.patch<{ count: number }>("/api/alerts/read-all");
  },
};
