import api from './axios';

export interface Gasto {
  id: string;
  tenantId: string;
  descripcion: string;
  monto: number;
  categoria: string;
  fecha: string;
  notas?: string;
  createdAt: string;
}

export interface ResumenFinanciero {
  totalGastos: number;
  totalIngresos: number;
  ganancia: number;
  porCategoria: { categoria: string; total: number }[];
}

export const getGastos = (): Promise<Gasto[]> =>
  api.get('/gastos').then((r) => r.data);

export const createGasto = (data: {
  descripcion: string;
  monto: number;
  categoria: string;
  fecha?: string;
  notas?: string;
}): Promise<Gasto> => api.post('/gastos', data).then((r) => r.data);

export const deleteGasto = (id: string): Promise<void> =>
  api.delete(`/gastos/${id}`).then((r) => r.data);

export const getResumen = (): Promise<ResumenFinanciero> =>
  api.get('/gastos/resumen').then((r) => r.data);
