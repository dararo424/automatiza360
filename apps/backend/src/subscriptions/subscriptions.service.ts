import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Plan, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

const PLAN_LIMITS: Record<Plan, { conversations: number | null; apiKeys: boolean; teamSize: number | null }> = {
  STARTER: { conversations: 500, apiKeys: false, teamSize: 3 },
  PRO: { conversations: 2000, apiKeys: false, teamSize: 10 },
  BUSINESS: { conversations: null, apiKeys: true, teamSize: null },
};

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  // ── Cron: verificar suscripciones y trials diariamente a las 8am Colombia ──

  @Cron('0 13 * * *') // 8am Colombia = 13:00 UTC
  async verificarSuscripcionesYTrials(): Promise<void> {
    const now = new Date();
    const en3dias = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const en1dia = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

    // 1. Trials que terminan en 3 días o 1 día → aviso
    const trialsProximos = await this.prisma.tenant.findMany({
      where: {
        subscriptionStatus: SubscriptionStatus.TRIAL,
        trialEndsAt: { gte: now, lte: en3dias },
        active: true,
      },
      include: { users: { where: { role: 'OWNER', active: true }, select: { email: true, name: true }, take: 1 } },
    });

    for (const tenant of trialsProximos) {
      const owner = tenant.users[0];
      if (!owner) continue;
      const diasRestantes = Math.ceil((tenant.trialEndsAt!.getTime() - now.getTime()) / 86400000);
      try {
        await this.emailService.enviarTrialTerminaPronto(owner.email, owner.name, diasRestantes, tenant.plan);
        this.logger.log(`Trial ending email → ${owner.email} (${diasRestantes}d)`);
      } catch (e) {
        this.logger.error(`Trial email failed for ${owner.email}: ${(e as Error).message}`);
      }
    }

    // 2. Trials vencidos → suspender
    const trialsVencidos = await this.prisma.tenant.findMany({
      where: { subscriptionStatus: SubscriptionStatus.TRIAL, trialEndsAt: { lt: now }, active: true },
      include: { users: { where: { role: 'OWNER', active: true }, select: { email: true, name: true }, take: 1 } },
    });

    for (const tenant of trialsVencidos) {
      await this.prisma.tenant.update({ where: { id: tenant.id }, data: { subscriptionStatus: SubscriptionStatus.SUSPENDED } });
      const owner = tenant.users[0];
      if (owner) {
        try {
          await this.emailService.enviarSuscripcionVencida(owner.email, owner.name);
        } catch (e) {
          this.logger.error(`Suspended email failed for ${owner.email}: ${(e as Error).message}`);
        }
      }
      this.logger.log(`Trial expired → suspended: ${tenant.id}`);
    }

    // 3. Suscripciones activas que vencen en 3 días o 1 día → aviso
    const suscProximas = await this.prisma.tenant.findMany({
      where: {
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionEndsAt: { gte: now, lte: en3dias },
        active: true,
      },
      include: { users: { where: { role: 'OWNER', active: true }, select: { email: true, name: true }, take: 1 } },
    });

    for (const tenant of suscProximas) {
      const owner = tenant.users[0];
      if (!owner || !tenant.subscriptionEndsAt) continue;
      const diasRestantes = Math.ceil((tenant.subscriptionEndsAt.getTime() - now.getTime()) / 86400000);
      const fechaFmt = tenant.subscriptionEndsAt.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
      try {
        await this.emailService.enviarSuscripcionExpiraPronto(owner.email, owner.name, diasRestantes, fechaFmt);
        this.logger.log(`Subscription expiring email → ${owner.email} (${diasRestantes}d)`);
      } catch (e) {
        this.logger.error(`Expiry email failed for ${owner.email}: ${(e as Error).message}`);
      }
    }

    // 4. Suscripciones activas vencidas → suspender
    const suscVencidas = await this.prisma.tenant.findMany({
      where: {
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionEndsAt: { lt: now },
        active: true,
      },
      include: { users: { where: { role: 'OWNER', active: true }, select: { email: true, name: true }, take: 1 } },
    });

    for (const tenant of suscVencidas) {
      await this.prisma.tenant.update({ where: { id: tenant.id }, data: { subscriptionStatus: SubscriptionStatus.SUSPENDED } });
      const owner = tenant.users[0];
      if (owner) {
        try {
          await this.emailService.enviarSuscripcionVencida(owner.email, owner.name);
        } catch (e) {
          this.logger.error(`Expired email failed for ${owner.email}: ${(e as Error).message}`);
        }
      }
      this.logger.log(`Subscription expired → suspended: ${tenant.id}`);
    }
  }

  // ── Cron: resetear contador de conversaciones el 1ro de cada mes ──────────

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async resetearContadoresMensuales(): Promise<void> {
    const result = await this.prisma.tenant.updateMany({
      where: { active: true },
      data: { conversationCountMonth: 0 },
    });
    this.logger.log(`Conversation counters reset: ${result.count} tenants`);
  }

  async checkTrialStatus(tenantId: string): Promise<void> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { trialEndsAt: true, subscriptionStatus: true },
    });

    if (
      tenant?.subscriptionStatus === SubscriptionStatus.TRIAL &&
      tenant.trialEndsAt &&
      tenant.trialEndsAt < new Date()
    ) {
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: { subscriptionStatus: SubscriptionStatus.SUSPENDED },
      });
    }
  }

  async getTrialInfo(tenantId: string) {
    await this.checkTrialStatus(tenantId);

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { trialEndsAt: true, subscriptionStatus: true },
    });

    if (!tenant) {
      return { daysRemaining: 0, status: 'SUSPENDED', trialEndsAt: null };
    }

    const now = new Date();
    const daysRemaining = tenant.trialEndsAt
      ? Math.max(0, Math.ceil((tenant.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    return {
      daysRemaining,
      status: tenant.subscriptionStatus,
      trialEndsAt: tenant.trialEndsAt?.toISOString() ?? null,
    };
  }

  async getPlanInfo(tenantId: string) {
    await this.checkTrialStatus(tenantId);

    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: {
        plan: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        subscriptionEndsAt: true,
        trialEndsAt: true,
        conversationCountMonth: true,
      },
    });

    const planKey = (tenant.subscriptionPlan ?? tenant.plan) as Plan;
    const limits = PLAN_LIMITS[planKey] ?? PLAN_LIMITS.STARTER;

    const now = new Date();
    const daysRemaining = tenant.trialEndsAt
      ? Math.max(0, Math.ceil((tenant.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    return {
      plan: planKey,
      status: tenant.subscriptionStatus,
      trialEndsAt: tenant.trialEndsAt?.toISOString() ?? null,
      subscriptionEndsAt: tenant.subscriptionEndsAt?.toISOString() ?? null,
      daysRemaining,
      conversations: {
        used: tenant.conversationCountMonth,
        limit: limits.conversations,
      },
      features: {
        apiKeys: limits.apiKeys,
        teamSize: limits.teamSize,
        conversationLimit: limits.conversations,
      },
    };
  }

  async iniciarUpgrade(tenantId: string, nuevoPlan: string) {
    const PLAN_PRECIOS: Record<string, number> = {
      STARTER: 7900000,   // $79,000 COP en centavos
      PRO: 24200000,      // $242,000 COP en centavos
      BUSINESS: 52900000, // $529,000 COP en centavos
    };

    const monto = PLAN_PRECIOS[nuevoPlan];
    if (!monto) throw new BadRequestException('Plan no válido para upgrade');

    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { id: true, name: true },
    });

    const referencia = `upgrade-${tenant.id}-${nuevoPlan}-${Date.now()}`;

    await this.prisma.paymentIntent.create({
      data: {
        tenantId,
        plan: nuevoPlan,
        referencia,
        monto,
        status: 'PENDING',
      },
    });

    const wompiKey = process.env.WOMPI_PUBLIC_KEY ?? 'pub_test_placeholder';
    const redirectUrl = encodeURIComponent(
      `${process.env.FRONTEND_URL ?? 'https://app.automatiza360.com'}/pago-resultado`,
    );
    const url =
      `https://checkout.wompi.co/p/?public-key=${wompiKey}` +
      `&currency=COP&amount-in-cents=${monto}` +
      `&reference=${referencia}&redirect-url=${redirectUrl}`;

    return { url, referencia };
  }

  async cancelarSuscripcion(tenantId: string) {
    const tenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { subscriptionStatus: SubscriptionStatus.CANCELLED },
      select: { id: true, name: true, subscriptionStatus: true },
    });

    // Notify owner via email
    const owner = await this.prisma.user.findFirst({
      where: { tenantId, role: 'OWNER' },
      select: { email: true },
    });
    if (owner) {
      await this.emailService.send({
        to: owner.email,
        subject: 'Tu suscripción ha sido cancelada — Automatiza360',
        html: `
          <h2>Suscripción cancelada</h2>
          <p>Hola ${tenant.name},</p>
          <p>Tu suscripción ha sido cancelada. Tendrás acceso hasta fin de mes.</p>
          <p>Si cambias de opinión, puedes reactivarla en cualquier momento desde tu panel.</p>
          <a href="${process.env.FRONTEND_URL ?? 'https://app.automatiza360.com'}/mi-plan"
             style="background:#4f46e5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">
            Ir a Mi Plan →
          </a>
        `,
      });
    }

    return { status: tenant.subscriptionStatus, message: 'Suscripción cancelada. Tendrás acceso hasta fin de mes.' };
  }

  async reactivarSuscripcion(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { subscriptionStatus: true, trialEndsAt: true },
    });

    if (!tenant) throw new BadRequestException('Tenant no encontrado');
    if (tenant.subscriptionStatus !== SubscriptionStatus.CANCELLED) {
      throw new BadRequestException('Solo se puede reactivar una suscripción cancelada');
    }

    const now = new Date();
    const isInTrial = tenant.trialEndsAt && tenant.trialEndsAt > now;
    const newStatus = isInTrial ? SubscriptionStatus.TRIAL : SubscriptionStatus.ACTIVE;

    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { subscriptionStatus: newStatus },
      select: { subscriptionStatus: true },
    });

    return { status: updated.subscriptionStatus, message: 'Suscripción reactivada exitosamente.' };
  }
}
