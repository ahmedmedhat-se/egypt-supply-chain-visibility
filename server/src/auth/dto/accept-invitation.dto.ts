import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AcceptInvitationDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID('4')
  token: string;

  @ApiProperty({ example: 'newuser@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'StrongPass1!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Ahmed' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Tarek' })
  @IsString()
  @IsNotEmpty()
  lastName: string;
}
