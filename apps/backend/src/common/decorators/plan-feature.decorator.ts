import { SetMetadata } from '@nestjs/common';

export type PlanFeature = 'API_KEYS' | 'TEAM_SIZE';
export const PLAN_FEATURE_KEY = 'planFeature';
export const RequiresPlanFeature = (feature: PlanFeature) => SetMetadata(PLAN_FEATURE_KEY, feature);
