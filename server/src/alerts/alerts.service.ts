import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryAlertsDto } from './dto/alerts.dto';
import { buildPaginationMeta } from '../common/pagination/pagination.helper';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getUserAlerts(userId: string, query: QueryAlertsDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = { user_id: userId };

    if (query.isRead !== undefined) {
      where.is_read = query.isRead === 'true';
    }

    if (query.severity) {
      where.alert = { alert_severity: query.severity };
    }

    const [userAlerts, total] = await this.prisma.$transaction([
      this.prisma.userAlert.findMany({
        where,
        include: {
          alert: {
            include: {
              shipment: {
                select: {
                  shipment_reference_number: true,
                  shipment_status: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { notified_at: 'desc' },
      }),
      this.prisma.userAlert.count({ where }),
    ]);

    return {
      data: userAlerts,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async markAsRead(userId: string, userAlertId: string) {
    const userAlert = await this.prisma.userAlert.findUnique({
      where: { user_alert_id: userAlertId },
    });

    if (!userAlert || userAlert.user_id !== userId) {
      throw new NotFoundException('Alert not found');
    }

    const updated = await this.prisma.userAlert.update({
      where: { user_alert_id: userAlertId },
      data: { is_read: true, read_at: new Date() },
      include: { alert: true },
    });

    return { success: true, data: updated };
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.userAlert.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true, read_at: new Date() },
    });

    return { success: true, count: result.count };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.userAlert.count({
      where: { user_id: userId, is_read: false },
    });
    return { count };
  }

  // Internal method to create an alert and distribute to users
  async createAlert(params: {
    type: string;
    severity: string;
    title: string;
    message: string;
    shipmentId?: string;
    eventId?: string;
    targetRole?: string;
    targetUserIds?: string[];
    metadata?: any;
  }) {
    const { targetUserIds = [], targetRole } = params;
    
    // Determine who needs to receive this alert
    let userIdsToNotify = [...targetUserIds];

    if (targetRole && params.shipmentId) {
      // Find users related to this shipment by role
      const shipment = await this.prisma.shipment.findUnique({
        where: { shipment_id: params.shipmentId },
        include: {
          shipper_organization: { include: { users: true } },
          carrier_organization: { include: { users: true } },
        },
      });

      if (shipment) {
        if (targetRole === 'shipper' || targetRole === 'admin') {
          userIdsToNotify.push(
            ...shipment.shipper_organization.users.map((u) => u.user_id),
          );
        }
        if (
          (targetRole === 'carrier' || targetRole === 'driver') &&
          shipment.carrier_organization
        ) {
          userIdsToNotify.push(
            ...shipment.carrier_organization.users.map((u) => u.user_id),
          );
        }
      }
    }

    // Deduplicate user IDs
    userIdsToNotify = [...new Set(userIdsToNotify)];

    if (userIdsToNotify.length === 0) {
      this.logger.warn(`No target users found for alert: ${params.title}`);
      return null;
    }

    // Create the central Alert record
    const alert = await this.prisma.alert.create({
      data: {
        alert_type: params.type,
        alert_severity: params.severity,
        alert_title: params.title,
        alert_message: params.message,
        shipment_id: params.shipmentId,
        triggered_by_event_id: params.eventId,
        alert_target_role: params.targetRole,
        alert_metadata: params.metadata,
        user_alerts: {
          create: userIdsToNotify.map((userId) => ({
            user_id: userId,
          })),
        },
      },
      include: { user_alerts: true },
    });

    // TODO: We could publish a WebSocket event here for real-time notification push!

    return alert;
  }
}
