import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getMetricas(tenantId: string) {
    const now = new Date();

    // Colombia = UTC-5
    const offsetMs = 5 * 60 * 60 * 1000;
    const nowColombia = new Date(now.getTime() - offsetMs);
    const hoyInicio = new Date(
      Date.UTC(nowColombia.getUTCFullYear(), nowColombia.getUTCMonth(), nowColombia.getUTCDate()) + offsetMs,
    );
    const mesInicio = new Date(
      Date.UTC(nowColombia.getUTCFullYear(), nowColombia.getUTCMonth(), 1) + offsetMs,
    );

    const [
      ordenesHoy,
      ordenesMes,
      ingresosMesData,
      citasHoy,
      citasMes,
      citasPendientes,
      totalProductos,
      productosStockBajo,
      ticketsAbiertos,
      ticketsResueltosHoy,
      ultimasOrdenes,
      ultimasCitas,
      phonesOrden,
      phonesCita,
    ] = await Promise.all([
      this.prisma.order.count({ where: { tenantId, createdAt: { gte: hoyInicio } } }),
      this.prisma.order.count({ where: { tenantId, createdAt: { gte: mesInicio } } }),
      this.prisma.order.aggregate({
        where: { tenantId, createdAt: { gte: mesInicio }, status: { notIn: ['CANCELLED'] } },
        _sum: { total: true },
      }),
      this.prisma.appointment.count({ where: { tenantId, createdAt: { gte: hoyInicio } } }),
      this.prisma.appointment.count({ where: { tenantId, createdAt: { gte: mesInicio } } }),
      this.prisma.appointment.count({
        where: { tenantId, status: { in: ['SCHEDULED', 'CONFIRMED'] }, date: { gte: now } },
      }),
      this.prisma.product.count({ where: { tenantId, active: true } }),
      this.prisma.product.count({ where: { tenantId, active: true, stock: { lt: 5 } } }),
      this.prisma.ticket.count({
        where: { tenantId, status: { notIn: ['DELIVERED', 'CANCELLED'] } },
      }),
      this.prisma.ticket.count({
        where: { tenantId, status: 'DELIVERED', updatedAt: { gte: hoyInicio } },
      }),
      this.prisma.order.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, number: true, total: true, status: true, createdAt: true, phone: true },
      }),
      this.prisma.appointment.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          clientName: true,
          date: true,
          status: true,
          createdAt: true,
          service: { select: { name: true } },
        },
      }),
      this.prisma.order.findMany({
        where: { tenantId, createdAt: { gte: mesInicio }, phone: { not: null } },
        select: { phone: true },
        distinct: ['phone'],
      }),
      this.prisma.appointment.findMany({
        where: { tenantId, createdAt: { gte: mesInicio } },
        select: { clientPhone: true },
        distinct: ['clientPhone'],
      }),
    ]);

    const phonesSet = new Set([
      ...phonesOrden.map((o) => o.phone),
      ...phonesCita.map((c) => c.clientPhone),
    ]);

    return {
      ordenesHoy,
      ordenesMes,
      ingresosMes: Math.round(ingresosMesData._sum.total ?? 0),
      citasHoy,
      citasMes,
      citasPendientes,
      conversacionesMes: phonesSet.size,
      totalProductos,
      productosStockBajo,
      ticketsAbiertos,
      ticketsResueltosHoy,
      ultimasOrdenes: ultimasOrdenes.map((o) => ({
        id: o.id,
        clienteNombre: o.phone ?? `#${o.number}`,
        total: o.total,
        status: o.status,
        createdAt: o.createdAt,
      })),
      ultimasCitas: ultimasCitas.map((c) => ({
        id: c.id,
        clienteName: c.clientName,
        serviceName: c.service?.name ?? '—',
        date: c.date,
        status: c.status,
        createdAt: c.createdAt,
      })),
    };
  }
}
