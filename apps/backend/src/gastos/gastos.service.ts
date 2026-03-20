import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CrearGastoDto } from './dto/crear-gasto.dto';

@Injectable()
export class GastosService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string) {
    return this.prisma.gasto.findMany({
      where: { tenantId },
      orderBy: { fecha: 'desc' },
    });
  }

  create(tenantId: string, dto: CrearGastoDto) {
    return this.prisma.gasto.create({
      data: {
        tenantId,
        descripcion: dto.descripcion,
        monto: dto.monto,
        categoria: dto.categoria,
        fecha: dto.fecha ? new Date(dto.fecha) : new Date(),
        notas: dto.notas,
      },
    });
  }

  async remove(tenantId: string, id: string) {
    const gasto = await this.prisma.gasto.findFirst({ where: { id, tenantId } });
    if (!gasto) throw new NotFoundException('Gasto no encontrado');
    return this.prisma.gasto.delete({ where: { id } });
  }

  async getResumen(tenantId: string) {
    const gastos = await this.prisma.gasto.findMany({ where: { tenantId } });
    const totalGastos = gastos.reduce((sum, g) => sum + g.monto, 0);

    const ordenes = await this.prisma.order.findMany({
      where: {
        tenantId,
        status: OrderStatus.DELIVERED,
      },
      select: { total: true },
    });
    const totalIngresos = ordenes.reduce((sum, o) => sum + o.total, 0);

    const porCategoriaMap = new Map<string, number>();
    for (const g of gastos) {
      porCategoriaMap.set(g.categoria, (porCategoriaMap.get(g.categoria) ?? 0) + g.monto);
    }
    const porCategoria = Array.from(porCategoriaMap.entries()).map(([categoria, total]) => ({
      categoria,
      total,
    }));

    return {
      totalGastos,
      totalIngresos,
      ganancia: totalIngresos - totalGastos,
      porCategoria,
    };
  }
}
