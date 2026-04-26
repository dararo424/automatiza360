import { Injectable, NotFoundException } from '@nestjs/common';
import { TicketStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { FlujoService } from '../flujos/flujos.service';
import { CrearTicketDto } from './dto/crear-ticket.dto';
import { ActualizarTicketDto } from './dto/actualizar-ticket.dto';
import { ActualizarEstadoTicketDto } from './dto/actualizar-estado-ticket.dto';

const ESTADO_LABELS: Record<TicketStatus, string> = {
  RECEIVED: 'Recibido',
  DIAGNOSING: 'En diagnóstico',
  WAITING_PARTS: 'Esperando repuestos',
  REPAIRING: 'En reparación',
  READY: 'Listo para retirar',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificacionesService: NotificacionesService,
    private readonly flujos: FlujoService,
  ) {}

  async crear(dto: CrearTicketDto, tenantId: string) {
    await this.flujos.assertFlujoActivo(tenantId, 'soporte');
    return this.prisma.$transaction(async (tx) => {
      const count = await tx.ticket.count({ where: { tenantId } });
      const number = count + 1;

      return tx.ticket.create({
        data: { ...dto, number, tenantId },
      });
    });
  }

  listar(tenantId: string, estado?: TicketStatus) {
    return this.prisma.ticket.findMany({
      where: { tenantId, ...(estado && { status: estado }) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async buscarUno(id: string, tenantId: string) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id, tenantId },
    });
    if (!ticket) {
      throw new NotFoundException('Ticket no encontrado');
    }
    return ticket;
  }

  async actualizar(id: string, dto: ActualizarTicketDto, tenantId: string) {
    await this.buscarUno(id, tenantId);
    return this.prisma.ticket.update({ where: { id }, data: dto });
  }

  async exportarCsv(tenantId: string): Promise<string> {
    const tickets = await this.prisma.ticket.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    });

    const escape = (v: string | number | null | undefined) => {
      const s = String(v ?? '');
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };

    const header = 'Numero,Estado,Cliente,Telefono,Dispositivo,Problema,Diagnostico,Precio,Fecha';
    const rows = tickets.map((t) =>
      [
        escape(t.number),
        escape(t.status),
        escape(t.clientName),
        escape(t.clientPhone),
        escape(t.device),
        escape(t.issue),
        escape(t.diagnosis ?? ''),
        escape(t.price ?? ''),
        escape(t.createdAt.toISOString()),
      ].join(','),
    );

    return [header, ...rows].join('\n');
  }

  async actualizarEstado(
    id: string,
    dto: ActualizarEstadoTicketDto,
    tenantId: string,
  ) {
    const ticket = await this.buscarUno(id, tenantId);

    const updated = await this.prisma.ticket.update({
      where: { id },
      data: { status: dto.estado },
    });

    await this.notificacionesService.crear({
      type: 'TICKET_ESTADO',
      title: `Ticket #${ticket.number} - ${ESTADO_LABELS[dto.estado]}`,
      message: `Equipo "${ticket.device}" de ${ticket.clientName} (${ticket.clientPhone}): ${ESTADO_LABELS[dto.estado]}`,
      tenantId,
    });

    return updated;
  }
}
