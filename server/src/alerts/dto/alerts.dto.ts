import {
  IsOptional,
  IsInt,
  Min,
  IsBooleanString,
  IsString,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryAlertsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Filter by read status (true/false)' })
  @IsOptional()
  @IsBooleanString()
  isRead?: string;

  @ApiPropertyOptional({
    description: 'Filter by alert severity (info, warning, critical)',
  })
  @IsOptional()
  @IsString()
  @IsEnum(['info', 'warning', 'critical'])
  severity?: string;

  @ApiPropertyOptional({
    description: 'Search alerts by title, message, or shipment reference',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;
}
