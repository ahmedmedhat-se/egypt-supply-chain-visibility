import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { user_id: id },
      select: {
        user_id: true,
        user_email: true,
        user_first_name: true,
        user_last_name: true,
        user_role: true,
        user_token_version: true,
        organization_id: true,
        user_is_active: true,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { user_email: email },
    });
  }

  async incrementTokenVersion(userId: string) {
    await this.prisma.user.update({
      where: { user_id: userId },
      data: { user_token_version: { increment: 1 } },
    });
  }
}
