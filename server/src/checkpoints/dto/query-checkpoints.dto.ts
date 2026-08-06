import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryCheckpointsDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by checkpoint name or code' })
  @IsOptional()
  @IsString()
  search?: string;
}
