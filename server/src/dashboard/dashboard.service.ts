import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardStatsDto } from './dto/dashboard.dto';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns dashboard statistics.
   *
   * - **super_admin**: Platform-wide stats (all users, all orgs, all shipments).
   * - **admin / shipper / carrier / regulator**: Stats scoped to their own
   *   organization. Shipments are counted if the org appears as either the
   *   shipper **or** the carrier.
   */
  async getStats(role: string, organizationId: string): Promise<DashboardStatsDto> {
    const isSuperAdmin = role === 'super_admin';

    const orgFilter = isSuperAdmin
      ? undefined
      : { organization_id: organizationId };

    const shipmentOrgFilter = isSuperAdmin
      ? undefined
      : {
          OR: [
            { shipper_organization_id: organizationId },
            { carrier_organization_id: organizationId },
          ],
        };

    const [
      totalUsers,
      activeUsers,
      totalOrganizations,
      activeOrganizations,
      totalShipments,
      shipmentsByStatus,
      usersByRole,
      totalAlerts,
      criticalAlerts,
    ] = await Promise.all([
      // Users (org-scoped for non-super_admin, platform-wide for super_admin)
      isSuperAdmin
        ? this.prisma.user.count()
        : this.prisma.user.count({ where: orgFilter }),

      isSuperAdmin
        ? this.prisma.user.count({ where: { user_is_active: true } })
        : this.prisma.user.count({
            where: { ...orgFilter, user_is_active: true },
          }),

      // Organizations (only shown for super_admin; 1 for org-scoped)
      isSuperAdmin
        ? this.prisma.organization.count()
        : Promise.resolve(1),

      isSuperAdmin
        ? this.prisma.organization.count({ where: { organization_is_active: true } })
        : Promise.resolve(1),

      // Shipments (org-scoped if applicable)
      isSuperAdmin
        ? this.prisma.shipment.count()
        : this.prisma.shipment.count({ where: shipmentOrgFilter }),

      // Shipments by status
      isSuperAdmin
        ? this.prisma.shipment.groupBy({
            by: ['shipment_status'],
            _count: true,
          })
        : this.prisma.shipment.groupBy({
            by: ['shipment_status'],
            where: shipmentOrgFilter,
            _count: true,
          }),

      // Users by role
      isSuperAdmin
        ? this.prisma.user.groupBy({
            by: ['user_role'],
            _count: true,
          })
        : this.prisma.user.groupBy({
            by: ['user_role'],
            where: orgFilter,
            _count: true,
          }),

      // Alerts (scoped to org's shipments)
      isSuperAdmin
        ? this.prisma.alert.count()
        : this.prisma.alert.count({
            where: {
              shipment: shipmentOrgFilter,
            },
          }),

      // Critical unresolved alerts
      isSuperAdmin
        ? this.prisma.alert.count({
            where: {
              alert_is_resolved: false,
              alert_severity: 'critical',
            },
          })
        : this.prisma.alert.count({
            where: {
              alert_is_resolved: false,
              alert_severity: 'critical',
              shipment: shipmentOrgFilter,
            },
          }),
    ]);

    // Build status map with all possible statuses accounted for
    const statusMap: Record<string, number> = {};
    for (const group of shipmentsByStatus) {
      statusMap[group.shipment_status] = group._count;
    }

    const activeStatuses = [
      'pending',
      'confirmed',
      'in_transit',
      'at_checkpoint',
      'customs_hold',
      'customs_cleared',
      'out_for_delivery',
    ];
    const activeShipments = activeStatuses.reduce(
      (sum, s) => sum + (statusMap[s] || 0),
      0,
    );

    // Build role map
    const roleMap: Record<string, number> = {};
    for (const group of usersByRole) {
      roleMap[group.user_role] = group._count;
    }

    return {
      totalUsers,
      activeUsers,
      totalOrganizations,
      activeOrganizations,
      totalShipments,
      activeShipments,
      deliveredShipments: statusMap['delivered'] || 0,
      delayedShipments: statusMap['delayed'] || 0,
      cancelledShipments: statusMap['cancelled'] || 0,
      pendingShipments: statusMap['pending'] || 0,
      totalAlerts,
      criticalAlerts,
      shipmentsByStatus: statusMap,
      usersByRole: roleMap,
    };
  }
}
