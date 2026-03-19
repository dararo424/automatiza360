import api from './axios';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export const getEquipo = (): Promise<TeamMember[]> =>
  api.get('/equipo').then((r) => r.data);

export const invitarUsuario = (data: {
  name: string;
  email: string;
  password: string;
  role: string;
}): Promise<TeamMember> => api.post('/equipo/invitar', data).then((r) => r.data);

export const cambiarRol = (id: string, role: string): Promise<void> =>
  api.patch(`/equipo/${id}/rol`, { role }).then((r) => r.data);

export const eliminarMiembro = (id: string): Promise<void> =>
  api.delete(`/equipo/${id}`).then((r) => r.data);
