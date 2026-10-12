import { describe, it, expect } from 'vitest';
import { WORKER_INLINE_SCRIPT } from './systemResourceWorker';

describe('SystemResource Web Worker Specification', () => {
  it('exports valid and non-empty inline worker script template', () => {
    expect(WORKER_INLINE_SCRIPT).toBeDefined();
    expect(typeof WORKER_INLINE_SCRIPT).toBe('string');
    expect(WORKER_INLINE_SCRIPT.length).toBeGreaterThan(500);
  });

  it('contains essential message handlers and lifecycle methods', () => {
    expect(WORKER_INLINE_SCRIPT).toContain("case 'START'");
    expect(WORKER_INLINE_SCRIPT).toContain("case 'STOP'");
    expect(WORKER_INLINE_SCRIPT).toContain("case 'SET_INTERVAL'");
    expect(WORKER_INLINE_SCRIPT).toContain("case 'RECORD_MEMORY'");
    expect(WORKER_INLINE_SCRIPT).toContain("case 'TRIGGER_BENCHMARK'");
    expect(WORKER_INLINE_SCRIPT).toContain("case 'RESET_HISTORY'");
    expect(WORKER_INLINE_SCRIPT).toContain('calculateTrends');
    expect(WORKER_INLINE_SCRIPT).toContain('runMicroBenchmark');
  });

  it('implements GC event detection and trend calculations in script', () => {
    expect(WORKER_INLINE_SCRIPT).toContain('gcEventsCount');
    expect(WORKER_INLINE_SCRIPT).toContain('memoryDelta');
    expect(WORKER_INLINE_SCRIPT).toContain('jitter');
    expect(WORKER_INLINE_SCRIPT).toContain('p95Cpu');
    expect(WORKER_INLINE_SCRIPT).toContain('cpuSlope');
    expect(WORKER_INLINE_SCRIPT).toContain('memSlope');
  });
});
