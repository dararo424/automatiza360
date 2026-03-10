import { Injectable } from '@nestjs/common';
import { SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

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
}
