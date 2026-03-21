import api from './axios';

export interface Flujo {
  id: string;
  nombre: string;
  descripcion: string;
  emoji: string;
  industrias: string[];
}

export interface FlujoInfo {
  disponibles: Flujo[];
  activos: string[];
  limite: number;
  plan: string;
}

export async function getFlujos(): Promise<FlujoInfo> {
  const { data } = await api.get('/flujos');
  return data;
}

export async function updateFlujos(flujos: string[]): Promise<{ activos: string[]; limite: number; plan: string }> {
  const { data } = await api.patch('/flujos', { flujos });
  return data;
}
