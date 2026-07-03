import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as twilio from 'twilio';
import { PrismaService } from '../prisma/prisma.service';
import {
  ActualizarNotificadoVentasDto,
  CrearNotificadoVentasDto,
} from './dto/notificado-ventas.dto';

@Injectable()
export class NotificadosVentasService {
  private readonly logger = new Logger(NotificadosVentasService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── CRUD ─────────────────────────────────────────────────────────────────

  list(tenantId: string) {
    return this.prisma.notificadoVentas.findMany({
      where: { tenantId },
      orderBy: [{ active: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async crear(tenantId: string, dto: CrearNotificadoVentasDto) {
    const phone = this.normalizePhone(dto.phone);
    return this.prisma.notificadoVentas.upsert({
      where: { tenantId_phone: { tenantId, phone } },
      update: {
        name: dto.name,
        rol: dto.rol ?? 'VENDEDOR',
        resumenMatinal: dto.resumenMatinal ?? true,
        resumenCierre: dto.resumenCierre ?? false,
        notifInstantanea: dto.notifInstantanea ?? false,
        montoMinimo: dto.montoMinimo,
        active: true,
      },
      create: {
        tenantId,
        name: dto.name,
        phone,
        rol: dto.rol ?? 'VENDEDOR',
        resumenMatinal: dto.resumenMatinal ?? true,
        resumenCierre: dto.resumenCierre ?? false,
        notifInstantanea: dto.notifInstantanea ?? false,
        montoMinimo: dto.montoMinimo,
      },
    });
  }

  async actualizar(tenantId: string, id: string, dto: ActualizarNotificadoVentasDto) {
    const existing = await this.prisma.notificadoVentas.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('Notificado no encontrado');

    return this.prisma.notificadoVentas.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.phone !== undefined && { phone: this.normalizePhone(dto.phone) }),
        ...(dto.rol !== undefined && { rol: dto.rol }),
        ...(dto.resumenMatinal !== undefined && { resumenMatinal: dto.resumenMatinal }),
        ...(dto.resumenCierre !== undefined && { resumenCierre: dto.resumenCierre }),
        ...(dto.notifInstantanea !== undefined && { notifInstantanea: dto.notifInstantanea }),
        ...(dto.montoMinimo !== undefined && { montoMinimo: dto.montoMinimo }),
        ...(dto.active !== undefined && { active: dto.active }),
      },
    });
  }

  async eliminar(tenantId: string, id: string) {
    const existing = await this.prisma.notificadoVentas.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('Notificado no encontrado');
    await this.prisma.notificadoVentas.delete({ where: { id } });
    return { ok: true };
  }

  // ── Envíos WhatsApp ──────────────────────────────────────────────────────

  async probar(tenantId: string, id: string): Promise<{ ok: boolean; reason?: string }> {
    const persona = await this.prisma.notificadoVentas.findFirst({
      where: { id, tenantId },
    });
    if (!persona) throw new NotFoundException('Notificado no encontrado');

    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { name: true, twilioNumber: true },
    });

    const ok = await this.enviarWhatsApp(
      tenant.twilioNumber,
      persona.phone,
      `🔔 Notificación de prueba\n\nHola ${persona.name}, este es un mensaje de prueba desde ${tenant.name}.\n\nSi recibes este WhatsApp, las notificaciones de ventas están funcionando correctamente.`,
    );

    return ok ? { ok: true } : { ok: false, reason: 'Twilio no respondió OK' };
  }

  /**
   * Notificación instantánea cuando entra una cotización nueva.
   * Llamada desde CotizacionesService al crear.
   */
  async notificarCotizacionNueva(
    tenantId: string,
    cotizacion: {
      number: number;
      clientName: string;
      clientPhone: string | null;
      total: number;
      items: Array<{ name: string; quantity: number }>;
    },
  ): Promise<void> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, twilioNumber: true },
    });
    if (!tenant) return;

    const personas = await this.prisma.notificadoVentas.findMany({
      where: {
        tenantId,
        active: true,
        notifInstantanea: true,
        OR: [{ montoMinimo: null }, { montoMinimo: { lte: cotizacion.total } }],
      },
    });
    if (personas.length === 0) return;

    const totalFmt = cotizacion.total.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    });
    const itemsFmt = cotizacion.items
      .map((i) => `• ${i.quantity}x ${i.name}`)
      .join('\n');

    const frontendUrl = process.env.FRONTEND_URL ?? 'https://app.automatiza360.com';
    const body =
      `🔔 *Nueva cotización* — ${tenant.name}\n\n` +
      `👤 ${cotizacion.clientName}\n` +
      `📞 ${cotizacion.clientPhone ?? 'sin teléfono'}\n\n` +
      `${itemsFmt}\n\n` +
      `💰 *${totalFmt}*\n` +
      `📝 Cotización #${cotizacion.number}\n\n` +
      `Ver detalle: ${frontendUrl}/cotizaciones`;

    await Promise.all(
      personas.map((p) => this.enviarWhatsApp(tenant.twilioNumber, p.phone, body)),
    );
  }

  /**
   * Resumen matinal — enviado por cron diario.
   * Cubre la actividad nocturna (8pm día anterior → 8am hoy).
   */
  async enviarResumenMatinal(tenantId: string): Promise<void> {
    const ahora = new Date();
    const inicioCorte = new Date(ahora);
    inicioCorte.setHours(20, 0, 0, 0);
    inicioCorte.setDate(inicioCorte.getDate() - 1);
    return this.enviarResumenDeRango(tenantId, inicioCorte, ahora, 'matinal');
  }

  /**
   * Resumen de cierre — enviado por cron diario.
   * Cubre la actividad del día (8am → 8pm).
   */
  async enviarResumenCierre(tenantId: string): Promise<void> {
    const ahora = new Date();
    const inicioCorte = new Date(ahora);
    inicioCorte.setHours(8, 0, 0, 0);
    return this.enviarResumenDeRango(tenantId, inicioCorte, ahora, 'cierre');
  }

  private async enviarResumenDeRango(
    tenantId: string,
    desde: Date,
    hasta: Date,
    tipo: 'matinal' | 'cierre',
  ): Promise<void> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, twilioNumber: true },
    });
    if (!tenant) return;

    const filtroPersonas = tipo === 'matinal'
      ? { resumenMatinal: true }
      : { resumenCierre: true };

    const personas = await this.prisma.notificadoVentas.findMany({
      where: { tenantId, active: true, ...filtroPersonas },
    });
    if (personas.length === 0) return;

    const [cotizaciones, tickets, ordenes] = await Promise.all([
      this.prisma.cotizacion.findMany({
        where: { tenantId, createdAt: { gte: desde, lt: hasta } },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.ticket.findMany({
        where: { tenantId, createdAt: { gte: desde, lt: hasta } },
      }),
      this.prisma.order.findMany({
        where: { tenantId, createdAt: { gte: desde, lt: hasta } },
        include: { items: true },
      }),
    ]);

    if (cotizaciones.length === 0 && tickets.length === 0 && ordenes.length === 0) {
      return; // Sin actividad, no spam
    }

    const totalCotizado = cotizaciones.reduce((s, c) => s + c.total, 0);
    const totalCotizadoFmt = totalCotizado.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    });
    const totalVendido = ordenes.reduce((s, o) => s + o.total, 0);
    const totalVendidoFmt = totalVendido.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    });

    const frontendUrl = process.env.FRONTEND_URL ?? 'https://app.automatiza360.com';

    const header = tipo === 'matinal'
      ? `🌅 *Buen día Equipo ${tenant.name}*\n\nResumen de la noche (8pm → 8am):`
      : `🌆 *Cierre del día — ${tenant.name}*\n\nResumen del día (8am → 8pm):`;

    const lineas: string[] = [header, ''];

    if (cotizaciones.length > 0) {
      lineas.push(`💰 *${cotizaciones.length} cotizaciones* — total ${totalCotizadoFmt}`);
    }
    if (ordenes.length > 0) {
      lineas.push(`🛒 *${ordenes.length} ventas confirmadas* — total ${totalVendidoFmt}`);
    }
    if (tickets.length > 0) {
      lineas.push(`🔧 *${tickets.length} reparaciones nuevas*`);
    }

    if (cotizaciones.length > 0) {
      lineas.push('', '═══════════════════');
      cotizaciones.slice(0, 10).forEach((c, i) => {
        const itemsStr = c.items
          .slice(0, 3)
          .map((it) => `${it.quantity}x ${it.name}`)
          .join(', ');
        const totalC = c.total.toLocaleString('es-CO', {
          style: 'currency',
          currency: 'COP',
          maximumFractionDigits: 0,
        });
        lineas.push(
          `\n${i + 1}️⃣ ${c.clientName}`,
          `📞 ${c.clientPhone ?? 'sin teléfono'}`,
          `📦 ${itemsStr}`,
          `💰 ${totalC}`,
          `📝 Cotización #${c.number}`,
        );
      });
      if (cotizaciones.length > 10) {
        lineas.push(`\n…y ${cotizaciones.length - 10} más en el panel.`);
      }
      lineas.push('═══════════════════');
    }

    lineas.push('', `📋 Ver todas: ${frontendUrl}/cotizaciones`);

    const body = lineas.join('\n');

    await Promise.all(
      personas.map((p) => this.enviarWhatsApp(tenant.twilioNumber, p.phone, body)),
    );
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private normalizePhone(phone: string): string {
    const cleaned = phone.replace(/[\s\-]/g, '');
    return cleaned.startsWith('+') ? cleaned : `+57${cleaned.replace(/^0+/, '')}`;
  }

  private async enviarWhatsApp(
    fromNumber: string | null,
    toPhone: string,
    body: string,
  ): Promise<boolean> {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = fromNumber ?? process.env.TWILIO_WHATSAPP_NUMBER;

    if (!sid || !token || !from) {
      this.logger.warn('Twilio no configurado — skip WhatsApp a %s', toPhone);
      return false;
    }
    try {
      const client = twilio.default(sid, token);
      await client.messages.create({
        from: `whatsapp:${from}`,
        to: `whatsapp:${this.normalizePhone(toPhone)}`,
        body,
      });
      return true;
    } catch (err) {
      this.logger.error(`Error enviando a ${toPhone}: ${(err as Error).message}`);
      return false;
    }
  }
}
