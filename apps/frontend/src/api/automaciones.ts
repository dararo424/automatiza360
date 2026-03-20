import api from './axios';

export interface AutomacionPaso {
  id?: string;
  orden: number;
  tipo: 'WAIT' | 'SEND_WHATSAPP';
  config: { days?: number; mensaje?: string };
}

export interface Automacion {
  id: string;
  nombre: string;
  trigger: string;
  activa: boolean;
  pasos: AutomacionPaso[];
  createdAt: string;
}

export const getAutomaciones = (): Promise<Automacion[]> =>
  api.get('/automaciones').then((r) => r.data);

export const createAutomacion = (data: {
  nombre: string;
  trigger: string;
  pasos: AutomacionPaso[];
}): Promise<Automacion> =>
  api.post('/automaciones', data).then((r) => r.data);

export const updateAutomacion = (
  id: string,
  data: { nombre?: string; activa?: boolean; pasos?: AutomacionPaso[] },
): Promise<Automacion> =>
  api.patch(`/automaciones/${id}`, data).then((r) => r.data);

export const deleteAutomacion = (id: string): Promise<void> =>
  api.delete(`/automaciones/${id}`).then((r) => r.data);

export const toggleAutomacion = (id: string): Promise<Automacion> =>
  api.patch(`/automaciones/${id}/toggle`).then((r) => r.data);
