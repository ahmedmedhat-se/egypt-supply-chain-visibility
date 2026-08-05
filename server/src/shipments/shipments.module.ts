import { Module } from '@nestjs/common';
import { ShipmentsService } from './shipments.service';
import { ShipmentsController } from './shipments.controller';
import { QueueModule } from '../queue/queue.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [QueueModule, AuditModule],
  controllers: [ShipmentsController],
  providers: [ShipmentsService],
})
export class ShipmentsModule {}
