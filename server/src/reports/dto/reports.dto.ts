import {
  IsOptional,
  IsInt,
  Min,
  IsString,
  IsEnum,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QueryReportsDto {
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}

export class GenerateReportDto {
  @ApiProperty({
    description: 'Type of report (e.g. shipments_summary, performance)',
  })
  @IsString()
  @IsEnum(['shipments_summary', 'organizations_summary', 'performance'])
  reportType: string;

  @ApiPropertyOptional({
    description: 'JSON parameters for the report filters',
  })
  @IsOptional()
  @IsObject()
  parameters?: Record<string, any>;
}
