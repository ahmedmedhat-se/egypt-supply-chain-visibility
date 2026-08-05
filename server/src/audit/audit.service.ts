import { Injectable, Logger } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

export const AUDIT_EXCHANGE = 'escv.events';
export const AUDIT_ROUTING_KEY = 'audit.recorded';

export interface AuditEntry {
  userId: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly amqp: AmqpConnection) {}

  log(entry: AuditEntry): void {
    this.amqp
      .publish(AUDIT_EXCHANGE, AUDIT_ROUTING_KEY, {
        userId: entry.userId ?? null,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId ?? null,
        oldValue: entry.oldValue ?? null,
        newValue: entry.newValue ?? null,
        ip: entry.ip ?? null,
        userAgent: entry.userAgent ?? null,
        metadata: entry.metadata ?? {},
        performedAt: new Date().toISOString(),
      })
      .catch((error) => {
        this.logger.error(
          `Failed to enqueue audit event ${entry.action}: ${(error as Error).message}`,
        );
      });
  }
}
