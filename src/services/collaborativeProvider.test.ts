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
});
