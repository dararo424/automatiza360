import api from './axios';
import axios from 'axios';

export interface MenuPublico {
  tenant: { name: string; industry: string };
  menu: {
    id: string;
    fecha: string;
    activo: boolean;
    platos: {
      id: string;
      name: string;
      description?: string;
      price: number;
      disponible: boolean;
    }[];
  } | null;
}

export interface QrConfig {
  tenantSlug: string;
  publicUrl: string;
}

export const getMenuPublico = (slug: string): Promise<MenuPublico> =>
  axios.get(`${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/menu-publico/${slug}`).then((r) => r.data);

export const getQrConfig = (): Promise<QrConfig> =>
  api.get('/menu-dia/qr-config').then((r) => r.data);
