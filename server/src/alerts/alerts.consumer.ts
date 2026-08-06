import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe, Nack } from '@golevelup/nestjs-rabbitmq';
import { AlertsService } from './alerts.service';

@Injectable()
export class AlertsConsumer {
  private readonly logger = new Logger(AlertsConsumer.name);

  constructor(private readonly alertsService: AlertsService) {}

  @RabbitSubscribe({
    exchange: 'escv.events',
    routingKey: ['shipment.delayed', 'shipment.exception', 'shipment.delivered'],
    queue: 'alerts_queue',
  })
  public async handleShipmentEvents(msg: any) {
    try {
      this.logger.debug(`Received alert event: ${msg.type} for shipment ${msg.data?.shipmentId}`);
      
      const { type, data } = msg;

      let severity = 'info';
      let title = 'Shipment Update';
      let message = 'An update occurred on your shipment.';

      if (type === 'shipment.delayed') {
        severity = 'warning';
        title = 'Shipment Delayed';
        message = `Shipment ${data.shipmentId?.split('-')[0]} has been delayed at a checkpoint.`;
      } else if (type === 'shipment.exception') {
        severity = 'critical';
        title = 'Shipment Exception';
        message = `An exception was reported for shipment ${data.shipmentId?.split('-')[0]}.`;
      } else if (type === 'shipment.delivered') {
        severity = 'info';
        title = 'Shipment Delivered';
        message = `Shipment ${data.shipmentId?.split('-')[0]} has been successfully delivered.`;
      }

      await this.alertsService.createAlert({
        type,
        severity,
        title,
        message,
        shipmentId: data.shipmentId,
        targetRole: 'admin', // notify all admins of the involved organizations
        metadata: data,
      });

    } catch (error) {
      this.logger.error(`Failed to process alert event: ${(error as Error).message}`);
      return new Nack(false);
    }
  }
}
