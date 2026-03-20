import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AutomacionTrigger, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CrearAutomacionDto } from './dto/crear-automacion.dto';
import { ActualizarAutomacionDto } from './dto/actualizar-automacion.dto';

@Injectable()
export class AutomacionesService {
  private readonly logger = new Logger(AutomacionesService.name);

  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string) {
    return this.prisma.automacion.findMany({
      where: { tenantId },
      include: { pasos: { orderBy: { orden: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(tenantId: string, dto: CrearAutomacionDto) {
    return this.prisma.$transaction(async (tx) => {
      const automacion = await tx.automacion.create({
        data: {
          tenantId,
          nombre: dto.nombre,
          trigger: dto.trigger,
          activa: dto.activa ?? true,
          pasos: {
            create: dto.pasos.map((p) => ({
              orden: p.orden,
              tipo: p.tipo,
              config: p.config as Prisma.InputJsonValue,
            })),
          },
        },
        include: { pasos: { orderBy: { orden: 'asc' } } },
      });
      return automacion;
    });
  }

  async update(tenantId: string, id: string, dto: ActualizarAutomacionDto) {
    const existing = await this.prisma.automacion.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('Automatización no encontrada');

    return this.prisma.$transaction(async (tx) => {
      if (dto.pasos !== undefined) {
        await tx.automacionPaso.deleteMany({ where: { automacionId: id } });
        for (const paso of dto.pasos) {
          await tx.automacionPaso.create({
            data: {
              automacionId: id,
              orden: paso.orden,
              tipo: paso.tipo,
              config: paso.config as Prisma.InputJsonValue,
            },
          });
        }
      }

      return tx.automacion.update({
        where: { id },
        data: {
          ...(dto.nombre !== undefined && { nombre: dto.nombre }),
          ...(dto.activa !== undefined && { activa: dto.activa }),
        },
        include: { pasos: { orderBy: { orden: 'asc' } } },
      });
    });
  }

  async remove(tenantId: string, id: string) {
    const existing = await this.prisma.automacion.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('Automatización no encontrada');
    return this.prisma.automacion.delete({ where: { id } });
  }

  async toggle(tenantId: string, id: string) {
    const existing = await this.prisma.automacion.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('Automatización no encontrada');
    return this.prisma.automacion.update({
      where: { id },
      data: { activa: !existing.activa },
      include: { pasos: { orderBy: { orden: 'asc' } } },
    });
  }

  async dispararTrigger(
    tenantId: string,
    trigger: AutomacionTrigger,
    contactPhone: string,
    contactNombre: string | undefined,
    metadata: Record<string, unknown>,
  ) {
    const automaciones = await this.prisma.automacion.findMany({
      where: { tenantId, trigger, activa: true },
      include: { pasos: { orderBy: { orden: 'asc' } } },
    });

    for (const automacion of automaciones) {
      if (automacion.pasos.length === 0) continue;

      await this.prisma.automacionEjecucion.create({
        data: {
          automacionId: automacion.id,
          tenantId,
          contactPhone,
          contactNombre: contactNombre ?? null,
          pasoActual: 0,
          scheduledAt: new Date(),
          status: 'PENDIENTE',
          metadata: metadata as Prisma.InputJsonValue,
        },
      });
    }
  }

  @Cron('0 * * * *') // every hour
  async procesarEjecucionesPendientes() {
    const pendientes = await this.prisma.automacionEjecucion.findMany({
      where: {
        status: 'PENDIENTE',
        scheduledAt: { lte: new Date() },
      },
      include: {
        automacion: {
          include: { pasos: { orderBy: { orden: 'asc' } } },
        },
      },
    });

    for (const ejecucion of pendientes) {
      try {
        await this._procesarEjecucion(ejecucion);
      } catch (err: any) {
        this.logger.error(
          'Error procesando ejecución %s: %s',
          ejecucion.id,
          err?.message ?? err,
        );
        await this.prisma.automacionEjecucion.update({
          where: { id: ejecucion.id },
          data: { status: 'ERROR' },
        });
      }
    }
  }

  private async _procesarEjecucion(ejecucion: {
    id: string;
    pasoActual: number;
    contactPhone: string;
    contactNombre: string | null;
    automacion: {
      pasos: Array<{ orden: number; tipo: string; config: unknown }>;
    };
  }) {
    const pasos = ejecucion.automacion.pasos;
    const paso = pasos[ejecucion.pasoActual];

    if (!paso) {
      await this.prisma.automacionEjecucion.update({
        where: { id: ejecucion.id },
        data: { status: 'COMPLETADA', ejecutadaAt: new Date() },
      });
      return;
    }

    const config = paso.config as Record<string, unknown>;

    if (paso.tipo === 'WAIT') {
      const days = Number(config['days'] ?? 1);
      const nextScheduled = new Date(
        Date.now() + days * 24 * 60 * 60 * 1000,
      );
      await this.prisma.automacionEjecucion.update({
        where: { id: ejecucion.id },
        data: {
          pasoActual: ejecucion.pasoActual + 1,
          scheduledAt: nextScheduled,
        },
      });
    } else if (paso.tipo === 'SEND_WHATSAPP') {
      const nombre = ejecucion.contactNombre ?? 'Cliente';
      const mensaje = String(config['mensaje'] ?? '').replace(
        '{nombre}',
        nombre,
      );

      await this._enviarWhatsApp(ejecucion.contactPhone, mensaje);

      const siguientePasoIdx = ejecucion.pasoActual + 1;
      const hayMasPasos = siguientePasoIdx < pasos.length;

      await this.prisma.automacionEjecucion.update({
        where: { id: ejecucion.id },
        data: {
          pasoActual: siguientePasoIdx,
          ejecutadaAt: new Date(),
          status: hayMasPasos ? 'PENDIENTE' : 'COMPLETADA',
          scheduledAt: hayMasPasos ? new Date() : undefined,
        },
      });
    }
  }

  private async _enviarWhatsApp(phone: string, body: string) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_WHATSAPP_NUMBER;

    if (!sid || !token || !from) {
      this.logger.warn(
        'Twilio env vars no configuradas — omitiendo envío a %s',
        phone,
      );
      return;
    }

    const to = phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone}`;
    const params = new URLSearchParams({
      From: `whatsapp:${from}`,
      To: to,
      Body: body,
    });

    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
    const credentials = Buffer.from(`${sid}:${token}`).toString('base64');

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Twilio error ${res.status}: ${text}`);
    }

    this.logger.log('Mensaje WhatsApp de automatización enviado a %s', phone);
  }
}
