import { Injectable, NotFoundException } from '@nestjs/common';
import { OrdenCompraStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CrearProveedorDto } from './dto/crear-proveedor.dto';
import { CrearOrdenCompraDto } from './dto/crear-orden-compra.dto';

@Injectable()
export class ComprasService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Proveedores ─────────────────────────────────────────────────────────

  listarProveedores(tenantId: string) {
    return this.prisma.proveedor.findMany({
      where: { tenantId },
      orderBy: { nombre: 'asc' },
    });
  }

  crearProveedor(tenantId: string, dto: CrearProveedorDto) {
    return this.prisma.proveedor.create({ data: { ...dto, tenantId } });
  }

  async actualizarProveedor(id: string, tenantId: string, dto: Partial<CrearProveedorDto>) {
    const found = await this.prisma.proveedor.findFirst({ where: { id, tenantId } });
    if (!found) throw new NotFoundException('Proveedor no encontrado');
    return this.prisma.proveedor.update({ where: { id }, data: dto });
  }

  async eliminarProveedor(id: string, tenantId: string) {
    const found = await this.prisma.proveedor.findFirst({ where: { id, tenantId } });
    if (!found) throw new NotFoundException('Proveedor no encontrado');
    return this.prisma.proveedor.delete({ where: { id } });
  }

  // ─── Órdenes de compra ───────────────────────────────────────────────────

  listarOrdenes(tenantId: string) {
    return this.prisma.ordenCompra.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        proveedor: { select: { nombre: true } },
        items: true,
      },
    });
  }

  async crearOrden(tenantId: string, dto: CrearOrdenCompraDto) {
    const proveedor = await this.prisma.proveedor.findFirst({
      where: { id: dto.proveedorId, tenantId },
    });
    if (!proveedor) throw new NotFoundException('Proveedor no encontrado');

    const total = dto.items.reduce((s, i) => s + i.cantidad * i.precioUnitario, 0);

    return this.prisma.ordenCompra.create({
      data: {
        tenantId,
        proveedorId: dto.proveedorId,
        notas: dto.notas,
        esperadaAt: dto.esperadaAt ? new Date(dto.esperadaAt) : undefined,
        total,
        items: {
          create: dto.items.map((i) => ({
            nombre: i.nombre,
            cantidad: i.cantidad,
            precioUnitario: i.precioUnitario,
          })),
        },
      },
      include: { items: true, proveedor: { select: { nombre: true } } },
    });
  }

  async recibirOrden(id: string, tenantId: string) {
    const orden = await this.prisma.ordenCompra.findFirst({
      where: { id, tenantId },
      include: { items: true },
    });
    if (!orden) throw new NotFoundException('Orden de compra no encontrada');

    // Update stock for matching products
    for (const item of orden.items) {
      const product = await this.prisma.product.findFirst({
        where: {
          tenantId,
          name: { equals: item.nombre, mode: 'insensitive' },
          active: true,
        },
      });
      if (product) {
        await this.prisma.product.update({
          where: { id: product.id },
          data: { stock: { increment: item.cantidad } },
        });
      }
    }

    return this.prisma.ordenCompra.update({
      where: { id },
      data: {
        status: OrdenCompraStatus.RECIBIDA,
        recibidaAt: new Date(),
      },
      include: { items: true, proveedor: { select: { nombre: true } } },
    });
  }
}
