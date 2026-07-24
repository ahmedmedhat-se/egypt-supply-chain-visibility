export class DashboardStatsDto {
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
