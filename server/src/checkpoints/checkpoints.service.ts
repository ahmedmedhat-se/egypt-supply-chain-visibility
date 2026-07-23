import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCheckpointDto } from './dto/create-checkpoint.dto';
import { UpdateCheckpointDto } from './dto/update-checkpoint.dto';

@Injectable()
export class CheckpointsService {
  private readonly logger = new Logger(CheckpointsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCheckpointDto) {
    // Check unique code
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

    return this.formatCheckpoint(checkpoint);
  }

  async findAll() {
    const checkpoints = await this.prisma.checkpoint.findMany({
      orderBy: { checkpoint_name: 'asc' },
    });

    return {
      data: checkpoints.map((c) => this.formatCheckpoint(c)),
      meta: { total: checkpoints.length },
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

    // Check unique code if being changed
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

    return this.formatCheckpoint(updated);
  }

  async remove(id: string) {
    const checkpoint = await this.prisma.checkpoint.findUnique({
      where: { checkpoint_id: id },
    });

    if (!checkpoint) {
      throw new NotFoundException('Checkpoint not found');
    }

    // Soft delete — mark as inactive
    await this.prisma.checkpoint.update({
      where: { checkpoint_id: id },
      data: { checkpoint_is_active: false },
    });

    this.logger.log(
      `Checkpoint deactivated: ${checkpoint.checkpoint_code} (${id})`,
    );

    return { message: 'Checkpoint deactivated successfully' };
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
}
