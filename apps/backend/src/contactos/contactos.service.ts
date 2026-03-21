import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AutomacionTrigger } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AutomacionesService } from '../automaciones/automaciones.service';
import { UpsertContactDto } from './dto/upsert-contact.dto';

@Injectable()
export class ContactosService {
  private readonly logger = new Logger(ContactosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly automacionesService: AutomacionesService,
  ) {}

  async list(tenantId: string, search?: string) {
    return this.prisma.contact.findMany({
      where: {
        tenantId,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async upsert(tenantId: string, dto: UpsertContactDto) {
    // Check if this is a new contact
    const existing = await this.prisma.contact.findUnique({
      where: { tenantId_phone: { tenantId, phone: dto.phone } },
    });

    const contact = await this.prisma.contact.upsert({
      where: { tenantId_phone: { tenantId, phone: dto.phone } },
      update: {
        name: dto.name,
        email: dto.email,
        notes: dto.notes,
        tags: dto.tags,
      },
      create: {
        tenantId,
        phone: dto.phone,
        name: dto.name,
        email: dto.email,
        notes: dto.notes,
        tags: dto.tags,
      },
    });

    // Trigger automaciones only for brand-new contacts
    if (!existing) {
      this.automacionesService
        .dispararTrigger(
          tenantId,
          AutomacionTrigger.NEW_CONTACT,
          dto.phone,
          dto.name,
          {},
        )
        .catch((err) =>
          this.logger.error(
            'Error disparando automatización NEW_CONTACT: %s',
            err?.message ?? err,
          ),
        );
    }

    return contact;
  }

  async update(tenantId: string, id: string, dto: UpsertContactDto) {
    const existing = await this.prisma.contact.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Contacto no encontrado');
    return this.prisma.contact.update({
      where: { id },
      data: {
        phone: dto.phone,
        name: dto.name,
        email: dto.email,
        notes: dto.notes,
        tags: dto.tags,
      },
    });
  }

  async remove(tenantId: string, id: string) {
    return this.prisma.contact.deleteMany({ where: { id, tenantId } });
  }

  async agregarPuntos(tenantId: string, phone: string, puntos: number) {
    const contacto = await this.prisma.contact.findFirst({
      where: { tenantId, phone },
    });
    if (!contacto) return null;
    return this.prisma.contact.update({
      where: { id: contacto.id },
      data: { puntos: { increment: puntos } },
    });
  }

  async getHistorial(tenantId: string, id: string) {
    const contacto = await this.prisma.contact.findFirst({ where: { id, tenantId } });
    if (!contacto) throw new NotFoundException('Contacto no encontrado');

    const phone = contacto.phone;

    const [ordenes, citas] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          tenantId,
          OR: [{ phone: { contains: phone } }, { notes: { contains: phone } }],
        },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.appointment.findMany({
        where: { tenantId, clientPhone: { contains: phone } },
        include: { service: true, professional: true },
        orderBy: { date: 'desc' },
        take: 50,
      }),
    ]);

    const totalGastado = ordenes.reduce((sum, o) => sum + o.total, 0);

    return { ordenes, citas, totalGastado };
  }

  async canjearPuntos(tenantId: string, id: string, puntos: number) {
    const contacto = await this.prisma.contact.findFirst({
      where: { id, tenantId },
    });
    if (!contacto) throw new NotFoundException('Contacto no encontrado');
    if (contacto.puntos < puntos) {
      throw new BadRequestException(`Puntos insuficientes. Disponibles: ${contacto.puntos}`);
    }
    return this.prisma.contact.update({
      where: { id },
      data: {
        puntos: { decrement: puntos },
        puntosUsados: { increment: puntos },
      },
    });
  }
}
