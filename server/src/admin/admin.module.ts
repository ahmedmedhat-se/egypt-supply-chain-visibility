import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UsersModule } from '../users/users.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { ShipmentsModule } from '../shipments/shipments.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    UsersModule,
    OrganizationsModule,
    ShipmentsModule,
    PrismaModule,
    AuditModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
