import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsIn,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export const CHECKPOINT_TYPES = [
  'port',
  'customs',
  'warehouse',
  'hub',
  'border',
  'depot',
] as const;

export class CreateCheckpointDto {
  @ApiProperty({ example: 'Alexandria Port Gate 3' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'ALX-G3' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code: string;

  @ApiProperty({
    example: 'port',
    enum: CHECKPOINT_TYPES,
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(CHECKPOINT_TYPES)
  type: string;

  @ApiProperty({ example: 'Alexandria' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city: string;

  @ApiProperty({ example: 31.2001 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ example: 29.9187 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;
}
