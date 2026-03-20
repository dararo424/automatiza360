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
}
