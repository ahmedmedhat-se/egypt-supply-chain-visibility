import {
  IsString,
  IsUUID,
  IsOptional,
  IsEmail,
  IsBoolean,
  IsInt,
  Min,
  Max,
  IsIn,
  IsArray,
  IsObject,
  IsEnum,
  Length,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class AdminUpdateUserDto {
  @ApiPropertyOptional({ example: 'Ahmed' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  user_first_name?: string;

  @ApiPropertyOptional({ example: 'Medhat' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  user_last_name?: string;

  @ApiPropertyOptional({ example: '+201234567890' })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9]{10,15}$/, { message: 'Invalid phone number format' })
  user_phone?: string;

  @ApiPropertyOptional({ example: 'shipper', enum: ['admin', 'shipper', 'carrier', 'regulator'] })
  @IsOptional()
  @IsIn(['admin', 'shipper', 'carrier', 'regulator'])
  user_role?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  organization_id?: string;

  @ApiPropertyOptional({ example: 'NewPassword123!' })
  @IsOptional()
  @IsString()
  @Length(8, 50)
  @Matches(/(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*])/, {
    message: 'Password must contain uppercase, lowercase, number, and special character',
  })
  user_password?: string;
}

export class AdminUpdateOrganizationDto {
  @ApiPropertyOptional({ example: 'Egypt Shipping Co.' })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  organization_name?: string;

  @ApiPropertyOptional({ example: 'shipper', enum: ['shipper', 'carrier', 'regulator', 'government', 'admin'] })
  @IsOptional()
  @IsIn(['shipper', 'carrier', 'regulator', 'government', 'admin'])
  organization_type?: string;

  @ApiPropertyOptional({ example: '+201234567890' })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9]{10,15}$/, { message: 'Invalid phone number format' })
  organization_phone?: string;

  @ApiPropertyOptional({ example: '123 Nile St, Cairo, Egypt' })
  @IsOptional()
  @IsString()
  organization_address?: string;

  @ApiPropertyOptional({ example: 'Egypt' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  organization_country?: string;
}

export class AdminQueryUsersDto {
  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ example: 'Ahmed' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'shipper', enum: ['admin', 'shipper', 'carrier', 'regulator'] })
  @IsOptional()
  @IsIn(['admin', 'shipper', 'carrier', 'regulator'])
  role?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  organizationId?: string;
}

export class AdminQueryOrganizationsDto {
  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ example: 'Shipping' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'shipper', enum: ['shipper', 'carrier', 'regulator', 'government', 'admin'] })
  @IsOptional()
  @IsIn(['shipper', 'carrier', 'regulator', 'government', 'admin'])
  type?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;
}

export class AdminQueryShipmentsDto {
  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ 
    enum: ['draft', 'confirmed', 'picked_up', 'in_transit', 'at_checkpoint', 'customs_hold', 'customs_cleared', 'out_for_delivery', 'delivered', 'cancelled', 'delayed'] 
  })
  @IsOptional()
  @IsIn(['draft', 'confirmed', 'picked_up', 'in_transit', 'at_checkpoint', 'customs_hold', 'customs_cleared', 'out_for_delivery', 'delivered', 'cancelled', 'delayed'])
  status?: string;

  @ApiPropertyOptional({ example: 'Alexandria' })
  @IsOptional()
  @IsString()
  originCity?: string;

  @ApiPropertyOptional({ example: 'Cairo' })
  @IsOptional()
  @IsString()
  destinationCity?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  shipperId?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  carrierId?: string;
}

export class AdminBulkActionDto {
  @ApiProperty({ enum: ['activate', 'deactivate', 'delete', 'cancel'] })
  @IsIn(['activate', 'deactivate', 'delete', 'cancel'])
  action: string;

  @ApiProperty({ enum: ['user', 'organization', 'shipment'] })
  @IsIn(['user', 'organization', 'shipment'])
  resourceType: string;

  @ApiProperty({ type: [String], example: ['uuid1', 'uuid2'] })
  @IsArray()
  @IsUUID('4', { each: true })
  ids: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}