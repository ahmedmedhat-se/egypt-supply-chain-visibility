import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

export const ALERTS_EXCHANGE = 'escv.events';

export type AlertEventType =
  | 'shipment.delayed'
  | 'shipment.exception'
  | 'shipment.delivered';

export interface ShipmentAlertData {
  shipmentId: string;
  referenceNumber: string;
  shipmentStatus: string;
  shipperOrganizationId: string | null;
  carrierOrganizationId: string | null;
  carrierUserId: string | null;
  eventId?: string | null;
  occurredAt: string;
}

/**
 * Canonical wire contract for alert-triggering events.
 * Every producer publishes the `{ type, data }` envelope; the alerts
 * consumer and the websocket consumer both rely on this shape.
 */
export function publishAlertEvent(
  amqp: AmqpConnection,
  type: AlertEventType,
  data: ShipmentAlertData,
) {
  return amqp.publish(ALERTS_EXCHANGE, type, { type, data });
}
