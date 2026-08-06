import { Module } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { AlertsConsumer } from './alerts.consumer';
import { EtaScannerService } from './eta-scanner.service';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [QueueModule],
  providers: [AlertsService, AlertsConsumer, EtaScannerService],
  controllers: [AlertsController],
  exports: [AlertsService],
})
export class AlertsModule {}
