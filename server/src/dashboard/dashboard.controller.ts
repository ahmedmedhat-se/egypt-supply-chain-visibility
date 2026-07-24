import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DashboardStatsDto } from './dto/dashboard.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // @Get('stats')
  // @ApiOperation({ summary: 'Get dashboard statistics scoped to the authenticated user\'s organization' })
  // @ApiResponse({ status: 200, description: 'Dashboard stats returned', type: DashboardStatsDto })
  // async getStats(
  //   @CurrentUser() user: { sub: string; role: string; organizationId: string },
  // ): Promise<DashboardStatsDto> {
  //   return this.dashboardService.getStats(user.role, user.organizationId);
  // }
}
