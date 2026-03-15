import * as crypto from 'crypto';
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Role, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type PlanKey = 'STARTER' | 'PRO' | 'BUSINESS';

const PRECIOS: Record<PlanKey, number> = {
  STARTER: 14900000,   // $149.000 en centavos
  PRO: 29900000,       // $299.000 en centavos
  BUSINESS: 59900000,  // $599.000 en centavos
};

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

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
    console.log('Checkout URL generada:', checkoutUrl);

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
            },
          }),
        ]);
      } else if (
        transaccion.status === 'DECLINED' ||
        transaccion.status === 'VOIDED'
      ) {
        await this.prisma.paymentIntent.update({
          where: { id: intent.id },
          data: { status: transaccion.status },
        });
      }
    }

    return { ok: true };
  }

  verificarFirmaWebhook(payload: any, firmaRecibida: string): boolean {
    const cadena =
      JSON.stringify(payload) + process.env.WOMPI_EVENTS_SECRET;
    const firmaCalculada = crypto
      .createHash('sha256')
      .update(cadena)
      .digest('hex');
    return firmaCalculada === firmaRecibida;
  }

  async activarPorReferencia(tenantId: string, referencia: string) {
    const intent = await this.prisma.paymentIntent.findFirst({
      where: { referencia, tenantId },
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
