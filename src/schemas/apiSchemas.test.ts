import { describe, it, expect } from 'vitest';
import {
  TenantSchema,
  KanbanCardSchema,
  SecurityFindingSchema,
  CloudEventSchema,
  CardTagUpdateSchema,
  ProblemDetailsSchema,
} from './api.schemas.ts';

describe('API Runtime Validation Schemas (Zod)', () => {
  it('validates a correct tenant model and rejects invalid schema names', () => {
    const valid = {
      id: 't_fintech',
      name: 'FinTech Division',
      slug: 'fintech-div',
      schema: 'tenant_fintech',
      tier: 'division',
      storageQuotaMb: 10240,
      storageUsedMb: 512,
    };
    const parsed = TenantSchema.safeParse(valid);
    expect(parsed.success).toBe(true);

    const invalidSqlInjection = {
      ...valid,
      schema: 'tenant_test; DROP TABLE users;--',
    };
    const invalidParsed = TenantSchema.safeParse(invalidSqlInjection);
    expect(invalidParsed.success).toBe(false);
  });

  it('validates kanban card schema and rating bounds', () => {
    const validCard = {
      id: 'card_101',
      columnId: 'in_progress',
      title: 'Implement D3 Force Graph',
      description: 'Force-directed simulation with WebGL canvas',
      qualityRating: 5,
      tags: ['ui', 'd3'],
    };
    expect(KanbanCardSchema.safeParse(validCard).success).toBe(true);

    const invalidRating = {
      ...validCard,
      qualityRating: 10, // Max is 5
    };
    expect(KanbanCardSchema.safeParse(invalidRating).success).toBe(false);
  });

  it('validates security finding CWE format and scanners', () => {
    const validFinding = {
      id: 'sec_1',
      scanner: 'CodeQL',
      severity: 'HIGH',
      title: 'SQL Injection via query concat',
      fileOrUrl: 'server.ts:45',
      description: 'Use parameterized queries',
      cwe: 'CWE-89',
      status: 'open',
      detectedAt: '2026-10-12T00:00:00.000Z',
    };
    expect(SecurityFindingSchema.safeParse(validFinding).success).toBe(true);

    const invalidCwe = {
      ...validFinding,
      cwe: 'INVALID-FORMAT',
    };
    expect(SecurityFindingSchema.safeParse(invalidCwe).success).toBe(false);
  });

  it('validates CloudEvents 1.0 specification structure', () => {
    const validEvent = {
      specversion: '1.0',
      type: 'com.mirovisor.build.completed',
      source: 'https://ci.mirovisor.internal/pipeline',
      id: '550e8400-e29b-41d4-a716-446655440000',
      time: '2026-10-12T00:00:00.000Z',
      datacontenttype: 'application/json',
      data: { commit: 'abc1234', status: 'success' },
      tenantId: 't_holding',
    };
    expect(CloudEventSchema.safeParse(validEvent).success).toBe(true);
  });

  it('validates CardTagUpdateSchema constraints and sanitization', () => {
    const validTags = { tags: ['perf', 'security-audit', 'cwe-89'] };
    const parsed = CardTagUpdateSchema.safeParse(validTags);
    expect(parsed.success).toBe(true);

    const emptyTag = { tags: [''] };
    expect(CardTagUpdateSchema.safeParse(emptyTag).success).toBe(false);

    const tooManyTags = { tags: Array.from({ length: 25 }, (_, i) => `tag-${i}`) };
    expect(CardTagUpdateSchema.safeParse(tooManyTags).success).toBe(false);
  });

  it('validates RFC 7807 ProblemDetailsSchema for HTTP error responses', () => {
    const validProblem = {
      type: 'urn:mirovisor:error:validation',
      title: 'Bad Request',
      status: 400,
      detail: 'The payload contains invalid parameters.',
      invalidParams: [{ name: 'tags', reason: 'Must contain non-empty string tags' }],
    };
    expect(ProblemDetailsSchema.safeParse(validProblem).success).toBe(true);
  });
});
