import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignRouteDto {
  @ApiProperty({ description: 'ID of the route to assign to the shipment' })
  @IsUUID()
  routeId: string;
}
