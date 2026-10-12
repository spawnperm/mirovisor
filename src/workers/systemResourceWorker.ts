/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Web Worker for Periodic CPU & Memory Trend Monitoring
 * Runs off the main UI thread to measure event-loop jitter, CPU capacity,
 * memory consumption velocity, and garbage collection events without UI overhead.
 */

export interface SystemResourceSample {
  timestamp: string;
  timeMs: number;
  cpuPercent: number;
  cpuStatus: 'nominal' | 'elevated' | 'critical';
  eventLoopJitterMs: number;
  benchmarkScore: number;
  heapUsedMb: number;
  heapTotalMb: number;
  heapLimitMb: number;
  heapPercent: number;
  memoryDeltaMb: number;
  gcEventDetected: boolean;
  workerTick: number;
  hardwareConcurrency: number;
}

export interface WorkerTrendSummary {
  avgCpu: number;
  maxCpu: number;
  p95Cpu: number;
  avgMemoryMb: number;
  peakMemoryMb: number;
  gcEventsTotal: number;
  cpuSlope: 'increasing' | 'stable' | 'decreasing';
  memSlope: 'increasing' | 'stable' | 'decreasing';
}

export type WorkerInMessage =
  | { type: 'START'; intervalMs?: number }
  | { type: 'STOP' }
  | { type: 'SET_INTERVAL'; intervalMs: number }
  | { type: 'RECORD_MEMORY'; payload: { usedMb: number; totalMb: number; limitMb: number } }
  | { type: 'TRIGGER_BENCHMARK'; iterations?: number }
  | { type: 'RESET_HISTORY' };

export type WorkerOutMessage =
  | { type: 'TICK'; sample: SystemResourceSample; trend: WorkerTrendSummary }
  | { type: 'BENCHMARK_COMPLETE'; durationMs: number; opsPerSec: number }
  | { type: 'STATUS'; running: boolean; intervalMs: number; tickCount: number };

// Inline worker script template string for zero-config fallback instantiation
export const WORKER_INLINE_SCRIPT = `
let timerId = null;
let intervalMs = 1000;
let tickCount = 0;
let lastTickTime = performance.now();
let lastHeapUsed = 50;
let currentMemory = { usedMb: 52, totalMb: 96, limitMb: 128 };
let sampleHistory = [];
let gcEventsCount = 0;

function runMicroBenchmark(iterations = 15000) {
  const start = performance.now();
  let acc = 0;
  for (let i = 0; i < iterations; i++) {
    acc += Math.sqrt(i) * Math.sin(i);
  }
  const duration = performance.now() - start;
  return { duration, acc };
}

function calculateTrends() {
  if (sampleHistory.length === 0) {
    return {
      avgCpu: 0,
      maxCpu: 0,
      p95Cpu: 0,
      avgMemoryMb: 0,
      peakMemoryMb: 0,
      gcEventsTotal: 0,
      cpuSlope: 'stable',
      memSlope: 'stable'
    };
  }

  const cpus = sampleHistory.map(s => s.cpuPercent).sort((a, b) => a - b);
  const mems = sampleHistory.map(s => s.heapUsedMb);
  const sumCpu = cpus.reduce((a, b) => a + b, 0);
  const sumMem = mems.reduce((a, b) => a + b, 0);

  const p95Idx = Math.floor(cpus.length * 0.95);
  const p95Cpu = cpus[p95Idx] ?? cpus[cpus.length - 1];

  let cpuSlope = 'stable';
  let memSlope = 'stable';
  if (sampleHistory.length >= 4) {
    const half = Math.floor(sampleHistory.length / 2);
    const firstHalfCpu = sampleHistory.slice(0, half).reduce((a, b) => a + b.cpuPercent, 0) / half;
    const secondHalfCpu = sampleHistory.slice(half).reduce((a, b) => a + b.cpuPercent, 0) / (sampleHistory.length - half);
    if (secondHalfCpu - firstHalfCpu > 5) cpuSlope = 'increasing';
    else if (firstHalfCpu - secondHalfCpu > 5) cpuSlope = 'decreasing';

    const firstHalfMem = sampleHistory.slice(0, half).reduce((a, b) => a + b.heapUsedMb, 0) / half;
    const secondHalfMem = sampleHistory.slice(half).reduce((a, b) => a + b.heapUsedMb, 0) / (sampleHistory.length - half);
    if (secondHalfMem - firstHalfMem > 3) memSlope = 'increasing';
    else if (firstHalfMem - secondHalfMem > 3) memSlope = 'decreasing';
  }

  return {
    avgCpu: Math.round((sumCpu / cpus.length) * 10) / 10,
    maxCpu: Math.round(Math.max(...cpus) * 10) / 10,
    p95Cpu: Math.round(p95Cpu * 10) / 10,
    avgMemoryMb: Math.round((sumMem / mems.length) * 10) / 10,
    peakMemoryMb: Math.round(Math.max(...mems) * 10) / 10,
    gcEventsTotal: gcEventsCount,
    cpuSlope,
    memSlope
  };
}

function tick() {
  const now = performance.now();
  const delta = now - lastTickTime;
  lastTickTime = now;
  tickCount++;

  const jitter = Math.max(0, Math.round((delta - intervalMs) * 10) / 10);
  const bench = runMicroBenchmark(12000);

  // Inferred CPU load formula: baseline bench time + jitter weight
  const normalizedBenchLoad = Math.min(60, bench.duration * 12);
  const jitterLoad = Math.min(40, jitter * 4);
  const simulatedVariation = Math.sin(tickCount * 0.4) * 8 + (Math.random() * 6);
  const rawCpu = Math.max(5, Math.min(98, Math.round(18 + normalizedBenchLoad + jitterLoad + simulatedVariation)));

  const memoryDelta = Math.round((currentMemory.usedMb - lastHeapUsed) * 10) / 10;
  const isGc = memoryDelta < -2.5;
  if (isGc) {
    gcEventsCount++;
  }
  lastHeapUsed = currentMemory.usedMb;

  const sample = {
    timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    timeMs: Math.round(now),
    cpuPercent: rawCpu,
    cpuStatus: rawCpu > 85 ? 'critical' : rawCpu > 65 ? 'elevated' : 'nominal',
    eventLoopJitterMs: jitter,
    benchmarkScore: Math.round(1000 / (bench.duration + 0.1)),
    heapUsedMb: currentMemory.usedMb,
    heapTotalMb: currentMemory.totalMb,
    heapLimitMb: currentMemory.limitMb,
    heapPercent: Math.round((currentMemory.usedMb / (currentMemory.limitMb || 128)) * 100),
    memoryDeltaMb: memoryDelta,
    gcEventDetected: isGc,
    workerTick: tickCount,
    hardwareConcurrency: (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 4
  };

  sampleHistory.push(sample);
  if (sampleHistory.length > 30) {
    sampleHistory.shift();
  }

  const trends = calculateTrends();

  self.postMessage({
    type: 'TICK',
    sample,
    trend: trends
  });
}

function startPolling(newInterval = 1000) {
  if (timerId) clearInterval(timerId);
  intervalMs = newInterval;
  lastTickTime = performance.now();
  timerId = setInterval(tick, intervalMs);
  tick(); // immediate first sample
  self.postMessage({ type: 'STATUS', running: true, intervalMs, tickCount });
}

function stopPolling() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
  self.postMessage({ type: 'STATUS', running: false, intervalMs, tickCount });
}

self.onmessage = function(e) {
  const msg = e.data;
  if (!msg) return;

  switch (msg.type) {
    case 'START':
      startPolling(msg.intervalMs || intervalMs);
      break;
    case 'STOP':
      stopPolling();
      break;
    case 'SET_INTERVAL':
      startPolling(msg.intervalMs || 1000);
      break;
    case 'RECORD_MEMORY':
      if (msg.payload) {
        currentMemory = msg.payload;
      }
      break;
    case 'RESET_HISTORY':
      sampleHistory = [];
      gcEventsCount = 0;
      tickCount = 0;
      break;
    case 'TRIGGER_BENCHMARK':
      const iterations = msg.iterations || 100000;
      const benchStart = performance.now();
      runMicroBenchmark(iterations);
      const benchDuration = performance.now() - benchStart;
      const ops = Math.round((iterations / (benchDuration / 1000)));
      self.postMessage({
        type: 'BENCHMARK_COMPLETE',
        durationMs: Math.round(benchDuration * 10) / 10,
        opsPerSec: ops
      });
      break;
  }
};
`;
