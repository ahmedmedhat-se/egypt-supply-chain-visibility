import {
  IsOptional,
  IsString,
  IsIn,
  IsInt,
  Min,
  Max,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { SHIPMENT_STATUSES } from '../shipments.constants';

export class QueryShipmentDto {
  @ApiPropertyOptional({ enum: SHIPMENT_STATUSES })
  @IsString()
  @IsOptional()
  @IsIn(SHIPMENT_STATUSES)
  status?: string;

  @ApiPropertyOptional({
    description: 'Search by reference number or description',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  carrierOrganizationId?: string;

  @ApiPropertyOptional({
    description: 'Filter shipments created after this date (ISO 8601)',
  })
  @IsDateString()
  @IsOptional()
  createdAfter?: string;

  @ApiPropertyOptional({
    description: 'Filter shipments created before this date (ISO 8601)',
  })
  @IsDateString()
  @IsOptional()
  createdBefore?: string;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;
}
