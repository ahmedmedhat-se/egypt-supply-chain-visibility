import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe, Nack } from '@golevelup/nestjs-rabbitmq';
import { AlertsService } from './alerts.service';
import type { ShipmentAlertData } from './alert-events.helper';

@Injectable()
export class AlertsConsumer {
  private readonly logger = new Logger(AlertsConsumer.name);

  constructor(private readonly alertsService: AlertsService) {}

  @RabbitSubscribe({
    exchange: 'escv.events',
    routingKey: [
      'shipment.delayed',
      'shipment.exception',
      'shipment.delivered',
    ],
    queue: 'alerts_queue',
  })
  public async handleShipmentEvents(msg: {
    type?: string;
    data?: ShipmentAlertData;
  }) {
    try {
      const { type, data } = msg ?? {};

      if (!type || !data?.shipmentId) {
        this.logger.warn(
          `Ignoring malformed alert event: ${JSON.stringify(msg)}`,
        );
        return;
      }

      this.logger.debug(
        `Received alert event: ${type} for shipment ${data.shipmentId}`,
      );

      const ref = data.referenceNumber ?? data.shipmentId;

      let severity = 'info';
      let title = 'Shipment Update';
      let message = `An update occurred on shipment ${ref}.`;

      if (type === 'shipment.delayed') {
        severity = 'warning';
        title = 'Shipment Delayed';
        message = `Shipment ${ref} is past its estimated arrival time and has been flagged as delayed.`;
      } else if (type === 'shipment.exception') {
        severity = 'critical';
        title = 'Shipment Exception';
        message = `An exception was reported for shipment ${ref}.`;
      } else if (type === 'shipment.delivered') {
        severity = 'info';
        title = 'Shipment Delivered';
        message = `Shipment ${ref} has been successfully delivered.`;
      }

      await this.alertsService.createAlert({
        type,
        severity,
        title,
        message,
        shipmentId: data.shipmentId,
        targetSide: 'both',
        metadata: data,
      });
    } catch (error) {
      this.logger.error(
        `Failed to process alert event: ${(error as Error).message}`,
      );
      return new Nack(false);
    }
  }
}
