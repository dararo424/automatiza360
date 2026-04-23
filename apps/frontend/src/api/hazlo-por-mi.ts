import api from './axios';

export interface HazloRequest {
  id: string;
  descripcion: string;
  status: string;
  createdAt: string;
}

export const crearSolicitudHazlo = (descripcion: string): Promise<{ id: string; status: string }> =>
  api.post('/hazlo-por-mi', { descripcion }).then((r) => r.data);

export const getMisSolicitudesHazlo = (): Promise<HazloRequest[]> =>
  api.get('/hazlo-por-mi').then((r) => r.data);
