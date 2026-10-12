import { create } from 'zustand';
import {
  Tenant,
  User,
  KanbanCard,
  CardColumn,
  CardType,
  PluginManifest,
  CrmContact,
  CrmDeal,
  LmsCourse,
  SocialPost,
  SecurityFinding,
  PipelineBuild,
  TenantConfiguration,
  SystemMetric,
  ClientLogEntry,
  RlsPolicy,
} from '../types';
import { LogUtility } from '../services/logUtility';
import { VoiceMacro } from '../types/macros';
import { ConversationTurn, VoiceActionResult } from '../components/devtools/VoiceControlModal';
import {
  INITIAL_TENANTS,
  CURRENT_USER,
  INITIAL_KANBAN_CARDS,
  INITIAL_PLUGINS,
  INITIAL_CRM_CONTACTS,
  INITIAL_CRM_DEALS,
  INITIAL_LMS_COURSES,
  INITIAL_SOCIAL_POSTS,
  INITIAL_SECURITY_FINDINGS,
  INITIAL_METRICS,
  INITIAL_BUILDS,
} from '../data/mockData';
import { DEFAULT_VOICE_MACROS } from '../data/defaultMacros';
import { AiAgentService } from '../services/aiAgentService';
import { NavTabId } from '../components/layout/Header';

export interface AppState {
  // Navigation & Modals
  activeTab: NavTabId;
  setActiveTab: (tab: NavTabId) => void;
  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  isTerminalOpen: boolean;
  setTerminalOpen: (open: boolean) => void;
  isVoiceOpen: boolean;
  setVoiceOpen: (open: boolean) => void;
  isMacroRegistryOpen: boolean;
  setMacroRegistryOpen: (open: boolean) => void;

  // Tenants & User
  tenants: Tenant[];
  activeTenant: Tenant;
  currentUser: User;
  setActiveTenant: (tenant: Tenant | string) => void;
  updateTenantConfig: (tenantId: string, updatedConfig: TenantConfiguration) => void;
  createTenant: (newTenantPartial: Partial<Tenant>) => void;

  // Kanban
  cards: KanbanCard[];
  moveCard: (cardId: string, targetCol: CardColumn, feedbackReason?: string) => boolean;
  updateCard: (updatedCard: KanbanCard) => void;
  addCard: (newCard: KanbanCard) => void;
  rateCard: (cardId: string, rating: number, feedback: string) => void;
  rollbackCard: (cardId: string, reason: string) => void;

  // CI/CD Pipelines
  builds: PipelineBuild[];
  triggerBuild: (branch: string) => Promise<void>;

  // Plugins
  plugins: PluginManifest[];
  installPlugin: (pluginId: string) => void;
  uninstallPlugin: (pluginId: string) => void;
  addPluginManifest: (manifest: PluginManifest) => void;

  // Business CRM & Univer
  crmContacts: CrmContact[];
  crmDeals: CrmDeal[];
  addCrmContact: (contact: CrmContact) => void;
  addCrmDeal: (deal: CrmDeal) => void;

  // LMS Courses
  courses: LmsCourse[];
  completeCourse: (courseId: string) => void;

  // Community Social Feed
  posts: SocialPost[];
  addPost: (post: SocialPost) => void;

  // Security Findings & Gates
  securityFindings: SecurityFinding[];
  addSecurityFinding: (finding: SecurityFinding) => void;
  pushFindingToKanban: (finding: SecurityFinding) => void;
  remediateFinding: (finding: SecurityFinding) => void;

  // Observability & Metrics
  metrics: Record<string, SystemMetric>;
  setMetrics: (metrics: Record<string, SystemMetric>) => void;

  // Voice Interaction Memory & Macros
  voiceMemory: ConversationTurn[];
  setVoiceMemory: (updater: ConversationTurn[] | ((prev: ConversationTurn[]) => ConversationTurn[])) => void;
  macros: VoiceMacro[];
  setMacros: (updater: VoiceMacro[] | ((prev: VoiceMacro[]) => VoiceMacro[])) => void;
  executeVoiceCommand: (commandText: string, customMemory?: ConversationTurn[]) => VoiceActionResult;
  executeMacro: (macro: VoiceMacro) => void;

  // Global Toast Notifications
  toasts: import('../types').ToastNotification[];
  addToast: (toast: Omit<import('../types').ToastNotification, 'id' | 'timestamp'> & { id?: string }) => void;
  dismissToast: (id: string) => void;
  clearToasts: () => void;

  // Product Interaction Telemetry
  telemetryEvents: import('../types').ProductTelemetryEvent[];
  recordTelemetryEvent: (event: Omit<import('../types').ProductTelemetryEvent, 'id' | 'timestamp' | 'tenantId' | 'userId'>) => void;

  // Accessibility & UX Preferences (WCAG 2.1 AA)
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
  fontSizePreference: 'normal' | 'large' | 'xlarge';
  setFontSizePreference: (pref: 'normal' | 'large' | 'xlarge') => void;
  reducedMotion: boolean;
  setReducedMotion: (enabled: boolean) => void;
  enhancedFocusRings: boolean;
  setEnhancedFocusRings: (enabled: boolean) => void;
  isA11yPanelOpen: boolean;
  setA11yPanelOpen: (open: boolean) => void;
  announcementMessage: string | null;
  announceToScreenReader: (msg: string) => void;

  // Theme Management (Tailwind CSS dark mode strategy)
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;

  // Client-Side Error & Audit Logs (LogUtility)
  clientLogs: ClientLogEntry[];
  addClientLog: (log: ClientLogEntry) => void;
  clearClientLogs: () => void;

  // Postgres Row-Level Security (RLS) Policies
  rlsPolicies: RlsPolicy[];
  saveRlsPolicy: (policy: RlsPolicy) => void;
  deleteRlsPolicy: (policyId: string) => void;

  // Reset UI State
  resetUiState: () => void;
}

const loadStoredVoiceMemory = (): ConversationTurn[] => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('mirovisor_voice_conversation_memory');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
  }
  return AiAgentService.getInstance().getVoiceConversationHistory();
};

const loadStoredMacros = (): VoiceMacro[] => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('mirovisor_voice_macros');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
  }
  return DEFAULT_VOICE_MACROS;
};

const INITIAL_RLS_POLICIES: RlsPolicy[] = [
  {
    id: 'rls_1',
    tenantId: 't_holding',
    tableName: 'crm_deals',
    policyName: 'tenant_isolation_crm_deals',
    command: 'ALL',
    roles: 'public',
    usingExpression: "tenant_id = current_setting('app.current_tenant_id', true)",
    withCheckExpression: "tenant_id = current_setting('app.current_tenant_id', true)",
    isPermissive: true,
    status: 'active',
    createdAt: '2026-10-12T00:00:00.000Z',
    description: 'Изоляция сделок CRM на уровне текущего контекста схемы тенанта',
  },
  {
    id: 'rls_2',
    tenantId: 't_holding',
    tableName: 'security_findings',
    policyName: 'holding_auditor_security_findings',
    command: 'SELECT',
    roles: 'holding_auditor',
    usingExpression: "current_setting('app.user_role', true) = 'holding_auditor' OR tenant_id = current_setting('app.current_tenant_id', true)",
    isPermissive: true,
    status: 'active',
    createdAt: '2026-10-12T00:00:00.000Z',
    description: 'Сквозной аудит уязвимостей безопасности для суперадминистратора и аудитора холдинга',
  },
  {
    id: 'rls_3',
    tenantId: 't_fintech',
    tableName: 'kanban_cards',
    policyName: 'fintech_strict_kanban_policy',
    command: 'ALL',
    roles: 'tenant_user',
    usingExpression: "tenant_id = 't_fintech' AND current_setting('app.current_tenant_id', true) = 't_fintech'",
    withCheckExpression: "tenant_id = 't_fintech'",
    isPermissive: true,
    status: 'active',
    createdAt: '2026-10-12T00:00:00.000Z',
    description: 'Строгая изоляция финтех-задач Канбан с запретом перемещения между тенантами',
  },
];

const getStoredRlsPolicies = (): RlsPolicy[] => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('mirovisor_rls_policies');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
  }
  return INITIAL_RLS_POLICIES;
};

const getInitialTheme = (): 'dark' | 'light' => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('mirovisor_theme');
      if (saved === 'light' || saved === 'dark') {
        document.documentElement.classList.toggle('dark', saved === 'dark');
        return saved;
      }
    } catch {}
  }
  return 'dark';
};

export const useAppStore = create<AppState>((set, get) => ({
  // Navigation & Modals initial state
  activeTab: 'audit',
  setActiveTab: (tab) => {
    set({ activeTab: tab });
    get().announceToScreenReader(`Переход в раздел ${tab}`);
  },
  isSearchOpen: false,
  setSearchOpen: (open) => set({ isSearchOpen: open }),
  isTerminalOpen: false,
  setTerminalOpen: (open) => set({ isTerminalOpen: open }),
  isVoiceOpen: false,
  setVoiceOpen: (open) => set({ isVoiceOpen: open }),
  isMacroRegistryOpen: false,
  setMacroRegistryOpen: (open) => set({ isMacroRegistryOpen: open }),

  // Accessibility preferences initial state (WCAG 2.1 AA)
  highContrast: typeof window !== 'undefined' ? localStorage.getItem('mirovisor_a11y_contrast') === 'true' : false,
  setHighContrast: (enabled) => {
    if (typeof window !== 'undefined') localStorage.setItem('mirovisor_a11y_contrast', String(enabled));
    set({ highContrast: enabled });
  },
  fontSizePreference: (typeof window !== 'undefined' ? (localStorage.getItem('mirovisor_a11y_font_size') as 'normal' | 'large' | 'xlarge') : 'normal') || 'normal',
  setFontSizePreference: (pref) => {
    if (typeof window !== 'undefined') localStorage.setItem('mirovisor_a11y_font_size', pref);
    set({ fontSizePreference: pref });
  },
  reducedMotion: typeof window !== 'undefined' ? localStorage.getItem('mirovisor_a11y_reduced_motion') === 'true' : false,
  setReducedMotion: (enabled) => {
    if (typeof window !== 'undefined') localStorage.setItem('mirovisor_a11y_reduced_motion', String(enabled));
    set({ reducedMotion: enabled });
  },
  enhancedFocusRings: typeof window !== 'undefined' ? localStorage.getItem('mirovisor_a11y_focus') === 'true' : true,
  setEnhancedFocusRings: (enabled) => {
    if (typeof window !== 'undefined') localStorage.setItem('mirovisor_a11y_focus', String(enabled));
    set({ enhancedFocusRings: enabled });
  },
  isA11yPanelOpen: false,
  setA11yPanelOpen: (open) => set({ isA11yPanelOpen: open }),
  announcementMessage: null,
  announceToScreenReader: (msg) => {
    set({ announcementMessage: msg });
    setTimeout(() => {
      if (get().announcementMessage === msg) {
        set({ announcementMessage: null });
      }
    }, 4000);
  },

  // Tenants & User initial state
  tenants: INITIAL_TENANTS,
  activeTenant: INITIAL_TENANTS[0],
  currentUser: CURRENT_USER,

  setActiveTenant: (target) => {
    if (typeof target === 'string') {
      const found = get().tenants.find((t) => t.id === target);
      if (found) set({ activeTenant: found });
    } else {
      set({ activeTenant: target });
    }
  },

  updateTenantConfig: (tenantId, updatedConfig) => {
    set((state) => ({
      tenants: state.tenants.map((t) => (t.id === tenantId ? { ...t, config: updatedConfig } : t)),
      activeTenant:
        state.activeTenant.id === tenantId
          ? { ...state.activeTenant, config: updatedConfig }
          : state.activeTenant,
    }));
  },

  createTenant: (newTenantPartial) => {
    const { currentUser, tenants } = get();
    const newId = `tenant_${newTenantPartial.slug || Date.now().toString()}`;
    const newTenant: Tenant = {
      id: newId,
      name: newTenantPartial.name || 'Новый тенант',
      slug: newTenantPartial.slug || 'new-tenant',
      description: newTenantPartial.description || 'Изолированное пространство данных',
      avatarUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=120&auto=format&fit=crop&q=80',
      visibility: newTenantPartial.visibility || 'private',
      ownerId: currentUser.id,
      ownerName: currentUser.fullName,
      memberCount: 1,
      schema: `tenant_${(newTenantPartial.slug || 'client').replace(/-/g, '_')}`,
      storageQuotaMb: 10240,
      storageUsedMb: 120,
      createdAt: new Date().toISOString().split('T')[0],
      tags: ['New Tenant', 'Schema-per-Tenant', 'RLS Force'],
      config: {
        features: {
          enableCrm: true,
          enableLms: true,
          enableUniverOffice: true,
          enableWebContainers: true,
          enableSelfHealingCi: true,
        },
        quotas: {
          maxUsers: 100,
          storageQuotaMb: 10240,
          apiRateLimitRps: 300,
        },
        branding: {
          primaryColor: '#0ea5e9',
          accentColor: '#6366f1',
          customTitle: newTenantPartial.name || 'Портал клиента',
          themeStyle: 'slate-enterprise',
        },
      },
    };

    set({
      tenants: [newTenant, ...tenants],
      activeTenant: newTenant,
    });
  },

  // Kanban Cards initial state
  cards: INITIAL_KANBAN_CARDS,

  moveCard: (cardId, targetCol, feedbackReason) => {
    const { cards } = get();
    const card = cards.find((c) => c.id === cardId);
    if (!card) return false;

    if (targetCol === 'in_progress') {
      const inProgressCount = cards.filter((c) => c.column === 'in_progress' && c.id !== cardId).length;
      if (inProgressCount >= 3) {
        if (typeof window !== 'undefined' && typeof window.alert === 'function') {
          window.alert('Превышен WIP-лимит: не более 3 задач в колонке «В работу»!');
        }
        return false;
      }
    }

    set({
      cards: cards.map((c) =>
        c.id === cardId
          ? {
              ...c,
              column: targetCol,
              movedAt: new Date().toISOString(),
              rejectionReason: feedbackReason || c.rejectionReason,
            }
          : c
      ),
    });
    return true;
  },

  updateCard: (updatedCard) => {
    set((state) => ({
      cards: state.cards.map((c) => (c.id === updatedCard.id ? updatedCard : c)),
    }));
  },

  addCard: (newCard) => {
    set((state) => ({
      cards: [newCard, ...state.cards],
    }));
  },

  rateCard: (cardId, rating, feedback) => {
    const { cards } = get();
    set({
      cards: cards.map((c) =>
        c.id === cardId
          ? {
              ...c,
              userRating: rating,
              ratingFeedback: feedback,
            }
          : c
      ),
    });

    const card = cards.find((c) => c.id === cardId);
    if (card) {
      AiAgentService.getInstance().recordFeedback(
        card.createdBy,
        `Оценка качества кода для [${card.title}]: ${rating}/5 звезд. Отзыв: "${feedback}"`
      );
    }
  },

  rollbackCard: (cardId, reason) => {
    const { cards } = get();
    set({
      cards: cards.map((c) =>
        c.id === cardId
          ? {
              ...c,
              column: 'deferred',
              rolledBack: true,
              rollbackCommitHash: `rev_${Math.random().toString(36).substring(2, 9)}`,
              rejectionReason: `ОТКАТ: ${reason}`,
            }
          : c
      ),
    });

    const card = cards.find((c) => c.id === cardId);
    if (card) {
      AiAgentService.getInstance().recordFeedback(
        card.createdBy,
        `КРИТИЧЕСКИЙ ОТКАТ изменений кода для [${card.title}]. Причина: ${reason}`
      );
    }
  },

  // CI/CD Builds
  builds: INITIAL_BUILDS,

  triggerBuild: async (branch: string) => {
    const { builds, currentUser, securityFindings, activeTenant, addCard } = get();
    const nextNumber = (builds[0]?.buildNumber || 1044) + 1;
    const newBuild: PipelineBuild = {
      id: `build_${nextNumber}`,
      buildNumber: nextNumber,
      branch: branch,
      commitSha: Math.random().toString(36).substring(2, 9),
      commitMessage: `chore(pipeline): automated build run for ${branch} with security gates`,
      author: currentUser.fullName,
      status: 'success',
      startedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      durationSec: 135,
      environment: branch === 'main' ? 'production' : 'staging',
      natsEventPublished: true,
      findings: securityFindings.filter((f) => f.status === 'open'),
      steps: [
        {
          id: 's1',
          name: 'Checkout & Setup pnpm 9',
          status: 'success',
          durationSec: 6,
          logs: ['Checkout depth=0', 'pnpm install --frozen-lockfile OK'],
        },
        {
          id: 's2',
          name: 'Nx Affected Build & Lint',
          status: 'success',
          durationSec: 28,
          logs: ['Distributed execution on Nx Agents...', 'All targets compiled.'],
        },
        {
          id: 's3',
          name: 'Automated Security Gates (SAST/SCA/Secret/DAST)',
          status: 'success',
          durationSec: 42,
          logs: [
            'Running CodeQL Semantic SAST...',
            'Running Snyk Open Source SCA Audit...',
            'Running Gitleaks Secret Scanner...',
            'Running OWASP ZAP Baseline DAST...',
            'Security gates completed with reports.',
          ],
        },
        {
          id: 's4',
          name: 'Testcontainers Integration Suite',
          status: 'success',
          durationSec: 36,
          logs: ['Real PostgreSQL 16 & Redis & NATS verified.', '42 test suites passed.'],
        },
        {
          id: 's5',
          name: 'NATS JetStream & Cordis Analysis',
          status: 'success',
          durationSec: 23,
          logs: [
            `Published BuildCompleted to NATS subject: tenant.${activeTenant.id}.build`,
            'Cordis AI Agents synthesized new optimization proposal.',
          ],
        },
      ],
    };

    set({ builds: [newBuild, ...builds] });
    get().addToast({
      type: 'success',
      title: `CI/CD Сборка #${nextNumber} завершена`,
      message: `Ветка ${branch} прошла все Security Gates и тесты.`,
    });

    try {
      const newCard = await AiAgentService.getInstance().analyzeTelemetry(
        'security',
        `Automated Pipeline Build #${nextNumber} on branch ${branch} executed. NATS JetStream event published.`
      );
      addCard(newCard);
    } catch (e) {
      console.warn('AI telemetry failed:', e);
    }
  },

  // Plugins
  plugins: INITIAL_PLUGINS,
  installPlugin: (pluginId) => {
    const { activeTenant } = get();
    set((state) => ({
      plugins: state.plugins.map((p) => {
        if (p.id === pluginId && !p.installedInTenants.includes(activeTenant.id)) {
          return {
            ...p,
            installedInTenants: [...p.installedInTenants, activeTenant.id],
          };
        }
        return p;
      }),
    }));
    get().addToast({
      type: 'success',
      title: 'Плагин активирован',
      message: `Плагин ${pluginId} установлен в схему ${activeTenant.schema}.`,
    });
  },
  uninstallPlugin: (pluginId) => {
    const { activeTenant } = get();
    set((state) => ({
      plugins: state.plugins.map((p) => {
        if (p.id === pluginId) {
          return {
            ...p,
            installedInTenants: p.installedInTenants.filter((id) => id !== activeTenant.id),
          };
        }
        return p;
      }),
    }));
  },
  addPluginManifest: (manifest) => {
    set((state) => ({
      plugins: [manifest, ...state.plugins],
    }));
  },

  // CRM Contacts & Deals
  crmContacts: INITIAL_CRM_CONTACTS,
  crmDeals: INITIAL_CRM_DEALS,
  addCrmContact: (contact) => set((state) => ({ crmContacts: [contact, ...state.crmContacts] })),
  addCrmDeal: (deal) => set((state) => ({ crmDeals: [deal, ...state.crmDeals] })),

  // LMS Courses
  courses: INITIAL_LMS_COURSES,
  completeCourse: (courseId) => {
    const { currentUser } = get();
    if (!currentUser.completedCourses.includes(courseId)) {
      set({
        currentUser: {
          ...currentUser,
          completedCourses: [...currentUser.completedCourses, courseId],
        },
      });
    }
  },

  // Social Community Feed
  posts: INITIAL_SOCIAL_POSTS,
  addPost: (post) => set((state) => ({ posts: [post, ...state.posts] })),

  // Security Findings & Gates
  securityFindings: INITIAL_SECURITY_FINDINGS,
  addSecurityFinding: (finding) => set((state) => ({ securityFindings: [finding, ...state.securityFindings] })),
  pushFindingToKanban: (finding) => {
    const cardId = `card_${finding.scanner.toLowerCase()}_${Date.now().toString().slice(-4)}`;
    const newCard: KanbanCard = {
      id: cardId,
      title: `Исправить уязвимость: ${finding.title}`,
      description: `${finding.description}\n\nРекомендованное исправление: ${finding.remediationExplanation || 'Применить предложенный патч'}`,
      type: 'security',
      priority: finding.severity === 'CRITICAL' ? 'critical' : finding.severity === 'HIGH' ? 'high' : 'medium',
      column: 'ideas',
      source: `${finding.scanner} Security Gate · ${finding.fileOrUrl}`,
      sourceSnippet: finding.remediationSnippet || finding.fileOrUrl,
      suggestedPatch: finding.remediationSnippet,
      attachments: [],
      checklist: [
        { id: 'c1', text: `Устранить замечание в ${finding.fileOrUrl}`, done: false },
        { id: 'c2', text: 'Запустить повторное сканирование ' + finding.scanner, done: false },
        { id: 'c3', text: 'Проверить отсутствие регрессий в E2E тестах', done: false },
      ],
      createdBy: `${finding.scanner} Security Agent`,
      createdAt: new Date().toISOString(),
      comments: [
        {
          id: `cmt_${Date.now()}`,
          author: `${finding.scanner} Bot`,
          avatar: '🛡️',
          text: `Уязвимость категории ${finding.cwe}. Рекомендуется применить исправление в ближайшем релизе.`,
          timestamp: 'Только что',
        },
      ],
    };

    get().addCard(newCard);
    if (typeof window !== 'undefined' && typeof window.alert === 'function') {
      window.alert('Карточка успешно создана в колонке «Идеи» на Канбан-доске!');
    }
  },
  remediateFinding: (finding) => {
    set((state) => ({
      securityFindings: state.securityFindings.map((f) => (f.id === finding.id ? { ...f, status: 'remediated' } : f)),
      builds: state.builds.map((b) => ({
        ...b,
        findings: b.findings.map((f) => (f.id === finding.id ? { ...f, status: 'remediated' } : f)),
      })),
    }));
  },

  // Observability Metrics
  metrics: INITIAL_METRICS,
  setMetrics: (metrics) => set({ metrics }),

  // Voice Interaction Memory & Macros
  voiceMemory: loadStoredVoiceMemory(),
  setVoiceMemory: (updater) => {
    set((state) => {
      const next = typeof updater === 'function' ? updater(state.voiceMemory) : updater;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('mirovisor_voice_conversation_memory', JSON.stringify(next));
        } catch {}
      }
      AiAgentService.getInstance().syncVoiceConversationHistory(next);
      return { voiceMemory: next };
    });
  },

  macros: loadStoredMacros(),
  setMacros: (updater) => {
    set((state) => {
      const next = typeof updater === 'function' ? updater(state.macros) : updater;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('mirovisor_voice_macros', JSON.stringify(next));
        } catch {}
      }
      return { macros: next };
    });
  },

  executeVoiceCommand: (commandText, customMemory) => {
    const state = get();
    const text = commandText.toLowerCase().trim();
    const memory = customMemory || state.voiceMemory;

    // Check Macro Registry
    const matchedMacro = state.macros.find((m) => {
      const kw = m.keyword.toLowerCase().trim();
      if (text.includes(kw) || kw.includes(text)) return true;
      if (kw === 'deploy nightly') {
        return text.includes('ночной деплой') || text.includes('деплой найтли') || text.includes('ночная сборка');
      }
      if (kw === 'full system audit') {
        return text.includes('полный аудит') || text.includes('глубокий аудит');
      }
      if (kw === 'scaffold plugin') {
        return text.includes('создай и анонсируй') || text.includes('новый плагин в ленту');
      }
      return false;
    });

    if (matchedMacro) {
      const executedSteps: string[] = [];

      matchedMacro.actions.forEach((act) => {
        if (act.type === 'trigger_build') {
          state.triggerBuild(act.target || 'main');
          executedSteps.push('Запущен CI/CD пайплайн сборки ветки main');
        } else if (act.type === 'security_audit') {
          const auditFinding: SecurityFinding = {
            id: `sec_macro_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            scanner: 'CodeQL',
            severity: 'HIGH',
            title: `Макрос «${matchedMacro.keyword}»: Проверка безопасности RLS & ASVS L2`,
            fileOrUrl: `libs/core/src/tenant/${state.activeTenant.slug}/rls.guard.ts`,
            description: `Комплексная проверка в схеме ${state.activeTenant.schema} подтвердила строгое действие политики RLS FORCE и отсутствие перекрестной утечки данных.`,
            cwe: 'CWE-284 (Improper Access Control)',
            status: 'open',
            detectedAt: new Date().toISOString(),
            remediationExplanation: 'Изоляция PostgreSQL активна на уровне ядра базы данных.',
            remediationSnippet: `ALTER TABLE tenant_data FORCE ROW LEVEL SECURITY;\n-- Macro-verified for ${state.activeTenant.schema}`,
          };
          state.addSecurityFinding(auditFinding);
          executedSteps.push('Проведен аудит безопасности и проверена изоляция RLS');
        } else if (act.type === 'post_social') {
          const releasePost: SocialPost = {
            id: `post_macro_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            authorId: state.currentUser.id,
            authorName: state.currentUser.fullName,
            authorAvatar: state.currentUser.avatarUrl,
            tenantId: state.activeTenant.id,
            tenantName: state.activeTenant.name,
            content: `🚀 [Voice Macro: «${matchedMacro.keyword}»] Запущен ночной цикл сборки и комплексного аудита. Проверки CodeQL SAST, RLS-изоляция схемы ${state.activeTenant.schema} и авто-тесты успешно верифицированы. Релиз готов!`,
            tags: ['#macro', '#deploy', '#nightly', '#security', '#rls', '#ci-cd'],
            likes: 5,
            commentsCount: 2,
            timestamp: 'Только что (Голосовой макрос)',
          };
          state.addPost(releasePost);
          executedSteps.push('Сводка релиза опубликована в Community Feed');
        } else if (act.type === 'scaffold_plugin') {
          const pluginId = `plugin-macro-${Date.now().toString().slice(-4)}`;
          const manifest: PluginManifest = {
            id: pluginId,
            name: `Widget ${matchedMacro.keyword}`,
            version: '1.0.0',
            description: `Микрофронтенд-виджет, созданный макросом «${matchedMacro.keyword}».`,
            author: state.currentUser.fullName,
            license: 'MIT',
            dependencies: [],
            conflicts: [],
            permissions: ['audit.codebase.read'],
            category: 'devtools',
            priceRub: 0,
            installedInTenants: [state.activeTenant.id],
            status: 'active',
          };
          state.addPluginManifest(manifest);
          executedSteps.push(`Создан микрофронтенд-плагин [${pluginId}]`);
        } else if (act.type === 'navigate_tab') {
          const targetTab = (act.target as NavTabId) || 'pipelines';
          state.setActiveTab(targetTab);
          executedSteps.push(`Переход на экран «${targetTab}»`);
        } else if (act.type === 'rollback_code') {
          const implemented = state.cards.find((c) => c.column === 'collected' && !c.rolledBack);
          if (implemented) {
            state.rollbackCard(implemented.id, `Макрос ${matchedMacro.keyword}`);
            executedSteps.push(`Выполнен откат изменения [${implemented.id}]`);
          }
        }
      });

      // Update execution count on macro
      state.setMacros((prev) =>
        prev.map((m) =>
          m.id === matchedMacro.id
            ? { ...m, executionCount: (m.executionCount || 0) + 1, lastRunAt: new Date().toISOString() }
            : m
        )
      );

      return {
        intent: `macro_${matchedMacro.id}`,
        responseSpeech: `Исполнен голосовой макрос «${matchedMacro.name}» с ключевым словом «${matchedMacro.keyword}». Запущена CI/CD сборка, проведен аудит безопасности RLS и опубликована сводка в Community Feed!`,
        details: `Макрос выполнил ${matchedMacro.actions.length} действий: ${executedSteps.join(' → ')}.`,
        affectedEntity: matchedMacro.keyword,
        metadata: {
          macroId: matchedMacro.id,
          keyword: matchedMacro.keyword,
          steps: executedSteps,
        },
      };
    }

    // Default conversational programming intent
    return {
      intent: 'general_query',
      responseSpeech: `Я понял ваш запрос: «${commandText}». Платформа работает штатно в контексте тенанта «${state.activeTenant.name}». Что еще вы хотите запрограммировать или запустить?`,
      details: `Контекст диалога сохранен в оперативной памяти агента.`,
    };
  },

  executeMacro: (macro) => {
    const result = get().executeVoiceCommand(macro.keyword);
    const userTurn: ConversationTurn = {
      id: `vt_${Date.now()}_u`,
      timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      role: 'user',
      text: `Запуск макроса: «${macro.keyword}»`,
    };

    const agentTurn: ConversationTurn = {
      id: `vt_${Date.now()}_a`,
      timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      role: 'agent',
      text: result?.responseSpeech || `Макрос «${macro.name}» успешно выполнен.`,
      actionResult: result?.details || 'Цепочка действий макроса завершена',
      intent: `macro_${macro.id}`,
      affectedEntity: macro.keyword,
    };

    get().setVoiceMemory((prev) => [...prev, userTurn, agentTurn]);
    get().addToast({
      type: 'info',
      title: `Макрос «${macro.name}»`,
      message: result?.details || 'Цепочка действий макроса исполнена.',
    });
  },

  // Global Toast Notifications
  toasts: [],
  addToast: (toast) => {
    const newToast: import('../types').ToastNotification = {
      id: toast.id || `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      durationMs: toast.durationMs ?? 5000,
      ...toast,
    };
    set((state) => ({ toasts: [newToast, ...state.toasts.slice(0, 5)] }));
  },
  dismissToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
  clearToasts: () => {
    set({ toasts: [] });
  },

  // Product Interaction Telemetry
  telemetryEvents: [],
  recordTelemetryEvent: (event) => {
    const { activeTenant, currentUser } = get();
    const newEvent: import('../types').ProductTelemetryEvent = {
      id: `tel_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      tenantId: activeTenant.id,
      userId: currentUser.id,
      ...event,
    };
    set((state) => ({
      telemetryEvents: [newEvent, ...state.telemetryEvents.slice(0, 99)],
    }));
  },

  // Theme Management (Tailwind CSS dark mode strategy)
  theme: getInitialTheme(),
  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mirovisor_theme', theme);
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
    set({ theme });
  },
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },

  // Client-Side Error & Audit Logs (LogUtility)
  clientLogs: LogUtility.getStoredLogs(),
  addClientLog: (log) => {
    set((state) => ({ clientLogs: [log, ...state.clientLogs].slice(0, 100) }));
  },
  clearClientLogs: () => {
    LogUtility.clearLogs();
    set({ clientLogs: [] });
  },

  // Postgres Row-Level Security (RLS) Policies
  rlsPolicies: getStoredRlsPolicies(),
  saveRlsPolicy: (policy) => {
    set((state) => {
      const existingIdx = state.rlsPolicies.findIndex((p) => p.id === policy.id);
      let updated: RlsPolicy[];
      if (existingIdx >= 0) {
        updated = [...state.rlsPolicies];
        updated[existingIdx] = policy;
      } else {
        updated = [policy, ...state.rlsPolicies];
      }
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('mirovisor_rls_policies', JSON.stringify(updated));
        } catch {}
      }
      return { rlsPolicies: updated };
    });
  },
  deleteRlsPolicy: (policyId) => {
    set((state) => {
      const updated = state.rlsPolicies.filter((p) => p.id !== policyId);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('mirovisor_rls_policies', JSON.stringify(updated));
        } catch {}
      }
      return { rlsPolicies: updated };
    });
  },

  resetUiState: () => {
    set({
      activeTab: 'audit',
      activeTenant: INITIAL_TENANTS[0],
      isSearchOpen: false,
      isTerminalOpen: false,
      isVoiceOpen: false,
      isMacroRegistryOpen: false,
      metrics: INITIAL_METRICS,
      toasts: [],
      clientLogs: LogUtility.getStoredLogs(),
      rlsPolicies: INITIAL_RLS_POLICIES,
    });
  },
}));
