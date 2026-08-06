import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCheckpointDto } from './dto/create-checkpoint.dto';
import { UpdateCheckpointDto } from './dto/update-checkpoint.dto';
import { AuditService } from '../audit/audit.service';
import { buildPaginationMeta } from '../common/pagination/pagination.helper';
import type { Prisma } from '@prisma/client';

@Injectable()
export class CheckpointsService {
  private readonly logger = new Logger(CheckpointsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateCheckpointDto) {
    const existing = await this.prisma.checkpoint.findUnique({
      where: { checkpoint_code: dto.code },
    });
    if (existing) {
      throw new ConflictException(
        `Checkpoint with code "${dto.code}" already exists`,
      );
    }

    const checkpoint = await this.prisma.checkpoint.create({
      data: {
        checkpoint_name: dto.name,
        checkpoint_code: dto.code,
        checkpoint_type: dto.type,
        checkpoint_city: dto.city,
        checkpoint_latitude: dto.latitude,
        checkpoint_longitude: dto.longitude,
      },
    });

    this.logger.log(
      `Checkpoint created: ${checkpoint.checkpoint_code} (${checkpoint.checkpoint_id})`,
    );

    this.auditService.log({
      action: 'CHECKPOINT_CREATE',
      resourceType: 'checkpoint',
      resourceId: checkpoint.checkpoint_id,
      newValue: this.auditPayload(checkpoint),
    });

    return this.formatCheckpoint(checkpoint);
  }

  async findAll(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;
    const where: Prisma.CheckpointWhereInput = {};

    if (search) {
      where.OR = [
        { checkpoint_name: { contains: search, mode: 'insensitive' } },
        { checkpoint_code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [checkpoints, totalItems] = await Promise.all([
      this.prisma.checkpoint.findMany({
        where,
        skip,
        take: limit,
        orderBy: { checkpoint_name: 'asc' },
      }),
      this.prisma.checkpoint.count({ where }),
    ]);

    return {
      data: checkpoints.map((c) => this.formatCheckpoint(c)),
      meta: buildPaginationMeta(page, limit, totalItems),
    };
  }

  async findOne(id: string) {
    const checkpoint = await this.prisma.checkpoint.findUnique({
      where: { checkpoint_id: id },
    });

    if (!checkpoint) {
      throw new NotFoundException('Checkpoint not found');
    }

    return this.formatCheckpoint(checkpoint);
  }

  async update(id: string, dto: UpdateCheckpointDto) {
    const checkpoint = await this.prisma.checkpoint.findUnique({
      where: { checkpoint_id: id },
    });

    if (!checkpoint) {
      throw new NotFoundException('Checkpoint not found');
    }

    if (dto.code && dto.code !== checkpoint.checkpoint_code) {
      const existing = await this.prisma.checkpoint.findUnique({
        where: { checkpoint_code: dto.code },
      });
      if (existing) {
        throw new ConflictException(
          `Checkpoint with code "${dto.code}" already exists`,
        );
      }
    }

    const updated = await this.prisma.checkpoint.update({
      where: { checkpoint_id: id },
      data: {
        ...(dto.name !== undefined && { checkpoint_name: dto.name }),
        ...(dto.code !== undefined && { checkpoint_code: dto.code }),
        ...(dto.type !== undefined && { checkpoint_type: dto.type }),
        ...(dto.city !== undefined && { checkpoint_city: dto.city }),
        ...(dto.latitude !== undefined && {
          checkpoint_latitude: dto.latitude,
        }),
        ...(dto.longitude !== undefined && {
          checkpoint_longitude: dto.longitude,
        }),
      },
    });

    this.logger.log(`Checkpoint updated: ${updated.checkpoint_code}`);

    this.auditService.log({
      action: 'CHECKPOINT_UPDATE',
      resourceType: 'checkpoint',
      resourceId: updated.checkpoint_id,
      oldValue: this.auditPayload(checkpoint),
      newValue: this.auditPayload(updated),
    });

    return this.formatCheckpoint(updated);
  }

  async remove(id: string) {
    const checkpoint = await this.prisma.checkpoint.findUnique({
      where: { checkpoint_id: id },
    });

    if (!checkpoint) {
      throw new NotFoundException('Checkpoint not found');
    }

    await this.prisma.checkpoint.update({
      where: { checkpoint_id: id },
      data: { checkpoint_is_active: false },
    });

    this.logger.log(
      `Checkpoint deactivated: ${checkpoint.checkpoint_code} (${id})`,
    );

    this.auditService.log({
      action: 'CHECKPOINT_REMOVE',
      resourceType: 'checkpoint',
      resourceId: id,
      oldValue: this.auditPayload(checkpoint),
      newValue: { isActive: false },
    });

    return { message: 'Checkpoint deactivated successfully' };
  }

  async activate(id: string) {
    const checkpoint = await this.prisma.checkpoint.findUnique({
      where: { checkpoint_id: id },
    });

    if (!checkpoint) {
      throw new NotFoundException('Checkpoint not found');
    }

    const updated = await this.prisma.checkpoint.update({
      where: { checkpoint_id: id },
      data: { checkpoint_is_active: true },
    });

    this.logger.log(`Checkpoint activated: ${updated.checkpoint_code} (${id})`);

    this.auditService.log({
      action: 'CHECKPOINT_ACTIVATE',
      resourceType: 'checkpoint',
      resourceId: id,
      oldValue: this.auditPayload(checkpoint),
      newValue: this.auditPayload(updated),
    });

    return this.formatCheckpoint(updated);
  }

  async deactivate(id: string) {
    const checkpoint = await this.prisma.checkpoint.findUnique({
      where: { checkpoint_id: id },
    });

    if (!checkpoint) {
      throw new NotFoundException('Checkpoint not found');
    }

    const activeRouteCount = await this.prisma.routeCheckpoint.count({
      where: {
        checkpoint_id: id,
        route: { route_is_active: true },
      },
    });

    if (activeRouteCount > 0) {
      throw new ConflictException(
        `Cannot deactivate checkpoint "${checkpoint.checkpoint_code}" — it is used by ${activeRouteCount} active route${activeRouteCount > 1 ? 's' : ''}. Remove it from the route(s) first.`,
      );
    }

    const updated = await this.prisma.checkpoint.update({
      where: { checkpoint_id: id },
      data: { checkpoint_is_active: false },
    });

    this.logger.log(
      `Checkpoint deactivated: ${updated.checkpoint_code} (${id})`,
    );

    this.auditService.log({
      action: 'CHECKPOINT_DEACTIVATE',
      resourceType: 'checkpoint',
      resourceId: id,
      oldValue: this.auditPayload(checkpoint),
      newValue: this.auditPayload(updated),
    });

    return this.formatCheckpoint(updated);
  }

  private formatCheckpoint(checkpoint: any) {
    return {
      id: checkpoint.checkpoint_id,
      name: checkpoint.checkpoint_name,
      code: checkpoint.checkpoint_code,
      type: checkpoint.checkpoint_type,
      city: checkpoint.checkpoint_city,
      latitude: Number(checkpoint.checkpoint_latitude),
      longitude: Number(checkpoint.checkpoint_longitude),
      isActive: checkpoint.checkpoint_is_active,
      createdAt: checkpoint.checkpoint_created_at,
      updatedAt: checkpoint.checkpoint_updated_at,
    };
  }

  /** Whitelisted snapshot for audit rows — never includes anything sensitive. */
  private auditPayload(checkpoint: any) {
    return {
      name: checkpoint.checkpoint_name,
      code: checkpoint.checkpoint_code,
      type: checkpoint.checkpoint_type,
      city: checkpoint.checkpoint_city,
      latitude:
        checkpoint.checkpoint_latitude != null
          ? Number(checkpoint.checkpoint_latitude)
          : null,
      longitude:
        checkpoint.checkpoint_longitude != null
          ? Number(checkpoint.checkpoint_longitude)
          : null,
      isActive: checkpoint.checkpoint_is_active,
    };
  }
}
