import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

describe('HealthController', () => {
  let controller: HealthController;

  const mockPrisma = {
    $queryRaw: jest.fn(),
  };
  const mockRedis = {
    ping: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('reports ok (200) when database and redis are up', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    mockRedis.ping.mockResolvedValue('PONG');
    const reply = { status: jest.fn().mockReturnThis() };

    const body = await controller.health(reply as any);

    expect(reply.status).toHaveBeenCalledWith(200);
    expect(body.status).toBe('ok');
    expect(body.info).toEqual({
      database: { status: 'up' },
      redis: { status: 'up' },
    });
  });

  it('reports error (503) when redis is down', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    mockRedis.ping.mockRejectedValue(new Error('connection refused'));
    const reply = { status: jest.fn().mockReturnThis() };

    const body = await controller.health(reply as any);

    expect(reply.status).toHaveBeenCalledWith(503);
    expect(body.status).toBe('error');
    expect(body.info.redis).toEqual({ status: 'down' });
  });

  it('reports down (503) when the database is down', async () => {
    mockPrisma.$queryRaw.mockRejectedValue(new Error('connection refused'));
    mockRedis.ping.mockResolvedValue('PONG');
    const reply = { status: jest.fn().mockReturnThis() };

    const body = await controller.health(reply as any);

    expect(reply.status).toHaveBeenCalledWith(503);
    expect(body.info.database).toEqual({ status: 'down' });
  });
});
