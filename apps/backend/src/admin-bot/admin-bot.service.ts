import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus, OrderStatus, TicketStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

function normalizePhone(phone: string): string {
  return phone.replace(/[\s+\-().]/g, '');
}

@Injectable()
export class AdminBotService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Check admin ────────────────────────────────────────────────────────────

  async checkAdmin(phone: string) {
    const normalized = normalizePhone(phone);
    // Últimos 10 dígitos para comparar sin código de país
    const last10 = normalized.slice(-10);

    // Buscar usuario (OWNER/ADMIN/STAFF) cuyo phone coincida
    const users = await this.prisma.user.findMany({
      where: { active: true, role: { in: ['OWNER', 'ADMIN', 'STAFF'] } },
      include: { tenant: true },
    });

    for (const user of users) {
      if (!user.phone) continue;
      const userPhoneNorm = normalizePhone(user.phone).slice(-10);
      if (userPhoneNorm === last10) {
        return {
          isAdmin: true,
          tenantId: user.tenantId,
          role: user.role,
          userId: user.id,
          industry: user.tenant.industry,
        };
      }
    }

    // Fallback: buscar por Tenant.ownerPhone (para owners que no tengan phone en User)
    const tenants = await this.prisma.tenant.findMany({ where: { active: true } });
    for (const t of tenants) {
      if (!t.ownerPhone) continue;
      const ownerNorm = normalizePhone(t.ownerPhone).slice(-10);
      if (ownerNorm === last10) {
        const owner = await this.prisma.user.findFirst({
          where: { tenantId: t.id, role: 'OWNER', active: true },
        });
        if (owner) {
          return {
            isAdmin: true,
            tenantId: t.id,
            role: owner.role,
            userId: owner.id,
            industry: t.industry,
          };
        }
      }
    }

    return { isAdmin: false };
  }

  // ── Menú del día ───────────────────────────────────────────────────────────

  async cargarMenuDia(tenantId: string, items: Array<{ nombre: string; precio: number; descripcion?: string }>) {
    // Desactivar menús anteriores del día
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    await this.prisma.menuDia.updateMany({
      where: { tenantId, activo: true },
      data: { activo: false },
    });

    const menu = await this.prisma.menuDia.create({
      data: {
        tenantId,
        activo: true,
        platos: {
          create: items.map((item) => ({
            name: item.nombre,
            price: item.precio,
            description: item.descripcion,
            disponible: true,
          })),
        },
      },
      include: { platos: true },
    });

    return menu;
  }

  // ── Producto ───────────────────────────────────────────────────────────────

  async crearOActualizarProducto(
    tenantId: string,
    nombre: string,
    precio: number,
    stock?: number,
    descripcion?: string,
  ) {
    const existing = await this.prisma.product.findFirst({
      where: {
        tenantId,
        name: { equals: nombre, mode: 'insensitive' },
      },
    });

    if (existing) {
      return this.prisma.product.update({
        where: { id: existing.id },
        data: {
          price: precio,
          ...(stock !== undefined && { stock }),
          ...(descripcion !== undefined && { description: descripcion }),
          active: true,
        },
      });
    }

    return this.prisma.product.create({
      data: {
        tenantId,
        name: nombre,
        price: precio,
        stock: stock ?? 0,
        description: descripcion,
        active: true,
      },
    });
  }

  async actualizarStock(tenantId: string, nombre: string, stock: number) {
    const product = await this.prisma.product.findFirst({
      where: { tenantId, name: { equals: nombre, mode: 'insensitive' } },
    });
    if (!product) throw new NotFoundException(`Producto "${nombre}" no encontrado`);

    return this.prisma.product.update({
      where: { id: product.id },
      data: { stock },
    });
  }

  async actualizarPrecio(tenantId: string, nombre: string, precio: number) {
    const product = await this.prisma.product.findFirst({
      where: { tenantId, name: { equals: nombre, mode: 'insensitive' } },
    });
    if (!product) throw new NotFoundException(`Producto "${nombre}" no encontrado`);

    return this.prisma.product.update({
      where: { id: product.id },
      data: { price: precio },
    });
  }

  async eliminarProducto(tenantId: string, nombre: string) {
    const product = await this.prisma.product.findFirst({
      where: { tenantId, name: { equals: nombre, mode: 'insensitive' } },
    });
    if (!product) throw new NotFoundException(`Producto "${nombre}" no encontrado`);

    return this.prisma.product.update({
      where: { id: product.id },
      data: { active: false },
    });
  }

  // ── Resumen del día ────────────────────────────────────────────────────────

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
      const pendientes = ordenes.filter((o) => o.status === OrderStatus.PENDING || o.status === OrderStatus.CONFIRMED || o.status === OrderStatus.PREPARING);
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

  // ── Tickets ────────────────────────────────────────────────────────────────

  async cambiarEstadoTicket(
    ticketId: string,
    tenantId: string,
    estado: TicketStatus,
    fotoUrl?: string,
  ) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id: ticketId, tenantId },
    });
    if (!ticket) throw new NotFoundException('Ticket no encontrado');

    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: estado,
        ...(fotoUrl !== undefined && { fotoUrl }),
      },
    });
  }

  async buscarTicketPorNombre(tenantId: string, nombre: string) {
    return this.prisma.ticket.findMany({
      where: {
        tenantId,
        clientName: { contains: nombre, mode: 'insensitive' },
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });
  }

  // ── Citas ──────────────────────────────────────────────────────────────────

  async cancelarCitasRango(
    tenantId: string,
    fecha: string,
    horaDesde?: string,
    profesionalId?: string,
  ) {
    const fechaDate = new Date(`${fecha}T00:00:00.000Z`);
    const fechaFin = new Date(`${fecha}T23:59:59.999Z`);

    let horaDesdeDate: Date | undefined;
    if (horaDesde) {
      horaDesdeDate = new Date(`${fecha}T${horaDesde}:00.000Z`);
    }

    const where: any = {
      tenantId,
      date: {
        gte: horaDesdeDate ?? fechaDate,
        lt: fechaFin,
      },
      status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.COMPLETED] },
    };

    if (profesionalId) {
      where.professionalId = profesionalId;
    }

    const citas = await this.prisma.appointment.findMany({
      where,
      include: { service: true, professional: true },
    });

    if (citas.length === 0) {
      return { canceladas: 0, clientesAfectados: [] };
    }

    await this.prisma.appointment.updateMany({
      where: { id: { in: citas.map((c) => c.id) } },
      data: { status: AppointmentStatus.CANCELLED },
    });

    const clientesAfectados = citas.map((c) => ({
      nombre: c.clientName,
      telefono: c.clientPhone,
      servicio: c.service.name,
      hora: c.date.toISOString(),
      profesional: c.professional?.name ?? null,
    }));

    return { canceladas: citas.length, clientesAfectados };
  }

  // ── Órdenes pendientes ─────────────────────────────────────────────────────

  async ordenesPendientes(tenantId: string) {
    const hoy = new Date();
    hoy.setUTCHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setUTCDate(manana.getUTCDate() + 1);

    return this.prisma.order.findMany({
      where: {
        tenantId,
        status: { in: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING] },
        createdAt: { gte: hoy, lt: manana },
      },
      include: { items: true },
      orderBy: { createdAt: 'asc' },
    });
  }
}
