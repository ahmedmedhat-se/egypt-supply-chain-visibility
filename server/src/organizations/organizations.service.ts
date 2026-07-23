import {
  Injectable,
  ForbiddenException,
  ConflictException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { randomUUID } from 'crypto';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly amqpConnection: AmqpConnection,
    private readonly configService: ConfigService,
  ) {}

  async createInvitation(
    orgId: string,
    dto: CreateInvitationDto,
    userId: string,
  ) {
    await this.ensureOrgAdminOrSuperAdmin(userId, orgId);

    const existingUser = await this.prisma.user.findUnique({
      where: { user_email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    // Create invitation
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invitation = await this.prisma.invitation.create({
      data: {
        organization_id: orgId,
        invited_email: dto.email,
        invited_role: dto.role,
        token,
        created_by_user_id: userId,
        expires_at: expiresAt,
      },
    });

    // Build invite link
    const frontendUrl = this.configService.get<string>(
      'CORS_ORIGIN',
      'http://localhost:5173',
    );
    const inviteLink = `${frontendUrl}/accept-invitation?token=${token}`;

    // Publish event to RabbitMQ
    await this.amqpConnection.publish('escv.events', 'invitation.created', {
      email: dto.email,
      inviteLink,
    });

    this.logger.log(`Invitation created for ${dto.email} (role ${dto.role})`);

    return {
      id: invitation.invitation_id,
      email: dto.email,
      role: dto.role,
      expiresAt,
    };
  }

  async getInvitations(orgId: string, userId: string) {
    await this.ensureOrgAdminOrSuperAdmin(userId, orgId);

    return this.prisma.invitation.findMany({
      where: { organization_id: orgId, status: 'pending' },
      select: {
        invitation_id: true,
        invited_email: true,
        invited_role: true,
        expires_at: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async resendInvitation(orgId: string, invitationId: string, userId: string) {
    await this.ensureOrgAdminOrSuperAdmin(userId, orgId);

    const invitation = await this.prisma.invitation.findFirst({
      where: { invitation_id: invitationId, organization_id: orgId },
    });

    if (!invitation || invitation.status !== 'pending') {
      throw new NotFoundException('Valid pending invitation not found');
    }

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.invitation.update({
      where: { invitation_id: invitationId },
      data: { token, expires_at: expiresAt },
    });

    const frontendUrl = this.configService.get<string>(
      'CORS_ORIGIN',
      'http://localhost:5173',
    );
    const inviteLink = `${frontendUrl}/accept-invitation?token=${token}`;

    await this.amqpConnection.publish('escv.events', 'invitation.created', {
      email: invitation.invited_email,
      inviteLink,
    });

    this.logger.log(`Invitation resent for ${invitation.invited_email}`);

    return { message: 'Invitation resent successfully' };
  }

  async cancelInvitation(orgId: string, invitationId: string, userId: string) {
    await this.ensureOrgAdminOrSuperAdmin(userId, orgId);

    const invitation = await this.prisma.invitation.findFirst({
      where: { invitation_id: invitationId, organization_id: orgId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    await this.prisma.invitation.delete({
      where: { invitation_id: invitationId },
    });

    this.logger.log(`Invitation ${invitationId} canceled and deleted`);

    return { message: 'Invitation canceled successfully' };
  }

  async getMembers(orgId: string, userId: string) {
    await this.ensureOrgAdminOrSuperAdmin(userId, orgId);

    return this.prisma.user.findMany({
      where: { organization_id: orgId },
      select: {
        user_id: true,
        user_email: true,
        user_first_name: true,
        user_last_name: true,
        user_role: true,
        user_is_active: true,
        user_created_at: true,
      },
      orderBy: { user_first_name: 'asc' },
    });
  }

  private async ensureOrgAdminOrSuperAdmin(userId: string, orgId: string) {
    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
      select: { user_role: true, organization_id: true },
    });

    if (!user) {
      throw new ForbiddenException('Access denied');
    }

    // super_admin can manage any organization
    if (user.user_role === 'super_admin') {
      return;
    }

    // org admin must belong to the target organization
    if (user.user_role === 'admin' && user.organization_id === orgId) {
      return;
    }

    throw new ForbiddenException('Only an admin can perform this action');
  }
}
