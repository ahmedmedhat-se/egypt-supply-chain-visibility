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
    // `unref()`: the timer must never keep the process alive on its own — e.g.
    // it used to make jest's e2e suite wait 10s after the tests finished (and
    // log "Cannot log after tests are done"). In production the server keeps
    // the event loop alive anyway, so the scan still runs.
    const timer = setTimeout(() => {
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
    timer.unref();
  }

  @Cron('0 0 * * *', { name: 'eta-delay-scan', timeZone: 'Africa/Cairo' })
  async handleMidnightScan() {
    const count = await this.scanForDelayedShipments();
    this.logger.log(`Midnight delay scan flagged ${count} shipment(s)`);
  }

  async scanForDelayedShipments(): Promise<number> {
    const cutoff = new Date(Date.now());

    // NOTE: the old query filtered `route: { route_estimated_days: { not: null } }`
    // inside `OR` — that shape crashed Prisma with "Maximum call stack size
    // exceeded" on every boot. `computeEffectiveEta` already returns null for a
    // shipment with no ETA and no route days, so filtering that case in JS
    // below is equivalent — same results, but a query Prisma accepts.
    const candidates = await this.prisma.shipment.findMany({
      where: {
        shipment_status: ACTIVE_STATUSES_NOT_ARRIVED,
        OR: [
          { shipment_estimated_arrival_at: { not: null } },
          { shipment_actual_departure_at: { not: null } },
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
