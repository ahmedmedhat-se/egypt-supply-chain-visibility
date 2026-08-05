import { Injectable, Logger } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { FastifyRequest } from 'fastify';
import { RequestContext } from '../common/context/request-context';

export const AUDIT_EXCHANGE = 'escv.events';
export const AUDIT_ROUTING_KEY = 'audit.recorded';

export interface AuditEntry {
  userId?: string | null;
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

  /**
   * Fire-and-forget audit logging. Enqueues an `audit.recorded` event and
   * returns immediately, so the request path never waits on a DB write.
   * The AuditConsumer persists the row asynchronously.
   *
   * ip and user-agent are resolved from, in priority order:
   *  1. an explicit entry.ip / entry.userAgent,
   *  2. the request passed explicitly,
   *  3. the request captured by the RequestContext interceptor,
   *  4. null.
   * userId falls back to the authenticated request user (verified JWT) when
   * the entry does not carry it explicitly.
   */
  log(entry: AuditEntry, request?: FastifyRequest): void {
    const contextRequest = request ?? RequestContext.getRequest();
    const actorUser = (contextRequest?.user ?? null) as
      | { sub?: string }
      | null
      | undefined;
    this.amqp
      .publish(AUDIT_EXCHANGE, AUDIT_ROUTING_KEY, {
        userId: entry.userId ?? actorUser?.sub ?? null,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId ?? null,
        oldValue: entry.oldValue ?? null,
        newValue: entry.newValue ?? null,
        ip: entry.ip ?? contextRequest?.ip ?? null,
        userAgent:
          entry.userAgent ?? contextRequest?.headers?.['user-agent'] ?? null,
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
