import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrearSucursalDto } from './dto/crear-sucursal.dto';

@Injectable()
export class SucursalesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string) {
    return this.prisma.sucursal.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    });
  }

  create(tenantId: string, dto: CrearSucursalDto) {
    return this.prisma.sucursal.create({
      data: {
        tenantId,
        nombre: dto.nombre,
        direccion: dto.direccion,
        ciudad: dto.ciudad,
        telefono: dto.telefono,
        twilioNumber: dto.twilioNumber,
        activa: dto.activa ?? true,
      },
    });
  }

  async update(tenantId: string, id: string, dto: CrearSucursalDto) {
    const sucursal = await this.prisma.sucursal.findFirst({ where: { id, tenantId } });
    if (!sucursal) throw new NotFoundException('Sucursal no encontrada');

    return this.prisma.sucursal.update({
      where: { id },
      data: {
        nombre: dto.nombre,
        direccion: dto.direccion,
        ciudad: dto.ciudad,
        telefono: dto.telefono,
        twilioNumber: dto.twilioNumber,
        activa: dto.activa,
      },
    });
  }

  async remove(tenantId: string, id: string) {
    const sucursal = await this.prisma.sucursal.findFirst({ where: { id, tenantId } });
    if (!sucursal) throw new NotFoundException('Sucursal no encontrada');
    await this.prisma.sucursal.delete({ where: { id } });
    return { message: 'Sucursal eliminada' };
  }
}
