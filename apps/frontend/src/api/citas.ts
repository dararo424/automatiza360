import api from './axios';
import type { Cita, AppointmentStatus, CalendarLinks } from '../types';

export interface CitasDelMes {
  counts: Record<string, number>;
  appointments: Cita[];
}

export function getCitasDelMes(year: number, month: number): Promise<CitasDelMes> {
  return api.get('/citas/mes', { params: { year, month } }).then((r) => r.data);
}

export function getCitasDelDia(date: string): Promise<Cita[]> {
  return api.get('/citas/dia', { params: { date } }).then((r) => r.data);
}

export function actualizarEstadoCita(
  id: string,
  status: AppointmentStatus,
): Promise<Cita> {
  return api.put(`/citas/${id}/estado`, { status }).then((r) => r.data);
}

export function getCalendarLinks(id: string): Promise<CalendarLinks> {
  return api.get(`/citas/${id}/calendar-link`).then((r) => r.data);
}

export function getCalendarICSUrl(id: string): string {
  const base = api.defaults.baseURL ?? '/api';
  const token = localStorage.getItem('token') ?? '';
  // Build URL — the ICS endpoint needs auth, so we append the token
  // as a query param isn't standard. We'll trigger a fetch instead.
  return `${base}/citas/${id}/calendar.ics?token=${token}`;
}

export async function downloadICS(id: string): Promise<void> {
  const response = await api.get(`/citas/${id}/calendar.ics`, {
    responseType: 'blob',
  });
  const url = URL.createObjectURL(new Blob([response.data], { type: 'text/calendar' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cita.ics';
  a.click();
  URL.revokeObjectURL(url);
}
