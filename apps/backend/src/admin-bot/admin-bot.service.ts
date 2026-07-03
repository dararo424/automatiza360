import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus, OrderStatus, TicketStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdminBotResumenesService } from './admin-bot-resumenes.service';
import { AdminBotMessagingService } from './admin-bot-messaging.service';

function normalizePhone(phone: string): string {
  return phone.replace(/[\s+\-().]/g, '');
}

@Injectable()
export class AdminBotService {
  private readonly logger = new Logger(AdminBotService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly resumenes: AdminBotResumenesService,
    private readonly messaging: AdminBotMessagingService,
  ) {}

  // ── Check admin ────────────────────────────────────────────────────────────

  async getTenantConfig(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        industry: true,
        descripcion: true,
        horario: true,
        direccion: true,
        ciudad: true,
        botName: true,
        botTone: true,
        flujosActivos: true,
        plan: true,
        subscriptionStatus: true,
      },
    });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');
    return {
      ...tenant,
      botName: tenant.botName ?? 'Asistente',
      botTone: tenant.botTone ?? 'AMIGABLE',
    };
  }

  async checkAdmin(phone: string) {
    const normalized = normalizePhone(phone);
    // Últimos 10 dígitos para comparar sin código de país
    const last10 = normalized.slice(-10);
    if (last10.length < 10) return { isAdmin: false };

    // Match en DB usando REGEXP_REPLACE para normalizar y LIKE con sufijo de 10 dígitos.
    // Una sola query con JOIN — no traemos toda la tabla a memoria.
    const userMatches = await this.prisma.$queryRaw<
      Array<{
        id: string;
        tenantId: string;
        role: string;
        email: string;
        name: string;
        industry: string;
      }>
    >`
      SELECT u.id, u."tenantId", u.role::text, u.email, u.name, t.industry::text
      FROM "User" u
      JOIN "Tenant" t ON t.id = u."tenantId"
      WHERE u.active = true
        AND u.role IN ('OWNER','ADMIN','STAFF')
        AND u.phone IS NOT NULL
        AND REGEXP_REPLACE(u.phone, '[^0-9]', '', 'g') LIKE ${'%' + last10}
      LIMIT 1
    `;

    if (userMatches.length > 0) {
      const match = userMatches[0];
      const owner =
        match.role === 'OWNER'
          ? { email: match.email, name: match.name }
          : await this.prisma.user.findFirst({
              where: { tenantId: match.tenantId, role: 'OWNER', active: true },
              select: { email: true, name: true },
            });
      return {
        isAdmin: true,
        tenantId: match.tenantId,
        role: match.role,
        userId: match.id,
        industry: match.industry,
        ownerEmail: owner?.email ?? match.email,
        ownerName: owner?.name ?? match.name,
      };
    }

    // Fallback: buscar por Tenant.ownerPhone (para owners que no tengan phone en User)
    const tenantMatches = await this.prisma.$queryRaw<
      Array<{ id: string; industry: string }>
    >`
      SELECT id, industry::text
      FROM "Tenant"
      WHERE active = true
        AND "ownerPhone" IS NOT NULL
        AND REGEXP_REPLACE("ownerPhone", '[^0-9]', '', 'g') LIKE ${'%' + last10}
      LIMIT 1
    `;

    if (tenantMatches.length > 0) {
      const t = tenantMatches[0];
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
          ownerEmail: owner.email,
          ownerName: owner.name,
        };
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

  // ── Resumen del día (delegado) ─────────────────────────────────────────────

  resumenDia(tenantId: string) {
    return this.resumenes.resumenDia(tenantId);
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

  // ── Notificación de cancelación a pacientes (delegado) ────────────────────

  notificarPacientesCancelacion(
    tenantId: string,
    industry: string,
    pacientes: Array<{
      nombre: string;
      telefono: string;
      servicio: string;
      hora: string;
      profesional?: string | null;
    }>,
  ) {
    return this.messaging.notificarPacientesCancelacion(tenantId, industry, pacientes);
  }

  private normalizePhone(phone: string): string {
    return this.messaging.normalizePhone(phone);
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

  // ── Resumen del mes (delegado) ─────────────────────────────────────────────

  resumenMes(tenantId: string) {
    return this.resumenes.resumenMes(tenantId);
  }

  // ── Reseñas recientes (delegado) ───────────────────────────────────────────

  verResenasRecientes(tenantId: string) {
    return this.resumenes.verResenasRecientes(tenantId);
  }

  // ── Cupones ────────────────────────────────────────────────────────────────

  async verCuponesActivos(tenantId: string) {
    return this.prisma.cupon.findMany({
      where: {
        tenantId,
        activo: true,
        OR: [
          { fechaVencimiento: null },
          { fechaVencimiento: { gte: new Date() } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  async crearCupon(
    tenantId: string,
    codigo: string,
    tipo: string,
    valor: number,
    minCompra?: number,
    maxUsos?: number,
    fechaVencimiento?: string,
  ) {
    return this.prisma.cupon.create({
      data: {
        tenantId,
        codigo: codigo.toUpperCase(),
        tipo: tipo as any,
        valor,
        minCompra: minCompra ?? 0,
        ...(maxUsos !== undefined && { maxUsos }),
        ...(fechaVencimiento && { fechaVencimiento: new Date(fechaVencimiento) }),
        activo: true,
      },
    });
  }

  // ── Listar contactos recientes ─────────────────────────────────────────────

  async listarContactosRecientes(tenantId: string) {
    return this.prisma.contact.findMany({
      where: { tenantId },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      select: { id: true, name: true, phone: true, email: true, tags: true, puntos: true, createdAt: true },
    });
  }

  async agregarContacto(
    tenantId: string,
    nombre: string,
    phone: string,
    email?: string,
    notas?: string,
  ) {
    const normalizedPhone = this.normalizePhone(phone);
    return this.prisma.contact.upsert({
      where: { tenantId_phone: { tenantId, phone: normalizedPhone } },
      update: {
        name: nombre,
        ...(email && { email }),
        ...(notas && { notes: notas }),
      },
      create: {
        tenantId,
        phone: normalizedPhone,
        name: nombre,
        ...(email && { email }),
        ...(notas && { notes: notas }),
      },
    });
  }

  // ── Turnos del personal ────────────────────────────────────────────────────

  async verTurnos(tenantId: string, fecha?: string) {
    const dia = fecha ? new Date(`${fecha}T00:00:00.000Z`) : new Date();
    dia.setUTCHours(0, 0, 0, 0);
    const diaSig = new Date(dia);
    diaSig.setUTCDate(diaSig.getUTCDate() + 1);

    const turnos = await this.prisma.turno.findMany({
      where: { tenantId, fecha: { gte: dia, lt: diaSig } },
      include: { user: { select: { name: true, role: true } } },
      orderBy: { horaInicio: 'asc' },
    });

    return {
      fecha: dia.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }),
      totalTurnos: turnos.length,
      turnos: turnos.map((t) => ({
        empleado: t.user.name,
        rol: t.user.role,
        horaInicio: t.horaInicio,
        horaFin: t.horaFin,
        notas: t.notas ?? null,
      })),
    };
  }

  // ── Garantías activas ──────────────────────────────────────────────────────

  async verGarantiasActivas(tenantId: string) {
    const hoy = new Date();
    const garantias = await this.prisma.garantia.findMany({
      where: { tenantId, fechaVencimiento: { gte: hoy } },
      orderBy: { fechaVencimiento: 'asc' },
      take: 15,
    });

    return garantias.map((g) => ({
      id: g.id,
      cliente: g.clienteNombre,
      telefono: g.clientePhone,
      producto: g.producto,
      vence: g.fechaVencimiento.toLocaleDateString('es-CO', { timeZone: 'America/Bogota' }),
      diasRestantes: Math.ceil((g.fechaVencimiento.getTime() - hoy.getTime()) / 86400000),
    }));
  }

  // ── Campaña rápida (delegado) ──────────────────────────────────────────────

  crearCampañaRapida(tenantId: string, mensaje: string) {
    return this.messaging.crearCampañaRapida(tenantId, mensaje);
  }

  // ── Helper: enviar WhatsApp a un cliente (delegado) ───────────────────────

  sendWhatsAppToClient(tenantId: string, toPhone: string, body: string): Promise<void> {
    return this.messaging.sendWhatsAppToClient(tenantId, toPhone, body);
  }
}
