import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CalendarService } from '../calendar/calendar.service';
import { CrearCitaBotDto } from './dto/crear-cita-bot.dto';

@Injectable()
export class CitasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calendar: CalendarService,
  ) {}

  listarServicios(tenantId: string) {
    return this.prisma.service.findMany({
      where: { tenantId, active: true },
      orderBy: { name: 'asc' },
    });
  }

  listarProfesionales(tenantId: string) {
    return this.prisma.professional.findMany({
      where: { tenantId, active: true },
      include: { schedules: true },
      orderBy: { name: 'asc' },
    });
  }

  async consultarDisponibilidad(
    tenantId: string,
    date: string,
    professionalId?: string,
  ) {
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getUTCDay();

    const whereProf: any = { tenantId, active: true };
    if (professionalId) whereProf.id = professionalId;

    const professionals = await this.prisma.professional.findMany({
      where: whereProf,
      include: {
        schedules: { where: { dayOfWeek } },
        appointments: {
          where: {
            date: {
              gte: new Date(`${date}T00:00:00.000Z`),
              lt: new Date(`${date}T23:59:59.999Z`),
            },
            status: { notIn: [AppointmentStatus.CANCELLED] },
          },
          include: { service: true },
        },
      },
    });

    return professionals.map((prof) => {
      const schedule = prof.schedules[0];
      if (!schedule) {
        return {
          professionalId: prof.id,
          name: prof.name,
          available: false,
          reason: 'No trabaja este día',
        };
      }

      const slots = this._generateSlots(
        schedule.startTime,
        schedule.endTime,
        prof.appointments,
      );

      return {
        professionalId: prof.id,
        name: prof.name,
        specialty: prof.specialty,
        schedule: { start: schedule.startTime, end: schedule.endTime },
        availableSlots: slots,
        bookedAppointments: prof.appointments.map((a) => ({
          time: new Date(a.date).toISOString().substring(11, 16),
          duration: a.service.duration,
          clientName: a.clientName,
        })),
      };
    });
  }

  async getCitasDelMes(tenantId: string, year: number, month: number) {
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 1));

    const appointments = await this.prisma.appointment.findMany({
      where: { tenantId, date: { gte: startDate, lt: endDate } },
      include: { service: true, professional: true },
      orderBy: { date: 'asc' },
    });

    const counts: Record<string, number> = {};
    for (const a of appointments) {
      const key = a.date.toISOString().substring(0, 10);
      counts[key] = (counts[key] ?? 0) + 1;
    }

    return { counts, appointments };
  }

  getCitasDelDia(tenantId: string, date: string) {
    return this.prisma.appointment.findMany({
      where: {
        tenantId,
        date: {
          gte: new Date(`${date}T00:00:00.000Z`),
          lt: new Date(`${date}T23:59:59.999Z`),
        },
      },
      include: { service: true, professional: true },
      orderBy: { date: 'asc' },
    });
  }

  async actualizarEstado(
    id: string,
    status: AppointmentStatus,
    tenantId: string,
  ) {
    const cita = await this.prisma.appointment.findFirst({
      where: { id, tenantId },
      include: { service: true, professional: true },
    });
    if (!cita) throw new NotFoundException('Cita no encontrada');

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: { status },
      include: { service: true, professional: true },
    });

    const fechaStr = cita.date.toLocaleDateString('es-CO', {
      dateStyle: 'medium',
    });
    const horaStr = cita.date.toLocaleTimeString('es-CO', {
      timeStyle: 'short',
    });
    const profName = cita.professional?.name ?? 'Sin asignar';

    const NOTIFS: Partial<
      Record<AppointmentStatus, { title: string; message: string }>
    > = {
      [AppointmentStatus.CONFIRMED]: {
        title: `Cita confirmada — ${cita.clientName}`,
        message: `✅ ${cita.clientName} — ${cita.service.name} — ${fechaStr} ${horaStr} con ${profName}`,
      },
      [AppointmentStatus.CANCELLED]: {
        title: `Cita cancelada — ${cita.clientName}`,
        message: `❌ ${cita.clientName} — ${cita.service.name} — ${fechaStr} ${horaStr} fue cancelada`,
      },
      [AppointmentStatus.COMPLETED]: {
        title: `Cita completada — ${cita.clientName}`,
        message: `✅ ${cita.clientName} completó su cita de ${cita.service.name} con ${profName}`,
      },
    };

    const notif = NOTIFS[status];
    if (notif) {
      await this.prisma.notificacion.create({
        data: { type: 'CITA_ESTADO', ...notif, tenantId },
      });
    }

    return updated;
  }

  async getCalendarLinks(id: string, tenantId: string) {
    const cita = await this.prisma.appointment.findFirst({
      where: { id, tenantId },
      include: { service: true, professional: true },
    });
    if (!cita) throw new NotFoundException('Cita no encontrada');

    const { title, description, endDateTime } = this._calendarData(cita);

    return {
      googleUrl: this.calendar.generateGoogleCalendarUrl({
        title,
        description,
        startDateTime: cita.date,
        endDateTime,
      }),
      outlookUrl: this.calendar.generateOutlookUrl({
        title,
        description,
        startDateTime: cita.date,
        endDateTime,
      }),
    };
  }

  async generateICS(id: string, tenantId: string): Promise<string> {
    const cita = await this.prisma.appointment.findFirst({
      where: { id, tenantId },
      include: { service: true, professional: true },
    });
    if (!cita) throw new NotFoundException('Cita no encontrada');

    const { title, description, endDateTime } = this._calendarData(cita);

    return this.calendar.generateICSFile({
      id: cita.id,
      title,
      description,
      startDateTime: cita.date,
      endDateTime,
    });
  }

  async crearCitaBot(dto: CrearCitaBotDto, tenantId: string) {
    const services = await this.prisma.service.findMany({
      where: { tenantId, active: true },
    });
    const service = services.find(
      (s) => s.name.toLowerCase() === dto.serviceName.toLowerCase(),
    );
    if (!service) {
      throw new NotFoundException(`Servicio "${dto.serviceName}" no encontrado`);
    }

    let professionalId: string | undefined;
    if (dto.professionalName) {
      const professionals = await this.prisma.professional.findMany({
        where: { tenantId, active: true },
      });
      const prof = professionals.find(
        (p) => p.name.toLowerCase() === dto.professionalName!.toLowerCase(),
      );
      if (!prof) {
        throw new NotFoundException(
          `Profesional "${dto.professionalName}" no encontrado`,
        );
      }
      professionalId = prof.id;
    }

    const appointmentDate = new Date(dto.date);
    const endTime = new Date(
      appointmentDate.getTime() + service.duration * 60_000,
    );

    if (professionalId) {
      const conflict = await this.prisma.appointment.findFirst({
        where: {
          tenantId,
          professionalId,
          status: { notIn: [AppointmentStatus.CANCELLED] },
          date: { gte: appointmentDate, lt: endTime },
        },
      });
      if (conflict) {
        throw new BadRequestException(
          'El profesional ya tiene una cita en ese horario',
        );
      }
    }

    const cita = await this.prisma.appointment.create({
      data: {
        clientName: dto.clientName,
        clientPhone: dto.clientPhone,
        date: appointmentDate,
        notes: dto.notes,
        tenantId,
        serviceId: service.id,
        ...(professionalId && { professionalId }),
      },
      include: { service: true, professional: true },
    });

    const { title, description, endDateTime } = this._calendarData(cita);

    const calendarLinks = {
      googleUrl: this.calendar.generateGoogleCalendarUrl({
        title,
        description,
        startDateTime: cita.date,
        endDateTime,
      }),
      outlookUrl: this.calendar.generateOutlookUrl({
        title,
        description,
        startDateTime: cita.date,
        endDateTime,
      }),
    };

    return { ...cita, calendarLinks };
  }

  async cancelarCita(id: string, clientPhone: string, tenantId: string) {
    const cita = await this.prisma.appointment.findFirst({
      where: { id, tenantId },
    });
    if (!cita) throw new NotFoundException('Cita no encontrada');

    const clean = clientPhone.replace('whatsapp:', '').trim();
    if (!cita.clientPhone.includes(clean)) {
      throw new ForbiddenException('No tienes permiso para cancelar esta cita');
    }

    return this.prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.CANCELLED },
      include: { service: true, professional: true },
    });
  }

  async exportarCsv(tenantId: string): Promise<string> {
    const citas = await this.prisma.appointment.findMany({
      where: { tenantId },
      include: { service: true, professional: true },
      orderBy: { date: 'asc' },
    });

    const escape = (v: string | null | undefined) => {
      const s = String(v ?? '');
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };

    const header = 'Cliente,Telefono,Servicio,Profesional,Fecha,Estado';
    const rows = citas.map((c) =>
      [
        escape(c.clientName),
        escape(c.clientPhone),
        escape(c.service.name),
        escape(c.professional?.name ?? ''),
        escape(c.date.toISOString()),
        escape(c.status),
      ].join(','),
    );

    return [header, ...rows].join('\n');
  }

  async citasCliente(phone: string, tenantId: string) {
    const clean = phone.replace('whatsapp:', '').trim();
    return this.prisma.appointment.findMany({
      where: {
        tenantId,
        clientPhone: { contains: clean },
        status: {
          notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.COMPLETED],
        },
        date: { gte: new Date() },
      },
      include: { service: true, professional: true },
      orderBy: { date: 'asc' },
    });
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private _calendarData(cita: {
    date: Date;
    service: { name: string; duration: number };
    clientName: string;
    professional?: { name: string } | null;
  }) {
    const endDateTime = new Date(
      cita.date.getTime() + cita.service.duration * 60_000,
    );
    const title = cita.service.name;
    const description = [
      `Paciente/Cliente: ${cita.clientName}`,
      cita.professional ? `Profesional: ${cita.professional.name}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    return { title, description, endDateTime };
  }

  private _generateSlots(
    startTime: string,
    endTime: string,
    booked: Array<{ date: Date; service: { duration: number } }>,
  ): string[] {
    const toMinutes = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const startMin = toMinutes(startTime);
    const endMin = toMinutes(endTime);

    const slots: string[] = [];
    for (let min = startMin; min < endMin; min += 30) {
      const h = String(Math.floor(min / 60)).padStart(2, '0');
      const m = String(min % 60).padStart(2, '0');

      const occupied = booked.some((a) => {
        // DB stores UTC; convert to Colombia (UTC-5) before comparing with local slot times
        const aMin = ((a.date.getUTCHours() - 5 + 24) % 24) * 60 + a.date.getUTCMinutes();
        return min >= aMin && min < aMin + a.service.duration;
      });

      if (!occupied) slots.push(`${h}:${m}`);
    }
    return slots;
  }
}
