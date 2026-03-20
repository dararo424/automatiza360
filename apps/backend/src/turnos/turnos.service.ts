import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CrearTurnoDto } from './dto/crear-turno.dto';

@Injectable()
export class TurnosService {
  constructor(private readonly prisma: PrismaService) {}

  async getTurnosSemana(tenantId: string, semana: string) {
    const base = new Date(semana);
    // Adjust to Monday of that week
    const day = base.getDay(); // 0=Sun
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(base);
    monday.setDate(base.getDate() + diff);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const turnos = await this.prisma.turno.findMany({
      where: {
        tenantId,
        fecha: { gte: monday, lte: sunday },
      },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
      orderBy: [{ fecha: 'asc' }, { horaInicio: 'asc' }],
    });

    return { semanaInicio: monday.toISOString(), semanaFin: sunday.toISOString(), turnos };
  }

  async crearTurno(tenantId: string, dto: CrearTurnoDto, userRole: Role) {
    if (userRole !== Role.OWNER && userRole !== Role.ADMIN && userRole !== Role.SUPERADMIN) {
      throw new ForbiddenException('Solo OWNER o ADMIN pueden asignar turnos');
    }

    // Verify user belongs to tenant
    const userInTenant = await this.prisma.user.findFirst({
      where: { id: dto.userId, tenantId },
    });
    if (!userInTenant) throw new NotFoundException('Usuario no encontrado en este tenant');

    return this.prisma.turno.create({
      data: {
        tenantId,
        userId: dto.userId,
        fecha: new Date(dto.fecha),
        horaInicio: dto.horaInicio,
        horaFin: dto.horaFin,
        notas: dto.notas,
      },
      include: { user: { select: { id: true, name: true, role: true } } },
    });
  }

  async eliminarTurno(id: string, tenantId: string, userRole: Role) {
    if (userRole !== Role.OWNER && userRole !== Role.ADMIN && userRole !== Role.SUPERADMIN) {
      throw new ForbiddenException('Solo OWNER o ADMIN pueden eliminar turnos');
    }

    const turno = await this.prisma.turno.findFirst({ where: { id, tenantId } });
    if (!turno) throw new NotFoundException('Turno no encontrado');

    return this.prisma.turno.delete({ where: { id } });
  }
}
