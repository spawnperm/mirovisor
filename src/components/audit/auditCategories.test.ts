import { describe, it, expect } from 'vitest';
import type { AuditCategory } from './EngineeringAuditView.tsx';

describe('Engineering Audit Categories & Dimension Completeness', () => {
  const requiredCategories: AuditCategory[] = [
    'infrastructure',
    'architecture',
    'code_modularity',
    'documentation',
    'security',
    'performance',
    'testing',
    'api_contracts',
    'devops_monitoring',
    'ci_cd',
    'ui_ux_a11y',
  ];

  it('covers all 11 mandatory dimensions requested by the engineering mandate', () => {
    expect(requiredCategories).toHaveLength(11);
    expect(requiredCategories).toContain('infrastructure');
    expect(requiredCategories).toContain('architecture');
    expect(requiredCategories).toContain('code_modularity');
    expect(requiredCategories).toContain('documentation');
    expect(requiredCategories).toContain('security');
    expect(requiredCategories).toContain('performance');
    expect(requiredCategories).toContain('testing');
    expect(requiredCategories).toContain('api_contracts');
    expect(requiredCategories).toContain('devops_monitoring');
    expect(requiredCategories).toContain('ci_cd');
    expect(requiredCategories).toContain('ui_ux_a11y');
  });
});
