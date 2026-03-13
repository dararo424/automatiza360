import api from './axios';

export interface TransaccionData {
  publicKey: string;
  referencia: string;
  monto: number;
  moneda: string;
  firma: string;
  redirectUrl: string;
  customerEmail: string;
  plan: string;
}

export interface Subscripcion {
  subscriptionStatus: string;
  subscriptionPlan: string | null;
  subscriptionEndsAt: string | null;
  trialEndsAt: string | null;
}

export function crearTransaccion(plan: 'STARTER' | 'PRO' | 'BUSINESS'): Promise<TransaccionData> {
  return api.post('/payments/crear-transaccion', { plan }).then((r) => r.data);
}

export function getSubscripcion(): Promise<Subscripcion> {
  return api.get('/payments/subscripcion').then((r) => r.data);
}
