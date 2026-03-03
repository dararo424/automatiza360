import api from './axios';
import type { ImportedProduct, Proveedor, ProveedorProducto } from '../types';

export function importarCatalogo(
  supplierName: string,
  products: ImportedProduct[],
): Promise<Proveedor> {
  return api
    .post('/proveedores/importar', { supplierName, products })
    .then((r) => r.data);
}

export function getProveedores(): Promise<Proveedor[]> {
  return api.get('/proveedores').then((r) => r.data);
}

export function getProductosProveedor(id: string): Promise<ProveedorProducto[]> {
  return api.get(`/proveedores/${id}/productos`).then((r) => r.data);
}

export function buscarProductos(
  q: string,
): Promise<{ propios: unknown[]; catalogo: unknown[] }> {
  return api.get('/proveedores/buscar', { params: { q } }).then((r) => r.data);
}
