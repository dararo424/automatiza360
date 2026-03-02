import api from './axios';
import type { Ticket, TicketStatus } from '../types';

export function getTickets(estado?: TicketStatus): Promise<Ticket[]> {
  return api.get('/tickets', { params: estado ? { estado } : {} }).then((r) => r.data);
}

export function getTicket(id: string): Promise<Ticket> {
  return api.get(`/tickets/${id}`).then((r) => r.data);
}

export function crearTicket(dto: {
  clientName: string;
  clientPhone: string;
  device: string;
  issue: string;
}): Promise<Ticket> {
  return api.post('/tickets', dto).then((r) => r.data);
}

export function actualizarTicket(
  id: string,
  dto: { diagnosis?: string; price?: number },
): Promise<Ticket> {
  return api.patch(`/tickets/${id}`, dto).then((r) => r.data);
}

export function cambiarEstadoTicket(id: string, estado: TicketStatus): Promise<Ticket> {
  return api.patch(`/tickets/${id}/estado`, { estado }).then((r) => r.data);
}
