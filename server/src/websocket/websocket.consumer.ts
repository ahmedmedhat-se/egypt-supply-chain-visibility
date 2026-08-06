import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { WebsocketGateway } from './websocket.gateway';
import type { ShipmentEventPayload } from './websocket.gateway';

interface SessionRevokedEvent {
  userId: string;
  sessionId?: string;
}

@Injectable()
export class WebsocketConsumer {
  private readonly logger = new Logger(WebsocketConsumer.name);

  constructor(private readonly gateway: WebsocketGateway) {}

  @RabbitSubscribe({
    exchange: 'escv.events',
    routingKey: [
      'shipment.status_changed',
      'shipment.created',
      'shipment.accepted',
      'shipment.removed',
      'shipment.route_assigned',
    ],
    queue: 'ws.shipment-events',
  })
  async handleShipmentEvent(payload: ShipmentEventPayload) {
    this.logger.debug(
      `Shipment event received: ${payload.shipment_id} (${payload.new_status ?? payload.status ?? 'n/a'})`,
    );
    this.gateway.emitShipmentEvent(payload);
  }

  @RabbitSubscribe({
    exchange: 'escv.events',
    routingKey: 'auth.session_revoked',
    queue: 'ws.session-revoked',
  })
  async handleSessionRevoked(event: SessionRevokedEvent) {
    this.logger.log(
      `Session revoked event for user ${event.userId} (session ${event.sessionId ?? 'all'})`,
    );
    this.gateway.emitForceLogout(event.userId, event.sessionId);
  }

  @RabbitSubscribe({
    exchange: 'escv.events',
    routingKey: 'alert.created',
    queue: 'ws.alert-created',
  })
  async handleAlertCreated(msg: {
    type?: string;
    data?: { userIds?: string[]; alert?: unknown };
  }) {
    const { userIds = [], alert } = msg?.data ?? {};
    if (!Array.isArray(userIds) || userIds.length === 0 || !alert) {
      this.logger.warn(
        'Ignoring alert.created event without recipients or payload',
      );
      return;
    }
    this.gateway.emitAlerts(userIds, alert);
  }
}
