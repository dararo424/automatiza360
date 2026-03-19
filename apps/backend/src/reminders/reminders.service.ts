import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppointmentStatus, Industry } from '@prisma/client';
import * as twilio from 'twilio';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(private readonly prisma: PrismaService) {}

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
