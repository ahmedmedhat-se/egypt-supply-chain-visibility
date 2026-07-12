import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', description: 'The email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Password123!', description: 'The password (min 8 chars)' })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: 'Ahmed', description: 'User first name' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Tarek', description: 'User last name' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'Shipper', description: 'User role' })
  @IsString()
  @IsNotEmpty()
  role: string;

  @ApiPropertyOptional({ example: '+201001234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Egypt Logistics' })
  @IsString()
  @IsNotEmpty()
  organizationName: string;

  @ApiProperty({ example: 'Logistics Provider' })
  @IsString()
  @IsNotEmpty()
  organizationType: string;

  @ApiProperty({ example: 'contact@egyptlogistics.com' })
  @IsEmail()
  @IsNotEmpty()
  organizationEmail: string;

  @ApiPropertyOptional({ example: 'Egypt', default: 'Egypt' })
  @IsOptional()
  @IsString()
  organizationCountry?: string;
}
