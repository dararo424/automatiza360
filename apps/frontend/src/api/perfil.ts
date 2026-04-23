import api from './axios';

export interface PerfilTenant {
  id: string;
  name: string;
  slug: string;
  industry: string;
  descripcion?: string;
  horario?: string;
  logoUrl?: string;
  direccion?: string;
  ciudad?: string;
  latitud?: number | null;
  longitud?: number | null;
  ownerPhone?: string;
  botName?: string | null;
  botTone?: string;
}

export const getMiPerfil = (): Promise<PerfilTenant> =>
  api.get('/perfil').then((r) => r.data);

export const actualizarPerfil = (data: Partial<PerfilTenant>): Promise<PerfilTenant> =>
  api.patch('/perfil', data).then((r) => r.data);
