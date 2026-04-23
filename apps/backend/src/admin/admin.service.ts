import { Injectable, NotFoundException } from '@nestjs/common';
import { SubscriptionStatus, Plan } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const PLAN_PRICES: Record<string, number> = {
  STARTER: 79000,
  PRO: 242000,
  BUSINESS: 529000,
};

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getTenants(filters: { status?: string; industry?: string; search?: string }) {
    const where: any = {};
    if (filters.status) where.subscriptionStatus = filters.status;
    if (filters.industry) where.industry = filters.industry;
    if (filters.search) where.name = { contains: filters.search, mode: 'insensitive' };

    const now = new Date();
    const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);

    const tenants = await this.prisma.tenant.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { users: true, orders: true, appointments: true },
        },
      },
    });

    return tenants.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      industry: t.industry,
      subscriptionStatus: t.subscriptionStatus,
      subscriptionPlan: t.subscriptionPlan,
      plan: t.plan,
      trialEndsAt: t.trialEndsAt,
      subscriptionEndsAt: t.subscriptionEndsAt,
      createdAt: t.createdAt,
      active: t.active,
      _count: t._count,
    }));
  }

  async getTenantById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        users: { select: { id: true, name: true, email: true, role: true, active: true } },
        _count: { select: { orders: true, appointments: true, tickets: true } },
      },
    });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');

    const now = new Date();
    const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);

    const [ordenesMes, citasMes] = await Promise.all([
      this.prisma.order.count({ where: { tenantId: id, createdAt: { gte: inicioMes } } }),
      this.prisma.appointment.count({ where: { tenantId: id, createdAt: { gte: inicioMes } } }),
    ]);

    const ultimasOrdenes = await this.prisma.order.findMany({
      where: { tenantId: id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, number: true, status: true, total: true, createdAt: true },
    });

    const ultimasCitas = await this.prisma.appointment.findMany({
      where: { tenantId: id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, clientName: true, date: true, status: true, createdAt: true },
    });

    return {
      ...tenant,
      metricas: { ordenesMes, citasMes },
      ultimasOrdenes,
      ultimasCitas,
    };
  }

  async getMetricas() {
    const now = new Date();
    const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);

    const hace2dias = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    const [activos, trial, suspendidos, cancelados, nuevosMes, porIndustria, sinConfigurar] = await Promise.all([
      this.prisma.tenant.count({ where: { subscriptionStatus: SubscriptionStatus.ACTIVE } }),
      this.prisma.tenant.count({ where: { subscriptionStatus: SubscriptionStatus.TRIAL } }),
      this.prisma.tenant.count({ where: { subscriptionStatus: SubscriptionStatus.SUSPENDED } }),
      this.prisma.tenant.count({ where: { subscriptionStatus: SubscriptionStatus.CANCELLED } }),
      this.prisma.tenant.count({ where: { createdAt: { gte: inicioMes } } }),
      this.prisma.tenant.groupBy({ by: ['industry'], _count: { industry: true } }),
      this.prisma.tenant.count({
        where: { onboardingDone: false, createdAt: { lte: hace2dias } },
      }),
    ]);

    const tenantsActivos = await this.prisma.tenant.findMany({
      where: { subscriptionStatus: SubscriptionStatus.ACTIVE },
      select: { subscriptionPlan: true, plan: true },
    });

    const mrr = tenantsActivos.reduce((sum, t) => {
      const planKey = t.subscriptionPlan ?? t.plan;
      return sum + (PLAN_PRICES[planKey] ?? 0);
    }, 0);

    return {
      activos,
      trial,
      suspendidos,
      cancelados,
      nuevosMes,
      sinConfigurar,
      mrr,
      porIndustria: porIndustria.map((g) => ({ industry: g.industry, count: g._count.industry })),
    };
  }

  async updateStatus(id: string, status: string, plan?: string) {
    const data: any = { subscriptionStatus: status as SubscriptionStatus };
    if (plan) {
      data.plan = plan as Plan;
      data.subscriptionPlan = plan;
    }
    return this.prisma.tenant.update({ where: { id }, data });
  }

  async extenderTrial(id: string, days: number) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');

    const base = tenant.trialEndsAt && tenant.trialEndsAt > new Date()
      ? tenant.trialEndsAt
      : new Date();
    const nuevaFecha = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);

    return this.prisma.tenant.update({
      where: { id },
      data: { trialEndsAt: nuevaFecha, subscriptionStatus: SubscriptionStatus.TRIAL },
    });
  }
}
