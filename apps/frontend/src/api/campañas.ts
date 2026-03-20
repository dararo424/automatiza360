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
  api.get('/campanas').then((r) => r.data);

export const createCampaña = (data: { nombre: string; mensaje: string }): Promise<Campaña> =>
  api.post('/campanas', data).then((r) => r.data);

export const enviarCampaña = (id: string): Promise<Campaña> =>
  api.post(`/campanas/${id}/enviar`).then((r) => r.data);
