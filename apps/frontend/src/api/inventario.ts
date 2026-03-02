import api from './axios';
import type { Producto } from '../types';

export function getAlertas(): Promise<Producto[]> {
  return api.get('/inventario/alertas').then((r) => r.data);
}

export function ajustarStock(
  id: string,
  dto: { cantidad: number; tipo: 'ENTRADA' | 'SALIDA' },
): Promise<Producto> {
  return api.patch(`/inventario/${id}/ajustar-stock`, dto).then((r) => r.data);
}
