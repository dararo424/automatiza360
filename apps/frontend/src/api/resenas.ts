import api from './axios';

export interface Resena {
  id: string;
  tenantId: string;
  clientPhone: string;
  clientName?: string;
  rating: number;
  comentario?: string;
  tipo: string;
  referenciaId?: string;
  createdAt: string;
}

export interface ResenasStats {
  promedio: number;
  total: number;
  distribucion: { rating: number; count: number }[];
}

export function getResenas(): Promise<Resena[]> {
  return api.get('/resenas').then((r) => r.data);
}

export function getResenasStats(): Promise<ResenasStats> {
  return api.get('/resenas/stats').then((r) => r.data);
}
