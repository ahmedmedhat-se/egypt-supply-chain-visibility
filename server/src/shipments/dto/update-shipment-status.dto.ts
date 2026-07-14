import {
  IsString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsUUID,
  IsISO8601,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SHIPMENT_STATUSES } from '../shipments.constants';
import type { ShipmentStatus } from '../shipments.constants';

export class UpdateShipmentStatusDto {
  @ApiProperty({
    enum: SHIPMENT_STATUSES,
    example: 'in_transit',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(SHIPMENT_STATUSES)
  status: ShipmentStatus;

  @ApiPropertyOptional({ example: 30.0444 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 31.2357 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  checkpointId?: string;

  @ApiPropertyOptional({ example: 'Shipment arrived at Cairo checkpoint' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '2024-12-02T14:30:00Z' })
  @IsOptional()
  @IsISO8601()
  occurredAt?: string;
}
