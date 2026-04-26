import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { usePlanFeatures } from './usePlanFeatures';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));
vi.mock('../api/subscriptions', () => ({
  getPlanInfo: vi.fn(),
}));

import { useAuth } from '../context/AuthContext';
import { getPlanInfo } from '../api/subscriptions';

const mockUseAuth = vi.mocked(useAuth);
const mockGetPlanInfo = vi.mocked(getPlanInfo);

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('usePlanFeatures', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('STARTER: bloquea api keys y campañas, agentLimit=1, conversationLimit=500', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1', tenant: { plan: 'STARTER' } } } as any);
    mockGetPlanInfo.mockResolvedValue({ plan: 'STARTER' } as any);

    const { result } = renderHook(() => usePlanFeatures(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.plan).toBe('STARTER');
    expect(result.current.canUseApiKeys).toBe(false);
    expect(result.current.canUseCampanas).toBe(false);
    expect(result.current.agentLimit).toBe(1);
    expect(result.current.conversationLimit).toBe(500);
  });

  it('PRO: permite campañas, bloquea api keys, agentLimit=3, conversationLimit=2000', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1', tenant: { plan: 'PRO' } } } as any);
    mockGetPlanInfo.mockResolvedValue({ plan: 'PRO' } as any);

    const { result } = renderHook(() => usePlanFeatures(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.plan).toBe('PRO');
    expect(result.current.canUseCampanas).toBe(true);
    expect(result.current.canUseApiKeys).toBe(false);
    expect(result.current.agentLimit).toBe(3);
    expect(result.current.conversationLimit).toBe(2000);
  });

  it('BUSINESS: permite todo, sin límites', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1', tenant: { plan: 'BUSINESS' } } } as any);
    mockGetPlanInfo.mockResolvedValue({ plan: 'BUSINESS' } as any);

    const { result } = renderHook(() => usePlanFeatures(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.plan).toBe('BUSINESS');
    expect(result.current.canUseCampanas).toBe(true);
    expect(result.current.canUseApiKeys).toBe(true);
    expect(result.current.agentLimit).toBeNull();
    expect(result.current.conversationLimit).toBeNull();
  });

  it('subscriptionPlan tiene precedencia sobre plan', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'u1', tenant: { plan: 'STARTER', subscriptionPlan: 'PRO' } },
    } as any);
    mockGetPlanInfo.mockResolvedValue({ plan: 'PRO' } as any);

    const { result } = renderHook(() => usePlanFeatures(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.plan).toBe('PRO');
    expect(result.current.canUseCampanas).toBe(true);
  });

  it('si la query falla, cae al plan local del user', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1', tenant: { plan: 'PRO' } } } as any);
    mockGetPlanInfo.mockRejectedValue(new Error('network'));

    const { result } = renderHook(() => usePlanFeatures(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.plan).toBe('PRO');
    expect(result.current.canUseCampanas).toBe(true);
  });
});
