import api from './axios';

export interface PlatoMenuDia {
  id: string;
  name: string;
  description?: string;
  price: number;
  disponible: boolean;
  menuDiaId: string;
}

export interface MenuDia {
  id: string;
  fecha: string;
  activo: boolean;
  createdAt: string;
  tenantId: string;
  platos: PlatoMenuDia[];
}

export const getMenuHoy = (): Promise<MenuDia | null> =>
  api.get('/menu-dia/hoy').then((r) => r.data);

export const listarMenus = (): Promise<MenuDia[]> =>
  api.get('/menu-dia').then((r) => r.data);

export const crearMenu = (platos: { name: string; description?: string; price: number }[]): Promise<MenuDia> =>
  api.post('/menu-dia', { platos }).then((r) => r.data);

export const toggleMenuActivo = (id: string): Promise<MenuDia> =>
  api.patch(`/menu-dia/${id}/toggle`).then((r) => r.data);

export const eliminarMenu = (id: string): Promise<void> =>
  api.delete(`/menu-dia/${id}`).then((r) => r.data);

export const togglePlato = (platoId: string): Promise<PlatoMenuDia> =>
  api.patch(`/menu-dia/plato/${platoId}/toggle`).then((r) => r.data);
