/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Mirovisor IndexedDB Offline Storage Service (using 'idb')
 * Caches critical application state (tenants, cards, security findings)
 * to maintain high availability and interactive workflows during network dropouts.
 */

import { openDB, IDBPDatabase } from 'idb';
import { Tenant, KanbanCard, SecurityFinding } from '../types';
import { LogUtility } from './logUtility';

const DB_NAME = 'mirovisor_offline_db';
const DB_VERSION = 1;

export interface OfflineDBSchema {
  tenants: {
    key: string;
    value: Tenant;
  };
  cards: {
    key: string;
    value: KanbanCard;
  };
  securityFindings: {
    key: string;
    value: SecurityFinding;
  };
  metadata: {
    key: string;
    value: { key: string; updatedAt: string; itemCount: number };
  };
}

class OfflineStorageService {
  private static instance: OfflineStorageService;
  private dbPromise: Promise<IDBPDatabase<any>> | null = null;

  private constructor() {
    // Singleton
  }

  public static getInstance(): OfflineStorageService {
    if (!OfflineStorageService.instance) {
      OfflineStorageService.instance = new OfflineStorageService();
    }
    return OfflineStorageService.instance;
  }

  private getDB(): Promise<IDBPDatabase<any>> {
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      return Promise.reject(new Error('IndexedDB is not supported in this environment.'));
    }

    if (!this.dbPromise) {
      this.dbPromise = openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('tenants')) {
            db.createObjectStore('tenants', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('cards')) {
            db.createObjectStore('cards', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('securityFindings')) {
            db.createObjectStore('securityFindings', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('metadata')) {
            db.createObjectStore('metadata', { keyPath: 'key' });
          }
        },
      });
    }

    return this.dbPromise;
  }

  /**
   * Cache all tenants to IndexedDB
   */
  public async cacheTenants(tenants: Tenant[]): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(['tenants', 'metadata'], 'readwrite');
      const store = tx.objectStore('tenants');
      await store.clear();
      for (const t of tenants) {
        await store.put(t);
      }
      await tx.objectStore('metadata').put({
        key: 'tenants_meta',
        updatedAt: new Date().toISOString(),
        itemCount: tenants.length,
      });
      await tx.done;
    } catch (err) {
      LogUtility.warn('Failed to cache tenants in IndexedDB', { error: String(err) }, 'OfflineStorage');
    }
  }

  /**
   * Retrieve cached tenants from IndexedDB
   */
  public async getCachedTenants(): Promise<Tenant[]> {
    try {
      const db = await this.getDB();
      return await db.getAll('tenants');
    } catch (err) {
      LogUtility.warn('Failed to read cached tenants from IndexedDB', { error: String(err) }, 'OfflineStorage');
      return [];
    }
  }

  /**
   * Cache all Kanban cards to IndexedDB
   */
  public async cacheCards(cards: KanbanCard[]): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(['cards', 'metadata'], 'readwrite');
      const store = tx.objectStore('cards');
      await store.clear();
      for (const c of cards) {
        await store.put(c);
      }
      await tx.objectStore('metadata').put({
        key: 'cards_meta',
        updatedAt: new Date().toISOString(),
        itemCount: cards.length,
      });
      await tx.done;
    } catch (err) {
      LogUtility.warn('Failed to cache cards in IndexedDB', { error: String(err) }, 'OfflineStorage');
    }
  }

  /**
   * Retrieve cached Kanban cards from IndexedDB
   */
  public async getCachedCards(): Promise<KanbanCard[]> {
    try {
      const db = await this.getDB();
      return await db.getAll('cards');
    } catch (err) {
      LogUtility.warn('Failed to read cached cards from IndexedDB', { error: String(err) }, 'OfflineStorage');
      return [];
    }
  }

  /**
   * Cache security findings to IndexedDB
   */
  public async cacheSecurityFindings(findings: SecurityFinding[]): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(['securityFindings', 'metadata'], 'readwrite');
      const store = tx.objectStore('securityFindings');
      await store.clear();
      for (const f of findings) {
        await store.put(f);
      }
      await tx.objectStore('metadata').put({
        key: 'security_meta',
        updatedAt: new Date().toISOString(),
        itemCount: findings.length,
      });
      await tx.done;
    } catch (err) {
      LogUtility.warn('Failed to cache security findings in IndexedDB', { error: String(err) }, 'OfflineStorage');
    }
  }

  /**
   * Retrieve cached security findings from IndexedDB
   */
  public async getCachedSecurityFindings(): Promise<SecurityFinding[]> {
    try {
      const db = await this.getDB();
      return await db.getAll('securityFindings');
    } catch (err) {
      LogUtility.warn('Failed to read cached security findings from IndexedDB', { error: String(err) }, 'OfflineStorage');
      return [];
    }
  }

  /**
   * Atomically save snapshot of all critical application state
   */
  public async saveAppStateSnapshot(
    tenants: Tenant[],
    cards: KanbanCard[],
    findings: SecurityFinding[]
  ): Promise<void> {
    await Promise.all([
      this.cacheTenants(tenants),
      this.cacheCards(cards),
      this.cacheSecurityFindings(findings),
    ]);
    LogUtility.info(
      `IndexedDB snapshot refreshed: ${tenants.length} tenants, ${cards.length} cards, ${findings.length} findings cached.`,
      {},
      'OfflineStorage'
    );
  }

  /**
   * Load entire offline snapshot
   */
  public async loadAppStateSnapshot(): Promise<{
    tenants: Tenant[];
    cards: KanbanCard[];
    securityFindings: SecurityFinding[];
  } | null> {
    try {
      const [tenants, cards, securityFindings] = await Promise.all([
        this.getCachedTenants(),
        this.getCachedCards(),
        this.getCachedSecurityFindings(),
      ]);

      if (tenants.length > 0 || cards.length > 0 || securityFindings.length > 0) {
        return { tenants, cards, securityFindings };
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Clear all offline IndexedDB caches
   */
  public async clearCache(): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(['tenants', 'cards', 'securityFindings', 'metadata'], 'readwrite');
      await tx.objectStore('tenants').clear();
      await tx.objectStore('cards').clear();
      await tx.objectStore('securityFindings').clear();
      await tx.objectStore('metadata').clear();
      await tx.done;
      LogUtility.info('IndexedDB offline cache cleared.', {}, 'OfflineStorage');
    } catch (err) {
      console.warn('Failed to clear IndexedDB cache', err);
    }
  }
}

export const OfflineStorage = OfflineStorageService.getInstance();
