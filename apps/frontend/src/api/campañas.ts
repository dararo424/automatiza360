import api from './axios';

export interface Campaña {
  id: string;
  tenantId: string;
  nombre: string;
  mensaje: string;
  status: 'BORRADOR' | 'ENVIANDO' | 'ENVIADA' | 'ERROR';
  totalEnviado: number;
  enviadaAt?: string;
  createdAt: string;
}

export const getCampañas = (): Promise<Campaña[]> =>
  api.get('/campañas').then((r) => r.data);

export const createCampaña = (data: { nombre: string; mensaje: string }): Promise<Campaña> =>
  api.post('/campañas', data).then((r) => r.data);

export const enviarCampaña = (id: string): Promise<Campaña> =>
  api.post(`/campañas/${id}/enviar`).then((r) => r.data);
