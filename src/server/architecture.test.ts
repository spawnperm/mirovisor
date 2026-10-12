import { describe, it, expect } from 'vitest';
import { TenantContextManager } from './tenantContext.ts';
import { TransactionalOutboxRelay } from './outboxRelay.ts';

describe('Tenant Isolation Kernel & Transactional Outbox Pattern', () => {
  it('propagates tenant context asynchronously without parameter drilling', async () => {
    const ctx = {
      tenantId: 't_defense',
      schema: 'tenant_defense',
      userId: 'usr_sec',
      roles: ['admin'],
    };

    await TenantContextManager.run(ctx, async () => {
      // Nested async call
      await new Promise((res) => setTimeout(res, 10));
      const current = TenantContextManager.current();
      expect(current.tenantId).toBe('t_defense');
      expect(current.schema).toBe('tenant_defense');
      expect(TenantContextManager.getSetSearchPathSql()).toBe(
        'SET LOCAL search_path = "tenant_defense", "platform_registry", "public";'
      );
    });

    expect(TenantContextManager.currentOptional()).toBeNull();
  });

  it('rejects unsafe schema names to prevent SQL injection', () => {
    const malicious = {
      tenantId: 'bad',
      schema: 'tenant_bad; DROP TABLE users;--',
    };

    expect(() => {
      TenantContextManager.run(malicious, () => {});
    }).toThrow('Invalid tenant schema name identifier');
  });

  it('enqueues CloudEvents into transactional outbox and publishes them', async () => {
    TransactionalOutboxRelay.clearQueue();

    const sampleEvent = {
      specversion: '1.0' as const,
      type: 'com.mirovisor.security.finding.detected',
      source: 'https://security.mirovisor.internal',
      id: '550e8400-e29b-41d4-a716-446655440001',
      time: new Date().toISOString(),
      datacontenttype: 'application/json' as const,
      data: { findingId: 'sec_99', severity: 'HIGH' },
      tenantId: 't_fintech',
    };

    const record = TransactionalOutboxRelay.enqueue(sampleEvent);
    expect(record.status).toBe('PENDING');
    expect(TransactionalOutboxRelay.getBacklogCount()).toBe(1);

    const publishedSubjects: string[] = [];
    const result = await TransactionalOutboxRelay.processPendingEvents(async (subject) => {
      publishedSubjects.push(subject);
      return true;
    });

    expect(result.processed).toBe(1);
    expect(TransactionalOutboxRelay.getBacklogCount()).toBe(0);
    expect(publishedSubjects[0]).toBe('mirovisor.t_fintech.telemetry.com.mirovisor.security.finding.detected');
  });
});
