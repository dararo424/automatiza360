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
    const respuestas = await this.prisma.npsRespuesta.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    const total = respuestas.length;

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

    const promotores = respuestas.filter((r) => r.score >= 9).length;
    const neutrales = respuestas.filter((r) => r.score >= 7 && r.score <= 8).length;
    const detractores = respuestas.filter((r) => r.score <= 6).length;

    const npsScore = Math.round(((promotores - detractores) / total) * 100);
    const promedio = Math.round((respuestas.reduce((acc, r) => acc + r.score, 0) / total) * 10) / 10;

    return {
      npsScore,
      promotores,
      neutrales,
      detractores,
      total,
      promedio,
      ultimas: respuestas.slice(0, 10),
    };
  }
}
