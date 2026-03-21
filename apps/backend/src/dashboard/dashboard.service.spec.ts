import { Test } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DashboardService', () => {
  let service: DashboardService;

  const mockPrisma = {
    order: {
      count: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn().mockResolvedValue({ _sum: { total: 0 } }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    appointment: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
    },
    product: { count: jest.fn().mockResolvedValue(0) },
    ticket: { count: jest.fn().mockResolvedValue(0) },
    conversation: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
    },
    message: { count: jest.fn().mockResolvedValue(0) },
    tenant: {
      findUnique: jest.fn().mockResolvedValue({
        conversationCountMonth: 0,
        plan: 'STARTER',
      }),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<DashboardService>(DashboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('getMetricas should return expected shape', async () => {
    const result = await service.getMetricas('tenant-id');
    expect(result).toHaveProperty('ordenesHoy');
    expect(result).toHaveProperty('ordenesMes');
    expect(result).toHaveProperty('ingresosMes');
    expect(result).toHaveProperty('citasHoy');
    expect(result).toHaveProperty('ticketsAbiertos');
    expect(result).toHaveProperty('ultimasOrdenes');
  });

  it('getTendencias should return array of date entries', async () => {
    mockPrisma.order.findMany.mockResolvedValue([]);
    mockPrisma.appointment.findMany.mockResolvedValue([]);
    const result = await service.getTendencias('tenant-id', 7);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(7);
    expect(result[0]).toHaveProperty('date');
    expect(result[0]).toHaveProperty('ordenes');
    expect(result[0]).toHaveProperty('ingresos');
  });

  it('getBotMetricas should return bot statistics', async () => {
    const result = await service.getBotMetricas('tenant-id');
    expect(result).toHaveProperty('totalConversaciones');
    expect(result).toHaveProperty('totalMensajes');
    expect(result).toHaveProperty('tasaRespuesta');
  });
});
