import api from './axios';
import type { Producto } from '../types';

export function getProductos(): Promise<Producto[]> {
  return api.get('/productos').then((r) => r.data);
}

export function crearProducto(dto: Partial<Producto>): Promise<Producto> {
  return api.post('/productos', dto).then((r) => r.data);
}

export function actualizarProducto(id: string, dto: Partial<Producto>): Promise<Producto> {
  return api.patch(`/productos/${id}`, dto).then((r) => r.data);
}

export function eliminarProducto(id: string): Promise<void> {
  return api.delete(`/productos/${id}`).then((r) => r.data);
}
