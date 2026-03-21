import { Test } from '@nestjs/testing';
import { ConversacionesService } from './conversaciones.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

describe('ConversacionesService', () => {
  let service: ConversacionesService;

  const mockPrisma = {
    tenant: { findUnique: jest.fn(), findUniqueOrThrow: jest.fn(), update: jest.fn() },
    conversation: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      upsert: jest.fn(),
    },
    message: { create: jest.fn(), findMany: jest.fn() },
  };
  const mockEmail = { sendEscalacion: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ConversacionesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EmailService, useValue: mockEmail },
      ],
    }).compile();
    service = module.get<ConversacionesService>(ConversacionesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return blocked when plan limit reached', async () => {
    mockPrisma.tenant.findUniqueOrThrow.mockResolvedValue({
      id: 'tenant-id',
      plan: 'STARTER',
      conversationCountMonth: 500,
    });
    mockPrisma.conversation.upsert.mockResolvedValue({ id: 'conv-id' });

    const result = await service.ingestMessage('tenant-id', {
      clientPhone: '+57300',
      body: 'hola',
      direction: 'INBOUND' as any,
    });
    expect(result).toEqual(
      expect.objectContaining({ blocked: true, reason: 'plan_limit_reached' }),
    );
  });

  it('getSesion should return empty array when conversation not found', async () => {
    mockPrisma.conversation.findFirst.mockResolvedValue(null);
    const result = await service.getSesion('tenant-id', '+57300');
    expect(result).toEqual([]);
  });

  it('getSesion should map messages to role/content format', async () => {
    mockPrisma.conversation.findFirst.mockResolvedValue({ id: 'conv-id' });
    mockPrisma.message.findMany.mockResolvedValue([
      { body: 'Hola', direction: 'INBOUND', createdAt: new Date() },
      { body: 'Hola, ¿en qué te ayudo?', direction: 'OUTBOUND', createdAt: new Date() },
    ]);
    const result = await service.getSesion('tenant-id', '+57300');
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ role: 'user', content: 'Hola' });
    expect(result[1]).toEqual({ role: 'assistant', content: 'Hola, ¿en qué te ayudo?' });
  });
});
