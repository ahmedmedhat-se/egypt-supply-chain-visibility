import {
  Injectable,
  ForbiddenException,
  ConflictException,
  Logger,
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
    private ConfigService: ConfigService,
  ) {}

  async createInvitation(
    orgId: string,
    dto: CreateInvitationDto,
    userId: string,
  ) {
    const admin = await this.prisma.user.findFirst({
      where: { user_id: userId, organization_id: orgId, user_role: 'admin' },
    });
    if (!admin) {
      throw new ForbiddenException('Only an admin can invite members');
    }

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
    const frontendUrl = this.ConfigService.get<string>(
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
}
