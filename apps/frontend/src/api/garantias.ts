import api from './axios';

export interface Garantia {
  id: string;
  tenantId: string;
  clienteNombre: string;
  clientePhone: string;
  producto: string;
  numeroSerie?: string;
  fechaCompra: string;
  mesesGarantia: number;
  fechaVencimiento: string;
  notas?: string;
  ticketId?: string;
  createdAt: string;
}

export const getGarantias = (): Promise<Garantia[]> =>
  api.get('/garantias').then((r) => r.data);

export const createGarantia = (data: {
  clienteNombre: string;
  clientePhone: string;
  producto: string;
  numeroSerie?: string;
  fechaCompra: string;
  mesesGarantia?: number;
  notas?: string;
  ticketId?: string;
}): Promise<Garantia> => api.post('/garantias', data).then((r) => r.data);

export const deleteGarantia = (id: string): Promise<void> =>
  api.delete(`/garantias/${id}`).then((r) => r.data);

export const getAlertasGarantia = (): Promise<Garantia[]> =>
  api.get('/garantias/alertas').then((r) => r.data);
