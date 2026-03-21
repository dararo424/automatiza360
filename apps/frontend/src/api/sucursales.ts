import api from './axios';

export interface Sucursal {
  id: string;
  tenantId: string;
  nombre: string;
  direccion?: string;
  ciudad?: string;
  telefono?: string;
  twilioNumber?: string;
  activa: boolean;
  createdAt: string;
}

export interface CrearSucursalPayload {
  nombre: string;
  direccion?: string;
  ciudad?: string;
  telefono?: string;
  twilioNumber?: string;
  activa?: boolean;
}

export function getSucursales(): Promise<Sucursal[]> {
  return api.get('/sucursales').then((r) => r.data);
}

export function crearSucursal(data: CrearSucursalPayload): Promise<Sucursal> {
  return api.post('/sucursales', data).then((r) => r.data);
}

export function actualizarSucursal(id: string, data: CrearSucursalPayload): Promise<Sucursal> {
  return api.patch(`/sucursales/${id}`, data).then((r) => r.data);
}

export function eliminarSucursal(id: string): Promise<{ message: string }> {
  return api.delete(`/sucursales/${id}`).then((r) => r.data);
}
