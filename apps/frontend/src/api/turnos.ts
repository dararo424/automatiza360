import api from './axios';

export interface TurnoUser {
  id: string;
  name: string;
  role: string;
}

export interface Turno {
  id: string;
  userId: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  notas?: string;
  createdAt: string;
  user: TurnoUser;
}

export interface TurnosSemana {
  semanaInicio: string;
  semanaFin: string;
  turnos: Turno[];
}

export function getTurnosSemana(semana?: string): Promise<TurnosSemana> {
  const params = semana ? `?semana=${semana}` : '';
  return api.get(`/turnos${params}`).then((r) => r.data);
}

export function crearTurno(data: {
  userId: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  notas?: string;
}): Promise<Turno> {
  return api.post('/turnos', data).then((r) => r.data);
}

export function eliminarTurno(id: string): Promise<void> {
  return api.delete(`/turnos/${id}`).then((r) => r.data);
}
