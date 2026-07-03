import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CitasService } from './citas.service';
import { PrismaService } from '../prisma/prisma.service';
import { CalendarService } from '../calendar/calendar.service';
import { AutomacionesService } from '../automaciones/automaciones.service';
import { PushService } from '../push/push.service';
import { FlujoService } from '../flujos/flujos.service';

const mockPrisma = {
  service: { findMany: jest.fn() },
  professional: { findMany: jest.fn() },
  appointment: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
  notificacion: { create: jest.fn().mockResolvedValue({}) },
};

const mockCalendar = { crearEvento: jest.fn() };
const mockAutomaciones = { dispararTrigger: jest.fn().mockResolvedValue(undefined) };
const mockPush = { sendToTenant: jest.fn().mockResolvedValue(undefined) };
const mockFlujos = { assertFlujoActivo: jest.fn().mockResolvedValue(undefined) };

const TENANT_ID = 'tenant-1';

describe('CitasService', () => {
  let service: CitasService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        CitasService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CalendarService, useValue: mockCalendar },
        { provide: AutomacionesService, useValue: mockAutomaciones },
        { provide: PushService, useValue: mockPush },
        { provide: FlujoService, useValue: mockFlujos },
      ],
    }).compile();
    service = module.get<CitasService>(CitasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ──────────────────────────────────────────────
  // listarServicios
  // ──────────────────────────────────────────────

  describe('listarServicios', () => {
    it('solo retorna servicios activos del tenant', async () => {
      const fakeServices = [{ id: 's1', name: 'Corte', active: true, tenantId: TENANT_ID }];
      mockPrisma.service.findMany.mockResolvedValue(fakeServices);

      const result = await service.listarServicios(TENANT_ID);
      expect(result).toEqual(fakeServices);
      expect(mockPrisma.service.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: TENANT_ID, active: true } }),
      );
    });
  });

  // ──────────────────────────────────────────────
  // listarProfesionales
  // ──────────────────────────────────────────────

  describe('listarProfesionales', () => {
    it('incluye los horarios de cada profesional', async () => {
      mockPrisma.professional.findMany.mockResolvedValue([
        { id: 'p1', name: 'Dr. García', schedules: [{ dayOfWeek: 1, startTime: '08:00', endTime: '17:00' }] },
      ]);

      const result = await service.listarProfesionales(TENANT_ID);
      expect(result[0].schedules).toHaveLength(1);
      expect(mockPrisma.professional.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ include: { schedules: true } }),
      );
    });
  });

  // ──────────────────────────────────────────────
  // getCitasDelMes
  // ──────────────────────────────────────────────

  describe('getCitasDelMes', () => {
    it('retorna conteos por día y lista de citas del mes', async () => {
      const fakeDate = new Date('2026-04-15T10:00:00Z');
      mockPrisma.appointment.findMany.mockResolvedValue([
        { id: 'a1', date: fakeDate, service: {}, professional: {} },
        { id: 'a2', date: fakeDate, service: {}, professional: {} },
      ]);

      const result = await service.getCitasDelMes(TENANT_ID, 2026, 4);
      expect(result.counts['2026-04-15']).toBe(2);
      expect(result.appointments).toHaveLength(2);
    });

    it('consulta el rango correcto del mes', async () => {
      mockPrisma.appointment.findMany.mockResolvedValue([]);
      await service.getCitasDelMes(TENANT_ID, 2026, 4);

      const call = mockPrisma.appointment.findMany.mock.calls[0][0];
      expect(call.where.date.gte).toEqual(new Date('2026-04-01T00:00:00.000Z'));
      expect(call.where.date.lt).toEqual(new Date('2026-05-01T00:00:00.000Z'));
    });
  });

  // ──────────────────────────────────────────────
  // getCitasDelDia
  // ──────────────────────────────────────────────

  describe('getCitasDelDia', () => {
    it('filtra citas al rango del día indicado', async () => {
      mockPrisma.appointment.findMany.mockResolvedValue([]);
      await service.getCitasDelDia(TENANT_ID, '2026-04-15');

      const call = mockPrisma.appointment.findMany.mock.calls[0][0];
      expect(call.where.date.gte).toEqual(new Date('2026-04-15T00:00:00.000Z'));
      expect(call.where.date.lt).toEqual(new Date('2026-04-15T23:59:59.999Z'));
    });
  });

  // ──────────────────────────────────────────────
  // actualizarEstado
  // ──────────────────────────────────────────────

  describe('actualizarEstado', () => {
    const fakeCita = {
      id: 'a1',
      tenantId: TENANT_ID,
      clientName: 'María',
      clientPhone: '+57300',
      date: new Date('2026-04-20T09:00:00Z'),
      service: { name: 'Consulta', duration: 30 },
      professional: { name: 'Dr. García' },
    };

    it('lanza NotFoundException si la cita no existe', async () => {
      mockPrisma.appointment.findFirst.mockResolvedValue(null);
      await expect(
        service.actualizarEstado('no-existe', 'CONFIRMED' as any, TENANT_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('actualiza el estado y crea notificación para CONFIRMED', async () => {
      mockPrisma.appointment.findFirst.mockResolvedValue(fakeCita);
      mockPrisma.appointment.update.mockResolvedValue({ ...fakeCita, status: 'CONFIRMED', service: fakeCita.service, professional: fakeCita.professional });

      await service.actualizarEstado('a1', 'CONFIRMED' as any, TENANT_ID);

      expect(mockPrisma.appointment.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'CONFIRMED' } }),
      );
      expect(mockPrisma.notificacion.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ type: 'CITA_ESTADO' }) }),
      );
    });

    it('dispara automatización APPOINTMENT_COMPLETED al completar', async () => {
      mockPrisma.appointment.findFirst.mockResolvedValue(fakeCita);
      mockPrisma.appointment.update.mockResolvedValue({ ...fakeCita, status: 'COMPLETED', service: fakeCita.service, professional: fakeCita.professional });

      await service.actualizarEstado('a1', 'COMPLETED' as any, TENANT_ID);

      // La automatización se dispara async (fire-and-forget), esperamos que se llame
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(mockAutomaciones.dispararTrigger).toHaveBeenCalledWith(
        TENANT_ID,
        'APPOINTMENT_COMPLETED',
        fakeCita.clientPhone,
        fakeCita.clientName,
        expect.any(Object),
      );
    });

    it('no crea notificación para estados sin plantilla (SCHEDULED)', async () => {
      mockPrisma.appointment.findFirst.mockResolvedValue(fakeCita);
      mockPrisma.appointment.update.mockResolvedValue({ ...fakeCita, status: 'SCHEDULED', service: fakeCita.service, professional: fakeCita.professional });

      await service.actualizarEstado('a1', 'SCHEDULED' as any, TENANT_ID);
      expect(mockPrisma.notificacion.create).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────
  // consultarDisponibilidad
  // ──────────────────────────────────────────────

  describe('consultarDisponibilidad', () => {
    it('retorna available: false si el profesional no trabaja ese día', async () => {
      mockPrisma.professional.findMany.mockResolvedValue([
        { id: 'p1', name: 'Dr. García', specialty: 'General', schedules: [], appointments: [] },
      ]);

      const result = await service.consultarDisponibilidad(TENANT_ID, '2026-04-15');
      expect(result[0].available).toBe(false);
      expect(result[0].reason).toContain('No trabaja');
    });

    it('genera slots disponibles cuando hay horario configurado', async () => {
      mockPrisma.professional.findMany.mockResolvedValue([
        {
          id: 'p1', name: 'Dr. García', specialty: 'General',
          schedules: [{ dayOfWeek: 2, startTime: '08:00', endTime: '09:00' }],
          appointments: [],
        },
      ]);

      // 2026-04-14 es martes (dayOfWeek=2)
      const result = await service.consultarDisponibilidad(TENANT_ID, '2026-04-14');
      expect(result[0]).toHaveProperty('availableSlots');
      expect(Array.isArray(result[0].availableSlots)).toBe(true);
    });
  });
});
