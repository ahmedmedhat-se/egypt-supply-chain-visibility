import { Controller, Get, Patch, Param, Query } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { QueryAlertsDto } from './dto/alerts.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Alerts')
@ApiBearerAuth()
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user alerts' })
  async getMyAlerts(@CurrentUser() user: any, @Query() query: QueryAlertsDto) {
    return this.alertsService.getUserAlerts(user.sub, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread alerts count' })
  async getUnreadCount(@CurrentUser() user: any) {
    return this.alertsService.getUnreadCount(user.sub);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all alerts as read' })
  async markAllAsRead(@CurrentUser() user: any) {
    return this.alertsService.markAllAsRead(user.sub);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark specific alert as read' })
  async markAsRead(@CurrentUser() user: any, @Param('id') id: string) {
    return this.alertsService.markAsRead(user.sub, id);
  }

  @Patch(':id/resolve')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Mark an alert as resolved (org-scoped)' })
  @ApiResponse({ status: 200, description: 'Alert resolved.' })
  @ApiResponse({ status: 404, description: 'Alert not found.' })
  async resolve(@Param('id') id: string, @CurrentUser() user: any) {
    return this.alertsService.resolve(user, id);
  }
}
