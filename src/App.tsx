/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy, Suspense, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ViewLoadingSkeleton } from './components/common/ViewLoadingSkeleton';
import { UniversalSearchModal } from './components/search/UniversalSearchModal';
import { PortalTerminalDrawer } from './components/devtools/PortalTerminalDrawer';
import { VoiceControlModal } from './components/devtools/VoiceControlModal';
import { MacroRegistryModal } from './components/devtools/MacroRegistryModal';
import { useAppStore } from './store/useAppStore';
import { useTenantsQuery, useTenantMetricsQuery, useKanbanCardsQuery } from './queries/useTenantQueries';

// =============================================================================
// React.lazy() dynamic code-splitting for all 15 modular enterprise screens
// =============================================================================
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
  // Zustand Store selectors
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
    tenants,
    activeTenant,
    setActiveTenant,
    updateTenantConfig,
    createTenant,
    currentUser,
    cards,
    moveCard,
    updateCard,
    addCard,
    rateCard,
    rollbackCard,
    builds,
    triggerBuild,
    plugins,
    installPlugin,
    uninstallPlugin,
    addPluginManifest,
    crmContacts,
    crmDeals,
    addCrmContact,
    addCrmDeal,
    courses,
    completeCourse,
    posts,
    addPost,
    securityFindings,
    pushFindingToKanban,
    remediateFinding,
    addSecurityFinding,
    metrics,
    voiceMemory,
    setVoiceMemory,
    macros,
    setMacros,
    executeVoiceCommand,
    executeMacro,
    resetUiState,
  } = useAppStore();

  // TanStack Query cache integration
  useTenantsQuery();
  useTenantMetricsQuery(activeTenant.id);
  useKanbanCardsQuery();

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

  const inProgressCardsCount = cards.filter((c) => c.column === 'in_progress').length;

  return (
    <ErrorBoundary onReset={resetUiState}>
      <div className="flex flex-col h-screen w-screen bg-[#090a0f] text-neutral-100 overflow-hidden font-sans">
        {/* Top Application Header */}
        <Header
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tenants={tenants}
          activeTenant={activeTenant}
          onSelectTenant={setActiveTenant}
          currentUser={currentUser}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenTerminal={() => setTerminalOpen(true)}
          onOpenVoice={() => setVoiceOpen(true)}
        />

        {/* Main View Area with React.lazy() & Suspense for all 15 screens */}
        <main className="flex-1 overflow-hidden relative">
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
                onOpenVoice={() => setVoiceOpen(true)}
                onOpenMacroRegistry={() => setMacroRegistryOpen(true)}
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
          onOpenTerminal={() => setTerminalOpen(true)}
          onOpenVoice={() => setVoiceOpen(true)}
          cardsInProgressCount={inProgressCardsCount}
          onResetUi={resetUiState}
        />

        {/* Universal Cmd+K Search Modal (WCAG 2.1 AA) */}
        <UniversalSearchModal
          isOpen={isSearchOpen}
          onClose={() => setSearchOpen(false)}
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
          onClose={() => setTerminalOpen(false)}
          activeTenant={activeTenant}
          currentUser={currentUser}
          onTriggerCiCd={() => triggerBuild('main')}
        />

        {/* Voice Control Modal (WCAG 2.1 AA) */}
        <VoiceControlModal
          isOpen={isVoiceOpen}
          onClose={() => setVoiceOpen(false)}
          activeTenant={activeTenant}
          onExecuteVoiceCommand={executeVoiceCommand}
          conversationMemory={voiceMemory}
          onUpdateConversationMemory={setVoiceMemory}
          onClearMemory={() => setVoiceMemory([])}
          macros={macros}
          onOpenMacroRegistry={() => setMacroRegistryOpen(true)}
        />

        {/* Voice Macro Registry Modal (WCAG 2.1 AA) */}
        <MacroRegistryModal
          isOpen={isMacroRegistryOpen}
          onClose={() => setMacroRegistryOpen(false)}
          macros={macros}
          onSaveMacro={(newMacro) => {
            setMacros((prev) => [newMacro, ...prev]);
          }}
          onDeleteMacro={(id) => {
            setMacros((prev) => prev.filter((m) => m.id !== id));
          }}
          onExecuteMacro={executeMacro}
        />
      </div>
    </ErrorBoundary>
  );
}
