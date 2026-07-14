import { Controller, Post, Body, Param, Get, Delete } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

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
  @ApiOperation({ summary: 'Get all pending invitations for the organization' })
  async getInvitations(
    @Param('orgId') orgId: string,
    @CurrentUser() user: any,
  ) {
    return this.organizationsService.getInvitations(orgId, user.sub);
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
  @ApiOperation({ summary: 'Get all active members in the organization' })
  async getMembers(@Param('orgId') orgId: string, @CurrentUser() user: any) {
    return this.organizationsService.getMembers(orgId, user.sub);
  }
}
