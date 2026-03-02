import api from './axios';
import type { UserProfile } from '../types';

export interface LoginResponse {
  token: string;
}

export function login(email: string, password: string): Promise<LoginResponse> {
  return api.post('/auth/login', { email, password }).then((r) => r.data);
}

export function getPerfil(): Promise<UserProfile> {
  return api.get('/auth/perfil').then((r) => r.data);
}
