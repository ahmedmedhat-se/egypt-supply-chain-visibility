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
import { RoutesService } from './routes.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { AddRouteCheckpointDto } from './dto/add-route-checkpoint.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Routes')
@Controller('routes')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  // ---------- Route CRUD ----------

  @Post()
  @Roles('super_admin')
  @ApiOperation({ summary: 'Create a new route' })
  @ApiResponse({ status: 201, description: 'Route created successfully.' })
  @ApiResponse({ status: 409, description: 'Route code conflict.' })
  async create(@Body() dto: CreateRouteDto) {
    return this.routesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all active routes' })
  @ApiResponse({ status: 200, description: 'Returns all routes.' })
  async findAll() {
    return this.routesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a route by ID with checkpoints' })
  @ApiResponse({ status: 200, description: 'Returns the route.' })
  @ApiResponse({ status: 404, description: 'Route not found.' })
  async findOne(@Param('id') id: string) {
    return this.routesService.findOne(id);
  }

  @Put(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Update a route' })
  @ApiResponse({ status: 200, description: 'Route updated successfully.' })
  @ApiResponse({ status: 404, description: 'Route not found.' })
  async update(@Param('id') id: string, @Body() dto: UpdateRouteDto) {
    return this.routesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('super_admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a route (deactivate)' })
  @ApiResponse({ status: 200, description: 'Route deactivated.' })
  @ApiResponse({ status: 404, description: 'Route not found.' })
  async remove(@Param('id') id: string) {
    return this.routesService.remove(id);
  }

  // ---------- Route Checkpoint sub-resource ----------

  @Post(':routeId/checkpoints')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Add a checkpoint to a route' })
  @ApiResponse({ status: 201, description: 'Checkpoint added to route.' })
  @ApiResponse({ status: 404, description: 'Route or checkpoint not found.' })
  @ApiResponse({ status: 409, description: 'Duplicate sequence or checkpoint.' })
  async addCheckpoint(
    @Param('routeId') routeId: string,
    @Body() dto: AddRouteCheckpointDto,
  ) {
    return this.routesService.addCheckpoint(routeId, dto);
  }

  @Delete(':routeId/checkpoints/:checkpointId')
  @Roles('super_admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a checkpoint from a route' })
  @ApiResponse({ status: 200, description: 'Checkpoint removed from route.' })
  @ApiResponse({ status: 404, description: 'Route or route checkpoint not found.' })
  async removeCheckpoint(
    @Param('routeId') routeId: string,
    @Param('checkpointId') checkpointId: string,
  ) {
    return this.routesService.removeCheckpoint(routeId, checkpointId);
  }
}
