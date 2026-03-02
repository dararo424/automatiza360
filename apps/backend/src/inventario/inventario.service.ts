import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AjustarStockDto } from './dto/ajustar-stock.dto';

@Injectable()
export class InventarioService {
  constructor(private readonly prisma: PrismaService) {}

  async listarAlertas(tenantId: string) {
    const products = await this.prisma.product.findMany({
      where: { tenantId, active: true },
    });
    return products.filter((p) => p.stock <= p.minStock);
  }

  async ajustarStock(id: string, dto: AjustarStockDto, tenantId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId, active: true },
    });
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    const delta = dto.tipo === 'entrada' ? dto.cantidad : -dto.cantidad;
    const newStock = Math.max(0, product.stock + delta);

    return this.prisma.product.update({
      where: { id },
      data: { stock: newStock },
    });
  }
}
