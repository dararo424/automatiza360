import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { TwilioProvisioningService } from '../twilio/twilio-provisioning.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    tenant: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockJwt = { sign: jest.fn().mockReturnValue('token') };

  const mockTwilio = {
    provisionNumber: jest.fn().mockResolvedValue({
      setupInstructions: 'test',
      sandboxMode: true,
      sandboxWord: 'test',
      twilioNumber: '+1234',
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: TwilioProvisioningService, useValue: mockTwilio },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw UnauthorizedException on invalid login (user not found)', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    await expect(
      service.login({ email: 'x@x.com', password: 'wrong' }),
    ).rejects.toThrow();
  });

  it('should throw ConflictException if email already registered', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });
    await expect(
      service.registrarTenant({
        businessName: 'Test',
        ownerName: 'Test Owner',
        ownerPhone: '+57300',
        industry: 'RESTAURANT' as any,
        email: 'existing@test.com',
        password: 'pass123',
      }),
    ).rejects.toThrow();
  });
});
