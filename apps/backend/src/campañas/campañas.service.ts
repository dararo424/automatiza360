import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as twilio from 'twilio';
import { PrismaService } from '../prisma/prisma.service';
import { CrearCampañaDto, FiltrosCampañaDto } from './dto/crear-campaña.dto';

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
        filtros: dto.filtros ? (dto.filtros as object) : undefined,
      },
    });
  }

  async previewContactos(tenantId: string, filtros?: FiltrosCampañaDto): Promise<{ total: number }> {
    const contactos = await this.aplicarFiltros(tenantId, filtros);
    return { total: contactos.length };
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

    const filtros = campaña.filtros as FiltrosCampañaDto | null;
    const contactos = await this.aplicarFiltros(tenantId, filtros ?? undefined);

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
          const nombre = contacto.name?.split(' ')[0] ?? 'cliente';
          const body = campaña.mensaje.replace(/\{nombre\}/gi, nombre);
          await client.messages.create({
            from: `whatsapp:${whatsappNumber}`,
            to: `whatsapp:${to}`,
            body,
          });
          totalEnviado++;
          // Respect Twilio rate limits — 1 msg/s to avoid 429s on large lists
          await new Promise((r) => setTimeout(r, 1000));
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

  private async aplicarFiltros(tenantId: string, filtros?: FiltrosCampañaDto) {
    let contactos = await this.prisma.contact.findMany({
      where: { tenantId },
      select: { phone: true, name: true, tags: true, puntos: true },
    });

    if (!filtros) return contactos;

    // Filter by tags (contact must have at least one matching tag)
    if (filtros.tags && filtros.tags.length > 0) {
      const tagsLower = filtros.tags.map((t) => t.toLowerCase().trim());
      contactos = contactos.filter((c) => {
        if (!c.tags) return false;
        const contactTags = c.tags.split(',').map((t) => t.toLowerCase().trim());
        return tagsLower.some((t) => contactTags.includes(t));
      });
    }

    // Filter by minimum loyalty points
    if (filtros.minPuntos !== undefined && filtros.minPuntos > 0) {
      contactos = contactos.filter((c) => c.puntos >= filtros.minPuntos!);
    }

    // Filter by "no purchase in last N days" (re-engagement)
    if (filtros.diasSinComprar !== undefined && filtros.diasSinComprar > 0) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - filtros.diasSinComprar);

      const phones = contactos.map((c) => c.phone).filter(Boolean) as string[];
      const recentOrders = await this.prisma.order.findMany({
        where: {
          tenantId,
          phone: { in: phones },
          createdAt: { gte: cutoff },
        },
        select: { phone: true },
        distinct: ['phone'],
      });
      const recentPhones = new Set(recentOrders.map((o) => o.phone));
      contactos = contactos.filter((c) => !recentPhones.has(c.phone));
    }

    // Filter by "purchased in last N days" (loyal customers)
    if (filtros.diasDesdeUltimaCompra !== undefined && filtros.diasDesdeUltimaCompra > 0) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - filtros.diasDesdeUltimaCompra);

      const phones = contactos.map((c) => c.phone).filter(Boolean) as string[];
      const recentOrders = await this.prisma.order.findMany({
        where: {
          tenantId,
          phone: { in: phones },
          createdAt: { gte: cutoff },
        },
        select: { phone: true },
        distinct: ['phone'],
      });
      const recentPhones = new Set(recentOrders.map((o) => o.phone));
      contactos = contactos.filter((c) => recentPhones.has(c.phone));
    }

    return contactos;
  }
}
