import api from './axios';

export type RolNotificado = 'VENDEDOR' | 'OWNER' | 'MANAGER';

export interface NotificadoVentas {
  id: string;
  name: string;
  phone: string;
  rol: RolNotificado;
  resumenMatinal: boolean;
  resumenCierre: boolean;
  notifInstantanea: boolean;
  montoMinimo: number | null;
  active: boolean;
  createdAt: string;
}

export interface CrearNotificadoVentasDto {
  name: string;
  phone: string;
  rol?: RolNotificado;
  resumenMatinal?: boolean;
  resumenCierre?: boolean;
  notifInstantanea?: boolean;
  montoMinimo?: number;
}

export const listNotificadosVentas = (): Promise<NotificadoVentas[]> =>
  api.get('/notificados-ventas').then((r) => r.data);

export const crearNotificadoVentas = (
  dto: CrearNotificadoVentasDto,
): Promise<NotificadoVentas> =>
  api.post('/notificados-ventas', dto).then((r) => r.data);

export const actualizarNotificadoVentas = (
  id: string,
  dto: Partial<CrearNotificadoVentasDto> & { active?: boolean },
): Promise<NotificadoVentas> =>
  api.patch(`/notificados-ventas/${id}`, dto).then((r) => r.data);

export const eliminarNotificadoVentas = (id: string): Promise<{ ok: boolean }> =>
  api.delete(`/notificados-ventas/${id}`).then((r) => r.data);

export const probarNotificadoVentas = (
  id: string,
): Promise<{ ok: boolean; reason?: string }> =>
  api.post(`/notificados-ventas/${id}/probar`).then((r) => r.data);
