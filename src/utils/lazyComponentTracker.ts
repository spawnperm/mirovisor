/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Performance Monitoring Utility for Lazy-Loaded Components
 * Uses `performance.now()` and `requestIdleCallback` to track chunk loading & execution time
 * of each lazy-loaded enterprise module in App.tsx and feed data to ObservabilityView.
 */

import { useState, useEffect } from 'react';
import { LogUtility } from '../services/logUtility';
import { recordModuleRenderTime } from '../hooks/usePerformanceMonitoring';

export interface LazyLoadRecord {
  name: string;
  durationMs: number;
  timestamp: string;
  status: 'idle' | 'loading' | 'loaded' | 'error';
  idleScheduled: boolean;
  heapMemoryUsedMb?: number;
}

// In-memory registry of all tracked lazy components
const lazyLoadRegistry: Record<string, LazyLoadRecord> = {};
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error('Error in lazy load listener:', e);
    }
  });
}

/**
 * Wraps a dynamic import loader function with high-resolution performance.now()
 * tracking and non-blocking requestIdleCallback telemetry persistence.
 */
export function trackLazyComponent<T>(
  name: string,
  loader: () => Promise<T>
): () => Promise<T> {
  // Initialize placeholder record if not present
  if (!lazyLoadRegistry[name]) {
    lazyLoadRegistry[name] = {
      name,
      durationMs: 0,
      timestamp: 'Pending load',
      status: 'idle',
      idleScheduled: false,
    };
  }

  return async (): Promise<T> => {
    const startTime = performance.now();
    lazyLoadRegistry[name] = {
      ...lazyLoadRegistry[name],
      status: 'loading',
      timestamp: new Date().toLocaleTimeString(),
    };
    notifyListeners();

    try {
      const module = await loader();
      const endTime = performance.now();
      const durationMs = Math.round((endTime - startTime) * 10) / 10;

      // Defer state update and logging to idle periods using requestIdleCallback
      const runInIdle = (idleDeadline?: IdleDeadline) => {
        let heapMb: number | undefined;
        if (typeof window !== 'undefined' && (performance as any).memory) {
          heapMb = Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024);
        }

        lazyLoadRegistry[name] = {
          name,
          durationMs,
          timestamp: new Date().toLocaleTimeString(),
          status: 'loaded',
          idleScheduled: true,
          heapMemoryUsedMb: heapMb,
        };

        // Sync with performance dashboard render times
        recordModuleRenderTime(name, durationMs);

        // Client-side LogUtility audit trail
        LogUtility.info(
          `Lazy module [${name}] loaded in ${durationMs}ms (idle time remaining: ${
            idleDeadline ? Math.round(idleDeadline.timeRemaining()) : 'N/A'
          }ms)`,
          {
            module: name,
            durationMs,
            heapMemoryUsedMb: heapMb,
            idleScheduled: true,
          },
          'LazyComponentPerf'
        );

        notifyListeners();
      };

      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        (window as any).requestIdleCallback(runInIdle, { timeout: 1500 });
      } else {
        setTimeout(runInIdle, 0);
      }

      return module;
    } catch (error) {
      const endTime = performance.now();
      const durationMs = Math.round((endTime - startTime) * 10) / 10;

      lazyLoadRegistry[name] = {
        name,
        durationMs,
        timestamp: new Date().toLocaleTimeString(),
        status: 'error',
        idleScheduled: false,
      };

      LogUtility.error(
        `Failed to lazy-load module [${name}]: ${String(error)}`,
        error,
        { module: name },
        'LazyComponentPerf'
      );

      notifyListeners();
      throw error;
    }
  };
}

/**
 * Returns a snapshot of all tracked lazy component timings
 */
export function getLazyLoadRecords(): LazyLoadRecord[] {
  return Object.values(lazyLoadRegistry);
}

/**
 * React hook to subscribe to real-time lazy component load events
 */
export function useLazyLoadTimings(): LazyLoadRecord[] {
  const [records, setRecords] = useState<LazyLoadRecord[]>(() => getLazyLoadRecords());

  useEffect(() => {
    const update = () => setRecords(getLazyLoadRecords());
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);

  return records;
}
