import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CrearOrdenDto } from './dto/crear-orden.dto';
import { CrearOrdenBotDto } from './dto/crear-orden-bot.dto';
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

  async crearDesdeBot(dto: CrearOrdenBotDto, tenantId: string) {
    const nombres = dto.items.map((i) => i.nombre_producto.toLowerCase());

    const products = await this.prisma.product.findMany({
      where: { tenantId, active: true },
    });

    const productMap = new Map(
      products.map((p) => [p.name.toLowerCase(), p]),
    );

    for (const nombre of nombres) {
      if (!productMap.has(nombre)) {
        throw new BadRequestException(`Producto no encontrado: "${nombre}"`);
      }
    }

    const total = dto.items.reduce((sum, item) => {
      return sum + productMap.get(item.nombre_producto.toLowerCase())!.price * item.cantidad;
    }, 0);

    const notesPartes = [
      `Cliente: ${dto.nombre_cliente}`,
      `Pago: ${dto.metodo_pago}`,
      `Dirección: ${dto.direccion_entrega}`,
    ];
    if (dto.notas) notesPartes.push(`Notas: ${dto.notas}`);

    return this.prisma.$transaction(async (tx) => {
      const count = await tx.order.count({ where: { tenantId } });
      return tx.order.create({
        data: {
          number: count + 1,
          total,
          notes: notesPartes.join(' | '),
          phone: dto.telefono,
          tenantId,
          status: OrderStatus.PENDING,
          items: {
            create: dto.items.map((i) => {
              const p = productMap.get(i.nombre_producto.toLowerCase())!;
              return { quantity: i.cantidad, price: p.price, name: p.name };
            }),
          },
        },
        include: { items: true },
      });
    });
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
