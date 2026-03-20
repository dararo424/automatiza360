import api from './axios';

export interface Proveedor {
  id: string;
  nombre: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  notas?: string;
  createdAt: string;
}

export interface OrdenCompraItem {
  id: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
}

export interface OrdenCompra {
  id: string;
  proveedorId: string;
  proveedor?: { nombre: string };
  status: 'PENDIENTE' | 'RECIBIDA' | 'CANCELADA';
  total: number;
  notas?: string;
  esperadaAt?: string;
  recibidaAt?: string;
  createdAt: string;
  items: OrdenCompraItem[];
}

// Proveedores
export function getProveedores(): Promise<Proveedor[]> {
  return api.get('/compras/proveedores').then((r) => r.data);
}

export function crearProveedor(data: Omit<Proveedor, 'id' | 'createdAt'>): Promise<Proveedor> {
  return api.post('/compras/proveedores', data).then((r) => r.data);
}

export function actualizarProveedor(id: string, data: Partial<Proveedor>): Promise<Proveedor> {
  return api.patch(`/compras/proveedores/${id}`, data).then((r) => r.data);
}

export function eliminarProveedor(id: string): Promise<void> {
  return api.delete(`/compras/proveedores/${id}`).then((r) => r.data);
}

// Órdenes de compra
export function getOrdenesCompra(): Promise<OrdenCompra[]> {
  return api.get('/compras/ordenes').then((r) => r.data);
}

export function crearOrdenCompra(data: {
  proveedorId: string;
  items: { nombre: string; cantidad: number; precioUnitario: number }[];
  notas?: string;
  esperadaAt?: string;
}): Promise<OrdenCompra> {
  return api.post('/compras/ordenes', data).then((r) => r.data);
}

export function recibirOrdenCompra(id: string): Promise<OrdenCompra> {
  return api.patch(`/compras/ordenes/${id}/recibir`).then((r) => r.data);
}
