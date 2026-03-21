import api from './axios';

export interface OnboardingStatus {
  step: number;
  done: boolean;
}

export function getOnboardingStatus(): Promise<OnboardingStatus> {
  return api.get('/perfil/onboarding-status').then((r) => r.data);
}

export function updateOnboardingStep(step: number): Promise<OnboardingStatus> {
  return api.patch('/perfil/onboarding-step', { step }).then((r) => r.data);
}
