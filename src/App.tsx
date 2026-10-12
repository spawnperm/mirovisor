/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header, NavTabId } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { MultidimensionalDataVisualizer } from './components/visualization/MultidimensionalDataVisualizer';
import { KanbanBoard } from './components/kanban/KanbanBoard';
import { PipelinesView } from './components/pipelines/PipelinesView';
import { TenantArchitectureView } from './components/tenants/TenantArchitectureView';
import { PluginStudioView } from './components/plugins/PluginStudioView';
import { GauzyCrmView } from './components/business/GauzyCrmView';
import { UniverOfficeView } from './components/business/UniverOfficeView';
import { PluginMarketplaceView } from './components/plugins/PluginMarketplaceView';
import { CommunityFeedView } from './components/social/CommunityFeedView';
import { LmsCourseView } from './components/lms/LmsCourseView';
import { SecurityCenterView } from './components/security/SecurityCenterView';
import { ObservabilityView } from './components/observability/ObservabilityView';
import { LlmWikiView } from './components/wiki/LlmWikiView';
import { UniversalSearchModal } from './components/search/UniversalSearchModal';
import { PortalTerminalDrawer } from './components/devtools/PortalTerminalDrawer';
import { VoiceControlModal, VoiceActionResult, ConversationTurn } from './components/devtools/VoiceControlModal';

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
  INITIAL_BACKSTAGE_PLUGINS,
} from './data/mockData';

import {
  Tenant,
  User,
  KanbanCard,
  CardColumn,
  PluginManifest,
  CrmContact,
  CrmDeal,
  LmsCourse,
  SocialPost,
  SecurityFinding,
  PipelineBuild,
  TenantConfiguration,
  BackstagePluginCode,
} from './types';

import { AiAgentService } from './services/aiAgentService';

export default function App() {
  const [tenants, setTenants] = useState<Tenant[]>(INITIAL_TENANTS);
  const [activeTenant, setActiveTenant] = useState<Tenant>(INITIAL_TENANTS[0]);
  const [currentUser, setCurrentUser] = useState<User>(CURRENT_USER);
  const [cards, setCards] = useState<KanbanCard[]>(INITIAL_KANBAN_CARDS);
  const [builds, setBuilds] = useState<PipelineBuild[]>(INITIAL_BUILDS);
  const [plugins, setPlugins] = useState<PluginManifest[]>(INITIAL_PLUGINS);
  const [crmContacts, setCrmContacts] = useState<CrmContact[]>(INITIAL_CRM_CONTACTS);
  const [crmDeals, setCrmDeals] = useState<CrmDeal[]>(INITIAL_CRM_DEALS);
  const [courses, setCourses] = useState<LmsCourse[]>(INITIAL_LMS_COURSES);
  const [posts, setPosts] = useState<SocialPost[]>(INITIAL_SOCIAL_POSTS);
  const [securityFindings, setSecurityFindings] = useState<SecurityFinding[]>(INITIAL_SECURITY_FINDINGS);
  const [metrics, setMetrics] = useState(INITIAL_METRICS);

  const [activeTab, setActiveTab] = useState<NavTabId>('visualizer');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState<boolean>(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState<boolean>(false);

  // Persistent voice conversation memory stored in localStorage across page refreshes and UI session toggles
  const [voiceMemory, setVoiceMemory] = useState<ConversationTurn[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('mirovisor_voice_conversation_memory');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn('Failed to load voice conversation memory from localStorage:', err);
      }
    }
    return AiAgentService.getInstance().getVoiceConversationHistory();
  });

  // Sync voice memory with localStorage and AiAgentService across renders and updates
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('mirovisor_voice_conversation_memory', JSON.stringify(voiceMemory));
      } catch (err) {
        console.warn('Failed to save voice conversation memory to localStorage:', err);
      }
    }
    AiAgentService.getInstance().syncVoiceConversationHistory(voiceMemory);
  }, [voiceMemory]);

  // Global Hotkey handlers (Ctrl+V for voice, Cmd+K for search)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v' && !isTerminalOpen && !isSearchOpen) {
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag !== 'input' && tag !== 'textarea') {
          e.preventDefault();
          setIsVoiceOpen((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isTerminalOpen, isSearchOpen]);

  // Kanban Card manipulation & WIP limit enforcement
  const handleMoveCard = (cardId: string, targetCol: CardColumn, feedbackReason?: string): boolean => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return false;

    // Check WIP limit on in_progress
    if (targetCol === 'in_progress') {
      const inProgressCount = cards.filter((c) => c.column === 'in_progress' && c.id !== cardId).length;
      if (inProgressCount >= 3) {
        alert('Превышен WIP-лимит: не более 3 задач в колонке «В работу»!');
        return false;
      }
    }

    setCards((prev) =>
      prev.map((c) => {
        if (c.id === cardId) {
          return {
            ...c,
            column: targetCol,
            movedAt: new Date().toISOString(),
            rejectionReason: feedbackReason || c.rejectionReason,
          };
        }
        return c;
      })
    );
    return true;
  };

  const handleUpdateCard = (updatedCard: KanbanCard) => {
    setCards((prev) => prev.map((c) => (c.id === updatedCard.id ? updatedCard : c)));
  };

  const handleAddCard = (newCard: KanbanCard) => {
    setCards((prev) => [newCard, ...prev]);
  };

  const handleRateCard = (cardId: string, rating: number, feedback: string) => {
    setCards((prev) =>
      prev.map((c) => {
        if (c.id === cardId) {
          return {
            ...c,
            userRating: rating,
            ratingFeedback: feedback,
          };
        }
        return c;
      })
    );

    const card = cards.find((c) => c.id === cardId);
    if (card) {
      AiAgentService.getInstance().recordFeedback(
        card.createdBy,
        `Оценка качества кода для [${card.title}]: ${rating}/5 звезд. Отзыв: "${feedback}"`
      );
    }
  };

  // Rollback mechanism with commit reversal simulation
  const handleRollbackCard = (cardId: string, reason: string) => {
    setCards((prev) =>
      prev.map((c) => {
        if (c.id === cardId) {
          return {
            ...c,
            column: 'deferred',
            rolledBack: true,
            rollbackCommitHash: `rev_${Math.random().toString(36).substring(2, 9)}`,
            rejectionReason: `ОТКАТ: ${reason}`,
          };
        }
        return c;
      })
    );

    const card = cards.find((c) => c.id === cardId);
    if (card) {
      AiAgentService.getInstance().recordFeedback(
        card.createdBy,
        `КРИТИЧЕСКИЙ ОТКАТ изменений кода для [${card.title}]. Причина: ${reason}`
      );
    }
  };

  // Trigger simulated CI/CD Pipeline run with automated security gates
  const handleTriggerBuild = async (branch: string) => {
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

    setBuilds([newBuild, ...builds]);

    // Synthesize new card into Kanban ideas
    try {
      const newCard = await AiAgentService.getInstance().analyzeTelemetry(
        'security',
        `Automated Pipeline Build #${nextNumber} on branch ${branch} executed. NATS JetStream event published.`
      );
      handleAddCard(newCard);
    } catch (e) {
      console.warn('AI telemetry failed:', e);
    }
  };

  // Push Security Finding directly to Kanban Board as actionable Card
  const handlePushFindingToKanban = (finding: SecurityFinding) => {
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

    handleAddCard(newCard);
    alert(`Карточка успешно создана в колонке «Идеи» на Канбан-доске!`);
  };

  // Security remediation handler
  const handleRemediateFinding = (finding: SecurityFinding) => {
    setSecurityFindings((prev) =>
      prev.map((f) => (f.id === finding.id ? { ...f, status: 'remediated' } : f))
    );
    // Also update finding in active build
    setBuilds((prev) =>
      prev.map((b) => ({
        ...b,
        findings: b.findings.map((f) => (f.id === finding.id ? { ...f, status: 'remediated' } : f)),
      }))
    );
  };

  // Tenant Configuration updates
  const handleUpdateTenantConfig = (tenantId: string, updatedConfig: TenantConfiguration) => {
    setTenants((prev) =>
      prev.map((t) => (t.id === tenantId ? { ...t, config: updatedConfig } : t))
    );
    if (activeTenant.id === tenantId) {
      setActiveTenant((prev) => ({ ...prev, config: updatedConfig }));
    }
  };

  // Create new tenant
  const handleCreateTenant = (newTenantPartial: Partial<Tenant>) => {
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

    setTenants([newTenant, ...tenants]);
    setActiveTenant(newTenant);
  };

  // Plugin Registry handlers
  const handleInstallPlugin = (pluginId: string) => {
    setPlugins((prev) =>
      prev.map((p) => {
        if (p.id === pluginId && !p.installedInTenants.includes(activeTenant.id)) {
          return {
            ...p,
            installedInTenants: [...p.installedInTenants, activeTenant.id],
          };
        }
        return p;
      })
    );
  };

  const handleUninstallPlugin = (pluginId: string) => {
    setPlugins((prev) =>
      prev.map((p) => {
        if (p.id === pluginId) {
          return {
            ...p,
            installedInTenants: p.installedInTenants.filter((id) => id !== activeTenant.id),
          };
        }
        return p;
      })
    );
  };

  // LMS Course completion handler
  const handleCompleteCourse = (courseId: string) => {
    if (!currentUser.completedCourses.includes(courseId)) {
      setCurrentUser((prev) => ({
        ...prev,
        completedCourses: [...prev.completedCourses, courseId],
      }));
    }
  };

  // Voice Command parser & portal programming executor with conversational memory
  const handleExecuteVoiceCommand = (
    commandText: string,
    conversationMemory: ConversationTurn[] = voiceMemory
  ): VoiceActionResult => {
    const text = commandText.toLowerCase().trim();

    // Context Analysis: Find prior turns in the conversation memory array
    const priorUserTurns = conversationMemory.filter(
      (t) => t.role === 'user' && t.text.toLowerCase().trim() !== text
    );
    const lastUserTurn = priorUserTurns.length > 0 ? priorUserTurns[priorUserTurns.length - 1] : null;

    const priorEntityTurns = conversationMemory.filter(
      (t) => t.role === 'agent' && t.affectedEntity
    );
    const lastEntityTurn = priorEntityTurns.length > 0 ? priorEntityTurns[priorEntityTurns.length - 1] : null;

    // A. Memory Context Inquiry: "Что мы сделали только что?" / "Какая была прошлая команда?"
    if (
      text.includes('что мы') ||
      text.includes('что только что') ||
      text.includes('прошлая команда') ||
      text.includes('прошлый шаг') ||
      (text.includes('предыдущ') && (text.includes('что') || text.includes('команд') || text.includes('шаг') || text.includes('действие'))) ||
      text.includes('контекст диалога') ||
      text.includes('память сессии')
    ) {
      if (lastUserTurn) {
        const entityInfo = lastEntityTurn?.affectedEntity
          ? ` Связанный объект в контексте: [${lastEntityTurn.affectedEntity}].`
          : '';
        return {
          intent: 'memory_recall',
          responseSpeech: `В предыдущем шаге вы скомандовали: «${lastUserTurn.text}».${entityInfo} Всего в оперативной памяти сейчас ${conversationMemory.length} реплик сессии. Я помню полный контекст разговора!`,
          details: `Контекст извлечен из памяти: последняя команда «${lastUserTurn.text}» (${lastUserTurn.timestamp}).`,
          affectedEntity: lastEntityTurn?.affectedEntity,
        };
      } else {
        return {
          intent: 'memory_recall',
          responseSpeech: `В памяти пока нет предыдущих команд — это начало нашей диалоговой сессии. Я готов выполнять инструкции и сохранять контекст.`,
          details: `Массив памяти инициализирован. Реплик: ${conversationMemory.length}.`,
        };
      }
    }

    // B. Memory Context Repeat: "Повтори предыдущую команду" / "Запусти еще раз" / "Сделай снова"
    if (
      (text.includes('повтори') || text.includes('еще раз') || text.includes('снова')) &&
      (text.includes('команд') || text.includes('прошл') || text.includes('предыдущ') || text.includes('действие') || text.length < 30)
    ) {
      if (lastUserTurn) {
        const repeatedResult = handleExecuteVoiceCommand(lastUserTurn.text, conversationMemory.slice(0, -1));
        return {
          ...repeatedResult,
          intent: `repeat_${repeatedResult.intent}`,
          responseSpeech: `Повторяю из памяти команду «${lastUserTurn.text}»: ${repeatedResult.responseSpeech}`,
          details: `Повторно исполнено из памяти сессии: «${lastUserTurn.text}»`,
        };
      } else {
        return {
          intent: 'repeat_command',
          responseSpeech: `В массиве памяти нет сохраненных предыдущих команд для повторения. Произнесите команду или выберите из списка.`,
          details: `Память не содержит предыдущих команд пользователя.`,
        };
      }
    }

    // C. Memory Context Entity Action: "Удали его" / "Откати этот плагин" / "Открой его код"
    if (
      (text.includes('удали его') || text.includes('удали этот плагин') || text.includes('откати этот плагин') || text.includes('убери его')) &&
      lastEntityTurn && lastEntityTurn.affectedEntity?.startsWith('plugin-voice-')
    ) {
      const targetPluginId = lastEntityTurn.affectedEntity;
      setPlugins((prev) => prev.filter((p) => p.id !== targetPluginId));
      return {
        intent: 'rollback_plugin',
        responseSpeech: `На основе контекста разговора я нашел созданный плагин ${targetPluginId} и удалил его из активного реестра.`,
        details: `Плагин [${targetPluginId}] успешно удален по контекстной ссылке из памяти.`,
        affectedEntity: targetPluginId,
      };
    }

    // 1. Programming & Scaffolding new Backstage micro-frontend plugin
    if (text.includes('плагин') && (text.includes('создай') || text.includes('создать') || text.includes('студи') || text.includes('бэкстейдж') || text.includes('backstage'))) {
      const pluginId = `plugin-voice-${Date.now().toString().slice(-4)}`;
      const voicePlugin: BackstagePluginCode = {
        id: pluginId,
        title: 'Голосовой микрофронтенд-виджет',
        version: '1.0.0',
        author: currentUser.fullName,
        category: 'devtools',
        description: `Микрофронтенд плагин, сгенерированный голосовым агентом в схеме ${activeTenant.schema} по запросу суперадмина.`,
        extensionPoint: 'ui-dashboard-card',
        lifecycleState: 'active',
        permissions: ['audit.codebase.read', 'telemetry.write'],
        typescriptCode: `import { createPlugin, createComponentExtension } from '@mirovisor/plugin-sdk';

export const voiceGeneratedPlugin = createPlugin({
  id: '${pluginId}',
  title: 'Voice Generated Plugin Widget',
  async onInstall({ tenantId }) {
    console.log(\`[Voice Agent] Installed plugin in tenant schema: \${tenantId}\`);
  },
});

export const VoiceWidget = createComponentExtension({
  name: 'VoiceWidget',
  component: () => ({
    render: () => ({
      status: 'Live & Operating',
      tenant: '${activeTenant.name}',
      programmedVia: 'Gemini Live Voice Agent (Barge-in Ready)',
    }),
  }),
});`,
      };

      // Add to manifest plugin catalog too
      const manifest: PluginManifest = {
        id: pluginId,
        name: 'Voice Generated Microfrontend Widget',
        version: '1.0.0',
        description: 'Микрофронтенд-плагин, сгенерированный голосовым программированием.',
        author: currentUser.fullName,
        license: 'MIT',
        dependencies: [],
        conflicts: [],
        permissions: ['audit.codebase.read'],
        category: 'devtools',
        priceRub: 0,
        installedInTenants: [activeTenant.id],
        status: 'active',
      };

      setPlugins((prev) => [manifest, ...prev]);
      setActiveTab('pluginstudio');

      return {
        intent: 'scaffold_plugin',
        responseSpeech: `Создан новый микрофронтенд-плагин «${voicePlugin.title}» и активирован в схеме тенанта ${activeTenant.name}. Переключаю вас в Plugin Studio.`,
        details: `Сгенерирован Backstage SDK плагин [${pluginId}]. Добавлен в реестр модулей.`,
        affectedEntity: pluginId,
      };
    }

    // 2. Triggering CI/CD, Nx build, and automated multi-agent synthesis
    if (text.includes('пайплайн') || text.includes('сборк') || text.includes('ci') || text.includes('оптимиз')) {
      setActiveTab('pipelines');
      handleTriggerBuild('main');
      return {
        intent: 'trigger_ci_cd',
        responseSpeech: `Запущен CI/CD пайплайн для ветки main с проверками SAST, SCA и запуском Testcontainers. NATS JetStream событие отправлено AI-агентам для генерации улучшений.`,
        details: `Сборка инициирована. Агенты Cordis анализируют свежую телеметрию.`,
      };
    }

    // 3. Security audit & RLS verification
    if (text.includes('безопасн') || text.includes('аудит') || text.includes('rls') || text.includes('asvs')) {
      setActiveTab('security');
      const newAuditFinding: SecurityFinding = {
        id: `sec_voice_${Date.now().toString().slice(-4)}`,
        scanner: 'CodeQL',
        severity: 'HIGH',
        title: 'Голосовой аудит: Проверка изоляции Row-Level Security',
        fileOrUrl: `libs/core/src/tenant/${activeTenant.slug}/rls.guard.ts`,
        description: `Автоматический аудит схемы ${activeTenant.schema} подтвердил строгое действие политики RLS FORCE и отсутствие перекрестной утечки данных.`,
        cwe: 'CWE-284 (Improper Access Control)',
        status: 'open',
        detectedAt: new Date().toISOString(),
        remediationExplanation: 'RLS FORCE изоляция активна на уровне PostgreSQL ядра.',
        remediationSnippet: `ALTER TABLE tenant_data FORCE ROW LEVEL SECURITY;\n-- Verified for ${activeTenant.schema}`,
      };
      setSecurityFindings((prev) => [newAuditFinding, ...prev]);
      return {
        intent: 'security_audit',
        responseSpeech: `Проведен мгновенный аудит изоляции RLS для тенанта «${activeTenant.name}». Политика FORCE активна, утечек между арендаторами не обнаружено.`,
        details: `ASVS 5.0 L2 аудит пройден. Запись аудита добавлена в Security Center.`,
      };
    }

    // 4. Code rollback mechanism (Instant safe commit reversal)
    if (text.includes('откат') || text.includes('откатить') || text.includes('rollback')) {
      const implemented = cards.find((c) => c.column === 'collected' && !c.rolledBack);
      if (implemented) {
        handleRollbackCard(implemented.id, 'Голосовая команда отката от суперадмина');
        setActiveTab('kanban');
        return {
          intent: 'rollback_code',
          responseSpeech: `Выполнен безопасный откат изменения «${implemented.title}». Создан коммит отката, а карточка отправлена на доработку.`,
          details: `Откат зафиксирован: revert commit создан. Агент обучается на вашей обратной связи.`,
          affectedEntity: implemented.id,
        };
      } else {
        return {
          intent: 'rollback_code',
          responseSpeech: `Нет внедренных изменений, ожидающих отката. Все стабильные коммиты проверены.`,
          details: `Нет карточек в статусе «Внедрено».`,
        };
      }
    }

    // 5. Tenant switching & hierarchical navigation
    if (text.includes('acme') || text.includes('акме')) {
      const acme = tenants.find((t) => t.id === 'tenant_acme');
      if (acme) {
        setActiveTenant(acme);
        return {
          intent: 'switch_tenant',
          responseSpeech: `Контекст переключен на головной холдинг «ACME Industrial Group» (схема tenant_acme).`,
          details: `Тенант обновлен: tenant_acme (RLS Scope применен)`,
          affectedEntity: 'tenant_acme',
        };
      }
    } else if (text.includes('бета') || text.includes('betalabs')) {
      const beta = tenants.find((t) => t.id === 'tenant_betalabs');
      if (beta) {
        setActiveTenant(beta);
        return {
          intent: 'switch_tenant',
          responseSpeech: `Контекст переключен на тенант «BetaLabs AI Cluster» (схема tenant_betalabs).`,
          details: `Тенант обновлен: tenant_betalabs`,
          affectedEntity: 'tenant_betalabs',
        };
      }
    } else if (text.includes('нордик') || text.includes('nordic')) {
      const nordic = tenants.find((t) => t.id === 'tenant_nordic');
      if (nordic) {
        setActiveTenant(nordic);
        return {
          intent: 'switch_tenant',
          responseSpeech: `Контекст переключен на дочерний дивизион «Nordic Logistics».`,
          details: `Тенант обновлен: tenant_nordic (Дочерний узел ACME)`,
          affectedEntity: 'tenant_nordic',
        };
      }
    }

    // 6. Navigation intents
    if (text.includes('канбан') || text.includes('задач') || text.includes('доск') || text.includes('идеи')) {
      setActiveTab('kanban');
      return {
        intent: 'navigate_kanban',
        responseSpeech: `Открываю Канбан-доску. В работе сейчас ${inProgressCardsCount} задач из лимита в 3.`,
        details: `Переход на Канбан-доску`,
      };
    } else if (text.includes('тен') || text.includes('мультитен') || text.includes('схем')) {
      setActiveTab('tenants');
      return {
        intent: 'navigate_tenants',
        responseSpeech: `Открываю архитектуру мультитенантности и распределение схем данных.`,
        details: `Переход в раздел «Тенанты»`,
      };
    } else if (text.includes('метрик') || text.includes('прометей') || text.includes('монитор')) {
      setActiveTab('observability');
      return {
        intent: 'navigate_observability',
        responseSpeech: `Открываю Prometheus & D3.js графики утилизации вычислительных мощностей и хранилища.`,
        details: `Переход в панель «Наблюдаемость»`,
      };
    } else if (text.includes('сделк') || text.includes('crm') || text.includes('клиент')) {
      setActiveTab('crm');
      return {
        intent: 'navigate_crm',
        responseSpeech: `Открываю модуль Gauzy CRM с клиентами и сделками текущего тенанта.`,
        details: `Переход в модуль CRM`,
      };
    } else if (text.includes('офис') || text.includes('таблиц') || text.includes('univer')) {
      setActiveTab('univer');
      return {
        intent: 'navigate_univer',
        responseSpeech: `Открываю офисные документы Univer Office.`,
        details: `Переход в Univer Office`,
      };
    } else if (text.includes('вики') || text.includes('wiki') || text.includes('документ')) {
      setActiveTab('wiki');
      return {
        intent: 'navigate_wiki',
        responseSpeech: `Открываю LLM Wiki и архитектурные решения ADR.`,
        details: `Переход в LLM Wiki`,
      };
    }

    // Default conversational programming intent
    return {
      intent: 'general_query',
      responseSpeech: `Я понял ваш запрос: «${commandText}». Платформа работает штатно в контексте тенанта «${activeTenant.name}». Что еще вы хотите запрограммировать или запустить?`,
      details: `Контекст диалога сохранен в оперативной памяти агента.`,
    };
  };

  const inProgressCardsCount = cards.filter((c) => c.column === 'in_progress').length;

  return (
    <div className="flex flex-col h-screen w-screen bg-[#090a0f] text-neutral-100 overflow-hidden font-sans">
      {/* Top Application Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tenants={tenants}
        activeTenant={activeTenant}
        onSelectTenant={setActiveTenant}
        currentUser={currentUser}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenTerminal={() => setIsTerminalOpen(true)}
        onOpenVoice={() => setIsVoiceOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'visualizer' && (
          <MultidimensionalDataVisualizer
            tenants={tenants}
            activeTenant={activeTenant}
            cards={cards}
            securityFindings={securityFindings}
            onSelectEntity={(type, id) => {
              if (type === 'tenant') {
                const found = tenants.find((t) => t.id === id);
                if (found) setActiveTenant(found);
              }
            }}
          />
        )}

        {activeTab === 'pipelines' && (
          <PipelinesView
            builds={builds}
            activeTenant={activeTenant}
            onTriggerBuild={handleTriggerBuild}
            onRemediateFinding={handleRemediateFinding}
            onPushToKanban={handlePushFindingToKanban}
          />
        )}

        {activeTab === 'tenants' && (
          <TenantArchitectureView
            tenants={tenants}
            activeTenant={activeTenant}
            onUpdateTenantConfig={handleUpdateTenantConfig}
            onCreateTenant={handleCreateTenant}
          />
        )}

        {activeTab === 'pluginstudio' && (
          <PluginStudioView
            activeTenant={activeTenant}
            onRegisterBackstagePlugin={(plugin) => {
              console.log('Registered Backstage plugin:', plugin);
            }}
            onInstallPluginManifest={(manifest) => {
              setPlugins((prev) => [manifest, ...prev]);
            }}
          />
        )}

        {activeTab === 'kanban' && (
          <KanbanBoard
            cards={cards}
            onUpdateCard={handleUpdateCard}
            onMoveCard={handleMoveCard}
            onAddCard={handleAddCard}
            onRollbackCard={handleRollbackCard}
            onRateCard={handleRateCard}
          />
        )}

        {activeTab === 'crm' && (
          <GauzyCrmView
            tenant={activeTenant}
            contacts={crmContacts}
            deals={crmDeals}
            onAddContact={(c) => setCrmContacts((prev) => [c, ...prev])}
            onAddDeal={(d) => setCrmDeals((prev) => [d, ...prev])}
          />
        )}

        {activeTab === 'univer' && <UniverOfficeView tenant={activeTenant} />}

        {activeTab === 'plugins' && (
          <PluginMarketplaceView
            plugins={plugins}
            activeTenant={activeTenant}
            onInstallPlugin={handleInstallPlugin}
            onUninstallPlugin={handleUninstallPlugin}
          />
        )}

        {activeTab === 'social' && (
          <CommunityFeedView
            tenant={activeTenant}
            currentUser={currentUser}
            posts={posts}
            onAddPost={(p) => setPosts((prev) => [p, ...prev])}
          />
        )}

        {activeTab === 'lms' && (
          <LmsCourseView
            courses={courses}
            currentUser={currentUser}
            onCompleteCourse={handleCompleteCourse}
          />
        )}

        {activeTab === 'security' && (
          <SecurityCenterView
            tenant={activeTenant}
            findings={securityFindings}
            onTriggerScan={() => {
              const newFind: SecurityFinding = {
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
              setSecurityFindings((prev) => [newFind, ...prev]);
            }}
            onRemediateFinding={(id) => {
              const finding = securityFindings.find((f) => f.id === id);
              if (finding) handleRemediateFinding(finding);
            }}
          />
        )}

        {activeTab === 'observability' && (
          <ObservabilityView tenant={activeTenant} metrics={metrics} />
        )}

        {activeTab === 'wiki' && <LlmWikiView />}
      </main>

      {/* Developer Status Footer */}
      <Footer
        activeTenant={activeTenant}
        onOpenTerminal={() => setIsTerminalOpen(true)}
        onOpenVoice={() => setIsVoiceOpen(true)}
        cardsInProgressCount={inProgressCardsCount}
      />

      {/* Universal Cmd+K Search Modal */}
      <UniversalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
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

      {/* In-Portal Developer Terminal Drawer */}
      <PortalTerminalDrawer
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
        activeTenant={activeTenant}
        currentUser={currentUser}
        onTriggerCiCd={async () => {
          await handleTriggerBuild('main');
        }}
      />

      {/* Gemini Live Voice Controller Modal */}
      <VoiceControlModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        activeTenant={activeTenant}
        onExecuteVoiceCommand={handleExecuteVoiceCommand}
        conversationMemory={voiceMemory}
        onUpdateConversationMemory={setVoiceMemory}
        onClearMemory={() => {
          setVoiceMemory([]);
          try {
            localStorage.removeItem('mirovisor_voice_conversation_memory');
          } catch (e) {
            // ignore
          }
        }}
      />
    </div>
  );
}
