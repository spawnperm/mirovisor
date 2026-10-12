import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../store/useAppStore';
import { Tenant, SystemMetric, KanbanCard, SecurityFinding } from '../types';

/**
 * TanStack Query hooks for asynchronous data synchronization, caching, and background telemetry polling.
 */

export const queryKeys = {
  tenants: ['tenants'] as const,
  tenant: (id: string) => ['tenant', id] as const,
  metrics: (tenantId: string) => ['metrics', tenantId] as const,
  kanban: ['kanban', 'cards'] as const,
  security: ['security', 'findings'] as const,
};

export function useTenantsQuery() {
  const tenants = useAppStore((state) => state.tenants);

  return useQuery({
    queryKey: queryKeys.tenants,
    queryFn: async (): Promise<Tenant[]> => {
      // Simulate real microsecond cache read or background remote fetch
      return tenants;
    },
    initialData: tenants,
    staleTime: 1000 * 60 * 5, // 5 min
  });
}

export function useTenantMetricsQuery(tenantId: string) {
  const metrics = useAppStore((state) => state.metrics);

  return useQuery({
    queryKey: queryKeys.metrics(tenantId),
    queryFn: async (): Promise<SystemMetric> => {
      return (
        metrics[tenantId] || {
          tenantId,
          rps: 240,
          p95LatencyMs: 28,
          errorRatePercent: 0.02,
          cpuUsage: 25,
          memoryUsageMb: 820,
          dbQueriesPerSec: 900,
        }
      );
    },
    initialData: metrics[tenantId],
    refetchInterval: 30000, // Background polling every 30 seconds
  });
}

export function useKanbanCardsQuery() {
  const cards = useAppStore((state) => state.cards);

  return useQuery({
    queryKey: queryKeys.kanban,
    queryFn: async (): Promise<KanbanCard[]> => {
      return cards;
    },
    initialData: cards,
  });
}

export function useSecurityFindingsQuery() {
  const findings = useAppStore((state) => state.securityFindings);

  return useQuery({
    queryKey: queryKeys.security,
    queryFn: async (): Promise<SecurityFinding[]> => {
      return findings;
    },
    initialData: findings,
  });
}
