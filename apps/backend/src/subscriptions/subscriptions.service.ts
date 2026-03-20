import { BadRequestException, Injectable } from '@nestjs/common';
import { Plan, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const PLAN_LIMITS: Record<Plan, { conversations: number | null; apiKeys: boolean; teamSize: number | null }> = {
  STARTER: { conversations: 500, apiKeys: false, teamSize: 3 },
  PRO: { conversations: 2000, apiKeys: false, teamSize: 10 },
  BUSINESS: { conversations: null, apiKeys: true, teamSize: null },
};

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

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
      PRO: 14900000,      // $149,000 COP en centavos
      BUSINESS: 29900000, // $299,000 COP en centavos
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
}
