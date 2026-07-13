import { Controller, Post, Body, Param } from '@nestjs/common';
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
}
