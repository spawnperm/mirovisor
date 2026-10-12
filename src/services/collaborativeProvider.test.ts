import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as Y from 'yjs';
import { MirovisorCollaborativeProvider } from './collaborativeProvider';

describe('MirovisorCollaborativeProvider (CRDT & WebRTC)', () => {
  let docA: Y.Doc;
  let docB: Y.Doc;
  let providerA: MirovisorCollaborativeProvider | undefined;
  let providerB: MirovisorCollaborativeProvider | undefined;

  beforeEach(() => {
    docA = new Y.Doc();
    docB = new Y.Doc();
  });

  afterEach(() => {
    if (providerA) providerA.destroy();
    if (providerB) providerB.destroy();
  });

  it('initializes local user in peers map with active status', () => {
    providerA = new MirovisorCollaborativeProvider({
      roomName: 'tenant-test-room-42',
      doc: docA,
      user: {
        id: 'usr-001',
        name: 'Алексей Архитектор',
        color: '#06b6d4',
        role: 'SuperAdmin',
      },
    });

    const localPeer = providerA.peers.get('usr-001');
    expect(localPeer).toBeDefined();
    expect(localPeer?.name).toBe('Алексей Архитектор');
    expect(localPeer?.status).toBe('active');
  });

  it('updates awareness presence when typing or idle', () => {
    providerA = new MirovisorCollaborativeProvider({
      roomName: 'tenant-test-room-42',
      doc: docA,
      user: {
        id: 'usr-001',
        name: 'Алексей Архитектор',
        color: '#06b6d4',
        role: 'SuperAdmin',
      },
    });

    providerA.setLocalStatus('typing');
    expect(providerA.peers.get('usr-001')?.status).toBe('typing');

    providerA.setLocalStatus('idle');
    expect(providerA.peers.get('usr-001')?.status).toBe('idle');
  });

  it('synchronizes Y.Text changes between collaborative documents', () => {
    // Test CRDT state vector exchange
    const textA = docA.getText('card-title');
    const textB = docB.getText('card-title');

    textA.insert(0, 'Рефакторинг PostgreSQL Schemas');

    const stateUpdate = Y.encodeStateAsUpdate(docA);
    Y.applyUpdate(docB, stateUpdate);

    expect(textB.toString()).toBe('Рефакторинг PostgreSQL Schemas');
  });

  it('resolves concurrent CRDT text edits deterministically without divergence', () => {
    const textA = docA.getText('description');
    const textB = docB.getText('description');

    // Initial synchronized baseline
    textA.insert(0, 'План: ');
    Y.applyUpdate(docB, Y.encodeStateAsUpdate(docA));

    // Peer A adds step 1
    textA.insert(6, '1. Настроить RLS. ');

    // Peer B concurrently adds step 2
    textB.insert(6, '2. Проверить индексы. ');

    // Bidirectional sync
    const updateAtoB = Y.encodeStateAsUpdate(docA);
    const updateBtoA = Y.encodeStateAsUpdate(docB);

    Y.applyUpdate(docB, updateAtoB);
    Y.applyUpdate(docA, updateBtoA);

    // Both documents must converge to the exact same text
    expect(textA.toString()).toBe(textB.toString());
    expect(textA.toString()).toContain('Настроить RLS');
    expect(textA.toString()).toContain('Проверить индексы');
  });

  it('synchronizes Y.Map metadata for Kanban cards', () => {
    const cardMapA = docA.getMap('card-meta-101');
    const cardMapB = docB.getMap('card-meta-101');

    cardMapA.set('column', 'in_progress');
    cardMapA.set('priority', 'critical');
    cardMapA.set('assignee', 'DevOps Agent');

    Y.applyUpdate(docB, Y.encodeStateAsUpdate(docA));

    expect(cardMapB.get('column')).toBe('in_progress');
    expect(cardMapB.get('priority')).toBe('critical');
    expect(cardMapB.get('assignee')).toBe('DevOps Agent');
  });

  it('properly cleans up awareness and state on provider destroy', () => {
    providerA = new MirovisorCollaborativeProvider({
      roomName: 'tenant-test-room-destroy',
      doc: docA,
      user: {
        id: 'usr-002',
        name: 'Инженер QA',
        color: '#10b981',
        role: 'Developer',
      },
    });

    expect(providerA.peers.size).toBeGreaterThanOrEqual(1);
    providerA.destroy();
    expect(providerA.peers.size).toBe(0);
  });
});
