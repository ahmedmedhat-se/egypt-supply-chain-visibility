import { IsOptional, IsString, IsUUID, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from './pagination.dto';

/**
 * Shared, feature-rich audit log filters used by both the super-admin and org-admin
 */
export class QueryAuditLogsDto extends PaginationDto {
  @ApiPropertyOptional({
    description:
      'Free-text search across action, resource type, resource id, IP and actor email/name',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Exact audit action, e.g. SHIPMENT_STATUS_UPDATE',
  })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({
    description:
      'Action category tag (auth, shipment, route, checkpoint, organization, user)',
    enum: ['auth', 'shipment', 'route', 'checkpoint', 'organization', 'user'],
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Exact resource type, e.g. shipment, user, organization',
  })
  @IsOptional()
  @IsString()
  resourceType?: string;

  @ApiPropertyOptional({ description: 'Exact resource id' })
  @IsOptional()
  @IsUUID()
  resourceId?: string;

  @ApiPropertyOptional({ description: 'Filter by acting user id' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Only logs performed at or after this ISO timestamp',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    description: 'Only logs performed at or before this ISO timestamp',
  })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({
    description: 'Partial match on the requesting IP address',
  })
  @IsOptional()
  @IsString()
  ipAddress?: string;
}
