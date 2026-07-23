import {
  Controller,
  Get,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { 
  AdminUpdateUserDto, 
  AdminUpdateOrganizationDto,
  AdminQueryUsersDto,
  AdminQueryOrganizationsDto,
  AdminQueryShipmentsDto,
  AdminBulkActionDto 
} from './dto/admin.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@Roles('super_admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard overview' })
  @ApiResponse({ status: 200, description: 'Dashboard overview returned' })
  async getDashboard(@CurrentUser() user: any) {
    return this.adminService.getDashboardOverview(user);
  }

  @Get('users')
  @ApiOperation({ summary: 'List all users with filtering' })
  @ApiResponse({ status: 200, description: 'Users list returned' })
  async listUsers(@Query() query: AdminQueryUsersDto) {
    return this.adminService.listUsers(query);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user details with full profile' })
  @ApiResponse({ status: 200, description: 'User details returned' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUser(@Param('id') id: string) {
    return this.adminService.getUser(id);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update any user details' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUser(
    @Param('id') id: string,
    @Body() dto: AdminUpdateUserDto,
    @CurrentUser() user: any,
  ) {
    return this.adminService.updateUser(id, dto, user);
  }

  @Patch('users/:id/deactivate')
  @ApiOperation({ summary: 'Deactivate user account' })
  @ApiResponse({ status: 200, description: 'User deactivated' })
  async deactivateUser(@Param('id') id: string, @CurrentUser() user: any) {
    return this.adminService.deactivateUser(id, user);
  }

  @Patch('users/:id/activate')
  @ApiOperation({ summary: 'Activate user account' })
  @ApiResponse({ status: 200, description: 'User activated' })
  async activateUser(@Param('id') id: string, @CurrentUser() user: any) {
    return this.adminService.activateUser(id, user);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete user (super admin only)' })
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: 200, description: 'User deleted' })
  async deleteUser(@Param('id') id: string, @CurrentUser() user: any) {
    return this.adminService.deleteUser(id, user);
  }

  @Get('organizations')
  @ApiOperation({ summary: 'List all organizations' })
  @ApiResponse({ status: 200, description: 'Organizations list returned' })
  async listOrganizations(@Query() query: AdminQueryOrganizationsDto) {
    return this.adminService.listOrganizations(query);
  }

  @Get('organizations/:id')
  @ApiOperation({ summary: 'Get organization details' })
  @ApiResponse({ status: 200, description: 'Organization details returned' })
  async getOrganization(@Param('id') id: string) {
    return this.adminService.getOrganization(id);
  }

  @Patch('organizations/:id')
  @ApiOperation({ summary: 'Update organization' })
  @ApiResponse({ status: 200, description: 'Organization updated' })
  async updateOrganization(
    @Param('id') id: string,
    @Body() dto: AdminUpdateOrganizationDto,
    @CurrentUser() user: any,
  ) {
    return this.adminService.updateOrganization(id, dto, user);
  }

  @Patch('organizations/:id/deactivate')
  @ApiOperation({ summary: 'Deactivate organization' })
  @ApiResponse({ status: 200, description: 'Organization deactivated' })
  async deactivateOrganization(@Param('id') id: string, @CurrentUser() user: any) {
    return this.adminService.deactivateOrganization(id, user);
  }

  @Get('shipments')
  @ApiOperation({ summary: 'List all shipments' })
  @ApiResponse({ status: 200, description: 'Shipments list returned' })
  async listShipments(@Query() query: AdminQueryShipmentsDto) {
    return this.adminService.listShipments(query);
  }

  @Get('shipments/:id')
  @ApiOperation({ summary: 'Get any shipment details' })
  @ApiResponse({ status: 200, description: 'Shipment details returned' })
  async getShipment(@Param('id') id: string) {
    return this.adminService.getShipment(id);
  }

  @Patch('shipments/:id/status')
  @ApiOperation({ summary: 'Update any shipment status' })
  @ApiResponse({ status: 200, description: 'Shipment status updated' })
  async updateShipmentStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @CurrentUser() user: any,
  ) {
    return this.adminService.updateShipmentStatus(id, status, user);
  }

  @Post('bulk-action')
  @ApiOperation({ summary: 'Perform bulk actions' })
  @ApiResponse({ status: 200, description: 'Bulk action completed' })
  async bulkAction(@Body() dto: AdminBulkActionDto, @CurrentUser() user: any) {
    return this.adminService.bulkAction(dto, user);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'View audit logs' })
  @ApiResponse({ status: 200, description: 'Audit logs returned' })
  async getAuditLogs(
    @Query('resourceType') resourceType?: string,
    @Query('resourceId') resourceId?: string,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getAuditLogs(resourceType, resourceId, limit);
  }
}