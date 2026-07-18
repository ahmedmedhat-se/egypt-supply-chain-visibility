import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UsersModule } from '../users/users.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { ShipmentsModule } from '../shipments/shipments.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [UsersModule, OrganizationsModule, ShipmentsModule, PrismaModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}