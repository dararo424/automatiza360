import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as twilio from 'twilio';
import { PrismaService } from '../prisma/prisma.service';
import { CrearCampañaDto } from './dto/crear-campaña.dto';

@Injectable()
export class CampañasService {
  private readonly logger = new Logger(CampañasService.name);

  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string) {
    return this.prisma.campaña.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(tenantId: string, dto: CrearCampañaDto) {
    return this.prisma.campaña.create({
      data: {
        tenantId,
        nombre: dto.nombre,
        mensaje: dto.mensaje,
      },
    });
  }

  async enviar(tenantId: string, campañaId: string) {
    const campaña = await this.prisma.campaña.findFirst({
      where: { id: campañaId, tenantId },
    });
    if (!campaña) throw new NotFoundException('Campaña no encontrada');

    await this.prisma.campaña.update({
      where: { id: campañaId },
      data: { status: 'ENVIANDO' },
    });

    const contactos = await this.prisma.contact.findMany({
      where: { tenantId },
      select: { phone: true },
    });

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

    let totalEnviado = 0;
    let hasError = false;

    if (!accountSid || !authToken || !whatsappNumber) {
      this.logger.warn('Credenciales de Twilio no configuradas. Campaña marcada como enviada sin enviar mensajes.');
    } else {
      const client = twilio.default(accountSid, authToken);
      for (const contacto of contactos) {
        if (!contacto.phone) continue;
        try {
          const to = contacto.phone.startsWith('+') ? contacto.phone : `+57${contacto.phone}`;
          await client.messages.create({
            from: `whatsapp:${whatsappNumber}`,
            to: `whatsapp:${to}`,
            body: campaña.mensaje,
          });
          totalEnviado++;
        } catch (err) {
          hasError = true;
          this.logger.error(`Error enviando campaña a ${contacto.phone}: ${(err as Error).message}`);
        }
      }
    }

    return this.prisma.campaña.update({
      where: { id: campañaId },
      data: {
        status: hasError ? 'ERROR' : 'ENVIADA',
        totalEnviado,
        enviadaAt: new Date(),
      },
    });
  }
}
