import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CheckpointsService } from './checkpoints.service';
import { CreateCheckpointDto } from './dto/create-checkpoint.dto';
import { UpdateCheckpointDto } from './dto/update-checkpoint.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Checkpoints')
@Controller('checkpoints')
export class CheckpointsController {
  constructor(private readonly checkpointsService: CheckpointsService) {}

  @Post()
  @Roles('super_admin')
  @ApiOperation({ summary: 'Create a new checkpoint' })
  @ApiResponse({ status: 201, description: 'Checkpoint created successfully.' })
  @ApiResponse({ status: 409, description: 'Checkpoint code conflict.' })
  async create(@Body() dto: CreateCheckpointDto) {
    return this.checkpointsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all checkpoints' })
  @ApiResponse({ status: 200, description: 'Returns all checkpoints.' })
  async findAll() {
    return this.checkpointsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a checkpoint by ID' })
  @ApiResponse({ status: 200, description: 'Returns the checkpoint.' })
  @ApiResponse({ status: 404, description: 'Checkpoint not found.' })
  async findOne(@Param('id') id: string) {
    return this.checkpointsService.findOne(id);
  }

  @Put(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Update a checkpoint' })
  @ApiResponse({ status: 200, description: 'Checkpoint updated successfully.' })
  @ApiResponse({ status: 404, description: 'Checkpoint not found.' })
  async update(@Param('id') id: string, @Body() dto: UpdateCheckpointDto) {
    return this.checkpointsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('super_admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a checkpoint (deactivate)' })
  @ApiResponse({ status: 200, description: 'Checkpoint deactivated.' })
  @ApiResponse({ status: 404, description: 'Checkpoint not found.' })
  async remove(@Param('id') id: string) {
    return this.checkpointsService.remove(id);
  }
}
