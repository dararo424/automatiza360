import * as crypto from 'crypto';
import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentsService, precioPara } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { BillingService } from '../billing/billing.service';
import { EmailService } from '../email/email.service';
import { AuditService } from '../audit/audit.service';

const mockPrisma = {
  tenant: { findUnique: jest.fn(), update: jest.fn() },
  paymentIntent: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
  referral: { findUnique: jest.fn() },
  $transaction: jest.fn().mockResolvedValue([]),
};

const mockBilling = { registrarPago: jest.fn().mockResolvedValue(undefined) };
const mockEmail = {
  sendConfirmacionPago: jest.fn().mockResolvedValue(undefined),
  enviarReciboPago: jest.fn().mockResolvedValue(undefined),
};
const mockAudit = { log: jest.fn() };

const TENANT_ID = 'tenant-abc-1234';
const SECRET = 'test_events_secret';

/** Construye un evento de Wompi con checksum válido según su spec. */
function wompiEvent(overrides: { txId?: string; status?: string; amount?: number } = {}) {
  const transaction = {
    id: overrides.txId ?? 'tx-1',
    status: overrides.status ?? 'APPROVED',
    amount_in_cents: overrides.amount ?? 7900000,
    reference: 'A360-tenant-ab-111',
  };
  const timestamp = 1719900000;
  const properties = ['transaction.id', 'transaction.status', 'transaction.amount_in_cents'];
  const concatenado = `${transaction.id}${transaction.status}${transaction.amount_in_cents}${timestamp}${SECRET}`;
  const checksum = crypto.createHash('sha256').update(concatenado).digest('hex');
  return {
    payload: {
      event: 'transaction.updated',
      data: { transaction },
      signature: { properties, checksum },
      timestamp,
    },
    checksum,
  };
}

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.WOMPI_EVENTS_SECRET = SECRET;
    process.env.WOMPI_PRIVATE_KEY = 'prv_test_x';

    const module = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: BillingService, useValue: mockBilling },
        { provide: EmailService, useValue: mockEmail },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();
    service = module.get<PaymentsService>(PaymentsService);
  });

  afterEach(() => {
    delete process.env.WOMPI_EVENTS_SECRET;
    (global.fetch as jest.Mock | undefined)?.mockRestore?.();
  });

  // ──────────────────────────────────────────────
  // Precios
  // ──────────────────────────────────────────────

  describe('precioPara', () => {
    it('mensual usa el precio de tabla', () => {
      expect(precioPara('STARTER', 'MENSUAL')).toBe(7900000);
      expect(precioPara('PRO', 'MENSUAL')).toBe(24200000);
    });

    it('anual cobra 10 meses (2 gratis)', () => {
      expect(precioPara('STARTER', 'ANUAL')).toBe(7900000 * 10);
      expect(precioPara('BUSINESS', 'ANUAL')).toBe(52900000 * 10);
    });
  });

  // ──────────────────────────────────────────────
  // Firma del webhook (spec Wompi)
  // ──────────────────────────────────────────────

  describe('verificarFirmaWebhook', () => {
    it('acepta un checksum válido calculado según signature.properties + timestamp + secret', () => {
      const { payload, checksum } = wompiEvent();
      expect(service.verificarFirmaWebhook(payload, checksum)).toBe(true);
    });

    it('rechaza un checksum alterado', () => {
      const { payload } = wompiEvent();
      const malo = 'a'.repeat(64);
      expect(service.verificarFirmaWebhook(payload, malo)).toBe(false);
    });

    it('rechaza si el payload fue manipulado tras firmar', () => {
      const { payload, checksum } = wompiEvent();
      (payload.data.transaction as any).amount_in_cents = 1;
      expect(service.verificarFirmaWebhook(payload, checksum)).toBe(false);
    });

    it('rechaza siempre si no hay WOMPI_EVENTS_SECRET', () => {
      delete process.env.WOMPI_EVENTS_SECRET;
      const { payload, checksum } = wompiEvent();
      expect(service.verificarFirmaWebhook(payload, checksum)).toBe(false);
    });
  });

  // ──────────────────────────────────────────────
  // activarPorReferencia — scoping + verificación server-side
  // ──────────────────────────────────────────────

  describe('activarPorReferencia', () => {
    const intent = {
      id: 'intent-1',
      tenantId: TENANT_ID,
      plan: 'PRO',
      periodo: 'MENSUAL',
      referencia: 'A360-tenant-ab-111',
      monto: 24200000,
      status: 'PENDING',
    };

    it('lanza NotFound si la referencia no pertenece al tenant (anti-IDOR)', async () => {
      mockPrisma.paymentIntent.findFirst.mockResolvedValue(null);
      await expect(
        service.activarPorReferencia('otro-tenant', intent.referencia),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(mockPrisma.paymentIntent.findFirst).toHaveBeenCalledWith({
        where: { referencia: intent.referencia, tenantId: 'otro-tenant' },
      });
    });

    it('es idempotente si el webhook ya aprobó el intent', async () => {
      mockPrisma.paymentIntent.findFirst.mockResolvedValue({ ...intent, status: 'APPROVED' });
      global.fetch = jest.fn();
      const res = await service.activarPorReferencia(TENANT_ID, intent.referencia);
      expect(res).toEqual({ ok: true, plan: 'PRO' });
      expect(global.fetch).not.toHaveBeenCalled();
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('rechaza si Wompi no tiene una transacción APPROVED por el monto exacto', async () => {
      mockPrisma.paymentIntent.findFirst.mockResolvedValue(intent);
      global.fetch = jest.fn().mockResolvedValue({
        json: async () => ({
          data: [{ status: 'DECLINED', amount_in_cents: intent.monto, currency: 'COP' }],
        }),
      }) as any;
      await expect(
        service.activarPorReferencia(TENANT_ID, intent.referencia),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('rechaza si el monto aprobado no coincide con el intent', async () => {
      mockPrisma.paymentIntent.findFirst.mockResolvedValue(intent);
      global.fetch = jest.fn().mockResolvedValue({
        json: async () => ({
          data: [{ status: 'APPROVED', amount_in_cents: 1000, currency: 'COP' }],
        }),
      }) as any;
      await expect(
        service.activarPorReferencia(TENANT_ID, intent.referencia),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('activa cuando Wompi confirma pago APPROVED por el monto correcto', async () => {
      mockPrisma.paymentIntent.findFirst.mockResolvedValue(intent);
      global.fetch = jest.fn().mockResolvedValue({
        json: async () => ({
          data: [{ id: 'tx-9', status: 'APPROVED', amount_in_cents: intent.monto, currency: 'COP' }],
        }),
      }) as any;
      const res = await service.activarPorReferencia(TENANT_ID, intent.referencia);
      expect(res).toEqual({ ok: true, plan: 'PRO' });
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.tenant.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: TENANT_ID },
          data: expect.objectContaining({ subscriptionStatus: 'ACTIVE', subscriptionPlan: 'PRO' }),
        }),
      );
    });

    it('un intent ANUAL extiende la suscripción ~12 meses', async () => {
      mockPrisma.paymentIntent.findFirst.mockResolvedValue({ ...intent, periodo: 'ANUAL', monto: 242000000 });
      global.fetch = jest.fn().mockResolvedValue({
        json: async () => ({
          data: [{ id: 'tx-9', status: 'APPROVED', amount_in_cents: 242000000, currency: 'COP' }],
        }),
      }) as any;
      await service.activarPorReferencia(TENANT_ID, intent.referencia);

      const updateArg = mockPrisma.tenant.update.mock.calls[0][0];
      const endsAt: Date = updateArg.data.subscriptionEndsAt;
      const enOnceMeses = new Date();
      enOnceMeses.setMonth(enOnceMeses.getMonth() + 11);
      expect(endsAt.getTime()).toBeGreaterThan(enOnceMeses.getTime());
    });
  });

  // ──────────────────────────────────────────────
  // crearTransaccion — periodo y monto
  // ──────────────────────────────────────────────

  describe('crearTransaccion', () => {
    beforeEach(() => {
      mockPrisma.tenant.findUnique.mockResolvedValue({ id: TENANT_ID, users: [] });
      mockPrisma.paymentIntent.create.mockResolvedValue({});
      process.env.WOMPI_INTEGRITY_SECRET = 'int_secret';
      process.env.WOMPI_PUBLIC_KEY = 'pub_test_x';
      process.env.FRONTEND_URL = 'https://app.test';
    });

    it('crea intent mensual con el precio de tabla', async () => {
      await service.crearTransaccion(TENANT_ID, 'PRO');
      expect(mockPrisma.paymentIntent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ plan: 'PRO', periodo: 'MENSUAL', monto: 24200000 }),
      });
    });

    it('crea intent anual cobrando 10 meses', async () => {
      await service.crearTransaccion(TENANT_ID, 'PRO', 'ANUAL');
      expect(mockPrisma.paymentIntent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ plan: 'PRO', periodo: 'ANUAL', monto: 242000000 }),
      });
    });
  });
});
