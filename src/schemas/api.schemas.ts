/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Mirovisor Runtime API Schemas & Contracts (Zod)
 */
import { z } from 'zod';

export const TenantSchema = z.object({
  id: z.string().min(2).max(64).regex(/^[a-z0-9_]+$/, 'Tenant ID must be lowercase alphanumeric with underscores'),
  name: z.string().min(2).max(255),
  slug: z.string().min(2).max(128).regex(/^[a-z0-9-]+$/, 'Slug must be kebab-case'),
  schema: z.string().min(2).max(64).regex(/^[a-z0-9_]+$/, 'PostgreSQL schema name must be valid identifier'),
  tier: z.enum(['holding', 'division', 'project', 'sandbox']).default('project'),
  storageQuotaMb: z.number().int().positive().default(5120),
  storageUsedMb: z.number().int().nonnegative().default(0),
});

export type ValidatedTenant = z.infer<typeof TenantSchema>;

export const KanbanCardSchema = z.object({
  id: z.string().min(1),
  columnId: z.enum(['incoming', 'refinement', 'ready_for_work', 'in_progress', 'review', 'done']),
  title: z.string().min(3).max(200),
  description: z.string().max(10000),
  qualityRating: z.number().min(1).max(5).optional(),
  rollbackSnapshot: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export type ValidatedKanbanCard = z.infer<typeof KanbanCardSchema>;

export const SecurityFindingSchema = z.object({
  id: z.string().min(1),
  scanner: z.enum(['CodeQL', 'Snyk', 'Gitleaks', 'OWASP ZAP', 'Aqua Trivy', 'Semgrep']),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  title: z.string().min(3).max(255),
  fileOrUrl: z.string().min(1),
  description: z.string(),
  cwe: z.string().regex(/^CWE-\d+$/),
  status: z.enum(['open', 'in_progress', 'resolved', 'ignored']).default('open'),
  detectedAt: z.string().datetime(),
  remediationSnippet: z.string().optional(),
});

export type ValidatedSecurityFinding = z.infer<typeof SecurityFindingSchema>;

export const CloudEventSchema = z.object({
  specversion: z.literal('1.0'),
  type: z.string().min(3),
  source: z.string().url().or(z.string().min(1)),
  id: z.string().uuid(),
  time: z.string().datetime(),
  datacontenttype: z.literal('application/json'),
  data: z.record(z.string(), z.unknown()),
  tenantId: z.string().min(2).max(64),
});

export type ValidatedCloudEvent = z.infer<typeof CloudEventSchema>;

/**
 * Custom Card Tags Update Contract
 */
export const CardTagUpdateSchema = z.object({
  tags: z.array(z.string().trim().min(1).max(32)).max(20),
});

export type ValidatedCardTagUpdate = z.infer<typeof CardTagUpdateSchema>;

/**
 * Partial Card Patch Contract
 */
export const CardPatchSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(10000).optional(),
  columnId: z.enum(['incoming', 'refinement', 'ready_for_work', 'in_progress', 'review', 'done']).optional(),
  tags: z.array(z.string().trim().min(1).max(32)).max(20).optional(),
  qualityRating: z.number().min(1).max(5).optional(),
});

export type ValidatedCardPatch = z.infer<typeof CardPatchSchema>;

/**
 * RFC 7807 Problem Details for HTTP APIs
 */
export const ProblemDetailsSchema = z.object({
  type: z.string().url().or(z.string().startsWith('urn:')),
  title: z.string(),
  status: z.number().int().min(100).max(599),
  detail: z.string(),
  instance: z.string().optional(),
  invalidParams: z.array(z.object({
    name: z.string(),
    reason: z.string(),
  })).optional(),
});

export type ValidatedProblemDetails = z.infer<typeof ProblemDetailsSchema>;

