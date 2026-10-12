import { describe, it, expect, vi, beforeEach } from 'vitest';
import { trackLazyComponent, getLazyLoadRecords } from './lazyComponentTracker';

describe('lazyComponentTracker Utility', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('measures load duration and records loaded status', async () => {
    const mockComponent = { default: () => 'MockComponent' };
    const mockLoader = vi.fn().mockImplementation(async () => {
      await new Promise((res) => setTimeout(res, 20));
      return mockComponent;
    });

    const trackedLoader = trackLazyComponent('Test Module', mockLoader);
    const result = await trackedLoader();

    expect(result).toBe(mockComponent);
    expect(mockLoader).toHaveBeenCalledTimes(1);

    // Wait for idle/timeout callback
    await new Promise((res) => setTimeout(res, 50));

    const records = getLazyLoadRecords();
    const testRecord = records.find((r) => r.name === 'Test Module');
    expect(testRecord).toBeDefined();
    expect(testRecord?.status).toBe('loaded');
    expect(testRecord?.durationMs).toBeGreaterThan(10);
  });

  it('handles loader errors and records error status', async () => {
    const mockLoader = vi.fn().mockRejectedValue(new Error('ChunkLoadError'));

    const trackedLoader = trackLazyComponent('Failing Module', mockLoader);

    await expect(trackedLoader()).rejects.toThrow('ChunkLoadError');

    const records = getLazyLoadRecords();
    const failRecord = records.find((r) => r.name === 'Failing Module');
    expect(failRecord).toBeDefined();
    expect(failRecord?.status).toBe('error');
  });
});
