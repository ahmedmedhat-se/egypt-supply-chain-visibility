import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

const COORD = '-?\\d{1,3}(?:\\.\\d+)?';
const LAT_LNG = new RegExp(`^${COORD},${COORD}$`);

export class RouteQueryDto {
  @ApiProperty({
    example: '30.0444,31.2357',
    description: 'Starting point as "latitude,longitude"',
  })
  @Matches(LAT_LNG, {
    message: 'from must be in "lat,lng" format, e.g. 30.0444,31.2357',
  })
  from!: string;

  @ApiProperty({
    example: '31.2001,29.9187',
    description: 'Destination point as "latitude,longitude"',
  })
  @Matches(LAT_LNG, {
    message: 'to must be in "lat,lng" format, e.g. 31.2001,29.9187',
  })
  to!: string;
}
