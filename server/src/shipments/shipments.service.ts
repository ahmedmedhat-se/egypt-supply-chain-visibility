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
import { QueryShipmentDto } from './dto/query-shipment.dto';
import { STATUS_TRANSITIONS } from './shipments.constants';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import type { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

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
  ) {}

  // ---------- Create ----------

  async create(user: RequestUser, dto: CreateShipmentDto) {
    // Only shippers and admins can create shipments
    if (user.role !== 'shipper' && user.role !== 'admin') {
      throw new ForbiddenException(
        'Only shippers or admins can create shipments',
      );
    }

    // Removed manual reference number check; will auto-generate below

    // Resolve the user's organization
    const dbUser = await this.prisma.user.findUnique({
      where: { user_id: user.sub },
      select: { organization_id: true, user_role: true },
    });

    if (!dbUser) {
      throw new NotFoundException('User not found');
    }

    // Validate carrier org exists if provided
    if (dto.carrierOrganizationId) {
      const carrierOrg = await this.prisma.organization.findUnique({
        where: { organization_id: dto.carrierOrganizationId },
      });
      if (!carrierOrg) {
        throw new BadRequestException('Carrier organization not found');
      }
    }

    // Validate route exists if provided
    if (dto.routeId) {
      const route = await this.prisma.route.findUnique({
        where: { route_id: dto.routeId },
      });
      if (!route) {
        throw new BadRequestException('Route not found');
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
          route: {
            select: { route_id: true, route_name: true, route_code: true },
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

    return this.formatShipment(shipment);
  }

  // ---------- Find All ----------

  async findAll(user: RequestUser, query: QueryShipmentDto) {
    const where = await this.buildWhereClause(user, query);
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [shipments, total] = await Promise.all([
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
          route: {
            select: { route_id: true, route_name: true, route_code: true },
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
        },
      }),
      this.prisma.shipment.count({ where }),
    ]);

    return {
      data: shipments.map((s) => this.formatShipment(s)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
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
        route: {
          select: { route_id: true, route_name: true, route_code: true },
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

    // Enforce visibility based on role
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

    // Only shipper (of the same org) or admin can update
    await this.enforceEditAccess(user, shipment);

    // Cannot update if delivered or cancelled
    if (
      shipment.shipment_status === 'delivered' ||
      shipment.shipment_status === 'cancelled'
    ) {
      throw new BadRequestException(
        `Cannot update a shipment with status "${shipment.shipment_status}"`,
      );
    }

    // Reference number uniqueness check removed since it's no longer editable

    // Validate carrier org if provided
    if (dto.carrierOrganizationId) {
      const carrierOrg = await this.prisma.organization.findUnique({
        where: { organization_id: dto.carrierOrganizationId },
      });
      if (!carrierOrg) {
        throw new BadRequestException('Carrier organization not found');
      }
    }

    // Validate route if provided
    if (dto.routeId) {
      const route = await this.prisma.route.findUnique({
        where: { route_id: dto.routeId },
      });
      if (!route) {
        throw new BadRequestException('Route not found');
      }
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
        route: {
          select: { route_id: true, route_name: true, route_code: true },
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

    // Shippers, carriers (of the same org), and admins can update status
    const dbUser = await this.prisma.user.findUnique({
      where: { user_id: user.sub },
      select: { organization_id: true },
    });

    if (!dbUser) {
      throw new NotFoundException('User not found');
    }

    const isAdmin = user.role === 'admin';
    const isShipperOrg =
      shipment.shipper_organization_id === dbUser.organization_id;
    const isCarrierOrg =
      shipment.carrier_organization_id === dbUser.organization_id;

    if (!isAdmin && !isShipperOrg && !isCarrierOrg) {
      throw new ForbiddenException(
        'You do not have permission to update this shipment status',
      );
    }

    // Validate status transition
    const validTransition = this.isValidTransition(
      shipment.shipment_status,
      dto.status,
    );
    if (!validTransition) {
      throw new BadRequestException(
        `Cannot transition from "${shipment.shipment_status}" to "${dto.status}"`,
      );
    }

    // Carrier has no special restriction — the state machine is sufficient

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
          route: {
            select: { route_id: true, route_name: true, route_code: true },
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
          event_latitude: dto.latitude ?? null,
          event_longitude: dto.longitude ?? null,
          checkpoint_id: dto.checkpointId ?? null,
          recorded_by_user_id: user.sub,
          event_occurred_at: dto.occurredAt
            ? new Date(dto.occurredAt)
            : new Date(),
        },
      }),
    ]);

    // Publish RabbitMQ event
    await this.amqpConnection.publish(
      'escv.events',
      'shipment.status_changed',
      {
        shipment_id: updatedShipment.shipment_id,
        old_status: shipment.shipment_status,
        new_status: dto.status,
        event_id: event.shipment_event_id,
        occurred_at: event.event_occurred_at,
      },
    );

    this.logger.log(
      `Shipment ${updatedShipment.shipment_reference_number} status updated to "${dto.status}"`,
    );

    return this.formatShipment(updatedShipment);
  }

  // ---------- Remove ----------

  async remove(user: RequestUser, id: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { shipment_id: id },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    // Only shipper of the org or admin can delete
    await this.enforceEditAccess(user, shipment);

    // Only draft shipments can be deleted
    if (shipment.shipment_status !== 'draft') {
      throw new BadRequestException('Only draft shipments can be deleted');
    }

    await this.prisma.shipment.delete({
      where: { shipment_id: id },
    });

    this.logger.log(
      `Shipment deleted: ${shipment.shipment_reference_number} (ID: ${shipment.shipment_id})`,
    );

    return { message: 'Shipment deleted successfully' };
  }

  // ---------- Private Helpers ----------

  private async buildWhereClause(
    user: RequestUser,
    query: QueryShipmentDto,
  ): Promise<Prisma.ShipmentWhereInput> {
    const where: Prisma.ShipmentWhereInput = {};

    // Role-based visibility
    if (user.role === 'shipper' || user.role === 'carrier') {
      const dbUser = await this.prisma.user.findUnique({
        where: { user_id: user.sub },
        select: { organization_id: true },
      });

      if (dbUser) {
        if (user.role === 'shipper') {
          where.shipper_organization_id = dbUser.organization_id;
        } else {
          // carrier sees shipments where their org is the carrier
          where.carrier_organization_id = dbUser.organization_id;
        }
      }
    }
    // Admins and regulators see all

    // Filters
    if (query.status) {
      where.shipment_status = query.status;
    }

    if (query.search) {
      where.OR = [
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
      ];
    }

    // Only admins and regulators can filter by carrier org
    if (
      query.carrierOrganizationId &&
      (user.role === 'admin' || user.role === 'regulator')
    ) {
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

    return where;
  }

  /**
   * Enforce that a user can view a given shipment.
   * - Admins and regulators see everything.
   * - Shippers see shipments where their org is the shipper.
   * - Carriers see shipments where their org is the carrier.
   */
  private async enforceViewAccess(user: RequestUser, shipment: any) {
    if (user.role === 'admin' || user.role === 'regulator') return;

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

    if (!isShipperOrg && !isCarrierOrg) {
      throw new ForbiddenException('You do not have access to this shipment');
    }
  }

  /**
   * Enforce that a user can edit a given shipment.
   * Only the shipper org or an admin can edit.
   */
  private async enforceEditAccess(user: RequestUser, shipment: any) {
    if (user.role === 'admin') return;

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

  /**
   * Validates status transition against the full state machine.
   */
  private isValidTransition(current: string, next: string): boolean {
    const allowed = STATUS_TRANSITIONS[current];
    return allowed ? allowed.includes(next) : false;
  }

  private formatShipment(shipment: any) {
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
      route: shipment.route,
      currentCheckpoint: shipment.current_checkpoint,
      createdBy: shipment.created_by
        ? {
            id: shipment.created_by.user_id,
            firstName: shipment.created_by.user_first_name,
            lastName: shipment.created_by.user_last_name,
          }
        : null,
      events: shipment.events
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
