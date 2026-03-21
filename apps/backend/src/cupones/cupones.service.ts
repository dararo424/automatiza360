import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CuponTipo } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CrearCuponDto } from './dto/crear-cupon.dto';

@Injectable()
export class CuponesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string) {
    return this.prisma.cupon.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(tenantId: string, dto: CrearCuponDto) {
    const codigo = dto.codigo.toUpperCase();
    return this.prisma.cupon.create({
      data: {
        tenantId,
        codigo,
        tipo: dto.tipo,
        valor: dto.valor,
        minCompra: dto.minCompra ?? 0,
        maxUsos: dto.maxUsos ?? null,
        fechaVencimiento: dto.fechaVencimiento ? new Date(dto.fechaVencimiento) : null,
      },
    });
  }

  async toggle(tenantId: string, id: string) {
    const cupon = await this.prisma.cupon.findFirst({ where: { id, tenantId } });
    if (!cupon) throw new NotFoundException('Cupón no encontrado');
    return this.prisma.cupon.update({
      where: { id },
      data: { activo: !cupon.activo },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.prisma.cupon.deleteMany({ where: { id, tenantId } });
    return { deleted: true };
  }

  async validar(
    tenantId: string,
    codigo: string,
    montoCompra: number,
  ): Promise<{ valido: boolean; tipo?: CuponTipo; valor?: number; descuento?: number; mensaje?: string }> {
    const cupon = await this.prisma.cupon.findUnique({
      where: { tenantId_codigo: { tenantId, codigo: codigo.toUpperCase() } },
    });

    if (!cupon) return { valido: false, mensaje: 'Cupón no encontrado' };
    if (!cupon.activo) return { valido: false, mensaje: 'Cupón inactivo' };
    if (cupon.fechaVencimiento && cupon.fechaVencimiento < new Date()) {
      return { valido: false, mensaje: 'Cupón vencido' };
    }
    if (cupon.maxUsos !== null && cupon.usosActuales >= cupon.maxUsos) {
      return { valido: false, mensaje: 'Cupón sin usos disponibles' };
    }
    if (montoCompra < cupon.minCompra) {
      return {
        valido: false,
        mensaje: `Monto mínimo requerido: $${cupon.minCompra.toLocaleString('es-CO')}`,
      };
    }

    const descuento =
      cupon.tipo === CuponTipo.PORCENTAJE
        ? Math.round((montoCompra * cupon.valor) / 100)
        : Math.min(cupon.valor, montoCompra);

    return { valido: true, tipo: cupon.tipo, valor: cupon.valor, descuento };
  }

  async aplicar(tenantId: string, codigo: string) {
    const cupon = await this.prisma.cupon.findUnique({
      where: { tenantId_codigo: { tenantId, codigo: codigo.toUpperCase() } },
    });
    if (!cupon) throw new BadRequestException('Cupón no encontrado');
    return this.prisma.cupon.update({
      where: { id: cupon.id },
      data: { usosActuales: { increment: 1 } },
    });
  }
}
