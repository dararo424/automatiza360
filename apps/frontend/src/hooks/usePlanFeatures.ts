import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getPlanInfo } from '../api/subscriptions';

export interface PlanFeatures {
  plan: string;
  canUseApiKeys: boolean;
  canUseConversaciones: boolean;
  canUseCampanas: boolean;
  conversationLimit: number | null;
  agentLimit: number | null;
  isLoading: boolean;
}

export function usePlanFeatures(): PlanFeatures {
  const { user } = useAuth();
  const plan = user?.tenant?.subscriptionPlan || user?.tenant?.plan || 'STARTER';

  const { data, isLoading } = useQuery({
    queryKey: ['plan-info'],
    queryFn: getPlanInfo,
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const resolvedPlan = data?.plan ?? plan;

  return {
    plan: resolvedPlan,
    canUseApiKeys: resolvedPlan === 'BUSINESS',
    canUseConversaciones: true,
    canUseCampanas: resolvedPlan === 'PRO' || resolvedPlan === 'BUSINESS',
    conversationLimit: resolvedPlan === 'STARTER' ? 500 : resolvedPlan === 'PRO' ? 2000 : null,
    agentLimit: resolvedPlan === 'STARTER' ? 1 : resolvedPlan === 'PRO' ? 3 : null,
    isLoading,
  };
}
