import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Industry } from '@prisma/client';
import * as twilio from 'twilio';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminBotMessagingService {
  private readonly logger = new Logger(AdminBotMessagingService.name);

  constructor(private readonly prisma: PrismaService) {}

  normalizePhone(phone: string): string {
    const cleaned = phone.replace(/[\s\-]/g, '');
    return cleaned.startsWith('+') ? cleaned : `+57${cleaned}`;
  }

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
  ): Promise<{
    enviados: number;
    errores: number;
    detalle: Array<{ nombre: string; ok: boolean; error?: string }>;
  }> {
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

  async crearCampañaRapida(tenantId: string, mensaje: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');

    const contactos = await this.prisma.contact.findMany({
      where: { tenantId, phone: { not: '' } },
      select: { phone: true, name: true },
    });

    if (contactos.length === 0) {
      return { enviados: 0, errores: 0, mensaje: 'No hay contactos registrados' };
    }

    const campaña = await this.prisma.campaña.create({
      data: {
        tenantId,
        nombre: `Campaña rápida ${new Date().toLocaleDateString('es-CO')}`,
        mensaje,
        status: 'ENVIANDO' as any,
      },
    });

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const whatsappNumber = tenant.twilioNumber ?? process.env.TWILIO_WHATSAPP_NUMBER;
    const contentSid = process.env.TWILIO_CONTENT_SID;

    let enviados = 0;
    let errores = 0;

    if (accountSid && authToken && whatsappNumber) {
      const twilioClient = twilio.default(accountSid, authToken);
      for (const contacto of contactos) {
        try {
          const nombre = contacto.name?.split(' ')[0] ?? 'cliente';
          const params: Record<string, unknown> = {
            from: `whatsapp:${whatsappNumber}`,
            to: `whatsapp:${this.normalizePhone(contacto.phone)}`,
          };
          if (contentSid) {
            params.contentSid = contentSid;
            params.contentVariables = JSON.stringify({
              '1': nombre,
              '2': tenant.name,
              '3': mensaje,
            });
          } else {
            params.body = mensaje.replace(/\{nombre\}/gi, nombre);
          }
          await twilioClient.messages.create(params as any);
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
}
