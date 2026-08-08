import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { QueryReportsDto, GenerateReportDto } from './dto/reports.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @ApiOperation({ summary: 'List user reports' })
  async listReports(@CurrentUser() user: any, @Query() query: QueryReportsDto) {
    return this.reportsService.listReports(user.sub, query);
  }

  @Post()
  @ApiOperation({ summary: 'Request a new report generation' })
  async generateReport(
    @CurrentUser() user: any,
    @Body() dto: GenerateReportDto,
  ) {
    return this.reportsService.generateReport(user.sub, dto);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Get report download URL' })
  async downloadReport(@CurrentUser() user: any, @Param('id') id: string) {
    return this.reportsService.getReportDownload(user.sub, id);
  }
}
