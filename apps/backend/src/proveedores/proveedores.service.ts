import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ImportarCatalogoDto } from './dto/importar-catalogo.dto';

@Injectable()
export class ProveedoresService {
  constructor(private readonly prisma: PrismaService) {}

  async importarCatalogo(dto: ImportarCatalogoDto, tenantId: string) {
    const { supplierName, products } = dto;

    return this.prisma.$transaction(async (tx) => {
      const supplier = await tx.supplier.upsert({
        where: { tenantId_name: { tenantId, name: supplierName } },
        create: { name: supplierName, tenantId },
        update: {},
      });

      await tx.supplierProduct.deleteMany({ where: { supplierId: supplier.id } });

      await tx.supplierProduct.createMany({
        data: products.map((p) => ({ ...p, supplierId: supplier.id })),
      });

      return tx.supplier.findUnique({
        where: { id: supplier.id },
        include: { _count: { select: { products: true } } },
      });
    });
  }

  listar(tenantId: string) {
    return this.prisma.supplier.findMany({
      where: { tenantId, active: true },
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
  }

  listarProductos(supplierId: string, tenantId: string) {
    return this.prisma.supplierProduct.findMany({
      where: { supplierId, supplier: { tenantId }, active: true },
      orderBy: { name: 'asc' },
    });
  }

  async buscarProductos(q: string, tenantId: string) {
    const term = q?.trim() ?? '';
    const filter = term
      ? { contains: term, mode: 'insensitive' as const }
      : undefined;

    const [propios, catalogo] = await Promise.all([
      this.prisma.product.findMany({
        where: {
          tenantId,
          active: true,
          ...(filter ? { name: filter } : {}),
        },
        orderBy: { name: 'asc' },
        take: 50,
      }),
      this.prisma.supplierProduct.findMany({
        where: {
          supplier: { tenantId },
          active: true,
          ...(filter ? { name: filter } : {}),
        },
        orderBy: { name: 'asc' },
        take: 50,
        include: { supplier: { select: { name: true } } },
      }),
    ]);

    return { propios, catalogo };
  }
}
