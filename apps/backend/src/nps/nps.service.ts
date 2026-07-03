import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegistrarNpsDto } from './dto/registrar-nps.dto';

@Injectable()
export class NpsService {
  constructor(private readonly prisma: PrismaService) {}

  async registrar(tenantId: string, dto: RegistrarNpsDto) {
    return this.prisma.npsRespuesta.create({
      data: {
        tenantId,
        clientPhone: dto.clientPhone,
        score: dto.score,
        comentario: dto.comentario,
        tipo: dto.tipo,
        referenciaId: dto.referenciaId,
      },
    });
  }

  async getStats(tenantId: string) {
    const [aggregate, promotores, neutrales, detractores, ultimas] = await Promise.all([
      this.prisma.npsRespuesta.aggregate({
        where: { tenantId },
        _count: { _all: true },
        _avg: { score: true },
      }),
      this.prisma.npsRespuesta.count({ where: { tenantId, score: { gte: 9 } } }),
      this.prisma.npsRespuesta.count({ where: { tenantId, score: { gte: 7, lte: 8 } } }),
      this.prisma.npsRespuesta.count({ where: { tenantId, score: { lte: 6 } } }),
      this.prisma.npsRespuesta.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    const total = aggregate._count._all;

    if (total === 0) {
      return {
        npsScore: 0,
        promotores: 0,
        neutrales: 0,
        detractores: 0,
        total: 0,
        promedio: 0,
        ultimas: [],
      };
    }

    const npsScore = Math.round(((promotores - detractores) / total) * 100);
    const promedio = aggregate._avg.score
      ? Math.round(aggregate._avg.score * 10) / 10
      : 0;

    return {
      npsScore,
      promotores,
      neutrales,
      detractores,
      total,
      promedio,
      ultimas,
    };
  }
}
