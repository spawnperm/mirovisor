/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Mirovisor Multi-Tenant Isolation Kernel
 * AsyncLocalStorage Context Propagation for Thread-Safe Tenant Isolation
 */
import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  tenantId: string;
  schema: string;
  userId?: string;
  roles?: string[];
  correlationId?: string;
}

const tenantStorage = new AsyncLocalStorage<TenantContext>();

export class TenantContextManager {
  /**
   * Run an asynchronous operation with an isolated tenant context.
   */
  static run<T>(context: TenantContext, callback: () => Promise<T> | T): Promise<T> | T {
    // Validate schema name to guarantee SQL injection safety
    if (!/^[a-z0-9_]{2,64}$/.test(context.schema)) {
      throw new Error(`Invalid tenant schema name identifier: ${context.schema}`);
    }
    return tenantStorage.run(context, callback);
  }

  /**
   * Retrieve the current tenant context. Throws if executed outside tenant context.
   */
  static current(): TenantContext {
    const ctx = tenantStorage.getStore();
    if (!ctx) {
      throw new Error('Operation attempted outside of an active TenantContext');
    }
    return ctx;
  }

  /**
   * Get the current tenant context or return null if none is bound.
   */
  static currentOptional(): TenantContext | null {
    return tenantStorage.getStore() || null;
  }

  /**
   * Safely formats an SQL search_path switch query with sanitized identifier.
   */
  static getSetSearchPathSql(): string {
    const ctx = this.current();
    return `SET LOCAL search_path = "${ctx.schema}", "platform_registry", "public";`;
  }
}
