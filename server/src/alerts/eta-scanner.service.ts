import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { PrismaService } from '../prisma/prisma.service';
import { computeEffectiveEta, isPastDelayGrace } from './delay-evaluator';
import { publishAlertEvent } from './alert-events.helper';

const ACTIVE_STATUSES_NOT_ARRIVED = {
  notIn: ['draft', 'pending', 'delivered', 'cancelled'],
};

/**
 * Scans for shipments whose estimated arrival time has passed (00:00 daily
 * + once on boot as catch-up) and publishes `shipment.delayed` events, which
 * the alerts consumer turns into alerts delivered live over WebSockets.
 */
@Injectable()
export class EtaScannerService implements OnModuleInit {
  private readonly logger = new Logger(EtaScannerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly amqp: AmqpConnection,
  ) {}

  onModuleInit() {
    // Catch-up run: a restart must not leave already-late shipments unflagged
    // until the next midnight.
    setTimeout(() => {
      this.scanForDelayedShipments()
        .then((count) =>
          this.logger.log(`Boot delay scan flagged ${count} shipment(s)`),
        )
        .catch((err) =>
          this.logger.error(
            `Boot delay scan failed: ${(err as Error).message}`,
          ),
        );
    }, 10_000);
  }

  @Cron('0 0 * * *', { name: 'eta-delay-scan', timeZone: 'Africa/Cairo' })
  async handleMidnightScan() {
    const count = await this.scanForDelayedShipments();
    this.logger.log(`Midnight delay scan flagged ${count} shipment(s)`);
  }

  async scanForDelayedShipments(): Promise<number> {
    const cutoff = new Date(Date.now());

    const candidates = await this.prisma.shipment.findMany({
      where: {
        shipment_status: ACTIVE_STATUSES_NOT_ARRIVED,
        OR: [
          { shipment_estimated_arrival_at: { not: null } },
          {
            shipment_estimated_arrival_at: null,
            shipment_actual_departure_at: { not: null },
            route: { route_estimated_days: { not: null } },
          },
        ],
      },
      select: {
        shipment_id: true,
        shipment_reference_number: true,
        shipment_status: true,
        shipment_estimated_arrival_at: true,
        shipment_actual_departure_at: true,
        shipper_organization_id: true,
        carrier_organization_id: true,
        carrier_user_id: true,
        route: { select: { route_estimated_days: true } },
      },
    });

    let flagged = 0;
    for (const shipment of candidates) {
      if (!isPastDelayGrace(computeEffectiveEta(shipment), cutoff)) continue;

      const openAlert = await this.prisma.alert.findFirst({
        where: {
          shipment_id: shipment.shipment_id,
          alert_type: 'shipment.delayed',
          alert_is_resolved: false,
        },
        select: { alert_id: true },
      });
      if (openAlert) continue;

      await publishAlertEvent(this.amqp, 'shipment.delayed', {
        shipmentId: shipment.shipment_id,
        referenceNumber: shipment.shipment_reference_number,
        shipmentStatus: shipment.shipment_status,
        shipperOrganizationId: shipment.shipper_organization_id,
        carrierOrganizationId: shipment.carrier_organization_id,
        carrierUserId: shipment.carrier_user_id,
        occurredAt: new Date().toISOString(),
      });
      flagged++;
    }

    if (flagged > 0) {
      this.logger.log(`Delay scan flagged ${flagged} late shipment(s)`);
    }
    return flagged;
  }
}
