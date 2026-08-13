import { Test, TestingModule } from '@nestjs/testing';
import { AlertsService } from './alerts.service';
import { PrismaService } from '../prisma/prisma.service';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('AlertsService', () => {
  let service: AlertsService;
  let prismaService: any;

  const mockPrisma = {
    $transaction: jest.fn(),
    userAlert: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    alert: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    shipment: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AmqpConnection, useValue: { publish: jest.fn() } },
      ],
    }).compile();

    service = module.get<AlertsService>(AlertsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserAlerts', () => {
    it('should return paginated alerts', async () => {
      const mockAlerts = [{ id: 1 }, { id: 2 }];
      mockPrisma.$transaction.mockResolvedValue([mockAlerts, 2]);

      const result = await service.getUserAlerts('user-1', {
        page: 1,
        limit: 10,
      });

      expect(result.data).toEqual(mockAlerts);
      expect(result.meta.totalItems).toBe(2);
      expect(result.meta.totalPages).toBe(1);
    });
  });

  describe('markAsRead', () => {
    it('should mark an alert as read', async () => {
      const mockAlert = { user_alert_id: 'alert-1', user_id: 'user-1' };
      mockPrisma.userAlert.findUnique.mockResolvedValue(mockAlert);
      mockPrisma.userAlert.update.mockResolvedValue({
        ...mockAlert,
        is_read: true,
      });

      const result = await service.markAsRead('user-1', 'alert-1');

      expect(result.success).toBe(true);
      expect(mockPrisma.userAlert.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if alert not found', async () => {
      mockPrisma.userAlert.findUnique.mockResolvedValue(null);

      await expect(service.markAsRead('user-1', 'alert-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      mockPrisma.userAlert.count.mockResolvedValue(5);

      const result = await service.getUnreadCount('user-1');

      expect(result.count).toBe(5);
    });
  });

  describe('createAlert', () => {
    it('should create an alert and distribute to target users', async () => {
      const mockAlert = { alert_id: 'alert-1' };
      mockPrisma.alert.create.mockResolvedValue(mockAlert);

      const result = await service.createAlert({
        type: 'test',
        severity: 'info',
        title: 'Test',
        message: 'Test msg',
        targetUserIds: ['user-1', 'user-2'],
      });

      expect(result).toEqual(mockAlert);
      expect(mockPrisma.alert.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            user_alerts: {
              create: [{ user_id: 'user-1' }, { user_id: 'user-2' }],
            },
          }),
        }),
      );
    });
  });

  describe('resolve', () => {
    it('should resolve any alert as super_admin', async () => {
      mockPrisma.alert.findUnique.mockResolvedValue({
        alert_id: 'alert-1',
        shipment: {
          shipper_organization_id: 'org-1',
          carrier_organization_id: null,
        },
      });
      mockPrisma.alert.update.mockResolvedValue({
        alert_id: 'alert-1',
        alert_is_resolved: true,
      });

      const result = await service.resolve(
        { sub: 'super-1', role: 'super_admin' },
        'alert-1',
      );

      expect(result.success).toBe(true);
      expect(mockPrisma.alert.update).toHaveBeenCalledWith({
        where: { alert_id: 'alert-1' },
        data: expect.objectContaining({ alert_is_resolved: true }),
      });
    });

    it('should allow an org admin to resolve an alert for their org shipment', async () => {
      mockPrisma.alert.findUnique.mockResolvedValue({
        alert_id: 'alert-2',
        shipment: {
          shipper_organization_id: 'org-1',
          carrier_organization_id: null,
        },
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        organization_id: 'org-1',
      });
      mockPrisma.alert.update.mockResolvedValue({ alert_id: 'alert-2' });

      const result = await service.resolve(
        { sub: 'admin-1', role: 'admin' },
        'alert-2',
      );

      expect(result.success).toBe(true);
    });

    it('should forbid an admin from another organization', async () => {
      mockPrisma.alert.findUnique.mockResolvedValue({
        alert_id: 'alert-3',
        shipment: {
          shipper_organization_id: 'org-1',
          carrier_organization_id: null,
        },
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        organization_id: 'org-9',
      });

      await expect(
        service.resolve({ sub: 'admin-2', role: 'admin' }, 'alert-3'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if alert not found', async () => {
      mockPrisma.alert.findUnique.mockResolvedValue(null);

      await expect(
        service.resolve({ sub: 'super-1', role: 'super_admin' }, 'missing'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
