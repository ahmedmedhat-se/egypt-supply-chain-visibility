import { IsEmail, IsIn, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInvitationDto {
  @ApiProperty({ example: 'newuser@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'shipper',
    enum: ['shipper', 'carrier', 'regulator', 'admin'],
  })
  @IsString()
  @IsIn(['shipper', 'carrier', 'regulator', 'admin'])
  role: string;
}
