import { Module } from '@nestjs/common';
import { CheckpointsService } from './checkpoints.service';
import { CheckpointsController } from './checkpoints.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [CheckpointsController],
  providers: [CheckpointsService],
})
export class CheckpointsModule {}
