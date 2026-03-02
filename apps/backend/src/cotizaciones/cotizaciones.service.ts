import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CotizacionStatus } from '../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { CrearCotizacionDto } from './dto/crear-cotizacion.dto';
import { ActualizarEstadoCotizacionDto } from './dto/actualizar-estado-cotizacion.dto';

@Injectable()
export class CotizacionesService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(dto: CrearCotizacionDto, tenantId: string) {
    const productIds = [...new Set(dto.items.map((i) => i.productId))];

    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, tenantId, active: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const id of productIds) {
      if (!productMap.has(id)) {
        throw new BadRequestException(`Producto no disponible: ${id}`);
      }
    }

    const total = dto.items.reduce((sum, item) => {
      return sum + productMap.get(item.productId)!.price * item.quantity;
    }, 0);

    return this.prisma.$transaction(async (tx) => {
      const count = await tx.cotizacion.count({ where: { tenantId } });
      const number = count + 1;

      return tx.cotizacion.create({
        data: {
          number,
          clientName: dto.clientName,
          clientPhone: dto.clientPhone,
          notes: dto.notes,
          validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
          total,
          tenantId,
          status: CotizacionStatus.DRAFT,
          items: {
            create: dto.items.map((i) => ({
              quantity: i.quantity,
              price: productMap.get(i.productId)!.price,
              name: productMap.get(i.productId)!.name,
              subtotal: productMap.get(i.productId)!.price * i.quantity,
            })),
          },
        },
        include: { items: true },
      });
    });
  }

  listar(tenantId: string, estado?: CotizacionStatus) {
    return this.prisma.cotizacion.findMany({
      where: { tenantId, ...(estado && { status: estado }) },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async buscarUno(id: string, tenantId: string) {
    const cotizacion = await this.prisma.cotizacion.findFirst({
      where: { id, tenantId },
      include: { items: true },
    });
    if (!cotizacion) {
      throw new NotFoundException('Cotización no encontrada');
    }
    return cotizacion;
  }

  async actualizarEstado(
    id: string,
    dto: ActualizarEstadoCotizacionDto,
    tenantId: string,
  ) {
    await this.buscarUno(id, tenantId);
    return this.prisma.cotizacion.update({
      where: { id },
      data: { status: dto.estado },
    });
  }

  async eliminar(id: string, tenantId: string) {
    await this.buscarUno(id, tenantId);
    return this.prisma.cotizacion.delete({ where: { id } });
  }
}
