import { Injectable, Logger } from '@nestjs/common';
import {
  RabbitSubscribe,
  MessageHandlerErrorBehavior,
} from '@golevelup/nestjs-rabbitmq';
import { PrismaService } from '../prisma/prisma.service';
import { AUDIT_EXCHANGE, AUDIT_ROUTING_KEY } from './audit.service';

interface AuditRecordedEvent {
  userId: string | null;
  organizationId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  oldValue: unknown;
  newValue: unknown;
  ip: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown>;
  performedAt: string;
}

@Injectable()
export class AuditConsumer {
  private readonly logger = new Logger(AuditConsumer.name);

  constructor(private readonly prisma: PrismaService) {}

  @RabbitSubscribe({
    exchange: AUDIT_EXCHANGE,
    routingKey: AUDIT_ROUTING_KEY,
    queue: 'audit.recorded',
    errorBehavior: MessageHandlerErrorBehavior.NACK,
  })
  async handleAuditRecorded(event: AuditRecordedEvent) {
    try {
      await this.prisma.auditLog.create({
        data: {
          user_id: event.userId,
          organization_id: event.organizationId,
          audit_action: event.action,
          audit_resource_type: event.resourceType,
          audit_resource_id: event.resourceId,
          audit_old_value: event.oldValue as never,
          audit_new_value: event.newValue as never,
          audit_ip_address: event.ip,
          audit_user_agent: event.userAgent,
          audit_metadata: event.metadata as never,
          audit_performed_at: new Date(event.performedAt),
        },
      });
    } catch (error) {
      // Never take the consumer down on a single bad row.
      this.logger.error(
        `Failed to persist audit row for ${event.action}: ${(error as Error).message}`,
      );
    }
  }
}
