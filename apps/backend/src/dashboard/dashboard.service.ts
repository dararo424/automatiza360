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
    const ayerInicio = new Date(hoyInicio.getTime() - 24 * 60 * 60 * 1000);
    const mesInicio = new Date(
      Date.UTC(nowColombia.getUTCFullYear(), nowColombia.getUTCMonth(), 1) + offsetMs,
    );
    const semanaInicio = new Date(hoyInicio.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      ordenesHoy,
      ordenesAyer,
      ordenesMes,
      ingresosMesData,
      ingresosAyerData,
      citasHoy,
      citasAyer,
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
      contactosNuevosSemana,
      contactosTotales,
    ] = await Promise.all([
      this.prisma.order.count({ where: { tenantId, createdAt: { gte: hoyInicio } } }),
      this.prisma.order.count({ where: { tenantId, createdAt: { gte: ayerInicio, lt: hoyInicio } } }),
      this.prisma.order.count({ where: { tenantId, createdAt: { gte: mesInicio } } }),
      this.prisma.order.aggregate({
        where: { tenantId, createdAt: { gte: mesInicio }, status: { notIn: ['CANCELLED'] } },
        _sum: { total: true },
      }),
      this.prisma.order.aggregate({
        where: { tenantId, createdAt: { gte: ayerInicio, lt: hoyInicio }, status: { notIn: ['CANCELLED'] } },
        _sum: { total: true },
      }),
      this.prisma.appointment.count({ where: { tenantId, createdAt: { gte: hoyInicio } } }),
      this.prisma.appointment.count({ where: { tenantId, createdAt: { gte: ayerInicio, lt: hoyInicio } } }),
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
      this.prisma.contact.count({ where: { tenantId, createdAt: { gte: semanaInicio } } }),
      this.prisma.contact.count({ where: { tenantId } }),
    ]);

    const phonesSet = new Set([
      ...phonesOrden.map((o) => o.phone),
      ...phonesCita.map((c) => c.clientPhone),
    ]);

    return {
      ordenesHoy,
      ordenesAyer,
      ordenesMes,
      ingresosMes: Math.round(ingresosMesData._sum.total ?? 0),
      ingresosAyer: Math.round(ingresosAyerData._sum.total ?? 0),
      citasHoy,
      citasAyer,
      citasMes,
      citasPendientes,
      conversacionesMes: phonesSet.size,
      totalProductos,
      productosStockBajo,
      ticketsAbiertos,
      ticketsResueltosHoy,
      contactosNuevosSemana,
      contactosTotales,
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

  async getTendencias(tenantId: string, days: number = 30): Promise<Array<{ date: string; ordenes: number; citas: number; ingresos: number }>> {
    const now = new Date();
    const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const [orders, appointments] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          tenantId,
          createdAt: { gte: since },
          status: { notIn: ['CANCELLED'] },
        },
        select: { createdAt: true, total: true },
      }),
      this.prisma.appointment.findMany({
        where: {
          tenantId,
          date: { gte: since },
          status: { notIn: ['CANCELLED'] },
        },
        select: { date: true },
      }),
    ]);

    const result: Map<string, { ordenes: number; citas: number; ingresos: number }> = new Map();

    for (let d = 0; d < days; d++) {
      const day = new Date(since.getTime() + d * 24 * 60 * 60 * 1000);
      const key = day.toISOString().substring(0, 10);
      result.set(key, { ordenes: 0, citas: 0, ingresos: 0 });
    }

    for (const order of orders) {
      const key = order.createdAt.toISOString().substring(0, 10);
      const entry = result.get(key);
      if (entry) {
        entry.ordenes += 1;
        entry.ingresos += order.total;
      }
    }

    for (const appt of appointments) {
      const key = appt.date.toISOString().substring(0, 10);
      const entry = result.get(key);
      if (entry) {
        entry.citas += 1;
      }
    }

    return Array.from(result.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getBotMetricas(tenantId: string) {
    const now = new Date();
    const offsetMs = 5 * 60 * 60 * 1000;
    const nowColombia = new Date(now.getTime() - offsetMs);
    const mesInicio = new Date(
      Date.UTC(nowColombia.getUTCFullYear(), nowColombia.getUTCMonth(), 1) + offsetMs,
    );

    const [
      totalConversaciones,
      conversacionesMes,
      totalMensajes,
      mensajesMes,
      mensajesEntrantes,
      mensajesSalientes,
      tenant,
    ] = await Promise.all([
      this.prisma.conversation.count({ where: { tenantId } }),
      this.prisma.conversation.count({ where: { tenantId, createdAt: { gte: mesInicio } } }),
      this.prisma.message.count({ where: { conversation: { tenantId } } }),
      this.prisma.message.count({ where: { conversation: { tenantId }, createdAt: { gte: mesInicio } } }),
      this.prisma.message.count({ where: { conversation: { tenantId }, direction: 'INBOUND', createdAt: { gte: mesInicio } } }),
      this.prisma.message.count({ where: { conversation: { tenantId }, direction: 'OUTBOUND', createdAt: { gte: mesInicio } } }),
      this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { conversationCountMonth: true, plan: true },
      }),
    ]);

    return {
      totalConversaciones,
      conversacionesMes,
      totalMensajes,
      mensajesMes,
      mensajesEntrantes,
      mensajesSalientes,
      tasaRespuesta: mensajesEntrantes > 0
        ? Math.round((mensajesSalientes / mensajesEntrantes) * 100)
        : 0,
      usoCuotaMes: tenant?.conversationCountMonth ?? 0,
      plan: tenant?.plan ?? 'STARTER',
    };
  }

  async getRoi(tenantId: string) {
    const now = new Date();
    const mesInicio = new Date(now.getFullYear(), now.getMonth(), 1);

    // Minutes saved per automated interaction (conservative estimate)
    const MINUTOS_POR_MENSAJE = 3;
    // Average hourly wage for a Colombian small business employee (~COP/hour)
    const COSTO_HORA_COP = 15000;

    const [mensajesSalientes, contactosTotales, campañasEnviadas, ordenesBot] = await Promise.all([
      this.prisma.message.count({ where: { conversation: { tenantId }, direction: 'OUTBOUND', createdAt: { gte: mesInicio } } }),
      this.prisma.contact.count({ where: { tenantId } }),
      this.prisma.campaña.count({ where: { tenantId, createdAt: { gte: mesInicio } } }),
      this.prisma.order.count({ where: { tenantId, createdAt: { gte: mesInicio }, phone: { not: null } } }),
    ]);

    const minutosAhorrados = mensajesSalientes * MINUTOS_POR_MENSAJE;
    const horasAhorradas = Math.round(minutosAhorrados / 60);
    const ahorroEstimadoCOP = Math.round((minutosAhorrados / 60) * COSTO_HORA_COP);

    return {
      mensajesAutomatizados: mensajesSalientes,
      minutosAhorrados,
      horasAhorradas,
      ahorroEstimadoCOP,
      contactosTotales,
      campañasEnviadas,
      ordenesViaBot: ordenesBot,
    };
  }
}
