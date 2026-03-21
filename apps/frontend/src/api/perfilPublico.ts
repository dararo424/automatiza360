import api from './axios';

export interface PlatoMenu {
  nombre: string;
  descripcion?: string;
  precio: number;
}

export interface ServicioPublico {
  nombre: string;
  descripcion?: string;
  precio: number;
  duracion: number;
}

export interface PerfilPublico {
  nombre: string;
  industria: string;
  descripcion?: string;
  horario?: string;
  logoUrl?: string;
  direccion?: string;
  ciudad?: string;
  latitud?: number | null;
  longitud?: number | null;
  whatsappNumber?: string;
  menuHoy?: { platos: PlatoMenu[] };
  servicios?: ServicioPublico[];
}

export const getPerfilPublico = (slug: string): Promise<PerfilPublico> =>
  api.get(`/perfil-publico/${slug}`).then((r) => r.data);
