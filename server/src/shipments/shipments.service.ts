import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { UpdateShipmentStatusDto } from './dto/update-shipment-status.dto';
import { AssignRouteDto } from './dto/assign-route.dto';
import { QueryShipmentDto } from './dto/query-shipment.dto';
import { STATUS_TRANSITIONS } from './shipments.constants';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { AuditService } from '../audit/audit.service';
import type { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { buildPaginationMeta } from '../common/pagination/pagination.helper';
import { publishAlertEvent } from '../alerts/alert-events.helper';
import {
  computeEffectiveEta,
  isPastDelayGrace,
} from '../alerts/delay-evaluator';

/** Shape of the user payload attached by JwtAuthGuard */
interface RequestUser {
  sub: string;
  email: string;
  role: string;
  tokenVersion: number;
}

@Injectable()
export class ShipmentsService {
  private readonly logger = new Logger(ShipmentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly amqpConnection: AmqpConnection,
    private readonly auditService: AuditService,
  ) {}

  // ---------- Create ----------

  async create(user: RequestUser, dto: CreateShipmentDto) {
    if (
      user.role !== 'shipper' &&
      user.role !== 'admin' &&
      user.role !== 'super_admin'
    ) {
      throw new ForbiddenException(
        'You do not have permission to create shipments',
      );
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { user_id: user.sub },
      select: {
        organization_id: true,
        user_role: true,
        organization: { select: { organization_type: true } },
      },
    });

    if (!dbUser) {
      throw new NotFoundException('User not found');
    }

    if (dbUser.user_role === 'super_admin') {
      throw new ForbiddenException(
        'Super admins cannot directly create shipments; they must act on behalf of a shipper organization.',
      );
    }

    if (dbUser.organization?.organization_type !== 'shipper') {
      throw new ForbiddenException(
        'Only users belonging to a shipper organization can create shipments.',
      );
    }

    if (dto.carrierOrganizationId) {
      if (dto.carrierOrganizationId === dbUser.organization_id) {
        throw new BadRequestException(
          'A shipper cannot assign their own organization as the carrier',
        );
      }
      const carrierOrg = await this.prisma.organization.findUnique({
        where: { organization_id: dto.carrierOrganizationId },
      });
      if (!carrierOrg) {
        throw new BadRequestException('Carrier organization not found');
      }
    }

    if (dto.routeId) {
      const route = await this.prisma.route.findUnique({
        where: { route_id: dto.routeId },
      });
      if (!route) {
        throw new BadRequestException('Route not found');
      }
    }

    if (dto.estimatedDepartureAt && dto.estimatedArrivalAt) {
      if (
        new Date(dto.estimatedArrivalAt) <= new Date(dto.estimatedDepartureAt)
      ) {
        throw new BadRequestException(
          'Estimated arrival date must be after the estimated departure date',
        );
      }
    }

    const generatedRefNumber = `SHP-${randomUUID().split('-')[0].toUpperCase()}`;

    const shipment = await this.prisma.$transaction(async (tx) => {
      const createdShipment = await tx.shipment.create({
        data: {
          shipper_organization_id: dbUser.organization_id,
          carrier_organization_id: dto.carrierOrganizationId ?? null,
          route_id: dto.routeId ?? null,
          created_by_user_id: user.sub,
          shipment_reference_number: generatedRefNumber,
          shipment_status: 'draft',
          shipment_description: dto.description ?? null,
          shipment_cargo_type: dto.cargoType ?? null,
          shipment_weight_kg: dto.weightKg ?? null,
          shipment_volume_m3: dto.volumeM3 ?? null,
          shipment_origin_address: dto.originAddress,
          shipment_destination_address: dto.destinationAddress,
          shipment_origin_city: dto.originCity,
          shipment_destination_city: dto.destinationCity,
          shipment_estimated_departure_at: dto.estimatedDepartureAt
            ? new Date(dto.estimatedDepartureAt)
            : null,
          shipment_estimated_arrival_at: dto.estimatedArrivalAt
            ? new Date(dto.estimatedArrivalAt)
            : null,
          shipment_notes: dto.notes ?? null,
        },
        include: {
          shipper_organization: {
            select: { organization_id: true, organization_name: true },
          },
          carrier_organization: {
            select: { organization_id: true, organization_name: true },
          },
          carrier_user: {
            select: {
              user_id: true,
              user_first_name: true,
              user_last_name: true,
              user_email: true,
            },
          },
          route: {
            select: {
              route_id: true,
              route_name: true,
              route_code: true,
              route_estimated_days: true,
              route_checkpoints: {
                orderBy: { sequence_order: 'asc' },
                select: {
                  sequence_order: true,
                  checkpoint: {
                    select: {
                      checkpoint_id: true,
                      checkpoint_name: true,
                      checkpoint_city: true,
                      checkpoint_latitude: true,
                      checkpoint_longitude: true,
                      checkpoint_type: true,
                    },
                  },
                },
              },
            },
          },
          created_by: {
            select: {
              user_id: true,
              user_first_name: true,
              user_last_name: true,
            },
          },
        },
      });

      await tx.shipmentEvent.create({
        data: {
          shipment_id: createdShipment.shipment_id,
          event_type: 'shipment_created',
          event_status: 'draft',
          event_description: 'Shipment drafted and registered in the system',
          recorded_by_user_id: user.sub,
        },
      });

      return createdShipment;
    });

    this.logger.log(
      `Shipment created: ${shipment.shipment_reference_number} (ID: ${shipment.shipment_id})`,
    );

    this.auditService.log({
      action: 'SHIPMENT_CREATE',
      resourceType: 'shipment',
      resourceId: shipment.shipment_id,
      userId: user.sub,
      newValue: {
        referenceNumber: shipment.shipment_reference_number,
        status: shipment.shipment_status,
        shipperOrganizationId: shipment.shipper_organization_id,
        carrierOrganizationId: shipment.carrier_organization_id,
        routeId: shipment.route_id,
        originCity: shipment.shipment_origin_city,
        destinationCity: shipment.shipment_destination_city,
      },
    });

    await this.amqpConnection.publish('escv.events', 'shipment.created', {
      shipment_id: shipment.shipment_id,
      reference_number: shipment.shipment_reference_number,
      status: shipment.shipment_status,
      occurred_at: new Date().toISOString(),
      latitude: null,
      longitude: null,
      estimated_arrival_at: shipment.shipment_estimated_arrival_at,
      shipperOrganizationId: shipment.shipper_organization_id,
      carrierOrganizationId: shipment.carrier_organization_id,
      carrierUserId: shipment.carrier_user_id,
    });

    return this.formatShipment(shipment);
  }

  // ---------- Find All ----------

  async findAll(user: RequestUser, query: QueryShipmentDto) {
    const where = await this.buildWhereClause(user, query);
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [shipments, totalItems] = await Promise.all([
      this.prisma.shipment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { shipment_created_at: 'desc' },
        include: {
          shipper_organization: {
            select: { organization_id: true, organization_name: true },
          },
          carrier_organization: {
            select: { organization_id: true, organization_name: true },
          },
          carrier_user: {
            select: {
              user_id: true,
              user_first_name: true,
              user_last_name: true,
              user_email: true,
            },
          },
          route: {
            select: {
              route_id: true,
              route_name: true,
              route_code: true,
              route_estimated_days: true,
              route_checkpoints: {
                orderBy: { sequence_order: 'asc' },
                select: {
                  sequence_order: true,
                  checkpoint: {
                    select: {
                      checkpoint_id: true,
                      checkpoint_name: true,
                      checkpoint_city: true,
                      checkpoint_latitude: true,
                      checkpoint_longitude: true,
                      checkpoint_type: true,
                    },
                  },
                },
              },
            },
          },
          created_by: {
            select: {
              user_id: true,
              user_first_name: true,
              user_last_name: true,
            },
          },
          current_checkpoint: {
            select: {
              checkpoint_id: true,
              checkpoint_name: true,
              checkpoint_code: true,
              checkpoint_city: true,
            },
          },
          // Minimal event data so each route checkpoint can expose when the
          // shipment actually reached it (used by the live map).
          events: {
            orderBy: { event_occurred_at: 'asc' },
            select: { checkpoint_id: true, event_occurred_at: true },
          },
        },
      }),
      this.prisma.shipment.count({ where }),
    ]);

    return {
      data: shipments.map((s) => this.formatShipment(s)),
      meta: buildPaginationMeta(page, limit, totalItems),
    };
  }

  // ---------- Find One ----------

  async findOne(user: RequestUser, id: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { shipment_id: id },
      include: {
        shipper_organization: {
          select: { organization_id: true, organization_name: true },
        },
        carrier_organization: {
          select: { organization_id: true, organization_name: true },
        },
        carrier_user: {
          select: {
            user_id: true,
            user_first_name: true,
            user_last_name: true,
            user_email: true,
          },
        },
        route: {
          select: {
            route_id: true,
            route_name: true,
            route_code: true,
            route_estimated_days: true,
            route_checkpoints: {
              orderBy: { sequence_order: 'asc' },
              select: {
                sequence_order: true,
                checkpoint: {
                  select: {
                    checkpoint_id: true,
                    checkpoint_name: true,
                    checkpoint_city: true,
                    checkpoint_latitude: true,
                    checkpoint_longitude: true,
                  },
                },
              },
            },
          },
        },
        created_by: {
          select: {
            user_id: true,
            user_first_name: true,
            user_last_name: true,
          },
        },
        current_checkpoint: {
          select: {
            checkpoint_id: true,
            checkpoint_name: true,
            checkpoint_code: true,
            checkpoint_city: true,
            checkpoint_type: true,
          },
        },
        events: {
          orderBy: { event_occurred_at: 'desc' },
          take: 10,
        },
      },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    await this.enforceViewAccess(user, shipment);

    return this.formatShipment(shipment);
  }

  // ---------- Update ----------

  async update(user: RequestUser, id: string, dto: UpdateShipmentDto) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { shipment_id: id },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    await this.enforceEditAccess(user, shipment);

    if (shipment.shipment_status === 'delivered') {
      throw new BadRequestException(
        `Cannot update a shipment with status "${shipment.shipment_status}"`,
      );
    }
    if (shipment.shipment_status === 'cancelled' && user.role === 'carrier') {
      throw new ForbiddenException(
        'You cannot modify a cancelled shipment. Contact your admin to restore it.',
      );
    }

    if (dto.carrierOrganizationId) {
      if (dto.carrierOrganizationId === shipment.shipper_organization_id) {
        throw new BadRequestException(
          'A shipper cannot assign their own organization as the carrier',
        );
      }
      const carrierOrg = await this.prisma.organization.findUnique({
        where: { organization_id: dto.carrierOrganizationId },
      });
      if (!carrierOrg) {
        throw new BadRequestException('Carrier organization not found');
      }
    }

    if (dto.routeId) {
      const route = await this.prisma.route.findUnique({
        where: { route_id: dto.routeId },
      });
      if (!route) {
        throw new BadRequestException('Route not found');
      }
    }

    const newDeparture =
      dto.estimatedDepartureAt !== undefined
        ? dto.estimatedDepartureAt
          ? new Date(dto.estimatedDepartureAt)
          : null
        : shipment.shipment_estimated_departure_at;

    const newArrival =
      dto.estimatedArrivalAt !== undefined
        ? dto.estimatedArrivalAt
          ? new Date(dto.estimatedArrivalAt)
          : null
        : shipment.shipment_estimated_arrival_at;

    if (newDeparture && newArrival && newArrival <= newDeparture) {
      throw new BadRequestException(
        'Estimated arrival date must be after the estimated departure date',
      );
    }

    const updated = await this.prisma.shipment.update({
      where: { shipment_id: id },
      data: {
        ...(dto.description !== undefined && {
          shipment_description: dto.description,
        }),
        ...(dto.cargoType !== undefined && {
          shipment_cargo_type: dto.cargoType,
        }),
        ...(dto.weightKg !== undefined && {
          shipment_weight_kg: dto.weightKg,
        }),
        ...(dto.volumeM3 !== undefined && {
          shipment_volume_m3: dto.volumeM3,
        }),
        ...(dto.originAddress !== undefined && {
          shipment_origin_address: dto.originAddress,
        }),
        ...(dto.destinationAddress !== undefined && {
          shipment_destination_address: dto.destinationAddress,
        }),
        ...(dto.originCity !== undefined && {
          shipment_origin_city: dto.originCity,
        }),
        ...(dto.destinationCity !== undefined && {
          shipment_destination_city: dto.destinationCity,
        }),
        ...(dto.carrierOrganizationId !== undefined && {
          carrier_organization_id: dto.carrierOrganizationId,
        }),
        ...(dto.routeId !== undefined && { route_id: dto.routeId }),
        ...(dto.notes !== undefined && { shipment_notes: dto.notes }),
        ...(dto.estimatedDepartureAt !== undefined && {
          shipment_estimated_departure_at: new Date(dto.estimatedDepartureAt),
        }),
        ...(dto.estimatedArrivalAt !== undefined && {
          shipment_estimated_arrival_at: new Date(dto.estimatedArrivalAt),
        }),
      },
      include: {
        shipper_organization: {
          select: { organization_id: true, organization_name: true },
        },
        carrier_organization: {
          select: { organization_id: true, organization_name: true },
        },
        carrier_user: {
          select: {
            user_id: true,
            user_first_name: true,
            user_last_name: true,
            user_email: true,
          },
        },
        route: {
          select: {
            route_id: true,
            route_name: true,
            route_code: true,
            route_estimated_days: true,
            route_checkpoints: {
              orderBy: { sequence_order: 'asc' },
              select: {
                sequence_order: true,
                checkpoint: {
                  select: {
                    checkpoint_id: true,
                    checkpoint_name: true,
                    checkpoint_city: true,
                    checkpoint_latitude: true,
                    checkpoint_longitude: true,
                  },
                },
              },
            },
          },
        },
        created_by: {
          select: {
            user_id: true,
            user_first_name: true,
            user_last_name: true,
          },
        },
      },
    });

    this.logger.log(
      `Shipment updated: ${updated.shipment_reference_number} (ID: ${updated.shipment_id})`,
    );

    this.auditService.log({
      action: 'SHIPMENT_UPDATE',
      resourceType: 'shipment',
      resourceId: id,
      userId: user.sub,
      oldValue: this.auditPayload(shipment),
      newValue: this.auditPayload(updated),
    });

    return this.formatShipment(updated);
  }

  // ---------- Assign Route ----------

  async assignRoute(user: RequestUser, id: string, dto: AssignRouteDto) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { shipment_id: id },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    if (shipment.shipment_status === 'delivered') {
      throw new BadRequestException(
        'Cannot change the route of a delivered shipment',
      );
    }
    if (
      shipment.shipment_status === 'cancelled' &&
      user.role !== 'super_admin'
    ) {
      throw new ForbiddenException(
        'Cannot change the route of a cancelled shipment. Contact your admin to restore it.',
      );
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { user_id: user.sub },
      select: {
        organization_id: true,
        organization: { select: { organization_type: true } },
      },
    });

    if (!dbUser) {
      throw new NotFoundException('User not found');
    }

    const isShipperSide =
      shipment.shipper_organization_id === dbUser.organization_id &&
      (user.role === 'shipper' || user.role === 'admin');
    const isCarrierSide =
      shipment.carrier_organization_id === dbUser.organization_id &&
      dbUser.organization?.organization_type === 'carrier' &&
      (user.role === 'admin' ||
        (user.role === 'carrier' && shipment.carrier_user_id === user.sub));

    if (user.role !== 'super_admin' && !isShipperSide && !isCarrierSide) {
      throw new ForbiddenException(
        'You do not have permission to assign a route to this shipment',
      );
    }

    // Carriers may only route shipments assigned to them or org-claimed
    // shipments with no driver yet — never an org-mate's load.
    if (user.role === 'carrier') {
      if (!this.canCarrierManage(shipment, dbUser.organization_id, user.sub)) {
        throw new ForbiddenException(
          'You can only assign routes to shipments assigned to you or not yet claimed by a driver',
        );
      }
    }

    const route = await this.prisma.route.findUnique({
      where: { route_id: dto.routeId },
    });
    if (!route) {
      throw new BadRequestException('Route not found');
    }

    const updated = await this.prisma.shipment.update({
      where: { shipment_id: id },
      data: { route_id: dto.routeId },
      include: {
        shipper_organization: {
          select: { organization_id: true, organization_name: true },
        },
        carrier_organization: {
          select: { organization_id: true, organization_name: true },
        },
        carrier_user: {
          select: {
            user_id: true,
            user_first_name: true,
            user_last_name: true,
            user_email: true,
          },
        },
        route: {
          select: {
            route_id: true,
            route_name: true,
            route_code: true,
            route_estimated_days: true,
            route_checkpoints: {
              orderBy: { sequence_order: 'asc' },
              select: {
                sequence_order: true,
                checkpoint: {
                  select: {
                    checkpoint_id: true,
                    checkpoint_name: true,
                    checkpoint_city: true,
                    checkpoint_latitude: true,
                    checkpoint_longitude: true,
                  },
                },
              },
            },
          },
        },
        created_by: {
          select: {
            user_id: true,
            user_first_name: true,
            user_last_name: true,
          },
        },
      },
    });

    await this.prisma.shipmentEvent.create({
      data: {
        shipment_id: id,
        event_type: 'route_assigned',
        event_status: 'confirmed',
        event_description: `Route "${route.route_name}" assigned to this shipment`,
        recorded_by_user_id: user.sub,
      },
    });

    await this.amqpConnection.publish(
      'escv.events',
      'shipment.route_assigned',
      {
        shipment_id: updated.shipment_id,
        reference_number: shipment.shipment_reference_number,
        route_id: route.route_id,
        shipment_status: updated.shipment_status,
        occurred_at: new Date().toISOString(),
        shipperOrganizationId: shipment.shipper_organization_id,
        carrierOrganizationId: shipment.carrier_organization_id,
        carrierUserId: shipment.carrier_user_id,
      },
    );

    this.logger.log(
      `Shipment ${updated.shipment_reference_number}: route "${route.route_name}" assigned (ID: ${updated.shipment_id})`,
    );

    this.auditService.log({
      action: 'SHIPMENT_ROUTE_ASSIGN',
      resourceType: 'shipment',
      resourceId: id,
      userId: user.sub,
      oldValue: { routeId: shipment.route_id },
      newValue: { routeId: route.route_id, routeName: route.route_name },
    });

    return this.formatShipment(updated);
  }

  // ---------- Update Status ----------

  async updateStatus(
    user: RequestUser,
    id: string,
    dto: UpdateShipmentStatusDto,
  ) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { shipment_id: id },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { user_id: user.sub },
      select: { organization_id: true, user_id: true },
    });

    if (!dbUser) {
      throw new NotFoundException('User not found');
    }

    const isShipperOrg =
      shipment.shipper_organization_id === dbUser.organization_id;
    const isCarrierOrg =
      shipment.carrier_organization_id === dbUser.organization_id;
    const isAssignedCarrier = shipment.carrier_user_id === dbUser.user_id;

    const canManage =
      user.role === 'super_admin' ||
      isShipperOrg ||
      isCarrierOrg ||
      isAssignedCarrier;

    if (user.role === 'carrier') {
      // A carrier driver only manages their own shipments or org-claimed
      // shipments that no driver has claimed yet — never an org-mate's load.
      if (
        !this.canCarrierManage(
          shipment,
          dbUser.organization_id,
          dbUser.user_id,
        )
      ) {
        throw new ForbiddenException(
          'You can only update shipments assigned to you or not yet claimed by a driver',
        );
      }
    } else if (!canManage) {
      throw new ForbiddenException(
        'You do not have permission to update this shipment status',
      );
    }

    if (user.role === 'carrier' && !isAssignedCarrier) {
      throw new ForbiddenException(
        'You can only update the status of your assigned shipments',
      );
    }

    const validTransition =
      shipment.shipment_status === dto.status ||
      this.isValidTransition(shipment.shipment_status, dto.status);

    if (!validTransition) {
      throw new BadRequestException(
        `Cannot transition from "${shipment.shipment_status}" to "${dto.status}"`,
      );
    }

    if (shipment.shipment_status === 'cancelled') {
      if (user.role !== 'super_admin') {
        const dbUserForRestore = await this.prisma.user.findUnique({
          where: { user_id: user.sub },
          select: {
            user_role: true,
            organization_id: true,
          },
        });
        if (
          !dbUserForRestore ||
          dbUserForRestore.user_role !== 'admin' ||
          dbUserForRestore.organization_id !== shipment.shipper_organization_id
        ) {
          throw new ForbiddenException(
            'Only the shipper organization admin or super admin can restore a cancelled shipment.',
          );
        }
      }
    }

    let checkpointPosition: { latitude: number; longitude: number } | null =
      null;
    if (dto.checkpointId) {
      const checkpoint = await this.prisma.checkpoint.findUnique({
        where: { checkpoint_id: dto.checkpointId },
        select: {
          checkpoint_latitude: true,
          checkpoint_longitude: true,
        },
      });
      if (checkpoint) {
        checkpointPosition = {
          latitude: Number(checkpoint.checkpoint_latitude),
          longitude: Number(checkpoint.checkpoint_longitude),
        };
      }
    }

    const [updatedShipment, event] = await this.prisma.$transaction([
      this.prisma.shipment.update({
        where: { shipment_id: id },
        data: {
          shipment_status: dto.status,
          ...(dto.latitude !== undefined && {
            shipment_current_latitude: dto.latitude,
          }),
          ...(dto.longitude !== undefined && {
            shipment_current_longitude: dto.longitude,
          }),
          ...(checkpointPosition && {
            shipment_current_latitude: checkpointPosition.latitude,
            shipment_current_longitude: checkpointPosition.longitude,
          }),
          ...(dto.checkpointId !== undefined && {
            shipment_current_checkpoint_id: dto.checkpointId,
          }),
          ...(dto.status === 'delivered' && {
            shipment_actual_arrival_at: new Date(),
          }),
          ...(dto.status === 'in_transit' &&
            !shipment.shipment_actual_departure_at && {
              shipment_actual_departure_at: new Date(),
            }),
        },
        include: {
          shipper_organization: {
            select: { organization_id: true, organization_name: true },
          },
          carrier_organization: {
            select: { organization_id: true, organization_name: true },
          },
          carrier_user: {
            select: {
              user_id: true,
              user_first_name: true,
              user_last_name: true,
              user_email: true,
            },
          },
          route: {
            select: {
              route_id: true,
              route_name: true,
              route_code: true,
              route_estimated_days: true,
              route_checkpoints: {
                orderBy: { sequence_order: 'asc' },
                select: {
                  sequence_order: true,
                  checkpoint: {
                    select: {
                      checkpoint_id: true,
                      checkpoint_name: true,
                      checkpoint_city: true,
                      checkpoint_latitude: true,
                      checkpoint_longitude: true,
                      checkpoint_type: true,
                    },
                  },
                },
              },
            },
          },
          created_by: {
            select: {
              user_id: true,
              user_first_name: true,
              user_last_name: true,
            },
          },
        },
      }),
      this.prisma.shipmentEvent.create({
        data: {
          shipment_id: id,
          event_type: 'status_change',
          event_status: dto.status,
          event_description: dto.description ?? null,
          event_latitude: checkpointPosition?.latitude ?? dto.latitude ?? null,
          event_longitude:
            checkpointPosition?.longitude ?? dto.longitude ?? null,
          checkpoint_id: dto.checkpointId ?? null,
          recorded_by_user_id: user.sub,
          event_occurred_at: dto.occurredAt
            ? new Date(dto.occurredAt)
            : new Date(),
        },
      }),
    ]);

    await this.amqpConnection.publish(
      'escv.events',
      'shipment.status_changed',
      {
        shipment_id: updatedShipment.shipment_id,
        reference_number: shipment.shipment_reference_number,
        old_status: shipment.shipment_status,
        new_status: dto.status,
        status: updatedShipment.shipment_status,
        event_id: event.shipment_event_id,
        occurred_at: event.event_occurred_at,
        latitude: checkpointPosition?.latitude ?? dto.latitude ?? null,
        longitude: checkpointPosition?.longitude ?? dto.longitude ?? null,
        estimated_arrival_at: updatedShipment.shipment_estimated_arrival_at,
        shipperOrganizationId: shipment.shipper_organization_id,
        carrierOrganizationId: shipment.carrier_organization_id,
        carrierUserId: shipment.carrier_user_id,
      },
    );

    // Realtime alert evaluation on material status changes.
    // The alerts consumer turns these into alerts delivered live over WS.
    if (dto.status === 'in_transit') {
      this.maybePublishDelay(updatedShipment).catch((err) =>
        this.logger.error(
          `Realtime delay evaluation failed: ${(err as Error).message}`,
        ),
      );
    } else if (dto.status === 'delivered') {
      await publishAlertEvent(this.amqpConnection, 'shipment.delivered', {
        shipmentId: updatedShipment.shipment_id,
        referenceNumber: shipment.shipment_reference_number,
        shipmentStatus: dto.status,
        shipperOrganizationId: shipment.shipper_organization_id,
        carrierOrganizationId: shipment.carrier_organization_id,
        carrierUserId: shipment.carrier_user_id,
        eventId: event.shipment_event_id,
        occurredAt: event.event_occurred_at.toISOString(),
      });
    } else if (dto.status === 'customs_hold') {
      await publishAlertEvent(this.amqpConnection, 'shipment.exception', {
        shipmentId: updatedShipment.shipment_id,
        referenceNumber: shipment.shipment_reference_number,
        shipmentStatus: dto.status,
        shipperOrganizationId: shipment.shipper_organization_id,
        carrierOrganizationId: shipment.carrier_organization_id,
        carrierUserId: shipment.carrier_user_id,
        eventId: event.shipment_event_id,
        occurredAt: event.event_occurred_at.toISOString(),
      });
    }

    this.logger.log(
      `Shipment ${updatedShipment.shipment_reference_number} status updated to "${dto.status}"`,
    );

    this.auditService.log({
      action: 'SHIPMENT_STATUS_UPDATE',
      resourceType: 'shipment',
      resourceId: id,
      userId: user.sub,
      oldValue: {
        status: shipment.shipment_status,
        latitude: shipment.shipment_current_latitude
          ? Number(shipment.shipment_current_latitude)
          : null,
        longitude: shipment.shipment_current_longitude
          ? Number(shipment.shipment_current_longitude)
          : null,
        checkpointId: shipment.shipment_current_checkpoint_id,
      },
      newValue: {
        status: updatedShipment.shipment_status,
        latitude: updatedShipment.shipment_current_latitude
          ? Number(updatedShipment.shipment_current_latitude)
          : null,
        longitude: updatedShipment.shipment_current_longitude
          ? Number(updatedShipment.shipment_current_longitude)
          : null,
        checkpointId: updatedShipment.shipment_current_checkpoint_id,
      },
    });

    return this.formatShipment(updatedShipment);
  }

  /**
   * When a shipment transitions to in_transit and its effective ETA has
   * already passed the grace window, flag it as delayed immediately instead
   * of waiting for the 00:00 scan. Idempotent via the open-alert guard.
   */
  private async maybePublishDelay(shipment: {
    shipment_id: string;
    shipment_reference_number: string;
    shipment_status: string;
    shipment_estimated_arrival_at: Date | null;
    shipment_actual_departure_at: Date | null;
    shipper_organization_id: string;
    carrier_organization_id: string | null;
    carrier_user_id: string | null;
    route?: { route_estimated_days: number | null } | null;
  }) {
    if (!isPastDelayGrace(computeEffectiveEta(shipment))) return;
    await publishAlertEvent(this.amqpConnection, 'shipment.delayed', {
      shipmentId: shipment.shipment_id,
      referenceNumber: shipment.shipment_reference_number,
      shipmentStatus: shipment.shipment_status,
      shipperOrganizationId: shipment.shipper_organization_id,
      carrierOrganizationId: shipment.carrier_organization_id,
      carrierUserId: shipment.carrier_user_id,
      occurredAt: new Date().toISOString(),
    });
  }

  // ---------- Accept (Carrier claims a shipment) ----------

  async accept(user: RequestUser, id: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { shipment_id: id },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    if (shipment.shipment_status === 'cancelled') {
      throw new BadRequestException('Cannot accept a cancelled shipment');
    }

    if (
      user.role !== 'carrier' &&
      user.role !== 'admin' &&
      user.role !== 'super_admin'
    ) {
      throw new ForbiddenException('Only carrier users can accept shipments');
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { user_id: user.sub },
      select: {
        organization_id: true,
        user_role: true,
        organization: { select: { organization_type: true } },
      },
    });

    if (!dbUser) {
      throw new NotFoundException('User not found');
    }

    if (dbUser.user_role === 'super_admin') {
      throw new ForbiddenException(
        'Super admins cannot directly claim shipments; they must act on behalf of a carrier organization.',
      );
    }

    if (dbUser.organization?.organization_type !== 'carrier') {
      throw new ForbiddenException(
        'Only users belonging to a carrier organization can claim shipments.',
      );
    }

    if (
      shipment.carrier_organization_id &&
      shipment.carrier_organization_id !== dbUser.organization_id
    ) {
      throw new ForbiddenException(
        'This shipment is already assigned to another carrier organization',
      );
    }

    const activeShipmentCount = await this.prisma.shipment.count({
      where: {
        carrier_user_id: user.sub,
        shipment_status: {
          notIn: ['delivered', 'cancelled'],
        },
      },
    });

    if (activeShipmentCount > 0) {
      throw new ConflictException(
        'You already have an active shipment. Please complete or cancel it before accepting a new one.',
      );
    }

    if (
      shipment.carrier_organization_id === dbUser.organization_id &&
      shipment.carrier_user_id
    ) {
      if (shipment.carrier_user_id !== user.sub) {
        throw new ConflictException(
          'This shipment is already claimed by another driver in your organization',
        );
      }
      return this.formatShipment(shipment);
    }

    if (
      shipment.carrier_organization_id === dbUser.organization_id &&
      !shipment.carrier_user_id
    ) {
      const updated = await this.prisma.shipment.update({
        where: { shipment_id: id },
        data: { carrier_user_id: user.sub },
        include: {
          shipper_organization: {
            select: { organization_id: true, organization_name: true },
          },
          carrier_organization: {
            select: { organization_id: true, organization_name: true },
          },
          carrier_user: {
            select: {
              user_id: true,
              user_first_name: true,
              user_last_name: true,
              user_email: true,
            },
          },
          route: {
            select: {
              route_id: true,
              route_name: true,
              route_code: true,
              route_estimated_days: true,
              route_checkpoints: {
                orderBy: { sequence_order: 'asc' },
                select: {
                  sequence_order: true,
                  checkpoint: {
                    select: {
                      checkpoint_id: true,
                      checkpoint_name: true,
                      checkpoint_city: true,
                      checkpoint_latitude: true,
                      checkpoint_longitude: true,
                      checkpoint_type: true,
                    },
                  },
                },
              },
            },
          },
          created_by: {
            select: {
              user_id: true,
              user_first_name: true,
              user_last_name: true,
            },
          },
        },
      });

      await this.prisma.shipmentEvent.create({
        data: {
          shipment_id: id,
          event_type: 'carrier_assigned',
          event_status: 'confirmed',
          event_description: `Carrier user assigned to this shipment`,
          recorded_by_user_id: user.sub,
        },
      });

      this.logger.log(
        `Shipment ${updated.shipment_reference_number}: carrier user ${user.sub} assigned (org already claimed)`,
      );

      this.auditService.log({
        action: 'SHIPMENT_ACCEPT',
        resourceType: 'shipment',
        resourceId: id,
        userId: user.sub,
        oldValue: { carrierUserId: shipment.carrier_user_id },
        newValue: {
          carrierUserId: updated.carrier_user_id,
          carrierOrganizationId: updated.carrier_organization_id,
        },
      });

      await this.amqpConnection.publish('escv.events', 'shipment.accepted', {
        shipment_id: updated.shipment_id,
        reference_number: updated.shipment_reference_number,
        status: updated.shipment_status,
        occurred_at: new Date().toISOString(),
        latitude: null,
        longitude: null,
        estimated_arrival_at: updated.shipment_estimated_arrival_at,
        shipperOrganizationId: updated.shipper_organization_id,
        carrierOrganizationId: updated.carrier_organization_id,
        carrierUserId: updated.carrier_user_id,
      });

      return this.formatShipment(updated);
    }

    const updated = await this.prisma.shipment.update({
      where: { shipment_id: id },
      data: {
        carrier_organization_id: dbUser.organization_id,
        carrier_user_id: user.sub,
        ...(shipment.shipment_status === 'draft' && {
          shipment_status: 'confirmed',
        }),
      },
      include: {
        shipper_organization: {
          select: { organization_id: true, organization_name: true },
        },
        carrier_organization: {
          select: { organization_id: true, organization_name: true },
        },
        carrier_user: {
          select: {
            user_id: true,
            user_first_name: true,
            user_last_name: true,
            user_email: true,
          },
        },
        route: {
          select: {
            route_id: true,
            route_name: true,
            route_code: true,
            route_estimated_days: true,
            route_checkpoints: {
              orderBy: { sequence_order: 'asc' },
              select: {
                sequence_order: true,
                checkpoint: {
                  select: {
                    checkpoint_id: true,
                    checkpoint_name: true,
                    checkpoint_city: true,
                    checkpoint_latitude: true,
                    checkpoint_longitude: true,
                  },
                },
              },
            },
          },
        },
        created_by: {
          select: {
            user_id: true,
            user_first_name: true,
            user_last_name: true,
          },
        },
      },
    });

    await this.prisma.shipmentEvent.create({
      data: {
        shipment_id: id,
        event_type: 'carrier_assigned',
        event_status: 'confirmed',
        event_description: `Carrier user claimed this shipment`,
        recorded_by_user_id: user.sub,
      },
    });

    this.logger.log(
      `Shipment ${updated.shipment_reference_number} accepted by carrier user ${user.sub} (org ${dbUser.organization_id})`,
    );

    this.auditService.log({
      action: 'SHIPMENT_ACCEPT',
      resourceType: 'shipment',
      resourceId: id,
      userId: user.sub,
      oldValue: {
        carrierOrganizationId: shipment.carrier_organization_id,
        carrierUserId: shipment.carrier_user_id,
        status: shipment.shipment_status,
      },
      newValue: {
        carrierOrganizationId: updated.carrier_organization_id,
        carrierUserId: updated.carrier_user_id,
        status: updated.shipment_status,
      },
    });

    await this.amqpConnection.publish('escv.events', 'shipment.accepted', {
      shipment_id: updated.shipment_id,
      reference_number: updated.shipment_reference_number,
      status: updated.shipment_status,
      occurred_at: new Date().toISOString(),
      latitude: null,
      longitude: null,
      estimated_arrival_at: updated.shipment_estimated_arrival_at,
      shipperOrganizationId: updated.shipper_organization_id,
      carrierOrganizationId: updated.carrier_organization_id,
      carrierUserId: updated.carrier_user_id,
    });

    return this.formatShipment(updated);
  }

  // ---------- Remove ----------

  async remove(user: RequestUser, id: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { shipment_id: id },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    await this.enforceEditAccess(user, shipment);

    if (shipment.shipment_status !== 'draft') {
      throw new BadRequestException('Only draft shipments can be deleted');
    }

    await this.prisma.shipment.delete({
      where: { shipment_id: id },
    });

    this.logger.log(
      `Shipment deleted: ${shipment.shipment_reference_number} (ID: ${shipment.shipment_id})`,
    );

    this.auditService.log({
      action: 'SHIPMENT_DELETE',
      resourceType: 'shipment',
      resourceId: id,
      userId: user.sub,
      oldValue: this.auditPayload(shipment),
    });

    await this.amqpConnection.publish('escv.events', 'shipment.removed', {
      shipment_id: shipment.shipment_id,
      reference_number: shipment.shipment_reference_number,
      status: shipment.shipment_status,
      occurred_at: new Date().toISOString(),
      latitude: shipment.shipment_current_latitude
        ? Number(shipment.shipment_current_latitude)
        : null,
      longitude: shipment.shipment_current_longitude
        ? Number(shipment.shipment_current_longitude)
        : null,
      estimated_arrival_at: shipment.shipment_estimated_arrival_at,
      shipperOrganizationId: shipment.shipper_organization_id,
      carrierOrganizationId: shipment.carrier_organization_id,
      carrierUserId: shipment.carrier_user_id,
    });

    return { message: 'Shipment deleted successfully' };
  }

  // ---------- Private Helpers ----------

  private async buildWhereClause(
    user: RequestUser,
    query: QueryShipmentDto,
  ): Promise<Prisma.ShipmentWhereInput> {
    const where: Prisma.ShipmentWhereInput = {};
    const andClauses: Prisma.ShipmentWhereInput[] = [];

    const dbUser = await this.prisma.user.findUnique({
      where: { user_id: user.sub },
      select: { organization_id: true },
    });
    const orgId = dbUser?.organization_id ?? null;

    if (user.role !== 'regulator' && user.role !== 'super_admin') {
      if (orgId) {
        const roleBounds: Prisma.ShipmentWhereInput[] = [
          { shipper_organization_id: orgId },
          { carrier_organization_id: orgId },
        ];

        if (user.role === 'carrier') {
          roleBounds.push(
            {
              AND: [
                { carrier_organization_id: null },
                { shipment_status: { not: 'cancelled' } },
              ],
            },
            { carrier_user_id: user.sub },
          );
        }

        andClauses.push({ OR: roleBounds });
      } else {
        andClauses.push({ OR: [] });
      }
    }

    if (query.status || query.excludeStatus) {
      where.shipment_status = {
        equals: query.status,
        not: query.excludeStatus,
      };
    }

    if (query.search) {
      andClauses.push({
        OR: [
          {
            shipment_reference_number: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
          {
            shipment_description: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
        ],
      });
    }

    if (query.carrierOrganizationId && user.role === 'regulator') {
      where.carrier_organization_id = query.carrierOrganizationId;
    }

    if (query.createdAfter || query.createdBefore) {
      where.shipment_created_at = {};
      if (query.createdAfter) {
        where.shipment_created_at.gte = new Date(query.createdAfter);
      }
      if (query.createdBefore) {
        where.shipment_created_at.lte = new Date(query.createdBefore);
      }
    }

    if (query.scope) {
      if (query.scope === 'assigned') {
        // Everything claimed by the caller's organization. Carrier drivers only
        // see the org-claimed shipments with no driver yet (the ones they can
        // self-assign) — org-mates' shipments are not inspectable.
        if (orgId) {
          andClauses.push(
            user.role === 'carrier'
              ? {
                  AND: [
                    { carrier_organization_id: orgId },
                    { carrier_user_id: null },
                  ],
                }
              : { carrier_organization_id: orgId },
          );
        } else {
          andClauses.push({ OR: [] });
        }
      } else if (query.scope === 'mine') {
        // Only shipments where the caller is the assigned carrier driver.
        // "mine" is a driver concept — other roles get no rows for it.
        if (user.role === 'carrier') {
          andClauses.push({ carrier_user_id: user.sub });
        } else {
          andClauses.push({ OR: [] });
        }
      } else if (query.scope === 'available') {
        // Only shipments no carrier org has claimed are truly available.
        // Shipments already claimed by the caller's org belong in the
        // "Org Shipments" tab, where drivers can self-assign them.
        andClauses.push({
          AND: [
            { carrier_organization_id: null },
            { shipment_status: { not: 'cancelled' } },
          ],
        });
      }
    }

    if (andClauses.length > 0) {
      where.AND = andClauses;
    }

    return where;
  }

  private async enforceViewAccess(user: RequestUser, shipment: any) {
    if (user.role === 'regulator') return;

    const dbUser = await this.prisma.user.findUnique({
      where: { user_id: user.sub },
      select: { organization_id: true },
    });

    if (!dbUser) {
      throw new ForbiddenException('Access denied');
    }

    const isShipperOrg =
      shipment.shipper_organization_id === dbUser.organization_id;
    const isCarrierOrg =
      shipment.carrier_organization_id === dbUser.organization_id;
    const isAssignedCarrier = shipment.carrier_user_id === user.sub;

    if (user.role === 'carrier') {
      // A carrier driver may only inspect shipments assigned to them, or
      // org-claimed shipments no driver has claimed yet (so they can decide
      // to self-assign). Shipments driven by an org-mate are off-limits.
      if (
        !isShipperOrg &&
        !this.canCarrierManage(shipment, dbUser.organization_id, user.sub)
      ) {
        throw new ForbiddenException('You do not have access to this shipment');
      }
      return;
    }

    if (!isShipperOrg && !isCarrierOrg && !isAssignedCarrier) {
      throw new ForbiddenException('You do not have access to this shipment');
    }
  }

  private async enforceEditAccess(user: RequestUser, shipment: any) {
    if (user.role === 'super_admin') {
      return;
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { user_id: user.sub },
      select: { organization_id: true },
    });

    if (
      !dbUser ||
      shipment.shipper_organization_id !== dbUser.organization_id
    ) {
      throw new ForbiddenException(
        'You do not have permission to modify this shipment',
      );
    }
  }

  private isValidTransition(current: string, next: string): boolean {
    const allowed = STATUS_TRANSITIONS[current];
    return allowed ? allowed.includes(next) : false;
  }

  /**
   * Whether a carrier driver may work on a shipment: either it is assigned to
   * them, or it is claimed by their organization with no driver yet. Shipments
   * driven by an org-mate are never manageable by another driver.
   */
  private canCarrierManage(
    shipment: {
      carrier_organization_id: string | null;
      carrier_user_id: string | null;
    },
    organizationId: string | null,
    userId: string,
  ): boolean {
    if (shipment.carrier_user_id === userId) return true;
    return (
      !!organizationId &&
      shipment.carrier_organization_id === organizationId &&
      !shipment.carrier_user_id
    );
  }

  /** Whitelisted snapshot for audit rows — never includes content, notes, or identity data. */
  private auditPayload(shipment: any) {
    return {
      status: shipment.shipment_status,
      cargoType: shipment.shipment_cargo_type ?? null,
      weightKg: shipment.shipment_weight_kg
        ? Number(shipment.shipment_weight_kg)
        : null,
      volumeM3: shipment.shipment_volume_m3
        ? Number(shipment.shipment_volume_m3)
        : null,
      originCity: shipment.shipment_origin_city,
      destinationCity: shipment.shipment_destination_city,
      shipperOrganizationId: shipment.shipper_organization_id,
      carrierOrganizationId: shipment.carrier_organization_id,
      carrierUserId: shipment.carrier_user_id,
      routeId: shipment.route_id,
      estimatedDepartureAt: shipment.shipment_estimated_departure_at,
      estimatedArrivalAt: shipment.shipment_estimated_arrival_at,
    };
  }

  private formatShipment(shipment: any) {
    const routeCheckpoints = shipment.route?.route_checkpoints ?? [];

    // Earliest event per checkpoint = the moment the shipment reached it.
    const checkpointReachedAt = new Map<string, string>();
    for (const event of shipment.events ?? []) {
      if (
        event.checkpoint_id &&
        !checkpointReachedAt.has(event.checkpoint_id)
      ) {
        checkpointReachedAt.set(
          event.checkpoint_id,
          new Date(event.event_occurred_at).toISOString(),
        );
      }
    }

    const checkpointPosition = (cp: any) =>
      cp?.checkpoint
        ? {
            latitude: cp.checkpoint.checkpoint_latitude
              ? Number(cp.checkpoint.checkpoint_latitude)
              : null,
            longitude: cp.checkpoint.checkpoint_longitude
              ? Number(cp.checkpoint.checkpoint_longitude)
              : null,
            name: cp.checkpoint.checkpoint_name,
            city: cp.checkpoint.checkpoint_city,
          }
        : null;
    return {
      id: shipment.shipment_id,
      referenceNumber: shipment.shipment_reference_number,
      status: shipment.shipment_status,
      description: shipment.shipment_description,
      cargoType: shipment.shipment_cargo_type,
      weightKg: shipment.shipment_weight_kg
        ? Number(shipment.shipment_weight_kg)
        : null,
      volumeM3: shipment.shipment_volume_m3
        ? Number(shipment.shipment_volume_m3)
        : null,
      originAddress: shipment.shipment_origin_address,
      destinationAddress: shipment.shipment_destination_address,
      originCity: shipment.shipment_origin_city,
      destinationCity: shipment.shipment_destination_city,
      originPosition:
        routeCheckpoints.length > 0
          ? checkpointPosition(routeCheckpoints[0])
          : null,
      destinationPosition:
        routeCheckpoints.length > 0
          ? checkpointPosition(routeCheckpoints[routeCheckpoints.length - 1])
          : null,
      estimatedDepartureAt: shipment.shipment_estimated_departure_at,
      estimatedArrivalAt: shipment.shipment_estimated_arrival_at,
      actualDepartureAt: shipment.shipment_actual_departure_at,
      actualArrivalAt: shipment.shipment_actual_arrival_at,
      currentLatitude: shipment.shipment_current_latitude
        ? Number(shipment.shipment_current_latitude)
        : null,
      currentLongitude: shipment.shipment_current_longitude
        ? Number(shipment.shipment_current_longitude)
        : null,
      notes: shipment.shipment_notes,
      shipperOrganization: shipment.shipper_organization,
      carrierOrganization: shipment.carrier_organization,
      carrierUser: shipment.carrier_user
        ? {
            id: shipment.carrier_user.user_id,
            firstName: shipment.carrier_user.user_first_name,
            lastName: shipment.carrier_user.user_last_name,
            email: shipment.carrier_user.user_email,
          }
        : null,
      route: shipment.route
        ? {
            route_id: shipment.route.route_id,
            route_name: shipment.route.route_name,
            route_code: shipment.route.route_code,
            estimatedDays: shipment.route.route_estimated_days ?? null,
            checkpoints: (shipment.route.route_checkpoints ?? []).map(
              (rc: any) => ({
                id: rc.checkpoint.checkpoint_id,
                name: rc.checkpoint.checkpoint_name,
                city: rc.checkpoint.checkpoint_city,
                type: rc.checkpoint.checkpoint_type ?? null,
                latitude: rc.checkpoint.checkpoint_latitude
                  ? Number(rc.checkpoint.checkpoint_latitude)
                  : null,
                longitude: rc.checkpoint.checkpoint_longitude
                  ? Number(rc.checkpoint.checkpoint_longitude)
                  : null,
                sequenceOrder: rc.sequence_order,
                reachedAt:
                  checkpointReachedAt.get(rc.checkpoint.checkpoint_id) ?? null,
              }),
            ),
          }
        : null,
      currentCheckpoint: shipment.current_checkpoint,
      createdBy: shipment.created_by
        ? {
            id: shipment.created_by.user_id,
            firstName: shipment.created_by.user_first_name,
            lastName: shipment.created_by.user_last_name,
          }
        : null,
      // Only map full events when the query actually included the complete
      // event fields (list queries include just checkpoint_id + occurred_at
      // for reachedAt computation and must not leak partial event objects).
      events:
        shipment.events?.length && shipment.events[0]?.shipment_event_id
          ? shipment.events.map((e: any) => ({
              id: e.shipment_event_id,
              type: e.event_type,
              status: e.event_status,
              description: e.event_description,
              latitude: e.event_latitude ? Number(e.event_latitude) : null,
              longitude: e.event_longitude ? Number(e.event_longitude) : null,
              checkpointId: e.checkpoint_id,
              recordedByUserId: e.recorded_by_user_id,
              occurredAt: e.event_occurred_at,
            }))
          : undefined,
      createdAt: shipment.shipment_created_at,
      updatedAt: shipment.shipment_updated_at,
    };
  }
}
