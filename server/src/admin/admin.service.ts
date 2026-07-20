import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  AdminUpdateUserDto, 
  AdminUpdateOrganizationDto,
  AdminQueryUsersDto,
  AdminQueryOrganizationsDto,
  AdminQueryShipmentsDto,
  AdminBulkActionDto 
} from './dto/admin.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDashboardOverview(adminUser: any) {
    const [
      totalUsers,
      activeUsers,
      totalOrgs,
      activeOrgs,
      totalShipments,
      shipmentsByStatus,
      alertsTotal,
      alertsCritical,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { user_is_active: true } }),
      this.prisma.organization.count(),
      this.prisma.organization.count({ where: { organization_is_active: true } }),
      this.prisma.shipment.count(),
      this.prisma.shipment.groupBy({
        by: ['shipment_status'],
        _count: true,
      }),
      this.prisma.alert.count(),
      this.prisma.alert.count({ where: { alert_severity: 'critical', alert_is_resolved: false } }),
    ]);

    return {
      success: true,
      data: {
        users: { total: totalUsers, active: activeUsers },
        organizations: { total: totalOrgs, active: activeOrgs },
        shipments: { total: totalShipments, byStatus: shipmentsByStatus },
        alerts: { total: alertsTotal, critical: alertsCritical },
      },
    };
  }

  async listUsers(query: AdminQueryUsersDto) {
    const { page = 1, limit = 20, search, role, isActive, organizationId } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { user_email: { contains: search, mode: 'insensitive' } },
        { user_first_name: { contains: search, mode: 'insensitive' } },
        { user_last_name: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) where.user_role = role;
    if (isActive !== undefined) where.user_is_active = isActive;
    if (organizationId) where.organization_id = organizationId;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { user_created_at: 'desc' },
        include: {
          organization: {
            select: {
              organization_id: true,
              organization_name: true,
              organization_type: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      success: true,
      data: users,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { user_id: id },
      include: {
        organization: true,
        created_shipments: {
          select: { shipment_id: true, shipment_reference_number: true, shipment_status: true },
          take: 10,
        },
        audit_logs: {
          select: { audit_action: true, audit_performed_at: true },
          take: 20,
          orderBy: { audit_performed_at: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return { success: true, data: user };
  }

  async updateUser(id: string, dto: AdminUpdateUserDto, adminUser: any) {
    const user = await this.prisma.user.findUnique({ where: { user_id: id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.user_id === adminUser.user_id) {
      throw new ForbiddenException('Cannot modify your own account through admin panel');
    }

    const updateData: any = {};
    if (dto.user_first_name) updateData.user_first_name = dto.user_first_name;
    if (dto.user_last_name) updateData.user_last_name = dto.user_last_name;
    if (dto.user_phone !== undefined) updateData.user_phone = dto.user_phone;
    if (dto.user_role) updateData.user_role = dto.user_role;
    if (dto.organization_id) {
      const org = await this.prisma.organization.findUnique({
        where: { organization_id: dto.organization_id },
      });
      if (!org) throw new NotFoundException('Organization not found');
      updateData.organization_id = dto.organization_id;
    }
    if (dto.user_password) {
      updateData.user_password_hash = await bcrypt.hash(dto.user_password, 12);
    }

    const updated = await this.prisma.user.update({
      where: { user_id: id },
      data: updateData,
      include: { organization: true },
    });

    await this.logAdminAction(adminUser, 'UPDATE_USER', 'user', id, user, updated);

    return { success: true, data: updated };
  }

  async deactivateUser(id: string, adminUser: any) {
    const user = await this.prisma.user.findUnique({ where: { user_id: id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.user_id === adminUser.user_id) {
      throw new ForbiddenException('Cannot deactivate your own account');
    }

    const updated = await this.prisma.user.update({
      where: { user_id: id },
      data: { user_is_active: false },
    });

    await this.logAdminAction(adminUser, 'DEACTIVATE_USER', 'user', id, user, updated);
    return { success: true, message: 'User deactivated successfully' };
  }

  async activateUser(id: string, adminUser: any) {
    const user = await this.prisma.user.findUnique({ where: { user_id: id } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { user_id: id },
      data: { user_is_active: true },
    });

    await this.logAdminAction(adminUser, 'ACTIVATE_USER', 'user', id, user, updated);
    return { success: true, message: 'User activated successfully' };
  }

  async deleteUser(id: string, adminUser: any) {
    const user = await this.prisma.user.findUnique({ where: { user_id: id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.user_id === adminUser.user_id) {
      throw new ForbiddenException('Cannot delete your own account');
    }
    if (user.user_role === 'admin') {
      const adminCount = await this.prisma.user.count({ 
        where: { user_role: 'admin', organization_id: user.organization_id } 
      });
      if (adminCount <= 1) {
        throw new ForbiddenException('Cannot delete the last admin user of this organization');
      }
    }

    await this.prisma.user.delete({ where: { user_id: id } });
    await this.logAdminAction(adminUser, 'DELETE_USER', 'user', id, user, null);
    return { success: true, message: 'User deleted successfully' };
  }

  async listOrganizations(query: AdminQueryOrganizationsDto) {
    const { page = 1, limit = 20, search, type, isActive } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { organization_name: { contains: search, mode: 'insensitive' } },
        { organization_email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (type) where.organization_type = type;
    if (isActive !== undefined) where.organization_is_active = isActive;

    const [orgs, total] = await Promise.all([
      this.prisma.organization.findMany({
        where,
        skip,
        take: limit,
        orderBy: { organization_created_at: 'desc' },
        include: {
          users: {
            select: {
              user_id: true,
              user_email: true,
              user_first_name: true,
              user_last_name: true,
              user_role: true,
            },
          },
        },
      }),
      this.prisma.organization.count({ where }),
    ]);

    return {
      success: true,
      data: orgs,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async getOrganization(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { organization_id: id },
      include: {
        users: true,
        shipper_shipments: {
          select: { shipment_id: true, shipment_reference_number: true, shipment_status: true },
          take: 10,
        },
        carrier_shipments: {
          select: { shipment_id: true, shipment_reference_number: true, shipment_status: true },
          take: 10,
        },
      },
    });

    if (!org) throw new NotFoundException('Organization not found');
    return { success: true, data: org };
  }

  async updateOrganization(id: string, dto: AdminUpdateOrganizationDto, adminUser: any) {
    const org = await this.prisma.organization.findUnique({ where: { organization_id: id } });
    if (!org) throw new NotFoundException('Organization not found');

    const updateData: any = {};
    if (dto.organization_name) updateData.organization_name = dto.organization_name;
    if (dto.organization_type) updateData.organization_type = dto.organization_type;
    if (dto.organization_phone !== undefined) updateData.organization_phone = dto.organization_phone;
    if (dto.organization_address !== undefined) updateData.organization_address = dto.organization_address;
    if (dto.organization_country) updateData.organization_country = dto.organization_country;

    const updated = await this.prisma.organization.update({
      where: { organization_id: id },
      data: updateData,
      include: { users: true },
    });

    await this.logAdminAction(adminUser, 'UPDATE_ORGANIZATION', 'organization', id, org, updated);
    return { success: true, data: updated };
  }

  async deactivateOrganization(id: string, adminUser: any) {
    const org = await this.prisma.organization.findUnique({ where: { organization_id: id } });
    if (!org) throw new NotFoundException('Organization not found');

    const updated = await this.prisma.organization.update({
      where: { organization_id: id },
      data: { organization_is_active: false },
    });

    await this.prisma.user.updateMany({
      where: { organization_id: id },
      data: { user_is_active: false },
    });

    await this.logAdminAction(adminUser, 'DEACTIVATE_ORGANIZATION', 'organization', id, org, updated);
    return { success: true, message: 'Organization deactivated successfully' };
  }

  async listShipments(query: AdminQueryShipmentsDto) {
    const { page = 1, limit = 20, status, originCity, destinationCity, shipperId, carrierId } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.shipment_status = status;
    if (originCity) where.shipment_origin_city = { contains: originCity, mode: 'insensitive' };
    if (destinationCity) where.shipment_destination_city = { contains: destinationCity, mode: 'insensitive' };
    if (shipperId) where.shipper_organization_id = shipperId;
    if (carrierId) where.carrier_organization_id = carrierId;

    const [shipments, total] = await Promise.all([
      this.prisma.shipment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { shipment_created_at: 'desc' },
        include: {
          shipper_organization: { select: { organization_name: true } },
          carrier_organization: { select: { organization_name: true } },
          current_checkpoint: true,
          created_by: { select: { user_email: true, user_first_name: true, user_last_name: true } },
          events: {
            select: { event_type: true, event_occurred_at: true },
            take: 1,
            orderBy: { event_occurred_at: 'desc' },
          },
        },
      }),
      this.prisma.shipment.count({ where }),
    ]);

    return {
      success: true,
      data: shipments,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async getShipment(id: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { shipment_id: id },
      include: {
        shipper_organization: true,
        carrier_organization: true,
        route: {
          include: {
            route_checkpoints: {
              include: { checkpoint: true },
              orderBy: { sequence_order: 'asc' },
            },
          },
        },
        created_by: true,
        current_checkpoint: true,
        events: {
          include: {
            checkpoint: true,
            recorded_by: { select: { user_email: true, user_first_name: true, user_last_name: true } },
          },
          orderBy: { event_occurred_at: 'desc' },
        },
        alerts: {
          orderBy: { alert_created_at: 'desc' },
        },
      },
    });

    if (!shipment) throw new NotFoundException('Shipment not found');
    return { success: true, data: shipment };
  }

  async updateShipmentStatus(id: string, status: string, adminUser: any) {
    const validStatuses = [
      'draft', 'confirmed', 'picked_up', 'in_transit',
      'at_checkpoint', 'customs_hold', 'customs_cleared',
      'out_for_delivery', 'delivered', 'cancelled', 'delayed'
    ];

    if (!validStatuses.includes(status)) {
      throw new BadRequestException('Invalid shipment status');
    }

    const shipment = await this.prisma.shipment.findUnique({
      where: { shipment_id: id },
      include: { events: { orderBy: { event_occurred_at: 'desc' }, take: 1 } },
    });

    if (!shipment) throw new NotFoundException('Shipment not found');

    const [updated, event] = await this.prisma.$transaction([
      this.prisma.shipment.update({
        where: { shipment_id: id },
        data: { shipment_status: status },
      }),
      this.prisma.shipmentEvent.create({
        data: {
          shipment_id: id,
          recorded_by_user_id: adminUser.user_id,
          event_type: 'status_change',
          event_status: status,
          event_description: `Admin manually updated status to ${status}`,
          event_metadata: { previous_status: shipment.shipment_status, admin_action: true },
        },
      }),
    ]);

    await this.logAdminAction(adminUser, 'UPDATE_SHIPMENT_STATUS', 'shipment', id, shipment, updated);
    return { success: true, data: updated };
  }

  async bulkAction(dto: AdminBulkActionDto, adminUser: any) {
    const { action, resourceType, ids } = dto;

    if (!ids || ids.length === 0) {
      throw new BadRequestException('No IDs provided');
    }

    let result: any;

    switch (`${resourceType}_${action}`) {
      case 'user_deactivate':
        result = await this.prisma.user.updateMany({
          where: { user_id: { in: ids } },
          data: { user_is_active: false },
        });
        break;
      case 'user_activate':
        result = await this.prisma.user.updateMany({
          where: { user_id: { in: ids } },
          data: { user_is_active: true },
        });
        break;
      case 'user_delete':
        result = await this.prisma.user.deleteMany({
          where: { user_id: { in: ids } },
        });
        break;
      case 'shipment_cancel':
        result = await this.prisma.shipment.updateMany({
          where: { shipment_id: { in: ids } },
          data: { shipment_status: 'cancelled' },
        });
        break;
      case 'organization_deactivate':
        result = await this.prisma.organization.updateMany({
          where: { organization_id: { in: ids } },
          data: { organization_is_active: false },
        });
        await this.prisma.user.updateMany({
          where: { organization_id: { in: ids } },
          data: { user_is_active: false },
        });
        break;
      default:
        throw new BadRequestException('Invalid bulk action');
    }

    await this.logAdminAction(adminUser, `BULK_${action.toUpperCase()}`, resourceType, null, null, { ids, result });

    return {
      success: true,
      message: `Bulk ${action} completed on ${ids.length} ${resourceType}(s)`,
      result,
    };
  }

  async getAuditLogs(resourceType?: string, resourceId?: string, limit: number = 50) {
    const where: any = {};
    if (resourceType) where.audit_resource_type = resourceType;
    if (resourceId) where.audit_resource_id = resourceId;

    const logs = await this.prisma.auditLog.findMany({
      where,
      take: Math.min(limit, 100),
      orderBy: { audit_performed_at: 'desc' },
      include: {
        user: {
          select: {
            user_id: true,
            user_email: true,
            user_first_name: true,
            user_last_name: true,
          },
        },
      },
    });

    return { success: true, data: logs };
  }

  private async logAdminAction(
    adminUser: any,
    action: string,
    resourceType: string,
    resourceId: string | null,
    oldValue: any | null,
    newValue: any | null,
  ) {
    await this.prisma.auditLog.create({
      data: {
        user_id: adminUser.user_id,
        audit_action: action,
        audit_resource_type: resourceType,
        audit_resource_id: resourceId,
        audit_old_value: oldValue,
        audit_new_value: newValue,
        audit_metadata: { admin_action: true, admin_email: adminUser.user_email },
      },
    });
  }
}