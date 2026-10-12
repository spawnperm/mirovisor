import { describe, it, expect, beforeEach } from 'vitest';
import { AiAgentService } from './aiAgentService';

describe('AiAgentService (Cordis Multi-Agent Pipeline)', () => {
  beforeEach(() => {
    // Stub remote AI call to test deterministic offline rule-engine triage instantly
    (AiAgentService.getInstance() as any).ai = null;
  });

  it('correctly records and persists feedback memory for agent learning', () => {
    const service = AiAgentService.getInstance();
    const testFeedback = 'Отклонено: требуется строгая проверка RLS в PostgreSQL';
    service.recordFeedback('SecurityAgent (Cordis)', testFeedback);

    const memory = service.getFeedbackMemory('SecurityAgent (Cordis)');
    expect(memory).toContain(testFeedback);
  });

  it('assigns critical priority to security telemetry findings', async () => {
    const service = AiAgentService.getInstance();
    const result = await service.analyzeTelemetry('security', 'CWE-89: SQL Injection detected in tenant query');
    expect(result.priority).toBe('critical');
    expect(result.type).toBe('security');
    expect(result.createdBy).toContain('SecurityAgent');
  });

  it('assigns high priority to architecture telemetry findings', async () => {
    const service = AiAgentService.getInstance();
    const result = await service.analyzeTelemetry('architecture', 'Schema quota exceeded in tenant_fintech');
    expect(result.priority).toBe('high');
    expect(result.type).toBe('architecture');
  });
});
