import api from './axios';
import type { Notificacion } from '../types';

export function getNotificaciones(leidas?: boolean): Promise<Notificacion[]> {
  return api
    .get('/notificaciones', { params: leidas !== undefined ? { leidas } : {} })
    .then((r) => r.data);
}

export function marcarLeida(id: string): Promise<Notificacion> {
  return api.patch(`/notificaciones/${id}/marcar-leida`).then((r) => r.data);
}

export function marcarTodasLeidas(): Promise<void> {
  return api.patch('/notificaciones/leer-todas').then((r) => r.data);
}
