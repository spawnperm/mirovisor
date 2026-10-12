import { describe, it, expect } from 'vitest';
import { OfflineStorage } from './offlineStorageService';
import { Tenant, KanbanCard, SecurityFinding } from '../types';

describe('OfflineStorageService (IndexedDB Cache Layer)', () => {
  it('gracefully handles non-browser environments without crashing', async () => {
    const tenants = await OfflineStorage.getCachedTenants();
    expect(Array.isArray(tenants)).toBe(true);
    expect(tenants.length).toBe(0);

    const cards = await OfflineStorage.getCachedCards();
    expect(Array.isArray(cards)).toBe(true);
    expect(cards.length).toBe(0);

    const snapshot = await OfflineStorage.loadAppStateSnapshot();
    expect(snapshot).toBeNull();
  });

  it('safely attempts caching and clearing without uncaught exceptions', async () => {
    const mockTenants: Tenant[] = [
      {
        id: 't_mock',
        name: 'Mock Tenant',
        slug: 'mock',
        description: 'Mock description',
        avatarUrl: '',
        visibility: 'private',
        ownerId: 'u1',
        ownerName: 'Admin',
        memberCount: 5,
        schema: 'tenant_mock',
        storageQuotaMb: 10000,
        storageUsedMb: 500,
        createdAt: '2026-10-12',
        tags: ['test'],
      },
    ];

    const mockCards: KanbanCard[] = [
      {
        id: 'c_mock',
        title: 'Offline Card',
        description: 'Testing offline cache',
        type: 'devops',
        priority: 'high',
        column: 'ideas',
        source: '',
        attachments: [],
        checklist: [],
        createdBy: 'spawnperm',
        createdAt: '2026-10-12',
        comments: [],
      },
    ];

    const mockFindings: SecurityFinding[] = [];

    await expect(
      OfflineStorage.saveAppStateSnapshot(mockTenants, mockCards, mockFindings)
    ).resolves.not.toThrow();

    await expect(OfflineStorage.clearCache()).resolves.not.toThrow();
  });
});
