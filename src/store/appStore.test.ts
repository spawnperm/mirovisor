import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './useAppStore';
import { selectNavigationState, selectKanbanState, selectA11yPreferences } from './selectors';
import { KanbanCard } from '../types';

describe('useAppStore (Zustand Global State)', () => {
  beforeEach(() => {
    useAppStore.getState().resetUiState();
  });

  it('manages active tab and modal states correctly', () => {
    const store = useAppStore.getState();
    expect(store.activeTab).toBe('audit');

    store.setActiveTab('kanban');
    expect(useAppStore.getState().activeTab).toBe('kanban');

    store.setSearchOpen(true);
    expect(useAppStore.getState().isSearchOpen).toBe(true);

    store.setSearchOpen(false);
    expect(useAppStore.getState().isSearchOpen).toBe(false);
  });

  it('enforces WIP limit strictly on moveCard to in_progress', () => {
    const testCards: KanbanCard[] = [
      { id: 'c1', title: 'Task 1', description: '', type: 'security', priority: 'high', column: 'in_progress', source: '', attachments: [], checklist: [], createdBy: '', createdAt: '', comments: [] },
      { id: 'c2', title: 'Task 2', description: '', type: 'devops', priority: 'medium', column: 'in_progress', source: '', attachments: [], checklist: [], createdBy: '', createdAt: '', comments: [] },
      { id: 'c3', title: 'Task 3', description: '', type: 'testing', priority: 'low', column: 'in_progress', source: '', attachments: [], checklist: [], createdBy: '', createdAt: '', comments: [] },
      { id: 'c4', title: 'Task 4', description: '', type: 'ux', priority: 'high', column: 'ideas', source: '', attachments: [], checklist: [], createdBy: '', createdAt: '', comments: [] },
    ];

    useAppStore.setState({ cards: testCards });

    // Try moving 4th card to in_progress - must be rejected
    const moved = useAppStore.getState().moveCard('c4', 'in_progress');
    expect(moved).toBe(false);
    expect(useAppStore.getState().cards.find((c) => c.id === 'c4')?.column).toBe('ideas');
  });

  it('allows moving cards to collected and applies rollback', () => {
    const testCard: KanbanCard = {
      id: 'c-test',
      title: 'PostgreSQL RLS Hardening',
      description: '',
      type: 'security',
      priority: 'critical',
      column: 'in_progress',
      source: '',
      attachments: [],
      checklist: [],
      createdBy: 'AppSec Agent',
      createdAt: '',
      comments: [],
    };

    useAppStore.setState({ cards: [testCard] });

    useAppStore.getState().moveCard('c-test', 'collected');
    expect(useAppStore.getState().cards[0].column).toBe('collected');

    // Rollback test
    useAppStore.getState().rollbackCard('c-test', 'Regression in unit tests');
    const rolledBack = useAppStore.getState().cards[0];
    expect(rolledBack.column).toBe('deferred');
    expect(rolledBack.rolledBack).toBe(true);
    expect(rolledBack.rejectionReason).toContain('Regression in unit tests');
  });

  it('executes predefined voice macros and records history', () => {
    const store = useAppStore.getState();
    const nightlyMacro = store.macros.find((m) => m.keyword.toLowerCase().includes('nightly'));

    if (nightlyMacro) {
      const priorTurns = store.voiceMemory.length;
      store.executeMacro(nightlyMacro);

      const updatedMemory = useAppStore.getState().voiceMemory;
      expect(updatedMemory.length).toBeGreaterThan(priorTurns);
      const lastAgentTurn = updatedMemory[updatedMemory.length - 1];
      expect(lastAgentTurn.role).toBe('agent');
      expect(lastAgentTurn.text).toContain('Исполнен голосовой макрос');
    }
  });

  it('manages WCAG 2.1 AA accessibility preferences and announcements', () => {
    const store = useAppStore.getState();

    // High contrast
    store.setHighContrast(true);
    expect(useAppStore.getState().highContrast).toBe(true);

    // Font scaling
    store.setFontSizePreference('large');
    expect(useAppStore.getState().fontSizePreference).toBe('large');

    // Reduced motion
    store.setReducedMotion(true);
    expect(useAppStore.getState().reducedMotion).toBe(true);

    // Enhanced focus rings
    store.setEnhancedFocusRings(true);
    expect(useAppStore.getState().enhancedFocusRings).toBe(true);

    // Screen reader announcement
    store.announceToScreenReader('Тестовое оповещение для скринридера');
    expect(useAppStore.getState().announcementMessage).toBe('Тестовое оповещение для скринридера');
  });

  it('memoized selectors maintain shallow equality when unrelated store data (toasts, telemetry) changes', () => {
    const store = useAppStore.getState();
    const navBefore = selectNavigationState(store);
    const kanbanBefore = selectKanbanState(store);
    const a11yBefore = selectA11yPreferences(store);

    // Modify completely unrelated state: push a toast and record telemetry
    store.addToast({
      title: 'Unrelated Toast',
      message: 'This should not invalidate memoized layout slices',
      type: 'info',
    });
    store.recordTelemetryEvent({
      type: 'navigation_tab',
      target: 'test_button',
    });

    const stateAfter = useAppStore.getState();
    const navAfter = selectNavigationState(stateAfter);
    const kanbanAfter = selectKanbanState(stateAfter);
    const a11yAfter = selectA11yPreferences(stateAfter);

    // Verify shallow equality across all keys (exact reference equality for each selected field)
    for (const key of Object.keys(navBefore) as (keyof typeof navBefore)[]) {
      expect(navBefore[key]).toBe(navAfter[key]);
    }
    for (const key of Object.keys(kanbanBefore) as (keyof typeof kanbanBefore)[]) {
      expect(kanbanBefore[key]).toBe(kanbanAfter[key]);
    }
    for (const key of Object.keys(a11yBefore) as (keyof typeof a11yBefore)[]) {
      expect(a11yBefore[key]).toBe(a11yAfter[key]);
    }
  });

  it('manages user-controlled theme switcher and toggles dark mode', () => {
    const store = useAppStore.getState();
    store.setTheme('dark');
    expect(useAppStore.getState().theme).toBe('dark');

    store.toggleTheme();
    expect(useAppStore.getState().theme).toBe('light');

    store.toggleTheme();
    expect(useAppStore.getState().theme).toBe('dark');
  });

  it('captures client-side errors via LogUtility and manages RLS policies', () => {
    const store = useAppStore.getState();
    const initialLogsCount = store.clientLogs.length;

    // Add client error log
    store.addClientLog({
      id: 'test_err_1',
      timestamp: '12:00:00.000',
      level: 'error',
      service: 'TestRunner',
      message: 'Simulated client exception',
      orgId: 't_holding',
    });

    expect(useAppStore.getState().clientLogs.length).toBe(initialLogsCount + 1);

    // Test RLS policy management
    const testPolicy = {
      id: 'test_rls_new',
      tenantId: 't_holding',
      tableName: 'invoices',
      policyName: 'invoice_tenant_isolation',
      command: 'ALL' as const,
      roles: 'public',
      usingExpression: "tenant_id = current_setting('app.current_tenant_id', true)",
      isPermissive: true,
      status: 'active' as const,
      createdAt: '2026-10-12T00:00:00.000Z',
      description: 'Test policy',
    };

    store.saveRlsPolicy(testPolicy);
    expect(useAppStore.getState().rlsPolicies.some((p) => p.id === 'test_rls_new')).toBe(true);

    store.deleteRlsPolicy('test_rls_new');
    expect(useAppStore.getState().rlsPolicies.some((p) => p.id === 'test_rls_new')).toBe(false);
  });

  it('manages custom card tags (add, remove, set) with deduplication', () => {
    const testCard: KanbanCard = {
      id: 'c-tags-test',
      title: 'Tags Test Card',
      description: '',
      type: 'security',
      priority: 'high',
      column: 'ideas',
      source: '',
      attachments: [],
      checklist: [],
      tags: ['init-tag'],
      createdBy: 'TestAgent',
      createdAt: '',
      comments: [],
    };

    useAppStore.setState({ cards: [testCard] });
    const store = useAppStore.getState();

    // Add tag
    store.addCardTag('c-tags-test', 'security-audit');
    expect(useAppStore.getState().cards[0].tags).toContain('security-audit');

    // Add duplicate tag (should not duplicate)
    store.addCardTag('c-tags-test', 'SECURITY-AUDIT');
    expect(useAppStore.getState().cards[0].tags?.filter((t) => t === 'security-audit').length).toBe(1);

    // Remove tag
    store.removeCardTag('c-tags-test', 'init-tag');
    expect(useAppStore.getState().cards[0].tags).not.toContain('init-tag');

    // Set batch tags
    store.setCardTags('c-tags-test', ['frontend', 'perf', 'frontend']);
    expect(useAppStore.getState().cards[0].tags).toEqual(['frontend', 'perf']);
  });
});
