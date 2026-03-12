import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CrearCitaBotDto } from './dto/crear-cita-bot.dto';

@Injectable()
export class CitasService {
  constructor(private readonly prisma: PrismaService) {}

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
        return { professionalId: prof.id, name: prof.name, available: false, reason: 'No trabaja este día' };
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

  async crearCitaBot(dto: CrearCitaBotDto, tenantId: string) {
    // Resolve service by name (case-insensitive)
    const services = await this.prisma.service.findMany({
      where: { tenantId, active: true },
    });
    const service = services.find(
      (s) => s.name.toLowerCase() === dto.serviceName.toLowerCase(),
    );
    if (!service) {
      throw new NotFoundException(
        `Servicio "${dto.serviceName}" no encontrado`,
      );
    }

    // Resolve professional by name if provided
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

    // Check for conflicts
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

    return this.prisma.appointment.create({
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

  async citasCliente(phone: string, tenantId: string) {
    const clean = phone.replace('whatsapp:', '').trim();
    return this.prisma.appointment.findMany({
      where: {
        tenantId,
        clientPhone: { contains: clean },
        status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.COMPLETED] },
        date: { gte: new Date() },
      },
      include: { service: true, professional: true },
      orderBy: { date: 'asc' },
    });
  }

  // ── Private helpers ───────────────────────────────────────────────────────

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
      const slotTime = `${h}:${m}`;

      const occupied = booked.some((a) => {
        const aMin = a.date.getUTCHours() * 60 + a.date.getUTCMinutes();
        return min >= aMin && min < aMin + a.service.duration;
      });

      if (!occupied) slots.push(slotTime);
    }
    return slots;
  }
}
