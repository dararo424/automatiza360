import { Injectable } from '@nestjs/common';
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
}
