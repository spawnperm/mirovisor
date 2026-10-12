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

  describe('Voice Sentiment Analysis', () => {
    it('accurately detects positive sentiment with positive score', async () => {
      const service = AiAgentService.getInstance();
      const res = await service.analyzeSentiment('Отлично, сборка успешно завершена и все тесты прошли супер!');
      expect(res.sentiment).toBe('positive');
      expect(res.score).toBeGreaterThan(0);
      expect(res.label).toContain('Позитивный');
    });

    it('accurately detects negative sentiment with negative score', async () => {
      const service = AiAgentService.getInstance();
      const res = await service.analyzeSentiment('Обнаружен критический баг, ошибка в пайплайне и сбой базы данных');
      expect(res.sentiment).toBe('negative');
      expect(res.score).toBeLessThan(0);
      expect(res.label).toContain('Негативный');
    });

    it('accurately detects urgent priority sentiment', async () => {
      const service = AiAgentService.getInstance();
      const res = await service.analyzeSentiment('Срочно останови сборку, авария на проде!');
      expect(res.sentiment).toBe('urgent');
      expect(res.label).toContain('Срочный');
    });

    it('accurately detects neutral sentiment for standard navigational query', async () => {
      const service = AiAgentService.getInstance();
      const res = await service.analyzeSentiment('Покажи статус тенанта cyberbank');
      expect(res.sentiment).toBe('neutral');
      expect(res.label).toContain('Нейтральный');
    });
  });
});
