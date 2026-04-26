import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Plan } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PLAN_FEATURE_KEY, PlanFeature } from '../decorators/plan-feature.decorator';

const PLAN_LIMITS: Record<Plan, { teamSize: number | null; apiKeys: boolean }> = {
  STARTER:  { teamSize: 3,    apiKeys: false },
  PRO:      { teamSize: 10,   apiKeys: false },
  BUSINESS: { teamSize: null, apiKeys: true  },
};

@Injectable()
export class PlanLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const feature = this.reflector.get<PlanFeature>(PLAN_FEATURE_KEY, context.getHandler());
    if (!feature) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as { userId: string; tenantId: string } | undefined;
    if (!user?.tenantId) return true;

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { plan: true },
    });
    if (!tenant) return true;

    const limits = PLAN_LIMITS[tenant.plan as Plan] ?? PLAN_LIMITS.STARTER;

    if (feature === 'API_KEYS' && !limits.apiKeys) {
      throw new ForbiddenException(
        'Las API Keys solo están disponibles en el plan BUSINESS. Actualiza tu plan para acceder.',
      );
    }

    if (feature === 'TEAM_SIZE' && limits.teamSize !== null) {
      const count = await this.prisma.user.count({
        where: { tenantId: user.tenantId, active: true },
      });
      if (count >= limits.teamSize) {
        throw new ForbiddenException(
          `Tu plan ${tenant.plan} permite hasta ${limits.teamSize} miembros de equipo. Actualiza tu plan para agregar más.`,
        );
      }
    }

    return true;
  }
}
