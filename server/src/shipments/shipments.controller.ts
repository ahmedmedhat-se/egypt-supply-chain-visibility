import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ShipmentsService } from './shipments.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { UpdateShipmentStatusDto } from './dto/update-shipment-status.dto';
import { QueryShipmentDto } from './dto/query-shipment.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Shipments')
@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Post()
  @Roles('shipper', 'admin')
  @ApiOperation({ summary: 'Create a new shipment' })
  @ApiResponse({ status: 201, description: 'Shipment created successfully.' })
  @ApiResponse({ status: 409, description: 'Reference number conflict.' })
  async create(@Body() dto: CreateShipmentDto, @CurrentUser() user: any) {
    return this.shipmentsService.create(user, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List shipments with filtering and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of shipments.',
  })
  async findAll(@CurrentUser() user: any, @Query() query: QueryShipmentDto) {
    return this.shipmentsService.findAll(user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a shipment by ID' })
  @ApiResponse({ status: 200, description: 'Returns the shipment.' })
  @ApiResponse({ status: 404, description: 'Shipment not found.' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.shipmentsService.findOne(user, id);
  }

  @Put(':id')
  @Roles('shipper', 'admin')
  @ApiOperation({ summary: 'Update a shipment' })
  @ApiResponse({ status: 200, description: 'Shipment updated successfully.' })
  @ApiResponse({ status: 404, description: 'Shipment not found.' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateShipmentDto,
    @CurrentUser() user: any,
  ) {
    return this.shipmentsService.update(user, id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update shipment status with transition validation',
  })
  @ApiResponse({ status: 200, description: 'Shipment status updated.' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateShipmentStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.shipmentsService.updateStatus(user, id, dto);
  }

  @Delete(':id')
  @Roles('shipper', 'admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a draft shipment' })
  @ApiResponse({ status: 200, description: 'Shipment deleted.' })
  @ApiResponse({
    status: 400,
    description: 'Only draft shipments can be deleted.',
  })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.shipmentsService.remove(user, id);
  }
}
