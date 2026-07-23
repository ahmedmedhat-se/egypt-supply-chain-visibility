import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { AddRouteCheckpointDto } from './dto/add-route-checkpoint.dto';

@Injectable()
export class RoutesService {
  private readonly logger = new Logger(RoutesService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ---------- Route CRUD ----------

  async create(dto: CreateRouteDto) {
    // Check unique code
    const existing = await this.prisma.route.findUnique({
      where: { route_code: dto.code },
    });
    if (existing) {
      throw new ConflictException(
        `Route with code "${dto.code}" already exists`,
      );
    }

    const route = await this.prisma.route.create({
      data: {
        route_name: dto.name,
        route_code: dto.code,
        route_origin_city: dto.originCity,
        route_destination_city: dto.destinationCity,
        route_estimated_days: dto.estimatedDays ?? null,
      },
    });

    this.logger.log(`Route created: ${route.route_code} (${route.route_id})`);

    return this.formatRoute(route);
  }

  async findAll() {
    const routes = await this.prisma.route.findMany({
      where: { route_is_active: true },
      orderBy: { route_name: 'asc' },
      include: {
        route_checkpoints: {
          include: { checkpoint: true },
          orderBy: { sequence_order: 'asc' },
        },
        _count: { select: { shipments: true } },
      },
    });

    return {
      data: routes.map((r) => this.formatRoute(r)),
      meta: { total: routes.length },
    };
  }

  async findOne(id: string) {
    const route = await this.prisma.route.findUnique({
      where: { route_id: id },
      include: {
        route_checkpoints: {
          include: { checkpoint: true },
          orderBy: { sequence_order: 'asc' },
        },
        _count: { select: { shipments: true } },
      },
    });

    if (!route) {
      throw new NotFoundException('Route not found');
    }

    return this.formatRoute(route);
  }

  async update(id: string, dto: UpdateRouteDto) {
    const route = await this.prisma.route.findUnique({
      where: { route_id: id },
    });

    if (!route) {
      throw new NotFoundException('Route not found');
    }

    // Check unique code if being changed
    if (dto.code && dto.code !== route.route_code) {
      const existing = await this.prisma.route.findUnique({
        where: { route_code: dto.code },
      });
      if (existing) {
        throw new ConflictException(
          `Route with code "${dto.code}" already exists`,
        );
      }
    }

    const updated = await this.prisma.route.update({
      where: { route_id: id },
      data: {
        ...(dto.name !== undefined && { route_name: dto.name }),
        ...(dto.code !== undefined && { route_code: dto.code }),
        ...(dto.originCity !== undefined && {
          route_origin_city: dto.originCity,
        }),
        ...(dto.destinationCity !== undefined && {
          route_destination_city: dto.destinationCity,
        }),
        ...(dto.estimatedDays !== undefined && {
          route_estimated_days: dto.estimatedDays,
        }),
      },
    });

    this.logger.log(`Route updated: ${updated.route_code}`);

    return this.formatRoute(updated);
  }

  async remove(id: string) {
    const route = await this.prisma.route.findUnique({
      where: { route_id: id },
    });

    if (!route) {
      throw new NotFoundException('Route not found');
    }

    // Soft delete
    await this.prisma.route.update({
      where: { route_id: id },
      data: { route_is_active: false },
    });

    this.logger.log(`Route deactivated: ${route.route_code} (${id})`);

    return { message: 'Route deactivated successfully' };
  }

  // ---------- Route Checkpoint sub-resource ----------

  async addCheckpoint(routeId: string, dto: AddRouteCheckpointDto) {
    // Verify route exists
    const route = await this.prisma.route.findUnique({
      where: { route_id: routeId },
    });
    if (!route) {
      throw new NotFoundException('Route not found');
    }

    // Verify checkpoint exists
    const checkpoint = await this.prisma.checkpoint.findUnique({
      where: { checkpoint_id: dto.checkpointId },
    });
    if (!checkpoint) {
      throw new NotFoundException('Checkpoint not found');
    }

    // Check sequence order uniqueness for this route
    const existingSequence = await this.prisma.routeCheckpoint.findUnique({
      where: {
        route_id_sequence_order: {
          route_id: routeId,
          sequence_order: dto.sequenceOrder,
        },
      },
    });
    if (existingSequence) {
      throw new ConflictException(
        `Sequence order ${dto.sequenceOrder} already exists for this route`,
      );
    }

    // Check if checkpoint is already added to this route
    const existingCheckpoint = await this.prisma.routeCheckpoint.findFirst({
      where: {
        route_id: routeId,
        checkpoint_id: dto.checkpointId,
      },
    });
    if (existingCheckpoint) {
      throw new ConflictException(
        'Checkpoint is already assigned to this route',
      );
    }

    const routeCheckpoint = await this.prisma.routeCheckpoint.create({
      data: {
        route_id: routeId,
        checkpoint_id: dto.checkpointId,
        sequence_order: dto.sequenceOrder,
      },
      include: { checkpoint: true },
    });

    this.logger.log(
      `Checkpoint ${dto.checkpointId} added to route ${routeId} at position ${dto.sequenceOrder}`,
    );

    return {
      checkpointId: routeCheckpoint.checkpoint_id,
      sequenceOrder: routeCheckpoint.sequence_order,
      checkpoint: {
        id: routeCheckpoint.checkpoint.checkpoint_id,
        name: routeCheckpoint.checkpoint.checkpoint_name,
        code: routeCheckpoint.checkpoint.checkpoint_code,
        type: routeCheckpoint.checkpoint.checkpoint_type,
        city: routeCheckpoint.checkpoint.checkpoint_city,
      },
    };
  }

  async removeCheckpoint(routeId: string, checkpointId: string) {
    const route = await this.prisma.route.findUnique({
      where: { route_id: routeId },
    });
    if (!route) {
      throw new NotFoundException('Route not found');
    }

    const routeCheckpoint = await this.prisma.routeCheckpoint.findFirst({
      where: {
        route_id: routeId,
        checkpoint_id: checkpointId,
      },
    });

    if (!routeCheckpoint) {
      throw new NotFoundException('Checkpoint is not assigned to this route');
    }

    await this.prisma.routeCheckpoint.delete({
      where: {
        route_checkpoint_id: routeCheckpoint.route_checkpoint_id,
      },
    });

    this.logger.log(`Checkpoint ${checkpointId} removed from route ${routeId}`);

    return { message: 'Checkpoint removed from route successfully' };
  }

  // ---------- Helpers ----------

  private formatRoute(route: any) {
    return {
      id: route.route_id,
      name: route.route_name,
      code: route.route_code,
      originCity: route.route_origin_city,
      destinationCity: route.route_destination_city,
      estimatedDays: route.route_estimated_days,
      isActive: route.route_is_active,
      checkpoints: route.route_checkpoints
        ? route.route_checkpoints.map((rc: any) => ({
            id: rc.checkpoint.checkpoint_id,
            name: rc.checkpoint.checkpoint_name,
            code: rc.checkpoint.checkpoint_code,
            type: rc.checkpoint.checkpoint_type,
            city: rc.checkpoint.checkpoint_city,
            latitude: Number(rc.checkpoint.checkpoint_latitude),
            longitude: Number(rc.checkpoint.checkpoint_longitude),
            sequenceOrder: rc.sequence_order,
          }))
        : undefined,
      shipmentCount: route._count?.shipments ?? undefined,
      createdAt: route.route_created_at,
      updatedAt: route.route_updated_at,
    };
  }
}
