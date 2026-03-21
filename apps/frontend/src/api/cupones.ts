import api from './axios';

export interface Cupon {
  id: string;
  codigo: string;
  tipo: 'PORCENTAJE' | 'VALOR_FIJO';
  valor: number;
  minCompra: number;
  maxUsos: number | null;
  usosActuales: number;
  activo: boolean;
  fechaVencimiento: string | null;
  createdAt: string;
}

export interface CrearCuponPayload {
  codigo: string;
  tipo: 'PORCENTAJE' | 'VALOR_FIJO';
  valor: number;
  minCompra?: number;
  maxUsos?: number;
  fechaVencimiento?: string;
}

export interface ValidarCuponResult {
  valido: boolean;
  tipo?: string;
  valor?: number;
  descuento?: number;
  mensaje?: string;
}

export const getCupones = (): Promise<Cupon[]> =>
  api.get('/cupones').then((r) => r.data);

export const createCupon = (data: CrearCuponPayload): Promise<Cupon> =>
  api.post('/cupones', data).then((r) => r.data);

export const toggleCupon = (id: string): Promise<Cupon> =>
  api.patch(`/cupones/${id}/toggle`).then((r) => r.data);

export const deleteCupon = (id: string): Promise<void> =>
  api.delete(`/cupones/${id}`).then((r) => r.data);

export const validarCupon = (
  codigo: string,
  monto: number,
): Promise<ValidarCuponResult> =>
  api.post('/cupones/validar', { codigo, monto }).then((r) => r.data);
