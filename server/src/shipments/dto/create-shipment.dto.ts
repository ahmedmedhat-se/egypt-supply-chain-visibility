import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  IsUUID,
  IsNotEmpty,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateShipmentDto {
  @ApiProperty({ example: 'SHIP-2024-001' })
  @IsString()
  @IsNotEmpty()
  referenceNumber: string;

  @ApiPropertyOptional({
    example: 'Electronics shipment from Cairo to Alexandria',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'Electronics' })
  @IsString()
  @IsOptional()
  cargoType?: string;

  @ApiPropertyOptional({ example: 1500.5 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  weightKg?: number;

  @ApiPropertyOptional({ example: 10.5 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  volumeM3?: number;

  @ApiProperty({ example: '123 Main St, Cairo, Egypt' })
  @IsString()
  @IsNotEmpty()
  originAddress: string;

  @ApiProperty({ example: '456 Nile St, Alexandria, Egypt' })
  @IsString()
  @IsNotEmpty()
  destinationAddress: string;

  @ApiProperty({ example: 'Cairo' })
  @IsString()
  @IsNotEmpty()
  originCity: string;

  @ApiProperty({ example: 'Alexandria' })
  @IsString()
  @IsNotEmpty()
  destinationCity: string;

  @ApiPropertyOptional({ example: '2024-12-01T08:00:00Z' })
  @IsDateString()
  @IsOptional()
  estimatedDepartureAt?: string;

  @ApiPropertyOptional({ example: '2024-12-03T18:00:00Z' })
  @IsDateString()
  @IsOptional()
  estimatedArrivalAt?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  carrierOrganizationId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  routeId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
