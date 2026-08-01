import { Controller, Post, Body, Param, Get, Delete, Patch, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('Organizations')
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post(':orgId/invitations')
  @Roles('admin')
  @ApiOperation({ summary: 'Invite a new user to the organization' })
  async invite(
    @Param('orgId') orgId: string,
    @Body() dto: CreateInvitationDto,
    @CurrentUser() user: any,
  ) {
    return this.organizationsService.createInvitation(orgId, dto, user.sub);
  }

  @Get(':orgId/invitations')
  @Roles('admin')
  @ApiOperation({ summary: 'Get all invitations for the organization' })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async getInvitations(
    @Param('orgId') orgId: string,
    @Query('status') status: string | undefined,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @CurrentUser() user: any,
  ) {
    return this.organizationsService.getInvitations(orgId, status, page, limit, user.sub);
  }

  @Post(':orgId/invitations/:invitationId/resend')
  @Roles('admin')
  @ApiOperation({ summary: 'Resend a pending invitation' })
  async resendInvitation(
    @Param('orgId') orgId: string,
    @Param('invitationId') invitationId: string,
    @CurrentUser() user: any,
  ) {
    return this.organizationsService.resendInvitation(
      orgId,
      invitationId,
      user.sub,
    );
  }

  @Delete(':orgId/invitations/:invitationId')
  @Roles('admin')
  @ApiOperation({ summary: 'Cancel a pending invitation' })
  async cancelInvitation(
    @Param('orgId') orgId: string,
    @Param('invitationId') invitationId: string,
    @CurrentUser() user: any,
  ) {
    return this.organizationsService.cancelInvitation(
      orgId,
      invitationId,
      user.sub,
    );
  }

  @Get(':orgId/members')
  @Roles('admin')
  @ApiOperation({ summary: 'Get all members in the organization' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async getMembers(
    @Param('orgId') orgId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @CurrentUser() user: any,
  ) {
    return this.organizationsService.getMembers(orgId, page, limit, user.sub);
  }

  @Patch(':orgId/members/:userId/deactivate')
  @Roles('admin')
  @ApiOperation({ summary: 'Deactivate a member in the organization' })
  async deactivateMember(
    @Param('orgId') orgId: string,
    @Param('userId') userId: string,
    @CurrentUser() user: any,
  ) {
    return this.organizationsService.deactivateMember(orgId, userId, user.sub);
  }

  @Patch(':orgId/members/:userId/activate')
  @Roles('admin')
  @ApiOperation({ summary: 'Activate a member in the organization' })
  async activateMember(
    @Param('orgId') orgId: string,
    @Param('userId') userId: string,
    @CurrentUser() user: any,
  ) {
    return this.organizationsService.activateMember(orgId, userId, user.sub);
  }
}