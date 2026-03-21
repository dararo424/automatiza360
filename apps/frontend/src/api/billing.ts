import api from './axios';

export interface PagoRegistro {
  id: string;
  tenantId: string;
  monto: number;
  plan: string;
  status: string;
  wompiRef?: string;
  wompiId?: string;
  descripcion?: string;
  createdAt: string;
}

export async function getPagos(): Promise<PagoRegistro[]> {
  const { data } = await api.get('/billing/pagos');
  return data;
}
