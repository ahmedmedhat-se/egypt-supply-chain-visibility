import { Module } from '@nestjs/common';
import { QueueModule } from '../queue/queue.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditService } from './audit.service';
import { AuditConsumer } from './audit.consumer';

@Module({
  imports: [QueueModule, PrismaModule],
  providers: [AuditService, AuditConsumer],
  exports: [AuditService],
})
export class AuditModule {}
