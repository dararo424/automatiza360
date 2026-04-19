import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus, Industry, OrderStatus, TicketStatus } from '@prisma/client';
import * as twilio from 'twilio';
import { PrismaService } from '../prisma/prisma.service';

function normalizePhone(phone: string): string {
  return phone.replace(/[\s+\-().]/g, '');
}

@Injectable()
export class AdminBotService {
  private readonly logger = new Logger(AdminBotService.name);

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

  // ── Notificación de cancelación a pacientes ────────────────────────────────

  async notificarPacientesCancelacion(
    tenantId: string,
    industry: string,
    pacientes: Array<{
      nombre: string;
      telefono: string;
      servicio: string;
      hora: string;
      profesional?: string | null;
    }>,
  ): Promise<{ enviados: number; errores: number; detalle: Array<{ nombre: string; ok: boolean; error?: string }> }> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const whatsappNumber = tenant.twilioNumber ?? process.env.TWILIO_WHATSAPP_NUMBER;

    if (!accountSid || !authToken || !whatsappNumber) {
      throw new Error('Credenciales Twilio no configuradas');
    }

    const twilioClient = twilio.default(accountSid, authToken);
    let enviados = 0;
    let errores = 0;
    const detalle: Array<{ nombre: string; ok: boolean; error?: string }> = [];

    for (const paciente of pacientes) {
      try {
        const toNumber = this.normalizePhone(paciente.telefono);
        const mensaje = this.buildCancelacionMessage(paciente, tenant.name, industry);

        await twilioClient.messages.create({
          from: `whatsapp:${whatsappNumber}`,
          to: `whatsapp:${toNumber}`,
          body: mensaje,
        });

        enviados++;
        detalle.push({ nombre: paciente.nombre, ok: true });
        this.logger.log(`Cancelación notificada a ${toNumber} (${paciente.nombre})`);
      } catch (error) {
        errores++;
        detalle.push({ nombre: paciente.nombre, ok: false, error: (error as Error).message });
        this.logger.error(`Error notificando a ${paciente.nombre}: ${(error as Error).message}`);
      }
    }

    return { enviados, errores, detalle };
  }

  private buildCancelacionMessage(
    paciente: { nombre: string; servicio: string; hora: string; profesional?: string | null },
    storeName: string,
    industry: string,
  ): string {
    const hora = new Date(paciente.hora).toLocaleTimeString('es-CO', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Bogota',
    });
    const conProfesional = paciente.profesional ? ` con ${paciente.profesional}` : '';

    switch (industry.toUpperCase() as Industry) {
      case Industry.CLINIC:
        return (
          `🏥 Hola ${paciente.nombre}, lamentamos informarte que tu cita médica${conProfesional} ` +
          `de hoy a las ${hora} en ${storeName} ha sido cancelada por un imprevisto del profesional.\n\n` +
          `Por favor escríbenos para reagendarla lo antes posible. Pedimos disculpas. 🙏`
        );
      case Industry.BEAUTY:
        return (
          `💅 Hola ${paciente.nombre}, tu cita de ${paciente.servicio}${conProfesional} ` +
          `de hoy a las ${hora} en ${storeName} ha sido cancelada.\n\n` +
          `Escríbenos para reagendarla en la fecha que más te convenga. ¡Disculpa los inconvenientes! ✨`
        );
      case Industry.VETERINARY:
        return (
          `🐾 Hola ${paciente.nombre}, tu cita en ${storeName}${conProfesional} ` +
          `programada hoy a las ${hora} ha sido cancelada por un imprevisto.\n\n` +
          `Comunícate con nosotros para reagendarla. Pedimos disculpas. 🙏`
        );
      default:
        return (
          `📅 Hola ${paciente.nombre}, tu cita de ${paciente.servicio} en ${storeName} ` +
          `de hoy a las ${hora} ha sido cancelada.\n\n` +
          `Escríbenos para reagendarla. Disculpa los inconvenientes.`
        );
    }
  }

  private normalizePhone(phone: string): string {
    const cleaned = phone.replace(/[\s\-]/g, '');
    return cleaned.startsWith('+') ? cleaned : `+57${cleaned}`;
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

  // ── Ver detalle de orden por número ───────────────────────────────────────

  async verDetalleOrden(tenantId: string, numero: number) {
    const orden = await this.prisma.order.findFirst({
      where: { tenantId, number: numero },
      include: { items: true },
    });
    if (!orden) throw new NotFoundException(`Orden #${numero} no encontrada`);
    return orden;
  }

  // ── Cambiar estado de orden + notificar cliente si READY ──────────────────

  async cambiarEstadoOrden(tenantId: string, numero: number, estado: OrderStatus) {
    const orden = await this.prisma.order.findFirst({ where: { tenantId, number: numero }, include: { items: true } });
    if (!orden) throw new NotFoundException(`Orden #${numero} no encontrada`);

    const updated = await this.prisma.order.update({
      where: { id: orden.id },
      data: { status: estado },
      include: { items: true },
    });

    if (estado === OrderStatus.READY && orden.phone) {
      await this.sendWhatsAppToClient(tenantId, orden.phone, this.buildOrdenListaMessage(orden));
    }

    return updated;
  }

  private buildOrdenListaMessage(orden: { number: number; items: Array<{ name: string; quantity: number }> }): string {
    const items = orden.items.map((i) => `• ${i.quantity}x ${i.name}`).join('\n');
    return (
      `✅ ¡Tu pedido #${orden.number} está listo!\n\n` +
      `${items}\n\n` +
      `Puedes pasar a recogerlo o esperar a tu domiciliario. ¡Gracias por tu pedido! 🙏`
    );
  }

  // ── Ver citas de un día ────────────────────────────────────────────────────

  async verCitasDia(tenantId: string, fecha: string) {
    const inicio = new Date(`${fecha}T00:00:00.000Z`);
    const fin = new Date(`${fecha}T23:59:59.999Z`);

    const citas = await this.prisma.appointment.findMany({
      where: { tenantId, date: { gte: inicio, lte: fin } },
      include: { service: true, professional: true },
      orderBy: { date: 'asc' },
    });

    return {
      fecha,
      total: citas.length,
      citas: citas.map((c) => ({
        id: c.id,
        hora: c.date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' }),
        cliente: c.clientName,
        telefono: c.clientPhone,
        servicio: c.service.name,
        profesional: c.professional?.name ?? null,
        estado: c.status,
      })),
    };
  }

  // ── Crear cita desde admin ─────────────────────────────────────────────────

  async crearCitaAdmin(
    tenantId: string,
    clientName: string,
    clientPhone: string,
    serviceName: string,
    fecha: string,
    hora: string,
    profesionalNombre?: string,
  ) {
    const service = await this.prisma.service.findFirst({
      where: { tenantId, name: { contains: serviceName, mode: 'insensitive' }, active: true },
    });
    if (!service) throw new NotFoundException(`Servicio "${serviceName}" no encontrado`);

    let professionalId: string | undefined;
    if (profesionalNombre) {
      const prof = await this.prisma.professional.findFirst({
        where: { tenantId, name: { contains: profesionalNombre, mode: 'insensitive' }, active: true },
      });
      if (prof) professionalId = prof.id;
    }

    const date = new Date(`${fecha}T${hora}:00.000Z`);

    return this.prisma.appointment.create({
      data: {
        tenantId,
        clientName,
        clientPhone: this.normalizePhone(clientPhone),
        date,
        serviceId: service.id,
        professionalId: professionalId ?? null,
        status: AppointmentStatus.CONFIRMED,
      },
      include: { service: true, professional: true },
    });
  }

  // ── Cambiar estado de cita individual ─────────────────────────────────────

  async cambiarEstadoCita(tenantId: string, appointmentId: string, estado: AppointmentStatus) {
    const cita = await this.prisma.appointment.findFirst({ where: { id: appointmentId, tenantId } });
    if (!cita) throw new NotFoundException('Cita no encontrada');

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: estado },
      include: { service: true, professional: true },
    });
  }

  // ── Reagendar cita ─────────────────────────────────────────────────────────

  async reagendarCita(tenantId: string, appointmentId: string, nuevaFecha: string, nuevaHora: string) {
    const cita = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, tenantId },
      include: { service: true },
    });
    if (!cita) throw new NotFoundException('Cita no encontrada');

    const nuevaDate = new Date(`${nuevaFecha}T${nuevaHora}:00.000Z`);

    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { date: nuevaDate, status: AppointmentStatus.SCHEDULED, reminderSent: false },
      include: { service: true, professional: true },
    });

    // Notificar al cliente del reagendamiento
    if (cita.clientPhone) {
      const fechaStr = nuevaDate.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Bogota' });
      const horaStr = nuevaDate.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Bogota' });
      const msg = `📅 Hola ${cita.clientName}, tu cita de ${cita.service.name} ha sido reagendada para el ${fechaStr} a las ${horaStr}.\n\nEscríbenos si necesitas ajustar la fecha. ¡Hasta pronto! 😊`;
      await this.sendWhatsAppToClient(tenantId, cita.clientPhone, msg);
    }

    return updated;
  }

  // ── Buscar contacto ────────────────────────────────────────────────────────

  async buscarContacto(tenantId: string, query: string) {
    const last10 = query.replace(/\D/g, '').slice(-10);
    return this.prisma.contact.findMany({
      where: {
        tenantId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { phone: { endsWith: last10 } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    });
  }

  // ── Registrar gasto ────────────────────────────────────────────────────────

  async registrarGasto(tenantId: string, descripcion: string, monto: number, categoria: string) {
    return this.prisma.gasto.create({
      data: { tenantId, descripcion, monto, categoria, fecha: new Date() },
    });
  }

  // ── Crear ticket ───────────────────────────────────────────────────────────

  async crearTicket(
    tenantId: string,
    clientName: string,
    clientPhone: string,
    device: string,
    issue: string,
    fotoUrl?: string,
  ) {
    const last = await this.prisma.ticket.findFirst({ where: { tenantId }, orderBy: { number: 'desc' } });
    const number = (last?.number ?? 0) + 1;

    return this.prisma.ticket.create({
      data: {
        tenantId,
        number,
        clientName,
        clientPhone: this.normalizePhone(clientPhone),
        device,
        issue,
        status: TicketStatus.RECEIVED,
        ...(fotoUrl && { fotoUrl }),
      },
    });
  }

  // ── Ver cotizaciones pendientes ────────────────────────────────────────────

  async verCotizacionesPendientes(tenantId: string) {
    return this.prisma.cotizacion.findMany({
      where: { tenantId, status: { in: ['DRAFT', 'SENT'] as any } },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  // ── Ver stock bajo ─────────────────────────────────────────────────────────

  async verStockBajo(tenantId: string) {
    return this.prisma.$queryRaw<Array<{ id: string; name: string; stock: number; minStock: number; price: number }>>`
      SELECT id, name, stock, "minStock", price
      FROM "Product"
      WHERE "tenantId" = ${tenantId}
        AND active = true
        AND stock <= "minStock"
      ORDER BY stock ASC
      LIMIT 20
    `;
  }

  // ── Resumen del mes ────────────────────────────────────────────────────────

  async resumenMes(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');

    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const inicioMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
    const finMesAnterior = new Date(inicioMes.getTime() - 1);

    const [ordenesEste, ordenesPrevio, citasEste, citasPrevio, contactosEste, gastosEste] = await Promise.all([
      this.prisma.order.aggregate({
        where: { tenantId, createdAt: { gte: inicioMes }, status: { not: OrderStatus.CANCELLED } },
        _count: { id: true },
        _sum: { total: true },
      }),
      this.prisma.order.aggregate({
        where: { tenantId, createdAt: { gte: inicioMesAnterior, lte: finMesAnterior }, status: { not: OrderStatus.CANCELLED } },
        _count: { id: true },
        _sum: { total: true },
      }),
      this.prisma.appointment.count({ where: { tenantId, createdAt: { gte: inicioMes } } }),
      this.prisma.appointment.count({ where: { tenantId, createdAt: { gte: inicioMesAnterior, lte: finMesAnterior } } }),
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

  // ── Campaña rápida — enviar mensaje a todos los contactos ──────────────────

  async crearCampañaRapida(tenantId: string, mensaje: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');

    const contactos = await this.prisma.contact.findMany({
      where: { tenantId, phone: { not: '' } },
      select: { phone: true, name: true },
    });

    if (contactos.length === 0) return { enviados: 0, errores: 0, mensaje: 'No hay contactos registrados' };

    const campaña = await this.prisma.campaña.create({
      data: { tenantId, nombre: `Campaña rápida ${new Date().toLocaleDateString('es-CO')}`, mensaje, status: 'ENVIANDO' as any },
    });

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const whatsappNumber = tenant.twilioNumber ?? process.env.TWILIO_WHATSAPP_NUMBER;

    let enviados = 0;
    let errores = 0;

    if (accountSid && authToken && whatsappNumber) {
      const twilioClient = twilio.default(accountSid, authToken);
      for (const contacto of contactos) {
        try {
          await twilioClient.messages.create({
            from: `whatsapp:${whatsappNumber}`,
            to: `whatsapp:${this.normalizePhone(contacto.phone)}`,
            body: mensaje,
          });
          enviados++;
        } catch {
          errores++;
        }
      }
    }

    await this.prisma.campaña.update({
      where: { id: campaña.id },
      data: { status: 'ENVIADA' as any, totalEnviado: enviados, enviadaAt: new Date() },
    });

    return { enviados, errores, total: contactos.length };
  }

  // ── Helper: enviar WhatsApp a un cliente ───────────────────────────────────

  async sendWhatsAppToClient(tenantId: string, toPhone: string, body: string): Promise<void> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const whatsappNumber = tenant?.twilioNumber ?? process.env.TWILIO_WHATSAPP_NUMBER;

    if (!accountSid || !authToken || !whatsappNumber) return;

    try {
      const twilioClient = twilio.default(accountSid, authToken);
      await twilioClient.messages.create({
        from: `whatsapp:${whatsappNumber}`,
        to: `whatsapp:${this.normalizePhone(toPhone)}`,
        body,
      });
    } catch (err) {
      this.logger.error(`sendWhatsAppToClient error: ${(err as Error).message}`);
    }
  }
}
