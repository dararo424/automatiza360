import api from './axios';
import type { Cotizacion, CotizacionStatus } from '../types';

export function getCotizaciones(estado?: CotizacionStatus): Promise<Cotizacion[]> {
  return api.get('/cotizaciones', { params: estado ? { estado } : {} }).then((r) => r.data);
}

export function crearCotizacion(dto: {
  clientName: string;
  clientPhone?: string;
  notes?: string;
  validUntil?: string;
  items: { name: string; price: number; quantity: number }[];
}): Promise<Cotizacion> {
  return api.post('/cotizaciones', dto).then((r) => r.data);
}

export function cambiarEstadoCotizacion(
  id: string,
  estado: CotizacionStatus,
): Promise<Cotizacion> {
  return api.patch(`/cotizaciones/${id}/estado`, { estado }).then((r) => r.data);
}

export function eliminarCotizacion(id: string): Promise<void> {
  return api.delete(`/cotizaciones/${id}`).then((r) => r.data);
}
