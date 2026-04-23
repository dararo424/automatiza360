import api from './axios';

export interface FiltrosCampaña {
  tags?: string[];
  minPuntos?: number;
  diasSinComprar?: number;
  diasDesdeUltimaCompra?: number;
}

export interface Campaña {
  id: string;
  tenantId: string;
  nombre: string;
  mensaje: string;
  filtros?: FiltrosCampaña;
  status: 'BORRADOR' | 'ENVIANDO' | 'ENVIADA' | 'ERROR';
  totalEnviado: number;
  enviadaAt?: string;
  createdAt: string;
}

export const getCampañas = (): Promise<Campaña[]> =>
  api.get('/campanas').then((r) => r.data);

export const createCampaña = (data: { nombre: string; mensaje: string; filtros?: FiltrosCampaña }): Promise<Campaña> =>
  api.post('/campanas', data).then((r) => r.data);

export const previewCampaña = (filtros?: FiltrosCampaña): Promise<{ total: number }> =>
  api.post('/campanas/preview', { filtros }).then((r) => r.data);

export const enviarCampaña = (id: string): Promise<Campaña> =>
  api.post(`/campanas/${id}/enviar`).then((r) => r.data);
