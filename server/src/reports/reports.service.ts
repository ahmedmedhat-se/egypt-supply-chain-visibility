import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryReportsDto, GenerateReportDto } from './dto/reports.dto';
import { buildPaginationMeta } from '../common/pagination/pagination.helper';
import { randomUUID } from 'crypto';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async listReports(userId: string, query: QueryReportsDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = { requested_by_user_id: userId };
    if (query.status) {
      where.report_status = query.status;
    }

    const [reports, total] = await this.prisma.$transaction([
      this.prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { report_created_at: 'desc' },
      }),
      this.prisma.report.count({ where }),
    ]);

    return {
      data: reports,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async generateReport(userId: string, dto: GenerateReportDto) {
    // 1. Create a pending report record
    const report = await this.prisma.report.create({
      data: {
        requested_by_user_id: userId,
        report_type: dto.reportType,
        report_status: 'pending',
        report_parameters: dto.parameters || {},
      },
    });

    // 2. Simulate async report generation in the background
    this.processReportAsync(report.report_id).catch((err) => {
      this.logger.error(`Async report generation failed: ${err.message}`);
    });

    return {
      success: true,
      message: 'Report generation started',
      data: report,
    };
  }

  async getReportDownload(userId: string, reportId: string) {
    const report = await this.prisma.report.findUnique({
      where: { report_id: reportId },
    });

    if (!report || report.requested_by_user_id !== userId) {
      throw new NotFoundException('Report not found');
    }

    if (report.report_status !== 'completed') {
      throw new BadRequestException('Report is not ready yet');
    }

    // In a real app, we would return a pre-signed S3 URL or stream the file buffer
    return {
      success: true,
      downloadUrl: `/api/downloads/${report.report_file_path}`,
    };
  }

  private async processReportAsync(reportId: string) {
    // Simulate some heavy work
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const mockFileName = `report-${randomUUID().slice(0, 8)}.pdf`;

    await this.prisma.report.update({
      where: { report_id: reportId },
      data: {
        report_status: 'completed',
        report_file_path: mockFileName,
        report_generated_at: new Date(),
        report_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    this.logger.log(`Report ${reportId} generated successfully.`);
  }
}
