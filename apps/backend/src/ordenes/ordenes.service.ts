import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus } from '../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { CrearOrdenDto } from './dto/crear-orden.dto';
import { ActualizarEstadoDto } from './dto/actualizar-estado.dto';

@Injectable()
export class OrdenesService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(dto: CrearOrdenDto, tenantId: string) {
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
      const count = await tx.order.count({ where: { tenantId } });
      const number = count + 1;

      return tx.order.create({
        data: {
          number,
          total,
          notes: dto.notes,
          phone: dto.phone,
          tenantId,
          status: OrderStatus.PENDING,
          items: {
            create: dto.items.map((i) => ({
              quantity: i.quantity,
              price: productMap.get(i.productId)!.price,
              name: productMap.get(i.productId)!.name,
            })),
          },
        },
        include: { items: true },
      });
    });
  }

  listar(tenantId: string, estado?: OrderStatus) {
    return this.prisma.order.findMany({
      where: { tenantId, ...(estado && { status: estado }) },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async buscarUno(id: string, tenantId: string) {
    const orden = await this.prisma.order.findFirst({
      where: { id, tenantId },
      include: { items: true },
    });
    if (!orden) {
      throw new NotFoundException('Orden no encontrada');
    }
    return orden;
  }

  async actualizarEstado(
    id: string,
    dto: ActualizarEstadoDto,
    tenantId: string,
  ) {
    await this.buscarUno(id, tenantId);
    return this.prisma.order.update({
      where: { id },
      data: { status: dto.estado },
    });
  }
}
