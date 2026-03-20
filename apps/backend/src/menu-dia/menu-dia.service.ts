import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrearMenuDiaDto } from './dto/crear-menu-dia.dto';
import { ActualizarMenuDiaDto } from './dto/actualizar-menu-dia.dto';

@Injectable()
export class MenuDiaService {
  constructor(private readonly prisma: PrismaService) {}

  async crearOActualizarHoy(
    dto: CrearMenuDiaDto | ActualizarMenuDiaDto,
    tenantId: string,
  ) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    return this.prisma.$transaction(async (tx) => {
      const existente = await tx.menuDia.findFirst({
        where: { tenantId, fecha: { gte: start, lte: end } },
      });

      if (existente) {
        await tx.platoMenuDia.deleteMany({ where: { menuDiaId: existente.id } });
        return tx.menuDia.update({
          where: { id: existente.id },
          data: {
            activo: 'activo' in dto && dto.activo !== undefined ? dto.activo : true,
            platos: { create: dto.platos },
          },
          include: { platos: true },
        });
      }

      return tx.menuDia.create({
        data: {
          tenantId,
          platos: { create: dto.platos },
        },
        include: { platos: true },
      });
    });
  }

  async obtenerHoy(tenantId: string) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    return this.prisma.menuDia.findFirst({
      where: {
        tenantId,
        activo: true,
        fecha: { gte: start, lte: end },
      },
      include: { platos: { where: { disponible: true } } },
    });
  }

  listar(tenantId: string) {
    return this.prisma.menuDia.findMany({
      where: { tenantId },
      include: { platos: true },
      orderBy: { fecha: 'desc' },
    });
  }

  async toggleActivo(id: string, tenantId: string) {
    const menu = await this.prisma.menuDia.findFirst({ where: { id, tenantId } });
    if (!menu) return null;
    return this.prisma.menuDia.update({
      where: { id },
      data: { activo: !menu.activo },
      include: { platos: true },
    });
  }

  eliminar(id: string, tenantId: string) {
    return this.prisma.menuDia.deleteMany({ where: { id, tenantId } });
  }

  async togglePlato(platoId: string) {
    const plato = await this.prisma.platoMenuDia.findUnique({ where: { id: platoId } });
    if (!plato) return null;
    return this.prisma.platoMenuDia.update({
      where: { id: platoId },
      data: { disponible: !plato.disponible },
    });
  }

  async obtenerMenuPublico(tenantSlug: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) return null;

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const menu = await this.prisma.menuDia.findFirst({
      where: {
        tenantId: tenant.id,
        activo: true,
        fecha: { gte: start, lte: end },
      },
      include: { platos: { where: { disponible: true } } },
    });

    return { tenant: { name: tenant.name, industry: tenant.industry }, menu };
  }

  async getQrConfigByTenantId(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    const tenantSlug = tenant?.slug ?? '';
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    return {
      tenantSlug,
      publicUrl: `${frontendUrl}/menu/${tenantSlug}`,
    };
  }
}
