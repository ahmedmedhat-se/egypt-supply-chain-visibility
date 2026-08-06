import { Module } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { AlertsConsumer } from './alerts.consumer';

@Module({
  providers: [AlertsService, AlertsConsumer],
  controllers: [AlertsController],
  exports: [AlertsService],
})
export class AlertsModule {}
