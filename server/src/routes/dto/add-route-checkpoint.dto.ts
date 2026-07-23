import { IsUUID, IsInt, Min, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddRouteCheckpointDto {
  @ApiProperty({ description: 'ID of the checkpoint to add' })
  @IsUUID()
  @IsNotEmpty()
  checkpointId: string;

  @ApiProperty({ example: 1, description: 'Order position in the route' })
  @IsInt()
  @Min(1)
  sequenceOrder: number;
}
