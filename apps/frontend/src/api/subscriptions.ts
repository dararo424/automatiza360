import api from './axios';
import type { TrialInfo } from '../types';

export interface PlanInfo {
  plan: string;
  status: string;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  daysRemaining: number;
  conversations: { used: number; limit: number | null };
  features: { apiKeys: boolean; teamSize: number | null; conversationLimit: number | null };
}

export function getTrialInfo(): Promise<TrialInfo> {
  return api.get('/subscriptions/trial-info').then((r) => r.data);
}

export function getPlanInfo(): Promise<PlanInfo> {
  return api.get('/subscriptions/plan-info').then((r) => r.data);
}

export function iniciarUpgrade(plan: string): Promise<{ url: string; referencia: string }> {
  return api.post('/subscriptions/upgrade', { plan }).then((r) => r.data);
}

export function cancelarSuscripcion(): Promise<{ status: string; message: string }> {
  return api.post('/subscriptions/cancelar').then((r) => r.data);
}

export function reactivarSuscripcion(): Promise<{ status: string; message: string }> {
  return api.post('/subscriptions/reactivar').then((r) => r.data);
}
