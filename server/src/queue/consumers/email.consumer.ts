import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { MailService } from '../../mail/mail.service';

interface InvitationCreatedEvent {
  email: string;
  inviteLink: string;
}

@Injectable()
export class EmailConsumer {
  private readonly logger = new Logger(EmailConsumer.name);

  constructor(private readonly mailService: MailService) {}

  @RabbitSubscribe({
    exchange: 'escv.events',
    routingKey: 'invitation.created',
    queue: 'email.invitation',
  })
  async handleInvitationCreated(event: InvitationCreatedEvent) {
    this.logger.log(`Processing invitation email for ${event.email}`);
    await this.mailService.sendInvitationEmail(event.email, event.inviteLink);
  }
}
