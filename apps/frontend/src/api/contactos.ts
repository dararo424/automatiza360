import api from './axios';

export interface Contacto {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  notes?: string;
  tags?: string;
  puntos: number;
  puntosUsados: number;
  createdAt: string;
  updatedAt: string;
}

export const getContactos = (search?: string): Promise<Contacto[]> =>
  api.get('/contactos', { params: search ? { search } : {} }).then((r) => r.data);

export const upsertContacto = (data: Partial<Contacto> & { phone: string }): Promise<Contacto> =>
  api.post('/contactos', data).then((r) => r.data);

export const actualizarContacto = (id: string, data: Partial<Contacto> & { phone: string }): Promise<Contacto> =>
  api.patch(`/contactos/${id}`, data).then((r) => r.data);

export const eliminarContacto = (id: string): Promise<void> =>
  api.delete(`/contactos/${id}`).then((r) => r.data);

export const canjearPuntos = (id: string, puntos: number): Promise<Contacto> =>
  api.post(`/contactos/${id}/canjear-puntos`, { puntos }).then((r) => r.data);
