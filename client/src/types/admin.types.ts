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

export interface AuditLog {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  userId: string;
  userName: string;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  createdAt: string;
}

export interface BulkActionData {
  action: string;
  shipmentIds: string[];
  status?: string;
}
