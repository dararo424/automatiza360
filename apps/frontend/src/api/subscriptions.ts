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
