import api from './axios';
import type { Orden, OrderStatus } from '../types';

export function getOrdenes(estado?: OrderStatus): Promise<Orden[]> {
  return api.get('/ordenes', { params: estado ? { estado } : {} }).then((r) => r.data);
}

export function getOrden(id: string): Promise<Orden> {
  return api.get(`/ordenes/${id}`).then((r) => r.data);
}

export function crearOrden(dto: {
  phone?: string;
  notes?: string;
  items: { name: string; price: number; quantity: number }[];
}): Promise<Orden> {
  return api.post('/ordenes', dto).then((r) => r.data);
}

export function cambiarEstadoOrden(id: string, estado: OrderStatus): Promise<Orden> {
  return api.patch(`/ordenes/${id}/estado`, { estado }).then((r) => r.data);
}

export const getLinkPago = (id: string): Promise<{ url: string }> =>
  api.get(`/ordenes/${id}/link-pago`).then((r) => r.data);

export type EnviarLinkResult =
  | { ok: true; url: string; sentTo: string }
  | { ok: false; reason: string };

export const enviarLinkPagoWhatsApp = (id: string): Promise<EnviarLinkResult> =>
  api.post(`/ordenes/${id}/enviar-link-pago`).then((r) => r.data);
