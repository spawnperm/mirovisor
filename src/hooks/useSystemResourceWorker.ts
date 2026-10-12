/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * React hook to manage the System Resource Web Worker lifecycle,
 * post memory metrics, and receive real-time CPU & memory trend feeds.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  SystemResourceSample,
  WorkerTrendSummary,
  WORKER_INLINE_SCRIPT,
  WorkerInMessage,
} from '../workers/systemResourceWorker';
import { LogUtility } from '../services/logUtility';

export interface UseSystemResourceWorkerReturn {
  latestSample: SystemResourceSample | null;
  history: SystemResourceSample[];
  trend: WorkerTrendSummary;
  isRunning: boolean;
  pollingIntervalMs: number;
  benchmarkResult: { durationMs: number; opsPerSec: number } | null;
  isBenchmarking: boolean;
  setPollingInterval: (intervalMs: number) => void;
  togglePolling: () => void;
  runBenchmark: (iterations?: number) => void;
  resetHistory: () => void;
  workerSupported: boolean;
}

const DEFAULT_TREND: WorkerTrendSummary = {
  avgCpu: 28,
  maxCpu: 45,
  p95Cpu: 42,
  avgMemoryMb: 54,
  peakMemoryMb: 68,
  gcEventsTotal: 0,
  cpuSlope: 'stable',
  memSlope: 'stable',
};

export function useSystemResourceWorker(initialIntervalMs = 1000): UseSystemResourceWorkerReturn {
  const [latestSample, setLatestSample] = useState<SystemResourceSample | null>(null);
  const [history, setHistory] = useState<SystemResourceSample[]>([]);
  const [trend, setTrend] = useState<WorkerTrendSummary>(DEFAULT_TREND);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [pollingIntervalMs, setPollingIntervalMs] = useState<number>(initialIntervalMs);
  const [benchmarkResult, setBenchmarkResult] = useState<{ durationMs: number; opsPerSec: number } | null>(null);
  const [isBenchmarking, setIsBenchmarking] = useState<boolean>(false);
  const [workerSupported, setWorkerSupported] = useState<boolean>(true);

  const workerRef = useRef<Worker | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const memorySyncTimerRef = useRef<any>(null);

  // Read current main thread memory and send to worker
  const syncMemoryToWorker = useCallback(() => {
    if (!workerRef.current) return;
    let used = 54;
    let total = 96;
    let limit = 128;

    if (typeof window !== 'undefined' && (performance as any).memory) {
      const mem = (performance as any).memory;
      used = Math.round(mem.usedJSHeapSize / 1024 / 1024);
      total = Math.round(mem.totalJSHeapSize / 1024 / 1024);
      limit = Math.round(mem.jsHeapSizeLimit / 1024 / 1024);
    } else {
      // Realistic simulation delta for browsers without performance.memory API
      used = Math.round(48 + Math.sin(Date.now() / 4000) * 12 + Math.random() * 4);
    }

    const msg: WorkerInMessage = {
      type: 'RECORD_MEMORY',
      payload: { usedMb: used, totalMb: total, limitMb: limit },
    };
    workerRef.current.postMessage(msg);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') {
      setWorkerSupported(false);
      return;
    }

    try {
      const blob = new Blob([WORKER_INLINE_SCRIPT], { type: 'application/javascript' });
      const blobUrl = URL.createObjectURL(blob);
      blobUrlRef.current = blobUrl;

      const worker = new Worker(blobUrl);
      workerRef.current = worker;

      worker.onmessage = (e: MessageEvent) => {
        const msg = e.data;
        if (!msg) return;

        if (msg.type === 'TICK') {
          const sample = msg.sample as SystemResourceSample;
          const tr = msg.trend as WorkerTrendSummary;

          setLatestSample(sample);
          setTrend(tr);
          setHistory((prev) => {
            const next = [...prev, sample];
            return next.length > 25 ? next.slice(-25) : next;
          });
        } else if (msg.type === 'STATUS') {
          setIsRunning(msg.running);
          setPollingIntervalMs(msg.intervalMs);
        } else if (msg.type === 'BENCHMARK_COMPLETE') {
          setIsBenchmarking(false);
          setBenchmarkResult({
            durationMs: msg.durationMs,
            opsPerSec: msg.opsPerSec,
          });
          LogUtility.info(
            `Web Worker CPU Benchmark: ${msg.opsPerSec.toLocaleString()} ops/sec in ${msg.durationMs}ms`,
            { durationMs: msg.durationMs, opsPerSec: msg.opsPerSec },
            'SystemResourceWorker'
          );
        }
      };

      worker.onerror = (err) => {
        console.warn('[SystemResourceWorker] Worker error:', err);
        LogUtility.warn('System Resource Web Worker reported an error', { message: err.message }, 'WebWorker');
      };

      // Start worker polling
      worker.postMessage({ type: 'START', intervalMs: initialIntervalMs });

      // Synchronize memory every interval
      syncMemoryToWorker();
      memorySyncTimerRef.current = setInterval(syncMemoryToWorker, initialIntervalMs);

      return () => {
        if (memorySyncTimerRef.current) clearInterval(memorySyncTimerRef.current);
        if (workerRef.current) {
          workerRef.current.terminate();
          workerRef.current = null;
        }
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
          blobUrlRef.current = null;
        }
      };
    } catch (e) {
      console.warn('[SystemResourceWorker] Failed to initialize worker:', e);
      setWorkerSupported(false);
    }
  }, [initialIntervalMs, syncMemoryToWorker]);

  const setPollingInterval = useCallback((intervalMs: number) => {
    setPollingIntervalMs(intervalMs);
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'SET_INTERVAL', intervalMs });
    }
    if (memorySyncTimerRef.current) {
      clearInterval(memorySyncTimerRef.current);
      memorySyncTimerRef.current = setInterval(syncMemoryToWorker, intervalMs);
    }
  }, [syncMemoryToWorker]);

  const togglePolling = useCallback(() => {
    if (!workerRef.current) return;
    if (isRunning) {
      workerRef.current.postMessage({ type: 'STOP' });
      setIsRunning(false);
    } else {
      workerRef.current.postMessage({ type: 'START', intervalMs: pollingIntervalMs });
      setIsRunning(true);
    }
  }, [isRunning, pollingIntervalMs]);

  const runBenchmark = useCallback((iterations = 120000) => {
    if (!workerRef.current) return;
    setIsBenchmarking(true);
    workerRef.current.postMessage({ type: 'TRIGGER_BENCHMARK', iterations });
  }, []);

  const resetHistory = useCallback(() => {
    setHistory([]);
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'RESET_HISTORY' });
    }
  }, []);

  return {
    latestSample,
    history,
    trend,
    isRunning,
    pollingIntervalMs,
    benchmarkResult,
    isBenchmarking,
    setPollingInterval,
    togglePolling,
    runBenchmark,
    resetHistory,
    workerSupported,
  };
}
