import {
  Injectable,
  ForbiddenException,
  ConflictException,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { randomUUID } from 'crypto';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../audit/audit.service';
import { buildPaginationMeta } from '../common/pagination/pagination.helper';
import {
  buildAuditLogWhere,
  AUDIT_LOG_INCLUDE,
} from '../common/audit/audit-log-filters.helper';
import { QueryAuditLogsDto } from '../common/dto/query-audit-logs.dto';

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly amqpConnection: AmqpConnection,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
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

    const org = await this.prisma.organization.findUnique({
      where: { organization_id: orgId },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    if (
      dto.role !== 'admin' &&
      dto.role.toLowerCase() !== org.organization_type.toLowerCase()
    ) {
      throw new ConflictException(
        `Role mismatch: Cannot invite a '${dto.role}' to a '${org.organization_type}' organization.`,
      );
    }

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

    const frontendUrl = this.configService.get<string>(
      'CORS_ORIGIN',
      'http://localhost:5173',
    );
    const inviteLink = `${frontendUrl}/accept-invitation?token=${token}`;

    await this.amqpConnection.publish('escv.events', 'invitation.created', {
      email: dto.email,
      inviteLink,
    });

    this.logger.log(`Invitation created for ${dto.email} (role ${dto.role})`);

    this.auditService.log({
      action: 'ORG_INVITATION_CREATE',
      resourceType: 'organization',
      resourceId: orgId,
      userId,
      newValue: {
        invitationId: invitation.invitation_id,
        email: dto.email,
        role: dto.role,
        expiresAt,
      },
    });

    return {
      id: invitation.invitation_id,
      email: dto.email,
      role: dto.role,
      expiresAt,
    };
  }

  async getInvitations(
    orgId: string,
    status?: string,
    page: number = 1,
    limit: number = 10,
    userId?: string,
  ) {
    if (userId) await this.ensureOrgAdminOrSuperAdmin(userId, orgId);

    const skip = (page - 1) * limit;
    const take = limit;

    const where: any = { organization_id: orgId };
    if (status) where.status = status;

    const [invitations, totalItems] = await Promise.all([
      this.prisma.invitation.findMany({
        where,
        skip,
        take,
        select: {
          invitation_id: true,
          invited_email: true,
          invited_role: true,
          status: true,
          expires_at: true,
          created_at: true,
        },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.invitation.count({ where }),
    ]);

    return {
      data: invitations,
      meta: buildPaginationMeta(page, limit, totalItems),
    };
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

    this.auditService.log({
      action: 'ORG_INVITATION_RESEND',
      resourceType: 'organization',
      resourceId: orgId,
      userId,
      newValue: {
        invitationId,
        email: invitation.invited_email,
        expiresAt,
      },
    });

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

    this.auditService.log({
      action: 'ORG_INVITATION_CANCEL',
      resourceType: 'organization',
      resourceId: orgId,
      userId,
      oldValue: {
        invitationId,
        email: invitation.invited_email,
        role: invitation.invited_role,
        status: invitation.status,
      },
    });

    return { message: 'Invitation canceled successfully' };
  }

  async getMembers(
    orgId: string,
    page: number = 1,
    limit: number = 10,
    isActive?: boolean,
    userId?: string,
  ) {
    if (userId) await this.ensureOrgAdminOrSuperAdmin(userId, orgId);

    const skip = (page - 1) * limit;
    const take = limit;

    const where: any = { organization_id: orgId };
    if (isActive !== undefined) where.user_is_active = isActive;

    const [members, totalItems] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
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
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: members,
      meta: buildPaginationMeta(page, limit, totalItems),
    };
  }

  async getAuditLogs(
    orgId: string,
    query: QueryAuditLogsDto,
    requestingUserId: string,
  ) {
    await this.ensureOrgAdminOrSuperAdmin(requestingUserId, orgId);

    const { page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;
    const where = buildAuditLogWhere(query, orgId);

    const [logs, totalItems] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: Math.min(limit, 100),
        orderBy: { audit_performed_at: 'desc' },
        include: AUDIT_LOG_INCLUDE,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: buildPaginationMeta(page, limit, totalItems),
    };
  }

  async deactivateMember(
    orgId: string,
    targetUserId: string,
    requestingUserId: string,
  ) {
    await this.ensureOrgAdminOrSuperAdmin(requestingUserId, orgId);

    if (targetUserId === requestingUserId) {
      throw new BadRequestException('Cannot deactivate your own account');
    }

    const user = await this.prisma.user.findFirst({
      where: { user_id: targetUserId, organization_id: orgId },
    });

    if (!user) {
      throw new NotFoundException('User not found in this organization');
    }

    const updated = await this.prisma.user.update({
      where: { user_id: targetUserId },
      data: { user_is_active: false },
      select: {
        user_id: true,
        user_email: true,
        user_first_name: true,
        user_last_name: true,
        user_role: true,
        user_is_active: true,
      },
    });

    this.auditService.log({
      action: 'ORG_MEMBER_DEACTIVATE',
      resourceType: 'organization',
      resourceId: orgId,
      userId: requestingUserId,
      oldValue: { userId: targetUserId, isActive: user.user_is_active },
      newValue: { userId: updated.user_id, isActive: updated.user_is_active },
    });

    return updated;
  }

  async activateMember(
    orgId: string,
    targetUserId: string,
    requestingUserId: string,
  ) {
    await this.ensureOrgAdminOrSuperAdmin(requestingUserId, orgId);

    const user = await this.prisma.user.findFirst({
      where: { user_id: targetUserId, organization_id: orgId },
    });

    if (!user) {
      throw new NotFoundException('User not found in this organization');
    }

    const updated = await this.prisma.user.update({
      where: { user_id: targetUserId },
      data: { user_is_active: true },
      select: {
        user_id: true,
        user_email: true,
        user_first_name: true,
        user_last_name: true,
        user_role: true,
        user_is_active: true,
      },
    });

    this.auditService.log({
      action: 'ORG_MEMBER_ACTIVATE',
      resourceType: 'organization',
      resourceId: orgId,
      userId: requestingUserId,
      oldValue: { userId: targetUserId, isActive: user.user_is_active },
      newValue: { userId: updated.user_id, isActive: updated.user_is_active },
    });

    return updated;
  }

  private async ensureOrgAdminOrSuperAdmin(userId: string, orgId: string) {
    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
      select: { user_role: true, organization_id: true },
    });

    if (!user) {
      throw new ForbiddenException('Access denied');
    }

    if (user.user_role === 'super_admin') {
      return;
    }

    if (user.user_role === 'admin' && user.organization_id === orgId) {
      return;
    }

    throw new ForbiddenException('Only an admin can perform this action');
  }
}
