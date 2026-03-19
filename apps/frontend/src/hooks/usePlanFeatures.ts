import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getPlanInfo } from '../api/subscriptions';

export interface PlanFeatures {
  plan: string;
  canUseApiKeys: boolean;
  canUseConversaciones: boolean;
  conversationLimit: number | null;
  teamSize: number | null;
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

  if (!data) {
    return {
      plan,
      canUseApiKeys: plan === 'BUSINESS',
      canUseConversaciones: true,
      conversationLimit: plan === 'STARTER' ? 500 : plan === 'PRO' ? 2000 : null,
      teamSize: plan === 'STARTER' ? 3 : plan === 'PRO' ? 10 : null,
      isLoading,
    };
  }

  return {
    plan: data.plan,
    canUseApiKeys: data.features.apiKeys,
    canUseConversaciones: true,
    conversationLimit: data.features.conversationLimit,
    teamSize: data.features.teamSize,
    isLoading,
  };
}
