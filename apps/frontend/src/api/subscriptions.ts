import api from './axios';
import type { TrialInfo } from '../types';

export function getTrialInfo(): Promise<TrialInfo> {
  return api.get('/subscriptions/trial-info').then((r) => r.data);
}
