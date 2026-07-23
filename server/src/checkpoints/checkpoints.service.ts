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

  async create(dto: CreateCheckpointDto) {}

  async findAll() {}

  async findOne(id: string) {}

  async update(id: string, dto: UpdateCheckpointDto) {}

  async remove(id: string) {}
}
