import { Controller, Get, Query } from '@nestjs/common';
import { MapService } from './map.service';
import { RouteQueryDto } from './dto/route-query.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Map')
@ApiBearerAuth()
@Controller('map')
export class MapController {
  constructor(private readonly mapService: MapService) {}

  @Get('route')
  @ApiOperation({
    summary:
      'Driving route between two coordinates (OSRM) with distance and duration',
  })
  async getRoute(@Query() query: RouteQueryDto) {
    const route = await this.mapService.getRoute(query.from, query.to);
    return { data: route };
  }
}
