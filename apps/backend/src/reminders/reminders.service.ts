import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppointmentStatus, Industry, SubscriptionStatus } from '@prisma/client';
import * as twilio from 'twilio';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  @Cron('0 8 * * 1')
  async sendWeeklyReport(): Promise<void> {
    this.logger.log('Generando reportes ejecutivos semanales...');

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(now);
    weekEnd.setHours(0, 0, 0, 0);

    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(weekStart.getDate() - 7);
    const prevWeekEnd = new Date(weekStart);

    const tenants = await this.prisma.tenant.findMany({
      where: {
        subscriptionStatus: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL] },
      },
      include: {
        users: { where: { role: 'OWNER' }, select: { email: true }, take: 1 },
      },
    });

    this.logger.log(`Tenants para reporte: ${tenants.length}`);

    for (const tenant of tenants) {
      const ownerEmail = tenant.users[0]?.email;
      if (!ownerEmail) continue;

      try {
        const [ordenesCur, ordenesPrev, citasCur, citasPrev, contactosCur, contactosPrev] =
          await Promise.all([
            this.prisma.order.aggregate({
              where: { tenantId: tenant.id, createdAt: { gte: weekStart, lt: weekEnd } },
              _count: { id: true },
              _sum: { total: true },
            }),
            this.prisma.order.aggregate({
              where: { tenantId: tenant.id, createdAt: { gte: prevWeekStart, lt: prevWeekEnd } },
              _count: { id: true },
              _sum: { total: true },
            }),
            this.prisma.appointment.count({
              where: { tenantId: tenant.id, createdAt: { gte: weekStart, lt: weekEnd } },
            }),
            this.prisma.appointment.count({
              where: { tenantId: tenant.id, createdAt: { gte: prevWeekStart, lt: prevWeekEnd } },
            }),
            this.prisma.contact.count({
              where: { tenantId: tenant.id, createdAt: { gte: weekStart, lt: weekEnd } },
            }),
            this.prisma.contact.count({
              where: { tenantId: tenant.id, createdAt: { gte: prevWeekStart, lt: prevWeekEnd } },
            }),
          ]);

        const calcChange = (cur: number, prev: number) =>
          prev === 0 ? 0 : ((cur - prev) / prev) * 100;

        const semanaLabel = `${weekStart.toLocaleDateString('es-CO')} – ${weekEnd.toLocaleDateString('es-CO')}`;

        await this.emailService.sendReporteEjecutivo(ownerEmail, {
          storeName: tenant.name,
          semana: semanaLabel,
          ordenes: ordenesCur._count.id,
          ingresos: ordenesCur._sum.total ?? 0,
          citas: citasCur,
          contactos: contactosCur,
          ordenesChange: calcChange(ordenesCur._count.id, ordenesPrev._count.id),
          ingresosChange: calcChange(ordenesCur._sum.total ?? 0, ordenesPrev._sum.total ?? 0),
          citasChange: calcChange(citasCur, citasPrev),
          contactosChange: calcChange(contactosCur, contactosPrev),
        });

        this.logger.log(`Reporte semanal enviado a ${ownerEmail} (${tenant.name})`);
      } catch (error) {
        this.logger.error(
          `Error enviando reporte a ${ownerEmail}: ${(error as Error).message}`,
        );
      }
    }

    this.logger.log('Reportes semanales completados.');
  }

  @Cron(CronExpression.EVERY_HOUR)
  async sendAppointmentReminders(): Promise<void> {
    this.logger.log('Iniciando envío de recordatorios de citas...');

    const now = new Date();
    const from = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const to = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        date: { gte: from, lte: to },
        reminderSent: false,
        status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED] },
      },
      include: {
        tenant: true,
        professional: true,
      },
    });

    this.logger.log(`Citas encontradas para recordatorio: ${appointments.length}`);

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

    if (!accountSid || !authToken || !whatsappNumber) {
      this.logger.warn('Credenciales de Twilio no configuradas. Se omiten recordatorios.');
      return;
    }

    const client = twilio.default(accountSid, authToken);

    for (const appointment of appointments) {
      if (!appointment.clientPhone) {
        this.logger.warn(`Cita ${appointment.id}: clientPhone vacío, se omite.`);
        continue;
      }

      try {
        const toNumber = this.normalizePhone(appointment.clientPhone);
        const message = this.buildMessage(appointment);

        await client.messages.create({
          from: `whatsapp:${whatsappNumber}`,
          to: `whatsapp:${toNumber}`,
          body: message,
        });

        await this.prisma.appointment.update({
          where: { id: appointment.id },
          data: { reminderSent: true, reminderSentAt: new Date() },
        });

        this.logger.log(
          `Recordatorio enviado a ${toNumber} para cita ${appointment.id} (${appointment.clientName})`,
        );
      } catch (error) {
        this.logger.error(
          `Error enviando recordatorio para cita ${appointment.id}: ${(error as Error).message}`,
        );
      }
    }

    this.logger.log('Envío de recordatorios completado.');
  }

  /** Día 1 de cada mes a las 00:05 — resetea el contador de conversaciones */
  @Cron('5 0 1 * *')
  async resetConversationCounts(): Promise<void> {
    this.logger.log('Reseteando contadores mensuales de conversaciones...');
    const result = await this.prisma.tenant.updateMany({
      data: { conversationCountMonth: 0 },
    });
    this.logger.log(`Contadores reseteados para ${result.count} tenants.`);
  }

  @Cron('0 9 * * *')
  async sendTrialExpiryEmails(): Promise<void> {
    this.logger.log('Revisando tenants con trial próximo a vencer...');

    const now = new Date();
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const in1Day = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

    const tenants = await this.prisma.tenant.findMany({
      where: {
        subscriptionStatus: SubscriptionStatus.TRIAL,
        trialEndsAt: { lte: in3Days, gte: now },
      },
      include: {
        users: {
          where: { role: 'OWNER' },
          select: { email: true },
          take: 1,
        },
      },
    });

    this.logger.log(`Tenants con trial por vencer: ${tenants.length}`);

    for (const tenant of tenants) {
      const ownerEmail = tenant.users[0]?.email;
      if (!ownerEmail || !tenant.trialEndsAt) continue;

      const msRemaining = tenant.trialEndsAt.getTime() - now.getTime();
      const daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));

      if (daysRemaining !== 3 && daysRemaining !== 1) continue;

      try {
        await this.emailService.sendTrialExpirando(ownerEmail, {
          storeName: tenant.name,
          daysRemaining,
        });
        this.logger.log(
          `Email de trial enviado a ${ownerEmail} (${tenant.name}) — ${daysRemaining} día(s) restantes`,
        );
      } catch (error) {
        this.logger.error(
          `Error enviando email de trial a ${ownerEmail}: ${(error as Error).message}`,
        );
      }
    }

    this.logger.log('Revisión de trials completada.');
  }

  @Cron('0 10 * * *')
  async sendPostConsultaFollowUp(): Promise<void> {
    this.logger.log('Iniciando seguimiento post-consulta...');

    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        date: { gte: start, lte: end },
        status: AppointmentStatus.COMPLETED,
        tenant: {
          industry: { in: [Industry.CLINIC, Industry.BEAUTY] },
        },
      },
      include: {
        tenant: true,
      },
    });

    this.logger.log(`Citas completadas ayer para follow-up: ${appointments.length}`);

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

    if (!accountSid || !authToken || !whatsappNumber) {
      this.logger.warn('Credenciales de Twilio no configuradas. Se omite follow-up post-consulta.');
      return;
    }

    const client = twilio.default(accountSid, authToken);

    for (const appointment of appointments) {
      if (!appointment.clientPhone) continue;
      try {
        const toNumber = this.normalizePhone(appointment.clientPhone);
        const message =
          `¡Hola ${appointment.clientName}! 😊 Esperamos que tu consulta de ayer haya sido de tu satisfacción. ` +
          `¿Cómo te encuentras? Si tienes alguna duda o necesitas algo, estamos aquí para ayudarte.`;

        await client.messages.create({
          from: `whatsapp:${whatsappNumber}`,
          to: `whatsapp:${toNumber}`,
          body: message,
        });

        this.logger.log(`Follow-up post-consulta enviado a ${toNumber} (cita ${appointment.id})`);
      } catch (error) {
        this.logger.error(
          `Error enviando follow-up para cita ${appointment.id}: ${(error as Error).message}`,
        );
      }
    }

    this.logger.log('Follow-up post-consulta completado.');
  }

  private normalizePhone(phone: string): string {
    const cleaned = phone.replace(/[\s\-]/g, '');
    return cleaned.startsWith('+') ? cleaned : `+57${cleaned}`;
  }

  private buildMessage(appointment: {
    clientName: string;
    date: Date;
    tenant: { name: string; industry: Industry };
    professional: { name: string } | null;
  }): string {
    const { clientName, date, tenant, professional } = appointment;
    const fecha = date.toLocaleDateString('es-CO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'America/Bogota',
    });
    const hora = date.toLocaleTimeString('es-CO', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Bogota',
    });
    const conProfesional = professional ? ` con ${professional.name}` : '';

    switch (tenant.industry) {
      case Industry.CLINIC:
        return (
          `🏥 Recordatorio de tu cita médica\n\n` +
          `Hola ${clientName}, te recordamos tu cita en ${tenant.name}${conProfesional}\n` +
          `📅 ${fecha}\n` +
          `🕐 ${hora}\n\n` +
          `Por favor llega 10 minutos antes. Para cancelar o reprogramar responde este mensaje.\n` +
          `¡Hasta pronto! 😊`
        );

      case Industry.BEAUTY:
        return (
          `💅 Recordatorio de tu cita\n\n` +
          `Hola ${clientName}, te esperamos en ${tenant.name}${conProfesional}\n` +
          `📅 ${fecha}\n` +
          `🕐 ${hora}\n\n` +
          `Si necesitas reagendar escríbenos.\n` +
          `¡Nos vemos! ✨`
        );

      case Industry.RESTAURANT:
        return (
          `🍽️ Recordatorio de tu reserva\n\n` +
          `Hola ${clientName}, confirmamos tu reserva en ${tenant.name}\n` +
          `📅 ${fecha}\n` +
          `🕐 ${hora}\n\n` +
          `Esperamos verte. Para cambios responde este mensaje. 🥂`
        );

      default:
        return (
          `📅 Recordatorio de tu cita\n\n` +
          `Hola ${clientName}, tienes una cita en ${tenant.name}${conProfesional}\n` +
          `📅 ${fecha}\n` +
          `🕐 ${hora}\n\n` +
          `Para cancelar o reagendar responde este mensaje.`
        );
    }
  }

  // ── Reporte matutino WhatsApp al dueño ────────────────────────────────────

  @Cron('0 8 * * *')
  async sendMorningWhatsAppReport(): Promise<void> {
    this.logger.log('Enviando reportes matutinos por WhatsApp...');

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!accountSid || !authToken) return;

    const twilioClient = twilio.default(accountSid, authToken);

    const tenants = await this.prisma.tenant.findMany({
      where: {
        subscriptionStatus: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL] },
        ownerPhone: { not: null },
      },
    });

    const hoy = new Date();
    hoy.setUTCHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setUTCDate(manana.getUTCDate() + 1);

    for (const tenant of tenants) {
      if (!tenant.ownerPhone) continue;
      const whatsappNumber = tenant.twilioNumber ?? process.env.TWILIO_WHATSAPP_NUMBER;
      if (!whatsappNumber) continue;

      try {
        const [citas, ordenes] = await Promise.all([
          this.prisma.appointment.findMany({
            where: { tenantId: tenant.id, date: { gte: hoy, lt: manana }, status: { in: ['SCHEDULED', 'CONFIRMED'] as any } },
            include: { service: true, professional: true },
            orderBy: { date: 'asc' },
          }),
          this.prisma.order.findMany({
            where: { tenantId: tenant.id, status: { in: ['PENDING', 'CONFIRMED', 'PREPARING'] as any }, createdAt: { gte: hoy, lt: manana } },
            take: 5,
          }),
        ]);

        const fecha = hoy.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
        let msg = `☀️ *Buenos días* — Resumen de hoy ${fecha} en ${tenant.name}\n\n`;

        if (citas.length > 0) {
          msg += `📅 *${citas.length} cita(s) hoy:*\n`;
          msg += citas.map((c) => {
            const hora = c.date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' });
            const prof = c.professional ? ` — ${c.professional.name}` : '';
            return `• ${hora} ${c.clientName} (${c.service.name}${prof})`;
          }).join('\n');
          msg += '\n\n';
        } else {
          msg += `📅 Sin citas agendadas hoy.\n\n`;
        }

        if (ordenes.length > 0) {
          msg += `🛒 *${ordenes.length} pedido(s) pendiente(s)*\n`;
        }

        msg += `\n_Responde este mensaje para gestionar tu negocio._`;

        await twilioClient.messages.create({
          from: `whatsapp:${whatsappNumber}`,
          to: `whatsapp:${this.normalizePhone(tenant.ownerPhone)}`,
          body: msg,
        });

        this.logger.log(`Reporte matutino enviado a ${tenant.name} (${tenant.ownerPhone})`);
      } catch (err) {
        this.logger.error(`Error reporte matutino ${tenant.name}: ${(err as Error).message}`);
      }
    }
  }

  // ── Alerta de stock bajo WhatsApp al dueño ────────────────────────────────

  @Cron('0 10 * * *')
  async sendStockAlerts(): Promise<void> {
    this.logger.log('Revisando alertas de stock bajo...');

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!accountSid || !authToken) return;

    const twilioClient = twilio.default(accountSid, authToken);

    const tenants = await this.prisma.tenant.findMany({
      where: {
        subscriptionStatus: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL] },
        ownerPhone: { not: null },
        industry: { in: ['TECH_STORE', 'CLOTHING_STORE', 'PHARMACY', 'RESTAURANT', 'BAKERY', 'WORKSHOP'] as any },
      },
    });

    for (const tenant of tenants) {
      if (!tenant.ownerPhone) continue;
      const whatsappNumber = tenant.twilioNumber ?? process.env.TWILIO_WHATSAPP_NUMBER;
      if (!whatsappNumber) continue;

      try {
        const bajoStock = await this.prisma.$queryRaw<Array<{ name: string; stock: number; minStock: number }>>`
          SELECT name, stock, "minStock"
          FROM "Product"
          WHERE "tenantId" = ${tenant.id}
            AND active = true
            AND stock <= "minStock"
          ORDER BY stock ASC
          LIMIT 10
        `;

        if (bajoStock.length === 0) continue;

        const lista = bajoStock.map((p) => `• ${p.name}: ${p.stock} unidades (mín. ${p.minStock})`).join('\n');
        const msg = `⚠️ *Alerta de stock bajo* — ${tenant.name}\n\n${lista}\n\n_Escríbeme para actualizar el stock._`;

        await twilioClient.messages.create({
          from: `whatsapp:${whatsappNumber}`,
          to: `whatsapp:${this.normalizePhone(tenant.ownerPhone)}`,
          body: msg,
        });

        this.logger.log(`Alerta de stock enviada a ${tenant.name} (${bajoStock.length} productos)`);
      } catch (err) {
        this.logger.error(`Error alerta stock ${tenant.name}: ${(err as Error).message}`);
      }
    }
  }

  /** Cada día a las 01:00 — suspende tenants con suscripción vencida y notifica por email */
  @Cron('0 1 * * *')
  async suspenderSuscripcionesVencidas() {
    this.logger.log('Cron: verificando suscripciones vencidas...');
    const ahora = new Date();

    const vencidos = await this.prisma.tenant.findMany({
      where: {
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionEndsAt: { lt: ahora },
      },
      include: {
        users: { where: { role: 'OWNER' }, take: 1 },
      },
    });

    for (const tenant of vencidos) {
      await this.prisma.tenant.update({
        where: { id: tenant.id },
        data: { subscriptionStatus: SubscriptionStatus.SUSPENDED },
      });

      const owner = tenant.users[0];
      if (owner) {
        await this.emailService.send({
          to: owner.email,
          subject: 'Tu suscripción ha vencido — Automatiza360',
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
              <h2 style="color:#0f172a;">Tu suscripción de ${tenant.name} ha vencido</h2>
              <p>Tu suscripción venció el <strong>${ahora.toLocaleDateString('es-CO')}</strong> y tu cuenta ha sido suspendida temporalmente.</p>
              <p>Para continuar usando Automatiza360, renueva tu plan:</p>
              <a href="${process.env.FRONTEND_URL ?? 'https://app.automatiza360.com'}/planes"
                 style="background:#4f46e5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">
                Renovar suscripción →
              </a>
              <p style="color:#94a3b8;font-size:13px;margin-top:24px;">Tus datos estarán disponibles por 30 días adicionales.</p>
            </div>
          `,
        });
      }
      this.logger.log(`Tenant ${tenant.name} (${tenant.id}) suspendido por vencimiento`);
    }

    this.logger.log(`Cron: ${vencidos.length} tenants suspendidos`);
  }

  /** Cada día a las 09:00 — avisa a tenants ACTIVE cuya suscripción vence en 5 días */
  @Cron('0 9 * * *')
  async avisarVencimientoProximo() {
    const en5dias = new Date();
    en5dias.setDate(en5dias.getDate() + 5);
    const en6dias = new Date();
    en6dias.setDate(en6dias.getDate() + 6);

    const proximos = await this.prisma.tenant.findMany({
      where: {
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionEndsAt: { gte: en5dias, lt: en6dias },
      },
      include: {
        users: { where: { role: 'OWNER' }, take: 1 },
      },
    });

    for (const tenant of proximos) {
      const owner = tenant.users[0];
      if (!owner) continue;
      await this.emailService.sendTrialExpirando(owner.email, {
        storeName: tenant.name,
        daysRemaining: 5,
      });
      this.logger.log(`Aviso vencimiento enviado a ${tenant.name}`);
    }
  }
}
