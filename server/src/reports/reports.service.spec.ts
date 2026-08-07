import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('ReportsService', () => {
  let service: ReportsService;
  let prismaService: any;

  const mockPrisma = {
    $transaction: jest.fn(),
    report: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listReports', () => {
    it('should return paginated reports', async () => {
      const mockReports = [{ id: 1 }, { id: 2 }];
      mockPrisma.$transaction.mockResolvedValue([mockReports, 2]);

      const result = await service.listReports('user-1', { page: 1, limit: 10 });

      expect(result.data).toEqual(mockReports);
      expect(result.meta.totalItems).toBe(2);
    });
  });

  describe('generateReport', () => {
    it('should create a pending report', async () => {
      const mockReport = { report_id: 'rep-1', report_status: 'pending' };
      mockPrisma.report.create.mockResolvedValue(mockReport);

      const result = await service.generateReport('user-1', {
        reportType: 'performance',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockReport);
      expect(mockPrisma.report.create).toHaveBeenCalled();
    });
  });

  describe('getReportDownload', () => {
    it('should return download url if report is completed', async () => {
      mockPrisma.report.findUnique.mockResolvedValue({
        report_id: 'rep-1',
        requested_by_user_id: 'user-1',
        report_status: 'completed',
        report_file_path: 'mock.pdf'
      });

      const result = await service.getReportDownload('user-1', 'rep-1');

      expect(result.success).toBe(true);
      expect(result.downloadUrl).toContain('mock.pdf');
    });

    it('should throw NotFoundException if report belongs to someone else', async () => {
      mockPrisma.report.findUnique.mockResolvedValue({
        report_id: 'rep-1',
        requested_by_user_id: 'user-2',
      });

      await expect(service.getReportDownload('user-1', 'rep-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if report is not completed', async () => {
      mockPrisma.report.findUnique.mockResolvedValue({
        report_id: 'rep-1',
        requested_by_user_id: 'user-1',
        report_status: 'pending',
      });

      await expect(service.getReportDownload('user-1', 'rep-1')).rejects.toThrow(BadRequestException);
    });
  });
});
