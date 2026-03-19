import api from './axios';

export interface Contacto {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  notes?: string;
  tags?: string;
  createdAt: string;
  updatedAt: string;
}

export const getContactos = (search?: string): Promise<Contacto[]> =>
  api.get('/contactos', { params: search ? { search } : {} }).then((r) => r.data);

export const upsertContacto = (data: Partial<Contacto> & { phone: string }): Promise<Contacto> =>
  api.post('/contactos', data).then((r) => r.data);

export const eliminarContacto = (id: string): Promise<void> =>
  api.delete(`/contactos/${id}`).then((r) => r.data);
