import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrearResenaDto } from './dto/crear-resena.dto';

@Injectable()
export class ResenasService {
  constructor(private readonly prisma: PrismaService) {}

  create(tenantId: string, dto: CrearResenaDto) {
    return this.prisma.resena.create({
      data: { ...dto, tenantId },
    });
  }

  findAll(tenantId: string) {
    return this.prisma.resena.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStats(tenantId: string) {
    const resenas = await this.prisma.resena.findMany({
      where: { tenantId },
      select: { rating: true },
    });

    const total = resenas.length;
    const promedio = total > 0 ? resenas.reduce((s, r) => s + r.rating, 0) / total : 0;

    const distribMap = new Map<number, number>();
    for (let i = 1; i <= 5; i++) distribMap.set(i, 0);
    for (const r of resenas) distribMap.set(r.rating, (distribMap.get(r.rating) ?? 0) + 1);

    const distribucion = Array.from(distribMap.entries()).map(([rating, count]) => ({ rating, count }));

    return { promedio: Math.round(promedio * 10) / 10, total, distribucion };
  }
}
