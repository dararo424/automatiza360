import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrearGarantiaDto } from './dto/crear-garantia.dto';

@Injectable()
export class GarantiasService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string) {
    return this.prisma.garantia.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(tenantId: string, dto: CrearGarantiaDto) {
    const meses = dto.mesesGarantia ?? 12;
    const fechaCompra = new Date(dto.fechaCompra);
    const fechaVencimiento = new Date(fechaCompra);
    fechaVencimiento.setMonth(fechaVencimiento.getMonth() + meses);

    return this.prisma.garantia.create({
      data: {
        tenantId,
        clienteNombre: dto.clienteNombre,
        clientePhone: dto.clientePhone,
        producto: dto.producto,
        numeroSerie: dto.numeroSerie,
        fechaCompra,
        mesesGarantia: meses,
        fechaVencimiento,
        notas: dto.notas,
        ticketId: dto.ticketId,
      },
    });
  }

  async remove(tenantId: string, id: string) {
    const garantia = await this.prisma.garantia.findFirst({ where: { id, tenantId } });
    if (!garantia) throw new NotFoundException('Garantía no encontrada');
    return this.prisma.garantia.delete({ where: { id } });
  }

  async getAlertas(tenantId: string) {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return this.prisma.garantia.findMany({
      where: {
        tenantId,
        fechaVencimiento: { lte: in30Days },
      },
      orderBy: { fechaVencimiento: 'asc' },
    });
  }
}
