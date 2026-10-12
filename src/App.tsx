/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy, Suspense, useEffect, useCallback } from 'react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ViewLoadingSkeleton } from './components/common/ViewLoadingSkeleton';
import { UniversalSearchModal } from './components/search/UniversalSearchModal';
import { PortalTerminalDrawer } from './components/devtools/PortalTerminalDrawer';
import { VoiceControlModal } from './components/devtools/VoiceControlModal';
import { MacroRegistryModal } from './components/devtools/MacroRegistryModal';
import { AccessibilitySettingsModal } from './components/common/AccessibilitySettingsModal';
import { ToastContainer } from './components/common/ToastContainer';
import { useProductTelemetry } from './hooks/useProductTelemetry';
import {
  useNavigationSlice,
  useA11ySlice,
  useTenantsSlice,
  useKanbanSlice,
  usePipelinesSlice,
  usePluginsSlice,
  useCrmSlice,
  useLmsSlice,
  useSocialSlice,
  useSecuritySlice,
  useDevToolsSlice,
  useMetricsSlice,
  useInProgressCardsCount,
} from './store/selectors';
import { useTenantsQuery, useTenantMetricsQuery, useKanbanCardsQuery } from './queries/useTenantQueries';

// =============================================================================
// React.lazy() dynamic code-splitting for all 15 modular enterprise screens + Dashboard
// =============================================================================
const DashboardOverview = lazy(() =>
  import('./components/dashboard/DashboardOverview').then((m) => ({ default: m.DashboardOverview }))
);

const EngineeringAuditView = lazy(() =>
  import('./components/audit/EngineeringAuditView').then((m) => ({ default: m.EngineeringAuditView }))
);

const MultidimensionalDataVisualizer = lazy(() =>
  import('./components/visualization/MultidimensionalDataVisualizer').then((m) => ({
    default: m.MultidimensionalDataVisualizer,
  }))
);

const PipelinesView = lazy(() =>
  import('./components/pipelines/PipelinesView').then((m) => ({ default: m.PipelinesView }))
);

const KanbanBoard = lazy(() =>
  import('./components/kanban/KanbanBoard').then((m) => ({ default: m.KanbanBoard }))
);

const TenantArchitectureView = lazy(() =>
  import('./components/tenants/TenantArchitectureView').then((m) => ({
    default: m.TenantArchitectureView,
  }))
);

const PluginStudioView = lazy(() =>
  import('./components/plugins/PluginStudioView').then((m) => ({ default: m.PluginStudioView }))
);

const GauzyCrmView = lazy(() =>
  import('./components/business/GauzyCrmView').then((m) => ({ default: m.GauzyCrmView }))
);

const UniverOfficeView = lazy(() =>
  import('./components/business/UniverOfficeView').then((m) => ({ default: m.UniverOfficeView }))
);

const PluginMarketplaceView = lazy(() =>
  import('./components/plugins/PluginMarketplaceView').then((m) => ({
    default: m.PluginMarketplaceView,
  }))
);

const CommunityFeedView = lazy(() =>
  import('./components/social/CommunityFeedView').then((m) => ({ default: m.CommunityFeedView }))
);

const LmsCourseView = lazy(() =>
  import('./components/lms/LmsCourseView').then((m) => ({ default: m.LmsCourseView }))
);

const SecurityCenterView = lazy(() =>
  import('./components/security/SecurityCenterView').then((m) => ({
    default: m.SecurityCenterView,
  }))
);

const ObservabilityView = lazy(() =>
  import('./components/observability/ObservabilityView').then((m) => ({
    default: m.ObservabilityView,
  }))
);

const LlmWikiView = lazy(() =>
  import('./components/wiki/LlmWikiView').then((m) => ({ default: m.LlmWikiView }))
);

const DevToolsSessionView = lazy(() =>
  import('./components/devtools/DevToolsSessionView').then((m) => ({
    default: m.DevToolsSessionView,
  }))
);

export default function App() {
  // Memoized Zustand Store slices using shallow comparison
  // Prevents re-renders of the main layout when unrelated store data (e.g. toasts, telemetry, metrics) changes
  const {
    activeTab,
    setActiveTab,
    isSearchOpen,
    setSearchOpen,
    isTerminalOpen,
    setTerminalOpen,
    isVoiceOpen,
    setVoiceOpen,
    isMacroRegistryOpen,
    setMacroRegistryOpen,
    isA11yPanelOpen,
    setA11yPanelOpen,
    resetUiState,
  } = useNavigationSlice();

  const {
    highContrast,
    fontSizePreference,
    reducedMotion,
    enhancedFocusRings,
    announcementMessage,
  } = useA11ySlice();

  const {
    tenants,
    activeTenant,
    currentUser,
    setActiveTenant,
    updateTenantConfig,
    createTenant,
  } = useTenantsSlice();

  const {
    cards,
    moveCard,
    updateCard,
    addCard,
    rateCard,
    rollbackCard,
  } = useKanbanSlice();

  const { builds, triggerBuild } = usePipelinesSlice();

  const {
    plugins,
    installPlugin,
    uninstallPlugin,
    addPluginManifest,
  } = usePluginsSlice();

  const {
    crmContacts,
    crmDeals,
    addCrmContact,
    addCrmDeal,
  } = useCrmSlice();

  const { courses, completeCourse } = useLmsSlice();

  const { posts, addPost } = useSocialSlice();

  const {
    securityFindings,
    pushFindingToKanban,
    remediateFinding,
    addSecurityFinding,
  } = useSecuritySlice();

  const {
    voiceMemory,
    setVoiceMemory,
    macros,
    setMacros,
    executeVoiceCommand,
    executeMacro,
  } = useDevToolsSlice();

  const metrics = useMetricsSlice();

  // Primitive memoized selector for in-progress cards count
  const inProgressCardsCount = useInProgressCardsCount();

  // TanStack Query cache integration
  useTenantsQuery();
  useTenantMetricsQuery(activeTenant.id);
  useKanbanCardsQuery();

  // Automatic product interaction telemetry tracking
  useProductTelemetry();

  // Memoized modal toggle handlers
  const handleOpenSearch = useCallback(() => setSearchOpen(true), [setSearchOpen]);
  const handleCloseSearch = useCallback(() => setSearchOpen(false), [setSearchOpen]);
  const handleOpenTerminal = useCallback(() => setTerminalOpen(true), [setTerminalOpen]);
  const handleCloseTerminal = useCallback(() => setTerminalOpen(false), [setTerminalOpen]);
  const handleOpenVoice = useCallback(() => setVoiceOpen(true), [setVoiceOpen]);
  const handleCloseVoice = useCallback(() => setVoiceOpen(false), [setVoiceOpen]);
  const handleOpenA11y = useCallback(() => setA11yPanelOpen(true), [setA11yPanelOpen]);
  const handleCloseA11y = useCallback(() => setA11yPanelOpen(false), [setA11yPanelOpen]);
  const handleOpenMacroRegistry = useCallback(() => setMacroRegistryOpen(true), [setMacroRegistryOpen]);
  const handleCloseMacroRegistry = useCallback(() => setMacroRegistryOpen(false), [setMacroRegistryOpen]);

  // Global hotkeys (Cmd+K / Ctrl+K for search, Ctrl+V for voice)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(!isSearchOpen);
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === 'v' &&
        !isTerminalOpen &&
        !isSearchOpen
      ) {
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag !== 'input' && tag !== 'textarea') {
          e.preventDefault();
          setVoiceOpen(!isVoiceOpen);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isTerminalOpen, isSearchOpen, isVoiceOpen, setSearchOpen, setVoiceOpen]);

  return (
    <ErrorBoundary onReset={resetUiState}>
      {/* WCAG 2.1 AA Skip Link for Keyboard & Screen Reader Users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-cyan-600 focus:text-white focus:rounded-lg focus:font-bold focus:shadow-xl focus:ring-2 focus:ring-white focus:outline-none transition-all"
      >
        Перейти к основному содержимому (Skip to content)
      </a>

      {/* Screen Reader Live Region for Async Announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcementMessage}
      </div>

      <div
        className={`flex flex-col h-screen w-screen bg-[#090a0f] text-neutral-100 overflow-hidden font-sans ${
          highContrast ? 'high-contrast-mode' : ''
        } ${
          fontSizePreference === 'large'
            ? 'text-[115%]'
            : fontSizePreference === 'xlarge'
            ? 'text-[130%]'
            : ''
        } ${reducedMotion ? 'motion-reduce' : ''} ${
          enhancedFocusRings ? 'enhanced-focus' : ''
        }`}
      >
        {/* Top Application Header */}
        <Header
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tenants={tenants}
          activeTenant={activeTenant}
          onSelectTenant={setActiveTenant}
          currentUser={currentUser}
          onOpenSearch={handleOpenSearch}
          onOpenTerminal={handleOpenTerminal}
          onOpenVoice={handleOpenVoice}
          onOpenA11y={handleOpenA11y}
        />

        {/* Main View Area with React.lazy() & Suspense for all 15 screens */}
        <main id="main-content" tabIndex={-1} className="flex-1 overflow-hidden relative focus:outline-none">
          {activeTab === 'dashboard' && (
            <Suspense fallback={<ViewLoadingSkeleton label="Сводный Дашборд 15 Модулей" />}>
              <DashboardOverview />
            </Suspense>
          )}

          {activeTab === 'audit' && (
            <Suspense fallback={<ViewLoadingSkeleton label="Аудит & Модернизация" />}>
              <EngineeringAuditView />
            </Suspense>
          )}

          {activeTab === 'visualizer' && (
            <Suspense fallback={<ViewLoadingSkeleton label="Многомерный Визуализатор D3.js" />}>
              <MultidimensionalDataVisualizer
                tenants={tenants}
                activeTenant={activeTenant}
                cards={cards}
                securityFindings={securityFindings}
                voiceMemory={voiceMemory}
                macros={macros}
                onOpenVoice={handleOpenVoice}
                onOpenMacroRegistry={handleOpenMacroRegistry}
                onExecuteVoiceCommand={executeVoiceCommand}
                onExecuteMacro={executeMacro}
                onSelectTenant={setActiveTenant}
                onSelectEntity={(type, id) => {
                  if (type === 'tenant') {
                    const found = tenants.find((t) => t.id === id);
                    if (found) setActiveTenant(found);
                  }
                }}
              />
            </Suspense>
          )}

          {activeTab === 'pipelines' && (
            <Suspense fallback={<ViewLoadingSkeleton label="CI/CD Пайплайны & Security Gate" />}>
              <PipelinesView
                builds={builds}
                activeTenant={activeTenant}
                onTriggerBuild={triggerBuild}
                onRemediateFinding={remediateFinding}
                onPushToKanban={pushFindingToKanban}
              />
            </Suspense>
          )}

          {activeTab === 'tenants' && (
            <Suspense fallback={<ViewLoadingSkeleton label="Архитектура Мультитенантности RLS" />}>
              <TenantArchitectureView
                tenants={tenants}
                activeTenant={activeTenant}
                onUpdateTenantConfig={updateTenantConfig}
                onCreateTenant={createTenant}
              />
            </Suspense>
          )}

          {activeTab === 'pluginstudio' && (
            <Suspense fallback={<ViewLoadingSkeleton label="Студия Backstage SDK" />}>
              <PluginStudioView
                activeTenant={activeTenant}
                onRegisterBackstagePlugin={(plugin) => {
                  console.log('Registered Backstage plugin:', plugin);
                }}
                onInstallPluginManifest={addPluginManifest}
              />
            </Suspense>
          )}

          {activeTab === 'kanban' && (
            <Suspense fallback={<ViewLoadingSkeleton label="Канбан-доска Идей и Свимлейнов" />}>
              <KanbanBoard
                cards={cards}
                onUpdateCard={updateCard}
                onMoveCard={moveCard}
                onAddCard={addCard}
                onRollbackCard={rollbackCard}
                onRateCard={rateCard}
              />
            </Suspense>
          )}

          {activeTab === 'crm' && (
            <Suspense fallback={<ViewLoadingSkeleton label="Gauzy ERP / CRM" />}>
              <GauzyCrmView
                tenant={activeTenant}
                contacts={crmContacts}
                deals={crmDeals}
                onAddContact={addCrmContact}
                onAddDeal={addCrmDeal}
              />
            </Suspense>
          )}

          {activeTab === 'univer' && (
            <Suspense fallback={<ViewLoadingSkeleton label="Univer Office Документы" />}>
              <UniverOfficeView tenant={activeTenant} />
            </Suspense>
          )}

          {activeTab === 'plugins' && (
            <Suspense fallback={<ViewLoadingSkeleton label="Каталог Плагинов Verdaccio" />}>
              <PluginMarketplaceView
                plugins={plugins}
                activeTenant={activeTenant}
                onInstallPlugin={installPlugin}
                onUninstallPlugin={uninstallPlugin}
              />
            </Suspense>
          )}

          {activeTab === 'social' && (
            <Suspense fallback={<ViewLoadingSkeleton label="Лента Сообщества" />}>
              <CommunityFeedView
                tenant={activeTenant}
                currentUser={currentUser}
                posts={posts}
                onAddPost={addPost}
              />
            </Suspense>
          )}

          {activeTab === 'lms' && (
            <Suspense fallback={<ViewLoadingSkeleton label="LMS Образовательные Курсы" />}>
              <LmsCourseView
                courses={courses}
                currentUser={currentUser}
                onCompleteCourse={completeCourse}
              />
            </Suspense>
          )}

          {activeTab === 'security' && (
            <Suspense fallback={<ViewLoadingSkeleton label="Центр Безопасности OWASP ASVS" />}>
              <SecurityCenterView
                tenant={activeTenant}
                findings={securityFindings}
                onTriggerScan={() => {
                  const newFind: import('./types').SecurityFinding = {
                    id: `sec_${Date.now()}`,
                    scanner: 'CodeQL',
                    severity: 'MEDIUM',
                    title: 'CWE-20: Непроверенная длина входной строки в параметре limit',
                    fileOrUrl: 'apps/api/src/modules/deals/deals.controller.ts:42',
                    description: 'Добавить валидатор Zod z.coerce.number().max(100) для защиты от DoS.',
                    cwe: 'CWE-20',
                    status: 'open',
                    detectedAt: new Date().toISOString(),
                    remediationExplanation: 'Ограничить максимальное значение параметра limit в схеме Zod.',
                    remediationSnippet: `const QuerySchema = z.object({\n  limit: z.coerce.number().min(1).max(100).default(20),\n});`,
                  };
                  addSecurityFinding(newFind);
                }}
                onRemediateFinding={(id) => {
                  const finding = securityFindings.find((f) => f.id === id);
                  if (finding) remediateFinding(finding);
                }}
              />
            </Suspense>
          )}

          {activeTab === 'observability' && (
            <Suspense fallback={<ViewLoadingSkeleton label="Наблюдаемость & Тренды D3.js" />}>
              <ObservabilityView tenant={activeTenant} metrics={metrics} />
            </Suspense>
          )}

          {activeTab === 'wiki' && (
            <Suspense fallback={<ViewLoadingSkeleton label="LLM Wiki & Архитектурные ADR" />}>
              <LlmWikiView />
            </Suspense>
          )}

          {activeTab === 'devtools' && (
            <Suspense fallback={<ViewLoadingSkeleton label="DevTools & Голосовая Сессия" />}>
              <DevToolsSessionView />
            </Suspense>
          )}
        </main>

        {/* Developer Status Footer */}
        <Footer
          activeTenant={activeTenant}
          onOpenTerminal={handleOpenTerminal}
          onOpenVoice={handleOpenVoice}
          cardsInProgressCount={inProgressCardsCount}
          onResetUi={resetUiState}
        />

        {/* Universal Cmd+K Search Modal (WCAG 2.1 AA) */}
        <UniversalSearchModal
          isOpen={isSearchOpen}
          onClose={handleCloseSearch}
          tenants={tenants}
          cards={cards}
          plugins={plugins}
          deals={crmDeals}
          courses={courses}
          findings={securityFindings}
          builds={builds}
          onSelectResult={(category) => {
            if (category === 'tenant') setActiveTab('tenants');
            else if (category === 'pipeline') setActiveTab('pipelines');
            else if (category === 'kanban') setActiveTab('kanban');
            else if (category === 'plugin') setActiveTab('plugins');
            else if (category === 'crm') setActiveTab('crm');
            else if (category === 'lms') setActiveTab('lms');
            else if (category === 'security') setActiveTab('security');
            else if (category === 'wiki') setActiveTab('wiki');
          }}
        />

        {/* In-Portal Developer Terminal Drawer (WCAG 2.1 AA) */}
        <PortalTerminalDrawer
          isOpen={isTerminalOpen}
          onClose={handleCloseTerminal}
          activeTenant={activeTenant}
          currentUser={currentUser}
          onTriggerCiCd={() => triggerBuild('main')}
        />

        {/* Voice Control Modal (WCAG 2.1 AA) */}
        <VoiceControlModal
          isOpen={isVoiceOpen}
          onClose={handleCloseVoice}
          activeTenant={activeTenant}
          onExecuteVoiceCommand={executeVoiceCommand}
          conversationMemory={voiceMemory}
          onUpdateConversationMemory={setVoiceMemory}
          onClearMemory={() => setVoiceMemory([])}
          macros={macros}
          onOpenMacroRegistry={handleOpenMacroRegistry}
        />

        {/* Voice Macro Registry Modal (WCAG 2.1 AA) */}
        <MacroRegistryModal
          isOpen={isMacroRegistryOpen}
          onClose={handleCloseMacroRegistry}
          macros={macros}
          onSaveMacro={(newMacro) => {
            setMacros((prev) => [newMacro, ...prev]);
          }}
          onDeleteMacro={(id) => {
            setMacros((prev) => prev.filter((m) => m.id !== id));
          }}
          onExecuteMacro={executeMacro}
        />

        {/* Accessibility Preferences Modal (WCAG 2.1 AA) */}
        <AccessibilitySettingsModal
          isOpen={isA11yPanelOpen}
          onClose={handleCloseA11y}
        />

        {/* Global Persistent Real-Time Toast Notifications */}
        <ToastContainer />
      </div>
    </ErrorBoundary>
  );
}
