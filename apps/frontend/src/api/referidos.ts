import api from './axios';

export interface ReferralCode {
  id: string;
  code: string;
  tenantId: string;
  createdAt: string;
}

export interface Referral {
  id: string;
  referredTenantId: string;
  status: string;
  rewardGiven: boolean;
  createdAt: string;
}

export const getMiCodigo = (): Promise<ReferralCode> =>
  api.get('/referidos/mi-codigo').then((r) => r.data);

export const getReferrals = (): Promise<Referral[]> =>
  api.get('/referidos').then((r) => r.data);
