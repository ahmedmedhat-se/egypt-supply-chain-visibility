import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
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

  async onModuleDestroy() {
    if (this.transporter) {
      this.transporter.close();
      this.logger.log('SMTP transporter closed');
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

  async sendPasswordResetEmail(
    to: string,
    resetLink: string,
    expiresInMinutes: number = 15,
  ): Promise<void> {
    const from = this.configService.get<string>(
      'MAIL_FROM',
      'noreply@escv.com',
    );
    const html = `
      <!DOCTYPE html>
      <html>
        <body style="margin:0;padding:0;background:#F8FAFC;font-family:Arial,Helvetica,sans-serif;">
          <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
            <!-- Platform header -->
            <div style="text-align:center;margin-bottom:20px;">
              <span style="font-size:18px;font-weight:bold;color:#0A2E4A;">ESCV</span>
              <span style="font-size:14px;color:#94A3B8;margin-left:8px;">Egypt Supply Chain Visibility</span>
            </div>
            <!-- Card -->
            <div style="background:#ffffff;border:1px solid #E2E8F0;border-radius:16px;padding:40px 32px;box-shadow:0 10px 30px rgba(10,46,74,0.06);">
              <div style="width:56px;height:56px;border-radius:14px;background:linear-gradient(135deg,#2D9B6E,#1F7A52);display:flex;align-items:center;justify-content:center;color:#ffffff;font-size:26px;font-weight:bold;margin:0 auto 24px;">E</div>
              <h1 style="text-align:center;color:#0A2E4A;font-size:22px;margin:0 0 8px;">Reset your password</h1>
              <p style="text-align:center;color:#64748B;font-size:14px;line-height:1.7;margin:0 0 28px;">We received a request to reset the password for your ESCV account. Click the button below to choose a new one. <strong style="color:#0A2E4A;">This link expires in ${expiresInMinutes} minute${expiresInMinutes === 1 ? '' : 's'}.</strong></p>
              <div style="text-align:center;margin:0 0 28px;">
                <a href="${resetLink}" style="display:inline-block;background:linear-gradient(135deg,#2D9B6E,#1F7A52);color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:14px 36px;border-radius:12px;">Reset Password</a>
              </div>
              <p style="text-align:center;color:#94A3B8;font-size:12px;line-height:1.6;margin:0 0 24px;">If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="text-align:center;margin:0 0 28px;">
                <a href="${resetLink}" style="color:#1F7A52;font-size:12px;word-break:break-all;">${resetLink}</a>
              </p>
              <hr style="border:none;border-top:1px solid #E2E8F0;margin:0 0 20px;" />
              <p style="text-align:center;color:#94A3B8;font-size:12px;line-height:1.6;margin:0;">If you didn't request this, you can safely ignore this email — your password won't change.</p>
            </div>
            <!-- Footer -->
            <p style="text-align:center;color:#94A3B8;font-size:12px;margin:24px 0 0;">© ${new Date().getFullYear()} ESCV — Egypt Supply Chain Visibility</p>
          </div>
        </body>
      </html>
    `;
    if (this.transporter) {
      await this.transporter.sendMail({
        from,
        to,
        subject: 'Reset your ESCV password',
        html,
      });
      this.logger.log(`Password reset email sent to ${to}`);
    } else {
      this.logger.log(`Password reset link for ${to}: ${resetLink}`);
    }
  }
}
