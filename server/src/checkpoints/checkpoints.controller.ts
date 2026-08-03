import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { CheckpointsService } from './checkpoints.service';
import { CreateCheckpointDto } from './dto/create-checkpoint.dto';
import { UpdateCheckpointDto } from './dto/update-checkpoint.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
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
  @ApiOperation({ summary: 'List all checkpoints with pagination' })
  @ApiResponse({ status: 200, description: 'Returns paginated checkpoints.' })
  async findAll(@Query() query: PaginationDto) {
    return this.checkpointsService.findAll(query.page, query.limit);
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

  @Patch(':id/activate')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Activate a checkpoint' })
  @ApiResponse({ status: 200, description: 'Checkpoint activated.' })
  @ApiResponse({ status: 404, description: 'Checkpoint not found.' })
  async activate(@Param('id') id: string) {
    return this.checkpointsService.activate(id);
  }

  @Patch(':id/deactivate')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Deactivate a checkpoint' })
  @ApiResponse({ status: 200, description: 'Checkpoint deactivated.' })
  @ApiResponse({ status: 404, description: 'Checkpoint not found.' })
  async deactivate(@Param('id') id: string) {
    return this.checkpointsService.deactivate(id);
  }
}