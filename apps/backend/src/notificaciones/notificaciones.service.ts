import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CrearNotificacionData {
  type: string;
  title: string;
  message: string;
  tenantId: string;
}

@Injectable()
export class NotificacionesService {
  constructor(private readonly prisma: PrismaService) {}

  crear(data: CrearNotificacionData) {
    return this.prisma.notificacion.create({ data });
  }

  listar(tenantId: string, leidas?: boolean) {
    return this.prisma.notificacion.findMany({
      where: {
        tenantId,
        ...(leidas !== undefined && { read: leidas }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async marcarLeida(id: string, tenantId: string) {
    const notificacion = await this.prisma.notificacion.findFirst({
      where: { id, tenantId },
    });
    if (!notificacion) {
      throw new NotFoundException('Notificación no encontrada');
    }
    return this.prisma.notificacion.update({
      where: { id },
      data: { read: true },
    });
  }

  marcarTodasLeidas(tenantId: string) {
    return this.prisma.notificacion.updateMany({
      where: { tenantId, read: false },
      data: { read: true },
    });
  }
}
