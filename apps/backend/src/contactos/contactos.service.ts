import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertContactDto } from './dto/upsert-contact.dto';

@Injectable()
export class ContactosService {
  constructor(private readonly prisma: PrismaService) {}

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
    return this.prisma.contact.upsert({
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
