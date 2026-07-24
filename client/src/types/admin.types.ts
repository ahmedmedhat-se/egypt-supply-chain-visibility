export interface AdminDashboardData {
  users: { total: number; active: number };
  organizations: { total: number; active: number };
  shipments: { total: number; byStatus: Array<{ shipment_status: string; _count: number }> };
  alerts: { total: number; critical: number };
}

export interface AdminUser {
  user_id: string;
  user_email: string;
  user_first_name: string;
  user_last_name: string;
  user_role: string;
  user_phone: string | null;
  user_is_active: boolean;
  user_created_at: string;
  user_updated_at: string;
  organization_id: string;
  organization?: {
    organization_id: string;
    organization_name: string;
    organization_type: string;
  };
}

export interface AdminOrganization {
  organization_id: string;
  organization_name: string;
  organization_email: string | null;
  organization_phone: string | null;
  organization_type: string;
  organization_address: string | null;
  organization_country: string | null;
  organization_is_active: boolean;
  organization_created_at: string;
  users: Array<{
    user_id: string;
    user_email: string;
    user_first_name: string;
    user_last_name: string;
    user_role: string;
  }>;
}

export interface AdminShipment {
  shipment_id: string;
  shipment_reference_number: string;
  shipment_status: string;
  shipment_origin_city: string;
  shipment_destination_city: string;
  shipment_created_at: string;
  shipper_organization: { organization_name: string };
  carrier_organization: { organization_name: string };
  current_checkpoint: unknown;
  created_by: { user_email: string; user_first_name: string; user_last_name: string };
}

export interface AuditLogEntry {
  audit_log_id: string;
  audit_action: string;
  audit_resource_type: string;
  audit_resource_id: string | null;
  audit_old_value: unknown;
  audit_new_value: unknown;
  audit_metadata: unknown;
  audit_performed_at: string;
  user: {
    user_id: string;
    user_email: string;
    user_first_name: string;
    user_last_name: string;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: { page: number; limit: number; total: number; pages: number };
}

export interface BulkActionData {
  action: string;
  resourceType: string;
  ids: string[];
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalOrganizations: number;
  activeOrganizations: number;
  totalShipments: number;
  activeShipments: number;
  deliveredShipments: number;
  delayedShipments: number;
  cancelledShipments: number;
  pendingShipments: number;
  totalAlerts: number;
  criticalAlerts: number;
  shipmentsByStatus: Record<string, number>;
  usersByRole: Record<string, number>;
}
