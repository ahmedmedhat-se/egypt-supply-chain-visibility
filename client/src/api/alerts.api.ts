import api from './client';

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

export const alertsApi = {
  getAlerts: async (params?: { page?: number; limit?: number; isRead?: boolean; severity?: string }) => {
    return api.get<{ data: UserAlert[]; meta: any }>('/alerts', { params });
  },

  getUnreadCount: async () => {
    return api.get<{ count: number }>('/alerts/unread-count');
  },

  markAsRead: async (id: string) => {
    return api.patch(`/alerts/${id}/read`);
  },

  markAllAsRead: async () => {
    return api.patch<{ count: number }>('/alerts/read-all');
  },
};
