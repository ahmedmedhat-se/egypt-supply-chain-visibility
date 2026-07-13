import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('MAIL_HOST');
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(this.configService.get<string>('MAIL_PORT', '587'), 10),
        secure: this.configService.get<string>('MAIL_SECURE') === 'true',
        auth: {
          user: this.configService.get<string>('MAIL_USER'),
          pass: this.configService.get<string>('MAIL_PASS'),
        },
      });
    } else {
      this.logger.warn('Mail host not configured - emails will be logged only');
    }
  }

  async sendInvitationEmail(to: string, inviteLink: string): Promise<void> {
    const from = this.configService.get<string>(
      'MAIL_FROM',
      'noreply@escv.com',
    );
    if (this.transporter) {
      await this.transporter.sendMail({
        from,
        to,
        subject: 'You are invited to join ESCV',
        html: `<p>Click <a href="${inviteLink}">here</a> to accept your invitation.</p>`,
      });
      this.logger.log(`Invitation email sent to ${to}`);
    } else {
      this.logger.log(`Invite link for ${to}: ${inviteLink}`);
    }
  }
}
