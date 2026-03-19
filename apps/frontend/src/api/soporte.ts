import api from './axios';

export interface MensajeSoporte {
  role: 'user' | 'assistant';
  content: string;
}

export interface RespuestaSoporte {
  respuesta: string;
  resolved: boolean;
}

export function enviarMensajeSoporte(
  mensaje: string,
  historial: MensajeSoporte[],
): Promise<RespuestaSoporte> {
  return api.post('/soporte/mensaje', { mensaje, historial }).then((r) => r.data);
}
