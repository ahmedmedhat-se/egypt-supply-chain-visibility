import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { PrismaService } from '../prisma/prisma.service';
import { QueryAlertsDto } from './dto/alerts.dto';
import { buildPaginationMeta } from '../common/pagination/pagination.helper';
import { ALERTS_EXCHANGE } from './alert-events.helper';

const ADMIN_ROLES = ['admin', 'org_admin'];
const OPEN_ALERT_TYPES = ['shipment.delayed', 'shipment.exception'];

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly amqp: AmqpConnection,
  ) {}

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

    if (query.search) {
      const search = query.search.trim();
      if (search) {
        // Combine with any existing alert filter (e.g. severity) as an AND.
        where.alert = {
          ...(where.alert ?? {}),
          OR: [
            { alert_title: { contains: search, mode: 'insensitive' } },
            { alert_message: { contains: search, mode: 'insensitive' } },
            {
              shipment: {
                shipment_reference_number: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            },
          ],
        };
      }
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

  /**
   * Mark an alert as resolved (org-scoped admin, or super_admin). Idempotent —
   * resolving an already-resolved alert is a no-op.
   */
  async resolve(user: { sub: string; role: string }, alertId: string) {
    const alert = await this.prisma.alert.findUnique({
      where: { alert_id: alertId },
      include: {
        shipment: {
          select: {
            shipper_organization_id: true,
            carrier_organization_id: true,
          },
        },
      },
    });

    if (!alert) {
      throw new NotFoundException('Alert not found');
    }

    // Super admins may resolve anything; org admins only alerts tied to their
    // own organization's shipments.
    if (user.role !== 'super_admin') {
      const dbUser = await this.prisma.user.findUnique({
        where: { user_id: user.sub },
        select: { organization_id: true },
      });

      const isInvolvedOrg =
        !!dbUser &&
        !!alert.shipment &&
        (alert.shipment.shipper_organization_id === dbUser.organization_id ||
          alert.shipment.carrier_organization_id === dbUser.organization_id);

      if (!isInvolvedOrg) {
        throw new ForbiddenException(
          'You do not have permission to resolve this alert',
        );
      }
    }

    const updated = await this.prisma.alert.update({
      where: { alert_id: alertId },
      data: { alert_is_resolved: true, alert_resolved_at: new Date() },
    });

    return { success: true, data: updated };
  }

  // Internal method to create an alert and distribute to users
  async createAlert(params: {
    type: string;
    severity: string;
    title: string;
    message: string;
    shipmentId?: string;
    eventId?: string;
    targetSide?: 'shipper' | 'carrier' | 'both';
    targetUserIds?: string[];
    metadata?: any;
  }) {
    const {
      targetUserIds = [],
      targetSide = 'both',
      type,
      severity,
      title,
      message,
      shipmentId,
      eventId,
      metadata,
    } = params;

    // Idempotency guard: never create a second open alert for the same
    // shipment + condition (the 00:00 scanner and realtime checks may both
    // evaluate the same shipment).
    if (shipmentId && OPEN_ALERT_TYPES.includes(type)) {
      const existing = await this.prisma.alert.findFirst({
        where: {
          shipment_id: shipmentId,
          alert_type: type,
          alert_is_resolved: false,
        },
        select: { alert_id: true },
      });
      if (existing) {
        this.logger.debug(
          `Skipping duplicate alert ${type} for shipment ${shipmentId} (open alert ${existing.alert_id} exists)`,
        );
        return null;
      }
    }

    // Recipients = org admins of the involved organization(s) + the user
    // directly involved with the shipment (shipper creator / carrier driver).
    const userIdsToNotify = new Set<string>(targetUserIds);

    let referenceNumber: string | null = null;

    if (shipmentId) {
      const shipment = await this.prisma.shipment.findUnique({
        where: { shipment_id: shipmentId },
        select: {
          shipment_reference_number: true,
          created_by_user_id: true,
          carrier_user_id: true,
          shipper_organization: {
            select: {
              users: {
                select: {
                  user_id: true,
                  user_role: true,
                  user_is_active: true,
                },
              },
            },
          },
          carrier_organization: {
            select: {
              users: {
                select: {
                  user_id: true,
                  user_role: true,
                  user_is_active: true,
                },
              },
            },
          },
        },
      });

      if (shipment) {
        referenceNumber = shipment.shipment_reference_number;

        if (targetSide === 'shipper' || targetSide === 'both') {
          this.collectRecipients(
            userIdsToNotify,
            shipment.shipper_organization.users,
            [shipment.created_by_user_id].filter(Boolean),
          );
        }
        if (targetSide === 'carrier' || targetSide === 'both') {
          this.collectRecipients(
            userIdsToNotify,
            shipment.carrier_organization?.users ?? [],
            [shipment.carrier_user_id].filter(Boolean),
          );
        }
      }
    }

    if (userIdsToNotify.size === 0) {
      this.logger.warn(`No target users found for alert: ${title}`);
      return null;
    }

    // Create the central Alert record
    const alert = await this.prisma.alert.create({
      data: {
        alert_type: type,
        alert_severity: severity,
        alert_title: title,
        alert_message: message,
        shipment_id: shipmentId,
        triggered_by_event_id: eventId,
        alert_target_role: targetSide === 'both' ? 'admin' : targetSide,
        alert_metadata: metadata,
        user_alerts: {
          create: [...userIdsToNotify].map((userId) => ({
            user_id: userId,
          })),
        },
      },
      include: { user_alerts: true },
    });

    // Live push: the websocket consumer turns this into `alert:new` events
    // on each recipient's `user:<id>` room.
    await this.amqp.publish(ALERTS_EXCHANGE, 'alert.created', {
      type: 'alert.created',
      data: {
        userIds: [...userIdsToNotify],
        alert: {
          alertId: alert.alert_id,
          alertType: alert.alert_type,
          alertSeverity: alert.alert_severity,
          alertTitle: alert.alert_title,
          alertMessage: alert.alert_message,
          shipmentRef: referenceNumber,
          notifiedAt: new Date().toISOString(),
        },
      },
    });

    return alert;
  }

  private collectRecipients(
    target: Set<string>,
    orgUsers: { user_id: string; user_role: string; user_is_active: boolean }[],
    involvedUserIds: (string | null | undefined)[],
  ) {
    for (const user of orgUsers) {
      if (!user.user_is_active) continue;
      if (ADMIN_ROLES.includes(user.user_role)) {
        target.add(user.user_id);
      }
    }
    for (const id of involvedUserIds) {
      if (id) target.add(id);
    }
  }
}
