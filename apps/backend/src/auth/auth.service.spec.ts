import { Test } from '@nestjs/testing';
import { ConflictException, UnauthorizedException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { TwilioProvisioningService } from '../twilio/twilio-provisioning.service';
import { EmailService } from '../email/email.service';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  tenant: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  passwordResetToken: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockJwt = { sign: jest.fn().mockReturnValue('mock-token') };
const mockTwilio = {
  provisionNumber: jest.fn().mockResolvedValue({
    setupInstructions: 'Envía "join test" al número',
    sandboxMode: true,
    sandboxWord: 'test',
    twilioNumber: '+14155238886',
  }),
};
const mockEmail = {
  enviarBienvenida: jest.fn().mockResolvedValue(undefined),
  enviarRecuperacionContrasena: jest.fn().mockResolvedValue(undefined),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: TwilioProvisioningService, useValue: mockTwilio },
        { provide: EmailService, useValue: mockEmail },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ──────────────────────────────────────────────
  // registrarTenant
  // ──────────────────────────────────────────────

  describe('registrarTenant', () => {
    const dto = {
      businessName: 'Restaurante Test',
      ownerName: 'Juan Pérez',
      ownerPhone: '+573001234567',
      industry: 'RESTAURANT' as any,
      email: 'juan@test.com',
      password: 'segura123',
    };

    it('lanza ConflictException si el email ya está registrado', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' });
      await expect(service.registrarTenant(dto)).rejects.toThrow(ConflictException);
    });

    it('crea tenant, owner y bot en una transacción', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.tenant.findUnique.mockResolvedValue(null);

      const fakeTenant = { id: 't1', name: dto.businessName, slug: 'restaurante-test', industry: dto.industry, trialEndsAt: new Date() };
      const fakeOwner = { id: 'u1', email: dto.email, role: 'OWNER', tenantId: 't1', tokenVersion: 0 };

      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          tenant: { create: jest.fn().mockResolvedValue(fakeTenant) },
          user: { create: jest.fn().mockResolvedValue(fakeOwner) },
          service: { createMany: jest.fn().mockResolvedValue({}) },
          product: { createMany: jest.fn().mockResolvedValue({}) },
        };
        return cb(tx);
      });

      const result = await service.registrarTenant(dto);

      expect(result.token).toBe('mock-token');
      expect(mockTwilio.provisionNumber).toHaveBeenCalledTimes(1);
      expect(mockEmail.enviarBienvenida).toHaveBeenCalledWith(
        dto.email,
        dto.ownerName,
        dto.businessName,
        expect.stringContaining('/login'),
      );
    });

    it('agrega owner a tenant existente sin OWNER', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null); // email no existe

      const tenantSinOwner = {
        id: 't2', name: dto.businessName, slug: 'restaurante-test',
        industry: dto.industry, users: [], twilioNumber: null, ownerPhone: null,
        trialEndsAt: new Date(),
      };
      mockPrisma.tenant.findUnique.mockResolvedValue(tenantSinOwner);

      const fakeOwner = { id: 'u2', email: dto.email, role: 'OWNER', tenantId: 't2', tokenVersion: 0 };
      mockPrisma.user.create.mockResolvedValue(fakeOwner);
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'bot1', email: 'bot@test.com' });
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.tenant.update.mockResolvedValue({});

      const result = await service.registrarTenant(dto);
      expect(result.mensaje).toContain('negocio existente');
    });
  });

  // ──────────────────────────────────────────────
  // login
  // ──────────────────────────────────────────────

  describe('login', () => {
    const loginDto = { email: 'juan@test.com', password: 'segura123' };

    it('lanza UnauthorizedException si el usuario no existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('lanza UnauthorizedException si la contraseña es incorrecta', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1', email: loginDto.email,
        password: '$2b$10$wronghash',
        active: true,
        tenant: { active: true },
        tokenVersion: 0, role: 'OWNER', tenantId: 't1',
      });
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('lanza ForbiddenException si el usuario está inactivo', async () => {
      // bcrypt hash real de "segura123"
      const hash = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVyRnMxBgu';
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1', email: loginDto.email, password: hash,
        active: false, tenant: { active: true },
        tokenVersion: 0, role: 'OWNER', tenantId: 't1',
      });
      await expect(service.login({ ...loginDto, password: 'abc' })).rejects.toThrow();
    });

    it('lanza ForbiddenException si el tenant está inactivo', async () => {
      const hash = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVyRnMxBgu';
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1', email: loginDto.email, password: hash,
        active: true, tenant: { active: false },
        tokenVersion: 0, role: 'OWNER', tenantId: 't1',
      });
      await expect(service.login({ ...loginDto, password: 'abc' })).rejects.toThrow();
    });
  });

  // ──────────────────────────────────────────────
  // solicitarRecuperacion
  // ──────────────────────────────────────────────

  describe('solicitarRecuperacion', () => {
    it('responde igual si el email no existe (no revela info)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const result = await service.solicitarRecuperacion('noexiste@x.com');
      expect(result.message).toContain('Si el correo existe');
      expect(mockEmail.enviarRecuperacionContrasena).not.toHaveBeenCalled();
    });

    it('envía email si el usuario existe y está activo', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', name: 'Juan', email: 'juan@test.com', active: true });
      mockPrisma.passwordResetToken.updateMany.mockResolvedValue({});
      mockPrisma.passwordResetToken.create.mockResolvedValue({});

      const result = await service.solicitarRecuperacion('juan@test.com');
      expect(result.message).toContain('Si el correo existe');
      expect(mockEmail.enviarRecuperacionContrasena).toHaveBeenCalledTimes(1);
    });
  });

  // ──────────────────────────────────────────────
  // resetearContrasena
  // ──────────────────────────────────────────────

  describe('resetearContrasena', () => {
    it('lanza BadRequestException con token inválido', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue(null);
      await expect(service.resetearContrasena('bad-token', 'nueva')).rejects.toThrow(BadRequestException);
    });

    it('lanza BadRequestException con token ya usado', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'rt1', userId: 'u1', used: true,
        expiresAt: new Date(Date.now() + 60000),
        user: { id: 'u1' },
      });
      await expect(service.resetearContrasena('used-token', 'nueva')).rejects.toThrow(BadRequestException);
    });

    it('lanza BadRequestException con token expirado', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'rt1', userId: 'u1', used: false,
        expiresAt: new Date(Date.now() - 60000), // pasado
        user: { id: 'u1' },
      });
      await expect(service.resetearContrasena('expired-token', 'nueva')).rejects.toThrow(BadRequestException);
    });

    it('actualiza contraseña e invalida el token con token válido', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'rt1', userId: 'u1', used: false,
        expiresAt: new Date(Date.now() + 60000),
        user: { id: 'u1' },
      });
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.passwordResetToken.update.mockResolvedValue({});

      const result = await service.resetearContrasena('valid-token', 'nueva123');
      expect(result.message).toContain('actualizada');
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'u1' } }),
      );
      expect(mockPrisma.passwordResetToken.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { used: true } }),
      );
    });
  });
});
