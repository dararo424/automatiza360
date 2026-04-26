import { Injectable, NotFoundException } from '@nestjs/common';
import { AppointmentStatus, OrderStatus, TicketStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminBotResumenesService {
  constructor(private readonly prisma: PrismaService) {}

  async resumenDia(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');

    const hoy = new Date();
    hoy.setUTCHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setUTCDate(manana.getUTCDate() + 1);

    const industry = tenant.industry;

    if (industry === 'RESTAURANT' || industry === 'BAKERY') {
      const ordenes = await this.prisma.order.findMany({
        where: { tenantId, createdAt: { gte: hoy, lt: manana } },
        include: { items: true },
      });
      const pendientes = ordenes.filter(
        (o) =>
          o.status === OrderStatus.PENDING ||
          o.status === OrderStatus.CONFIRMED ||
          o.status === OrderStatus.PREPARING,
      );
      const ingresos = ordenes
        .filter((o) => o.status !== OrderStatus.CANCELLED)
        .reduce((sum, o) => sum + o.total, 0);

      return {
        industria: industry,
        totalOrdenes: ordenes.length,
        ordenesPendientes: pendientes.length,
        ingresosDelDia: ingresos,
        ordenes: ordenes.map((o) => ({
          numero: o.number,
          estado: o.status,
          total: o.total,
          items: o.items.map((i) => `${i.quantity}x ${i.name}`).join(', '),
        })),
      };
    }

    if (industry === 'TECH_STORE' || industry === 'WORKSHOP') {
      const ticketsAbiertos = await this.prisma.ticket.findMany({
        where: {
          tenantId,
          status: { notIn: [TicketStatus.DELIVERED, TicketStatus.CANCELLED] },
        },
      });
      const ticketsCerradosHoy = await this.prisma.ticket.findMany({
        where: {
          tenantId,
          status: TicketStatus.DELIVERED,
          updatedAt: { gte: hoy, lt: manana },
        },
      });
      const ingresos = ticketsCerradosHoy.reduce((sum, t) => sum + (t.price ?? 0), 0);

      return {
        industria: industry,
        ticketsAbiertos: ticketsAbiertos.length,
        ticketsCerradosHoy: ticketsCerradosHoy.length,
        ingresosDelDia: ingresos,
      };
    }

    if (industry === 'CLINIC' || industry === 'BEAUTY' || industry === 'VETERINARY') {
      const citas = await this.prisma.appointment.findMany({
        where: { tenantId, date: { gte: hoy, lt: manana } },
        include: { service: true, professional: true },
      });
      const completadas = citas.filter((c) => c.status === AppointmentStatus.COMPLETED);
      const pendientes = citas.filter(
        (c) => c.status === AppointmentStatus.SCHEDULED || c.status === AppointmentStatus.CONFIRMED,
      );

      return {
        industria: industry,
        totalCitas: citas.length,
        citasCompletadas: completadas.length,
        citasPendientes: pendientes.length,
        citas: citas.map((c) => ({
          hora: c.date.toISOString(),
          cliente: c.clientName,
          servicio: c.service.name,
          profesional: c.professional?.name ?? null,
          estado: c.status,
        })),
      };
    }

    if (industry === 'CLOTHING_STORE') {
      const ordenes = await this.prisma.order.findMany({
        where: { tenantId, createdAt: { gte: hoy, lt: manana } },
      });
      const bajoStockProductos = await this.prisma.$queryRaw<
        Array<{ name: string; stock: number; minStock: number }>
      >`
        SELECT name, stock, "minStock" FROM "Product"
        WHERE "tenantId" = ${tenantId} AND active = true AND stock <= "minStock"
      `;

      return {
        industria: industry,
        ordenesDelDia: ordenes.length,
        productosStockBajo: bajoStockProductos.map((p) => ({
          nombre: p.name,
          stock: p.stock,
          minStock: p.minStock,
        })),
      };
    }

    return { industria: industry, mensaje: 'Industria sin resumen específico configurado' };
  }

  async resumenMes(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');

    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const inicioMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
    const finMesAnterior = new Date(inicioMes.getTime() - 1);

    const [ordenesEste, ordenesPrevio, citasEste, citasPrevio, contactosEste, gastosEste] =
      await Promise.all([
        this.prisma.order.aggregate({
          where: { tenantId, createdAt: { gte: inicioMes }, status: { not: OrderStatus.CANCELLED } },
          _count: { id: true },
          _sum: { total: true },
        }),
        this.prisma.order.aggregate({
          where: {
            tenantId,
            createdAt: { gte: inicioMesAnterior, lte: finMesAnterior },
            status: { not: OrderStatus.CANCELLED },
          },
          _count: { id: true },
          _sum: { total: true },
        }),
        this.prisma.appointment.count({ where: { tenantId, createdAt: { gte: inicioMes } } }),
        this.prisma.appointment.count({
          where: { tenantId, createdAt: { gte: inicioMesAnterior, lte: finMesAnterior } },
        }),
        this.prisma.contact.count({ where: { tenantId, createdAt: { gte: inicioMes } } }),
        this.prisma.gasto.aggregate({
          where: { tenantId, fecha: { gte: inicioMes } },
          _sum: { monto: true },
        }),
      ]);

    const pct = (cur: number, prev: number) =>
      prev === 0 ? null : Math.round(((cur - prev) / prev) * 100);

    return {
      mes: ahora.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }),
      ordenes: {
        cantidad: ordenesEste._count.id,
        ingresos: ordenesEste._sum.total ?? 0,
        vsAnterior: pct(ordenesEste._count.id, ordenesPrevio._count.id),
      },
      citas: { cantidad: citasEste, vsAnterior: pct(citasEste, citasPrevio) },
      contactosNuevos: contactosEste,
      gastosTotal: gastosEste._sum.monto ?? 0,
    };
  }

  async verResenasRecientes(tenantId: string) {
    const [resenas, nps] = await Promise.all([
      this.prisma.resena.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
      this.prisma.npsRespuesta.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    const promedioResenas = resenas.length
      ? (resenas.reduce((s, r) => s + r.rating, 0) / resenas.length).toFixed(1)
      : null;

    return {
      promedioRating: promedioResenas,
      totalResenas: resenas.length,
      resenas: resenas.map((r) => ({
        cliente: r.clientName ?? 'Anónimo',
        rating: r.rating,
        comentario: r.comentario ?? '',
        fecha: r.createdAt.toLocaleDateString('es-CO', { timeZone: 'America/Bogota' }),
      })),
      nps: nps.map((n) => ({
        cliente: n.clientPhone,
        score: n.score,
        comentario: n.comentario ?? '',
        fecha: n.createdAt.toLocaleDateString('es-CO', { timeZone: 'America/Bogota' }),
      })),
    };
  }
}
