import api from './axios';

export interface NpsStats {
  npsScore: number;
  promotores: number;
  neutrales: number;
  detractores: number;
  total: number;
  promedio: number;
  ultimas: NpsRespuesta[];
}

export interface NpsRespuesta {
  id: string;
  tenantId: string;
  clientPhone: string;
  score: number;
  comentario?: string;
  tipo: string;
  referenciaId?: string;
  createdAt: string;
}

export function getNpsStats(): Promise<NpsStats> {
  return api.get('/nps/stats').then((r) => r.data);
}
