import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrearProductoDto } from './dto/crear-producto.dto';
import { ActualizarProductoDto } from './dto/actualizar-producto.dto';

@Injectable()
export class ProductosService {
  constructor(private readonly prisma: PrismaService) {}

  crear(dto: CrearProductoDto, tenantId: string) {
    return this.prisma.product.create({
      data: { ...dto, tenantId },
    });
  }

  listar(tenantId: string) {
    return this.prisma.product.findMany({
      where: { tenantId, active: true },
      orderBy: { name: 'asc' },
    });
  }

  async buscarUno(id: string, tenantId: string) {
    const producto = await this.prisma.product.findFirst({
      where: { id, tenantId },
    });
    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }
    return producto;
  }

  async actualizar(id: string, dto: ActualizarProductoDto, tenantId: string) {
    await this.buscarUno(id, tenantId);
    return this.prisma.product.update({
      where: { id },
      data: dto,
    });
  }

  async eliminar(id: string, tenantId: string) {
    await this.buscarUno(id, tenantId);
    return this.prisma.product.update({
      where: { id },
      data: { active: false },
    });
  }
}
