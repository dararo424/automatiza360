import api from './axios';
import type { Industry, UserProfile } from '../types';

export interface LoginResponse {
  token: string;
}

export interface RegistroPayload {
  businessName: string;
  ownerName: string;
  ownerPhone: string;
  industry: Industry;
  email: string;
  password: string;
}

export interface RegistroResponse {
  token: string;
  tenant: { id: string; name: string; slug: string; industry: Industry };
  trialEndsAt: string;
  setupInstructions: string;
  sandboxMode: boolean;
  sandboxWord?: string;
  twilioNumber: string | null;
}

export function login(email: string, password: string): Promise<LoginResponse> {
  return api.post('/auth/login', { email, password }).then((r) => r.data);
}

export function registro(payload: RegistroPayload): Promise<RegistroResponse> {
  return api.post('/auth/registro', payload).then((r) => r.data);
}

export function getPerfil(): Promise<UserProfile> {
  return api.get('/auth/perfil').then((r) => r.data);
}
