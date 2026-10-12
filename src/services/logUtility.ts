/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Mirovisor Centralized LogUtility Service
 * Captures, buffers, and persists client-side errors, warnings, and audit events.
 * Bridges frontend runtime exceptions to the Observability Hub audit trails.
 */

import { ClientLogEntry } from '../types';

type LogListener = (entry: ClientLogEntry) => void;

class LogUtilityService {
  private static instance: LogUtilityService;
  private listeners: Set<LogListener> = new Set();
  private maxStoredLogs = 100;
  private isInitialized = false;

  private constructor() {
    // Initialized on demand
  }

  public static getInstance(): LogUtilityService {
    if (!LogUtilityService.instance) {
      LogUtilityService.instance = new LogUtilityService();
    }
    return LogUtilityService.instance;
  }

  /**
   * Initializes global error listeners for uncaught exceptions and unhandled promise rejections.
   */
  public initGlobalHandlers(): void {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // Window global uncaught error handler
    window.addEventListener('error', (event: ErrorEvent) => {
      this.error(
        event.message || 'Uncaught runtime exception',
        event.error || new Error(event.message),
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
        'Window-Uncaught'
      );
    });

    // Window unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message = reason instanceof Error ? reason.message : String(reason);
      this.error(
        `Unhandled Promise Rejection: ${message}`,
        reason instanceof Error ? reason : undefined,
        { reason: String(reason) },
        'Promise-Rejection'
      );
    });

    console.info('[Mirovisor LogUtility] Global error and rejection handlers initialized.');
  }

  /**
   * Record a frontend error with stack trace and context
   */
  public error(
    message: string,
    error?: Error | unknown,
    context?: Record<string, any>,
    service = 'Frontend-Client'
  ): ClientLogEntry {
    const stack = error instanceof Error ? error.stack : undefined;
    const entry = this.createEntry('error', message, service, stack, context);
    this.persistEntry(entry);
    console.error(`[Mirovisor Audit Error] [${service}] ${message}`, { error, context });
    return entry;
  }

  /**
   * Record a warning
   */
  public warn(
    message: string,
    context?: Record<string, any>,
    service = 'Frontend-Client'
  ): ClientLogEntry {
    const entry = this.createEntry('warn', message, service, undefined, context);
    this.persistEntry(entry);
    console.warn(`[Mirovisor Audit Warn] [${service}] ${message}`, context);
    return entry;
  }

  /**
   * Record an informational log or audit trail event
   */
  public info(
    message: string,
    context?: Record<string, any>,
    service = 'Frontend-Client'
  ): ClientLogEntry {
    const entry = this.createEntry('info', message, service, undefined, context);
    this.persistEntry(entry);
    console.info(`[Mirovisor Audit Info] [${service}] ${message}`, context);
    return entry;
  }

  /**
   * Create standard structured log entry
   */
  private createEntry(
    level: 'info' | 'warn' | 'error',
    message: string,
    service: string,
    stack?: string,
    context?: Record<string, any>
  ): ClientLogEntry {
    let orgId = 't_holding';
    let url = typeof window !== 'undefined' ? window.location.pathname : '/';

    try {
      // Lazy read active tenant if available in localStorage or state
      const savedTenant = typeof localStorage !== 'undefined' ? localStorage.getItem('mirovisor_active_tenant_id') : null;
      if (savedTenant) orgId = savedTenant;
    } catch {}

    const now = new Date();
    const timestamp = now.toLocaleTimeString() + '.' + String(now.getMilliseconds()).padStart(3, '0');

    return {
      id: `clog_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp,
      level,
      service,
      message,
      stack,
      context,
      orgId,
      url,
    };
  }

  /**
   * Persists log entry to localStorage and notifies listeners
   */
  private persistEntry(entry: ClientLogEntry): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = this.getStoredLogs();
        const updated = [entry, ...stored].slice(0, this.maxStoredLogs);
        localStorage.setItem('mirovisor_client_logs', JSON.stringify(updated));
      }
    } catch (err) {
      console.warn('[LogUtility] Failed to persist to localStorage', err);
    }

    // Notify registered listeners
    this.listeners.forEach((listener) => {
      try {
        listener(entry);
      } catch (e) {
        console.error('[LogUtility] Listener notification error', e);
      }
    });
  }

  /**
   * Retrieve stored logs from localStorage
   */
  public getStoredLogs(): ClientLogEntry[] {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    try {
      const data = localStorage.getItem('mirovisor_client_logs');
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  }

  /**
   * Clear all persisted client logs
   */
  public clearLogs(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.removeItem('mirovisor_client_logs');
      } catch {}
    }
  }

  /**
   * Subscribe to new log entries in real-time
   */
  public subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const LogUtility = LogUtilityService.getInstance();
