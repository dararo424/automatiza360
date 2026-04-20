import * as crypto from 'crypto';
import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Plan, Role, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BillingService } from '../billing/billing.service';
import { EmailService } from '../email/email.service';

type PlanKey = 'STARTER' | 'PRO' | 'BUSINESS';

const PRECIOS: Record<PlanKey, number> = {
  STARTER: 7900000,    // $79.000 COP en centavos
  PRO: 24200000,       // $242.000 COP en centavos
  BUSINESS: 52900000,  // $529.000 COP en centavos
};

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly billingService: BillingService,
    private readonly emailService: EmailService,
  ) {}

  async crearTransaccion(tenantId: string, plan: PlanKey) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { users: { where: { role: Role.OWNER }, take: 1 } },
    });

    const monto = PRECIOS[plan];
    const referencia = `A360-${tenantId.substring(0, 8)}-${Date.now()}`;

    await this.prisma.paymentIntent.create({
      data: { tenantId, plan, referencia, monto, status: 'PENDING' },
    });

    const firma = this.generarFirma(referencia, monto, 'COP');
    const redirectUrl = `${process.env.FRONTEND_URL}/pago-resultado`;

    const params = new URLSearchParams();
    params.set('public-key', process.env.WOMPI_PUBLIC_KEY ?? '');
    params.set('currency', 'COP');
    params.set('amount-in-cents', String(monto));
    params.set('reference', referencia);
    params.set('signature:integrity', firma);
    params.set('redirect-url', redirectUrl);

    const checkoutUrl = `https://checkout.wompi.co/p/?${params.toString()}`;

    return {
      checkoutUrl,
      publicKey: process.env.WOMPI_PUBLIC_KEY,
      referencia,
      monto,
      moneda: 'COP',
      firma,
      redirectUrl,
    };
  }

  generarFirma(referencia: string, monto: number, moneda: string): string {
    const cadena = `${referencia}${monto}${moneda}${process.env.WOMPI_INTEGRITY_SECRET}`;
    return crypto.createHash('sha256').update(cadena).digest('hex');
  }

  async procesarWebhook(payload: any, firmaRecibida: string) {
    const esValido = this.verificarFirmaWebhook(payload, firmaRecibida);
    if (!esValido) throw new UnauthorizedException('Firma inválida');

    const { event, data } = payload;

    if (event === 'transaction.updated') {
      const transaccion = data.transaction;
      const referencia: string = transaccion.reference;

      const intent = await this.prisma.paymentIntent.findFirst({
        where: { referencia },
      });
      if (!intent) return { ok: true };

      if (transaccion.status === 'APPROVED') {
        const proximoMes = new Date();
        proximoMes.setMonth(proximoMes.getMonth() + 1);

        await this.prisma.$transaction([
          this.prisma.paymentIntent.update({
            where: { id: intent.id },
            data: { status: 'APPROVED', wompiTransactionId: transaccion.id },
          }),
          this.prisma.tenant.update({
            where: { id: intent.tenantId },
            data: {
              subscriptionStatus: SubscriptionStatus.ACTIVE,
              subscriptionPlan: intent.plan,
              subscriptionEndsAt: proximoMes,
              trialEndsAt: null,
              plan: intent.plan as Plan,
            },
          }),
        ]);

        // Registrar pago en historial de facturación
        await this.billingService.registrarPago(
          intent.tenantId,
          intent.monto / 100,
          intent.plan,
          referencia,
          transaccion.id,
          'COMPLETADO',
          `Plan ${intent.plan}`,
        );

        // Notificar al owner por email
        const tenant = await this.prisma.tenant.findUnique({
          where: { id: intent.tenantId },
          include: { users: { where: { role: Role.OWNER }, take: 1 } },
        });
        if (tenant?.users[0]?.email) {
          this.emailService.sendConfirmacionPago(tenant.users[0].email, {
            ownerName: tenant.users[0].nombre ?? tenant.businessName,
            storeName: tenant.businessName,
            plan: intent.plan,
            monto: intent.monto / 100,
            referencia,
          }).catch((e) => this.logger.error('Email confirmación pago failed', e));
        }
      } else if (
        transaccion.status === 'DECLINED' ||
        transaccion.status === 'VOIDED'
      ) {
        await this.prisma.paymentIntent.update({
          where: { id: intent.id },
          data: { status: transaccion.status },
        });

        // Registrar pago fallido
        await this.billingService.registrarPago(
          intent.tenantId,
          intent.monto / 100,
          intent.plan,
          referencia,
          transaccion.id,
          'FALLIDO',
          `Plan ${intent.plan} - ${transaccion.status}`,
        );
      }
    }

    return { ok: true };
  }

  verificarFirmaWebhook(payload: any, firmaRecibida: string): boolean {
    const secret = process.env.WOMPI_EVENTS_SECRET;
    if (!secret) {
      // Sin secret configurado no podemos validar — rechazar siempre
      return false;
    }
    const cadena = JSON.stringify(payload) + secret;
    const firmaCalculada = crypto
      .createHash('sha256')
      .update(cadena)
      .digest('hex');
    return firmaCalculada === firmaRecibida;
  }

  async verificarTransaccion(transactionId: string) {
    const wompiUrl = process.env.WOMPI_BASE_URL ?? 'https://sandbox.wompi.co/v1';
    const response = await fetch(`${wompiUrl}/transactions/${transactionId}`, {
      headers: { Authorization: `Bearer ${process.env.WOMPI_PRIVATE_KEY}` },
    });
    const data = await response.json();
    const tx = data.data;
    return {
      status: tx.status as string,
      reference: tx.reference as string,
      amount: tx.amount_in_cents as number,
      currency: tx.currency as string,
    };
  }

  async activarPorReferencia(referencia: string) {
    const intent = await this.prisma.paymentIntent.findFirst({
      where: { referencia },
    });
    if (!intent) throw new NotFoundException('Referencia no encontrada');

    const proximoMes = new Date();
    proximoMes.setMonth(proximoMes.getMonth() + 1);

    await this.prisma.$transaction([
      this.prisma.paymentIntent.update({
        where: { id: intent.id },
        data: { status: 'APPROVED' },
      }),
      this.prisma.tenant.update({
        where: { id: intent.tenantId },
        data: {
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          subscriptionPlan: intent.plan,
          subscriptionEndsAt: proximoMes,
          plan: intent.plan as Plan,
        },
      }),
    ]);

    return { ok: true, plan: intent.plan };
  }

  async getSubscripcion(tenantId: string) {
    return this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        subscriptionStatus: true,
        subscriptionPlan: true,
        subscriptionEndsAt: true,
        trialEndsAt: true,
      },
    });
  }
}
