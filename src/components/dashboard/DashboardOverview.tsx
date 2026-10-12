/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Mirovisor Enterprise Dashboard Overview
 * Features:
 * - 15 Aggregated Module Cards with Live Status & Metric Aggregates
 * - Saved Perspectives: Store and switch between grid layout configurations (2-5 cols, density),
 *   module category filters, and visible widget subsets, persisting views in localStorage.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Activity, 
  Layers, 
  Terminal, 
  ShieldCheck, 
  Building, 
  Sparkles, 
  Briefcase, 
  Boxes, 
  Users, 
  GraduationCap, 
  BookOpen, 
  Cpu, 
  Network, 
  ArrowRight,
  TrendingUp,
  Server,
  Zap,
  CheckCircle2,
  Clock,
  Play,
  Bookmark,
  BookmarkPlus,
  Trash2,
  Check,
  Search,
  Filter,
  Columns,
  LayoutGrid,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  Eye,
  EyeOff,
  X,
  Sliders,
  AlertCircle
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { NavTabId } from '../layout/Header';

export interface DashboardPerspective {
  id: string;
  name: string;
  description: string;
  columns: 2 | 3 | 4 | 5;
  density: 'compact' | 'comfortable' | 'spacious';
  categoryFilter: string; // 'all' or specific module category
  visibleModuleIds: string[];
  isPreset?: boolean;
  isDefault?: boolean;
  updatedAt: string;
}

const DEFAULT_PERSPECTIVES: DashboardPerspective[] = [
  {
    id: 'p_full_360',
    name: 'Полный обзор 360°',
    description: 'Все 15 корпоративных модулей в максимальной 5-колоночной сетке платформы',
    columns: 5,
    density: 'comfortable',
    categoryFilter: 'all',
    visibleModuleIds: [
      'audit', 'visualizer', 'pipelines', 'kanban', 'tenants',
      'pluginstudio', 'crm', 'univer', 'plugins', 'social',
      'lms', 'security', 'observability', 'wiki', 'devtools'
    ],
    isPreset: true,
    isDefault: true,
    updatedAt: '2026-10-12T00:00:00Z',
  },
  {
    id: 'p_devops_security',
    name: 'DevOps & Security Gate',
    description: 'Фокус на CI/CD сборках, аудите ASVS 5.0, метриках и RLS мультитенантности',
    columns: 3,
    density: 'comfortable',
    categoryFilter: 'all',
    visibleModuleIds: ['pipelines', 'security', 'observability', 'tenants', 'devtools', 'audit'],
    isPreset: true,
    updatedAt: '2026-10-12T00:00:00Z',
  },
  {
    id: 'p_business_erp',
    name: 'Бизнес & Продуктивность',
    description: 'CRM сделки, Univer Office таблицы, задачи Канбан и корпоративное обучение',
    columns: 3,
    density: 'comfortable',
    categoryFilter: 'all',
    visibleModuleIds: ['crm', 'univer', 'kanban', 'lms', 'social'],
    isPreset: true,
    updatedAt: '2026-10-12T00:00:00Z',
  },
  {
    id: 'p_arch_data',
    name: 'Архитектура & Аналитика',
    description: 'D3 Force Mesh визуализация топологии тенантов, аудит и архитектурная база ADR',
    columns: 2,
    density: 'spacious',
    categoryFilter: 'all',
    visibleModuleIds: ['visualizer', 'audit', 'wiki', 'observability'],
    isPreset: true,
    updatedAt: '2026-10-12T00:00:00Z',
  },
  {
    id: 'p_minimal_ops',
    name: 'Критический Мониторинг',
    description: 'Минималистичный компактный экран для дежурного инженера эксплуатации',
    columns: 3,
    density: 'compact',
    categoryFilter: 'all',
    visibleModuleIds: ['security', 'pipelines', 'observability'],
    isPreset: true,
    updatedAt: '2026-10-12T00:00:00Z',
  },
];

interface ModuleCardProps {
  id: NavTabId;
  title: string;
  category: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  stats: { label: string; value: string | number; change?: string; isPositive?: boolean }[];
  statusText: string;
  statusType: 'success' | 'warning' | 'info' | 'active';
  density: 'compact' | 'comfortable' | 'spacious';
  onNavigate: (tab: NavTabId) => void;
}

const ModuleCard: React.FC<ModuleCardProps> = ({
  id,
  title,
  category,
  icon,
  badge,
  badgeColor = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  stats,
  statusText,
  statusType,
  density,
  onNavigate,
}) => {
  const getStatusDot = () => {
    switch (statusType) {
      case 'success':
        return <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />;
      case 'warning':
        return <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />;
      case 'active':
        return <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block shadow-xs shadow-cyan-400" />;
      case 'info':
      default:
        return <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />;
    }
  };

  const padClass = density === 'compact' ? 'p-3' : density === 'spacious' ? 'p-5' : 'p-4';
  const gridPadClass = density === 'compact' ? 'p-2 my-2' : density === 'spacious' ? 'p-3 my-3.5' : 'p-2.5 my-3';

  return (
    <div className={`group relative rounded-xl bg-neutral-900/70 border border-neutral-800/80 hover:border-cyan-500/40 ${padClass} transition-all duration-200 hover:shadow-lg hover:shadow-cyan-950/20 flex flex-col justify-between`}>
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-neutral-800/90 text-cyan-400 group-hover:bg-cyan-500/20 group-hover:text-cyan-300 transition-colors">
              {icon}
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block">
                {category}
              </span>
              <h3 className="text-sm font-bold text-white group-hover:text-cyan-200 transition-colors">
                {title}
              </h3>
            </div>
          </div>
          {badge && (
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${badgeColor}`}>
              {badge}
            </span>
          )}
        </div>

        {/* Metrics Grid */}
        <div className={`grid grid-cols-2 gap-2 ${gridPadClass} rounded-lg bg-neutral-950/60 border border-neutral-850`}>
          {stats.map((s, idx) => (
            <div key={idx} className="flex flex-col">
              <span className="text-[10px] text-neutral-400 font-sans">{s.label}</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xs font-mono font-bold text-neutral-200">{s.value}</span>
                {s.change && (
                  <span
                    className={`text-[9px] font-mono ${
                      s.isPositive ? 'text-emerald-400' : 'text-neutral-400'
                    }`}
                  >
                    {s.change}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer / Status + Quick Action */}
      <div className="pt-2 border-t border-neutral-800/60 flex items-center justify-between text-xs mt-1">
        <div className="flex items-center gap-1.5 text-[11px] text-neutral-300 font-mono">
          {getStatusDot()}
          <span className="truncate max-w-[140px]">{statusText}</span>
        </div>
        <button
          onClick={() => onNavigate(id)}
          className="flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 px-2 py-1 rounded hover:bg-neutral-800 transition-colors focus-visible:ring-1 focus-visible:ring-cyan-400 cursor-pointer"
        >
          <span>Открыть</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export const DashboardOverview: React.FC = () => {
  const setActiveTab = useAppStore((state) => state.setActiveTab);
  const activeTenant = useAppStore((state) => state.activeTenant);
  const tenants = useAppStore((state) => state.tenants);
  const cards = useAppStore((state) => state.cards);
  const builds = useAppStore((state) => state.builds);
  const plugins = useAppStore((state) => state.plugins);
  const crmContacts = useAppStore((state) => state.crmContacts);
  const crmDeals = useAppStore((state) => state.crmDeals);
  const courses = useAppStore((state) => state.courses);
  const posts = useAppStore((state) => state.posts);
  const securityFindings = useAppStore((state) => state.securityFindings);
  const metrics = useAppStore((state) => state.metrics);
  const voiceMemory = useAppStore((state) => state.voiceMemory);
  const macros = useAppStore((state) => state.macros);
  const addToast = useAppStore((state) => state.addToast);

  // Aggregates
  const inProgressCards = cards.filter((c) => c.column === 'in_progress').length;
  const criticalFindings = securityFindings.filter(
    (f) => f.severity === 'CRITICAL' && f.status === 'open'
  ).length;
  const latestBuild = builds[0];
  const totalDealValue = crmDeals.reduce((sum, d) => sum + (d.amountRub || 0), 0);
  const activePluginsCount = plugins.filter((p) => p.status === 'active').length;

  // ---------------------------------------------------------------------------
  // SAVED PERSPECTIVES STATE & PERSISTENCE (localStorage)
  // ---------------------------------------------------------------------------
  const [perspectives, setPerspectives] = useState<DashboardPerspective[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('mirovisor_saved_perspectives_v1');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (err) {
        console.warn('Failed to load saved perspectives from localStorage', err);
      }
    }
    return DEFAULT_PERSPECTIVES;
  });

  const [activePerspectiveId, setActivePerspectiveId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedId = localStorage.getItem('mirovisor_active_perspective_id');
        if (storedId) return storedId;
      } catch {}
    }
    return 'p_full_360';
  });

  // Active Perspective object
  const activePerspective = useMemo(() => {
    return perspectives.find((p) => p.id === activePerspectiveId) || perspectives[0] || DEFAULT_PERSPECTIVES[0];
  }, [perspectives, activePerspectiveId]);

  // Current ephemeral layout state (can be modified on the fly)
  const [currentColumns, setCurrentColumns] = useState<2 | 3 | 4 | 5>(activePerspective.columns);
  const [currentDensity, setCurrentDensity] = useState<'compact' | 'comfortable' | 'spacious'>(activePerspective.density);
  const [currentCategoryFilter, setCurrentCategoryFilter] = useState<string>(activePerspective.categoryFilter);
  const [currentVisibleIds, setCurrentVisibleIds] = useState<string[]>(activePerspective.visibleModuleIds);
  const [widgetSearchQuery, setWidgetSearchQuery] = useState<string>('');

  // Synchronize ephemeral state when perspective switch occurs
  useEffect(() => {
    setCurrentColumns(activePerspective.columns);
    setCurrentDensity(activePerspective.density);
    setCurrentCategoryFilter(activePerspective.categoryFilter);
    setCurrentVisibleIds(activePerspective.visibleModuleIds);
  }, [activePerspective.id]);

  // Persist perspectives array whenever it updates
  const savePerspectivesToStorage = useCallback((updatedList: DashboardPerspective[]) => {
    setPerspectives(updatedList);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('mirovisor_saved_perspectives_v1', JSON.stringify(updatedList));
      } catch (err) {
        console.warn('Failed to persist perspectives to localStorage', err);
      }
    }
  }, []);

  const handleSelectPerspective = (perspectiveId: string) => {
    setActivePerspectiveId(perspectiveId);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('mirovisor_active_perspective_id', perspectiveId);
      } catch {}
    }
    const target = perspectives.find((p) => p.id === perspectiveId);
    if (target) {
      addToast({
        type: 'info',
        title: 'Перспектива активирована',
        message: `Загружен вид «${target.name}» (${target.columns} колонок, ${target.visibleModuleIds.length} виджетов).`,
      });
    }
  };

  // Modals & Panels for Creating / Managing Perspectives
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isVisibilityDropdownOpen, setIsVisibilityDropdownOpen] = useState<boolean>(false);
  const [newPerspectiveName, setNewPerspectiveName] = useState<string>('');
  const [newPerspectiveDesc, setNewPerspectiveDesc] = useState<string>('');

  // Check if current view is modified compared to saved perspective
  const isModifiedFromSaved = useMemo(() => {
    if (currentColumns !== activePerspective.columns) return true;
    if (currentDensity !== activePerspective.density) return true;
    if (currentCategoryFilter !== activePerspective.categoryFilter) return true;
    if (currentVisibleIds.length !== activePerspective.visibleModuleIds.length) return true;
    const sortedCurrent = [...currentVisibleIds].sort().join(',');
    const sortedSaved = [...activePerspective.visibleModuleIds].sort().join(',');
    return sortedCurrent !== sortedSaved;
  }, [currentColumns, currentDensity, currentCategoryFilter, currentVisibleIds, activePerspective]);

  // ---------------------------------------------------------------------------
  // 15 DEFINED ENTERPRISE MODULES METADATA & DATA
  // ---------------------------------------------------------------------------
  const allModules = useMemo(() => [
    {
      id: 'audit' as NavTabId,
      title: 'Инженерный Аудит',
      category: 'Архитектура',
      icon: <Cpu className="w-4 h-4" />,
      badge: '100% готовность',
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      stats: [
        { label: 'Стандарты', value: '4/4', isPositive: true },
        { label: 'Соответствие', value: '100%' },
      ],
      statusText: 'Соответствует ТЗ',
      statusType: 'success' as const,
    },
    {
      id: 'visualizer' as NavTabId,
      title: 'Визуализатор D3',
      category: 'Аналитика',
      icon: <Network className="w-4 h-4" />,
      badge: 'Force-mesh',
      stats: [
        { label: 'Тенант-узлы', value: tenants.length },
        { label: 'CRDT Yjs', value: 'Активно' },
      ],
      statusText: 'Топология синхронизирована',
      statusType: 'active' as const,
    },
    {
      id: 'pipelines' as NavTabId,
      title: 'CI/CD Пайплайны',
      category: 'DevOps',
      icon: <Terminal className="w-4 h-4" />,
      badge: latestBuild?.status || 'Active',
      stats: [
        { label: 'Всего сборок', value: builds.length },
        { label: 'Security Gate', value: 'Строгий' },
      ],
      statusText: 'Ветка main защищена',
      statusType: 'success' as const,
    },
    {
      id: 'kanban' as NavTabId,
      title: 'Канбан & Eisenhower',
      category: 'Задачи',
      icon: <Layers className="w-4 h-4" />,
      badge: 'Свимлейны',
      stats: [
        { label: 'Всего задач', value: cards.length },
        { label: 'В работе', value: inProgressCards },
      ],
      statusText: '2x2 матрица доступна',
      statusType: 'active' as const,
    },
    {
      id: 'tenants' as NavTabId,
      title: 'Мультитенантность',
      category: 'Ядро RLS',
      icon: <Building className="w-4 h-4" />,
      badge: 'PostgreSQL RLS',
      stats: [
        { label: 'Организации', value: tenants.length },
        { label: 'Изоляция', value: 'Схема/Строка' },
      ],
      statusText: `Активен: ${activeTenant.schema}`,
      statusType: 'success' as const,
    },
    {
      id: 'pluginstudio' as NavTabId,
      title: 'Backstage Studio',
      category: 'SDK & Расширения',
      icon: <Sparkles className="w-4 h-4" />,
      badge: 'Scaffolder',
      stats: [
        { label: 'Шаблоны', value: '4 вида' },
        { label: 'Версии', value: 'SemVer' },
      ],
      statusText: 'Песочница доступна',
      statusType: 'info' as const,
    },
    {
      id: 'crm' as NavTabId,
      title: 'Gauzy ERP / CRM',
      category: 'Бизнес',
      icon: <Briefcase className="w-4 h-4" />,
      badge: `$${(totalDealValue / 1000).toFixed(0)}k`,
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      stats: [
        { label: 'Сделки', value: crmDeals.length },
        { label: 'Контакты', value: crmContacts.length },
      ],
      statusText: 'Воронка продаж активна',
      statusType: 'active' as const,
    },
    {
      id: 'univer' as NavTabId,
      title: 'Univer Office',
      category: 'Документы',
      icon: <BookOpen className="w-4 h-4" />,
      badge: 'Таблицы',
      stats: [
        { label: 'Синхронизация', value: 'Realtime' },
        { label: 'Формулы', value: 'Включены' },
      ],
      statusText: 'Ядро готово',
      statusType: 'success' as const,
    },
    {
      id: 'plugins' as NavTabId,
      title: 'Каталог Verdaccio',
      category: 'Пакеты',
      icon: <Boxes className="w-4 h-4" />,
      badge: `${activePluginsCount} активно`,
      stats: [
        { label: 'В каталоге', value: plugins.length },
        { label: 'Подписи', value: 'Ed25519' },
      ],
      statusText: 'Проверено подписями',
      statusType: 'success' as const,
    },
    {
      id: 'social' as NavTabId,
      title: 'Лента Сообщества',
      category: 'Коллаборация',
      icon: <Users className="w-4 h-4" />,
      badge: `${posts.length} постов`,
      stats: [
        { label: 'Публикации', value: posts.length },
        { label: 'Каналы', value: 'Инженерия' },
      ],
      statusText: 'Синхронизировано',
      statusType: 'info' as const,
    },
    {
      id: 'lms' as NavTabId,
      title: 'LMS Обучение',
      category: 'Знания',
      icon: <GraduationCap className="w-4 h-4" />,
      badge: `${courses.length} курсов`,
      stats: [
        { label: 'Курсы', value: courses.length },
        { label: 'Прогресс', value: 'Индивидуально' },
      ],
      statusText: 'Курсы доступны',
      statusType: 'info' as const,
    },
    {
      id: 'security' as NavTabId,
      title: 'ASVS Security Gate',
      category: 'Безопасность',
      icon: <ShieldCheck className="w-4 h-4" />,
      badge: `${securityFindings.length} находок`,
      badgeColor: criticalFindings > 0 ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      stats: [
        { label: 'Критические', value: criticalFindings },
        { label: 'Всего CWE', value: securityFindings.length },
      ],
      statusText: criticalFindings === 0 ? 'Сканирование чисто' : 'Требуется исправление',
      statusType: (criticalFindings === 0 ? 'success' : 'warning') as 'success' | 'warning',
    },
    {
      id: 'observability' as NavTabId,
      title: 'Метрики & D3 Тренды',
      category: 'Наблюдаемость',
      icon: <Activity className="w-4 h-4" />,
      badge: 'D3 Dual-Axis',
      stats: [
        { label: 'Квота диска', value: `${(activeTenant.storageQuotaMb / 1024).toFixed(1)} GB` },
        { label: 'Участники', value: activeTenant.memberCount },
      ],
      statusText: 'D3 Trendline активна',
      statusType: 'success' as const,
    },
    {
      id: 'wiki' as NavTabId,
      title: 'LLM Wiki & ADR',
      category: 'Документация',
      icon: <BookOpen className="w-4 h-4" />,
      badge: '15 ADR',
      stats: [
        { label: 'Архитектура', value: '15 ADR' },
        { label: 'Векторы', value: 'Готово' },
      ],
      statusText: 'База знаний актуальна',
      statusType: 'info' as const,
    },
    {
      id: 'devtools' as NavTabId,
      title: 'DevTools & Voice AI',
      category: 'Инструменты',
      icon: <Terminal className="w-4 h-4 text-cyan-400" />,
      badge: `${macros.length} макросов`,
      stats: [
        { label: 'Макросы', value: macros.length },
        { label: 'Voice реплики', value: voiceMemory.length },
      ],
      statusText: 'Deploy Nightly готов',
      statusType: 'active' as const,
    },
  ], [
    activeTenant.memberCount,
    activeTenant.schema,
    activeTenant.storageQuotaMb,
    activePluginsCount,
    builds.length,
    cards.length,
    courses.length,
    criticalFindings,
    crmContacts.length,
    crmDeals.length,
    inProgressCards,
    latestBuild?.status,
    macros.length,
    plugins.length,
    posts.length,
    securityFindings.length,
    tenants.length,
    totalDealValue,
    voiceMemory.length,
  ]);

  // Unique categories for filtering
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    allModules.forEach((m) => set.add(m.category));
    return Array.from(set);
  }, [allModules]);

  // Filtered Modules according to active perspective + search query
  const displayedModules = useMemo(() => {
    return allModules.filter((m) => {
      // 1. Must be in currentVisibleIds
      if (!currentVisibleIds.includes(m.id)) return false;

      // 2. Category filter
      if (currentCategoryFilter !== 'all' && m.category !== currentCategoryFilter) {
        return false;
      }

      // 3. Search query filter
      if (widgetSearchQuery.trim()) {
        const q = widgetSearchQuery.toLowerCase();
        const matchTitle = m.title.toLowerCase().includes(q);
        const matchCategory = m.category.toLowerCase().includes(q);
        const matchStatus = m.statusText.toLowerCase().includes(q);
        return matchTitle || matchCategory || matchStatus;
      }

      return true;
    });
  }, [allModules, currentVisibleIds, currentCategoryFilter, widgetSearchQuery]);

  // Handle saving new perspective
  const handleSaveNewPerspective = () => {
    const trimmedName = newPerspectiveName.trim();
    if (!trimmedName) return;

    const newPerspective: DashboardPerspective = {
      id: `p_user_${Date.now()}`,
      name: trimmedName,
      description: newPerspectiveDesc.trim() || 'Пользовательская конфигурация дашборда',
      columns: currentColumns,
      density: currentDensity,
      categoryFilter: currentCategoryFilter,
      visibleModuleIds: currentVisibleIds,
      isPreset: false,
      updatedAt: new Date().toISOString(),
    };

    const nextList = [...perspectives, newPerspective];
    savePerspectivesToStorage(nextList);
    setActivePerspectiveId(newPerspective.id);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('mirovisor_active_perspective_id', newPerspective.id);
      } catch {}
    }

    setIsCreateModalOpen(false);
    setNewPerspectiveName('');
    setNewPerspectiveDesc('');

    addToast({
      type: 'success',
      title: 'Перспектива сохранена',
      message: `Создана новая перспектива «${newPerspective.name}». Сохранено в localStorage.`,
    });
  };

  // Handle updating current perspective in-place
  const handleUpdateCurrentPerspective = () => {
    const updatedList = perspectives.map((p) => {
      if (p.id === activePerspective.id) {
        return {
          ...p,
          columns: currentColumns,
          density: currentDensity,
          categoryFilter: currentCategoryFilter,
          visibleModuleIds: currentVisibleIds,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    savePerspectivesToStorage(updatedList);
    addToast({
      type: 'success',
      title: 'Перспектива обновлена',
      message: `Конфигурация «${activePerspective.name}» успешно перезаписана в localStorage.`,
    });
  };

  // Handle deleting custom perspective
  const handleDeletePerspective = (idToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = perspectives.find((p) => p.id === idToDelete);
    if (!target || target.isPreset) return;

    const nextList = perspectives.filter((p) => p.id !== idToDelete);
    savePerspectivesToStorage(nextList);

    if (activePerspectiveId === idToDelete) {
      const fallbackId = nextList[0]?.id || DEFAULT_PERSPECTIVES[0].id;
      setActivePerspectiveId(fallbackId);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('mirovisor_active_perspective_id', fallbackId);
        } catch {}
      }
    }

    addToast({
      type: 'info',
      title: 'Перспектива удалена',
      message: `Перспектива «${target.name}» удалена из локального хранилища.`,
    });
  };

  // Reset to default presets
  const handleResetToPresets = () => {
    savePerspectivesToStorage(DEFAULT_PERSPECTIVES);
    setActivePerspectiveId(DEFAULT_PERSPECTIVES[0].id);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('mirovisor_active_perspective_id', DEFAULT_PERSPECTIVES[0].id);
      } catch {}
    }
    addToast({
      type: 'info',
      title: 'Сброс к предустановкам',
      message: 'Восстановлены заводские перспективы Mirovisor.',
    });
  };

  // Toggle individual module visibility
  const toggleModuleVisibility = (modId: string) => {
    setCurrentVisibleIds((prev) => {
      if (prev.includes(modId)) {
        if (prev.length <= 1) {
          addToast({
            type: 'warning',
            title: 'Минимум 1 модуль',
            message: 'В перспективе должен оставаться хотя бы один активный виджет.',
          });
          return prev;
        }
        return prev.filter((id) => id !== modId);
      } else {
        return [...prev, modId];
      }
    });
  };

  // Dynamic Grid Class according to currentColumns
  const gridColsClass = useMemo(() => {
    switch (currentColumns) {
      case 2:
        return 'grid-cols-1 md:grid-cols-2';
      case 3:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case 4:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
      case 5:
      default:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5';
    }
  }, [currentColumns]);

  return (
    <div className="h-full overflow-y-auto bg-[#090a0f] text-neutral-100 p-6 space-y-6">
      {/* Top Banner with High-Level KPI Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-neutral-900/90 via-indigo-950/30 to-cyan-950/20 border border-neutral-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              СВОДНЫЙ ДАШБОРД ПЛАТФОРМЫ
            </span>
            <span className="text-xs text-neutral-400 font-mono">
              Тенант: <strong className="text-white">{activeTenant.name}</strong> ({activeTenant.id})
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2 font-sans">
            Mirovisor Enterprise Status Overview
          </h1>
          <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
            Сводная матрица состояния 15 ключевых подсистем: мультитенантность RLS, CI/CD пайплайны,
            ASVS Security Gate, D3.js метрики, Канбан-свимлейны и AI-оркестрация.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              addToast({
                type: 'info',
                title: 'Синхронизация метрик',
                message: 'Обновлены агрегированные данные по всем 15 модулям.',
              });
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-xs font-medium text-neutral-200 border border-neutral-700 transition-colors cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Синхронизировать</span>
          </button>
          <button
            onClick={() => setActiveTab('kanban')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white shadow-md shadow-cyan-900/30 transition-colors cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Канбан Задач ({cards.length})</span>
          </button>
        </div>
      </div>

      {/* 4 Quick Stat Banners */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-neutral-400 block font-mono">Тенанты (RLS)</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-white font-mono">{tenants.length}</span>
              <span className="text-[10px] text-emerald-400 font-mono">активны</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-neutral-400 block font-mono">В Работе (WIP)</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-white font-mono">{inProgressCards}</span>
              <span className="text-[10px] text-neutral-400 font-mono">из {cards.length} карт</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-neutral-400 block font-mono">Критических CWE</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-rose-300 font-mono">{criticalFindings}</span>
              <span className="text-[10px] text-rose-400 font-mono">
                {criticalFindings > 0 ? 'требует внимания' : 'чисто'}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-neutral-400 block font-mono">CI/CD Сборка</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-emerald-300 font-mono">
                {latestBuild?.status === 'success' ? 'Passed' : 'Pending'}
              </span>
              <span className="text-[10px] text-neutral-400 font-mono">#{latestBuild?.id?.slice(0, 6)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SAVED PERSPECTIVES CONTROLS & MANAGEMENT BAR */}
      {/* ===================================================================== */}
      <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-3.5 shadow-lg">
        {/* Perspectives Switcher Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-800/80">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/70 border border-cyan-800/80 text-cyan-300 text-xs font-mono font-semibold">
              <Bookmark className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/20" />
              <span>СОХРАНЁННЫЕ ПЕРСПЕКТИВЫ:</span>
            </div>

            {/* List of Perspective Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {perspectives.map((p) => {
                const isActive = p.id === activePerspectiveId;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPerspective(p.id)}
                    className={`group px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/40 ring-1 ring-cyan-400/40'
                        : 'bg-neutral-850 hover:bg-neutral-800 text-neutral-300 border border-neutral-750'
                    }`}
                  >
                    <span>{p.name}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${isActive ? 'bg-cyan-700 text-cyan-100' : 'bg-neutral-800 text-neutral-400'}`}>
                      {p.columns}к
                    </span>
                    {!p.isPreset && (
                      <span
                        onClick={(e) => handleDeletePerspective(p.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-rose-400 transition-opacity ml-0.5"
                        title="Удалить пользовательскую перспективу"
                      >
                        <X className="w-3 h-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Modified state notification */}
            {isModifiedFromSaved && (
              <div className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-950/60 border border-amber-800/80 px-2.5 py-1 rounded-lg font-mono">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Вид изменён</span>
                <button
                  onClick={handleUpdateCurrentPerspective}
                  className="ml-1 text-[11px] underline hover:text-white cursor-pointer"
                >
                  Обновить «{activePerspective.name}»
                </button>
              </div>
            )}

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-cyan-950 hover:border-cyan-700/80 text-neutral-200 hover:text-cyan-300 text-xs font-medium border border-neutral-750 transition-all cursor-pointer"
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-cyan-400" />
              <span>Сохранить вид...</span>
            </button>

            <button
              onClick={handleResetToPresets}
              className="p-1.5 rounded-lg bg-neutral-850 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-750 transition-colors cursor-pointer"
              title="Сбросить к заводским предустановкам"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Live Grid Layout & Widget Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Left: Column Switcher & Density & Widget Visibility */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Column Switcher */}
            <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
              <span className="text-[10px] text-neutral-400 font-mono px-2 flex items-center gap-1">
                <Columns className="w-3 h-3 text-cyan-400" />
                <span>Колонки:</span>
              </span>
              {([2, 3, 4, 5] as const).map((colNum) => (
                <button
                  key={colNum}
                  onClick={() => setCurrentColumns(colNum)}
                  className={`w-7 h-6 rounded-lg font-mono font-bold text-xs transition-colors cursor-pointer ${
                    currentColumns === colNum
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  {colNum}
                </button>
              ))}
            </div>

            {/* Density Switcher */}
            <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
              <span className="text-[10px] text-neutral-400 font-mono px-2">Плотность:</span>
              <button
                onClick={() => setCurrentDensity('compact')}
                className={`px-2 py-1 rounded-lg text-[11px] font-mono transition-colors cursor-pointer ${
                  currentDensity === 'compact' ? 'bg-cyan-600 text-white font-bold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Компактная
              </button>
              <button
                onClick={() => setCurrentDensity('comfortable')}
                className={`px-2 py-1 rounded-lg text-[11px] font-mono transition-colors cursor-pointer ${
                  currentDensity === 'comfortable' ? 'bg-cyan-600 text-white font-bold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Обычная
              </button>
              <button
                onClick={() => setCurrentDensity('spacious')}
                className={`px-2 py-1 rounded-lg text-[11px] font-mono transition-colors cursor-pointer ${
                  currentDensity === 'spacious' ? 'bg-cyan-600 text-white font-bold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Просторная
              </button>
            </div>

            {/* Widget Visibility Checklist Popover Trigger */}
            <div className="relative">
              <button
                onClick={() => setIsVisibilityDropdownOpen(!isVisibilityDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-950 hover:bg-neutral-850 text-neutral-300 border border-neutral-800 text-xs font-mono transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span>Виджеты ({currentVisibleIds.length}/{allModules.length})</span>
                <ChevronDown className="w-3 h-3 text-neutral-400" />
              </button>

              {isVisibilityDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-neutral-900 border border-neutral-750 rounded-2xl shadow-2xl p-3 z-50 space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800 text-xs font-mono">
                    <span className="font-bold text-neutral-200">Выбор виджетов</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentVisibleIds(allModules.map((m) => m.id))}
                        className="text-[10px] text-cyan-400 hover:underline cursor-pointer"
                      >
                        Все
                      </button>
                      <button
                        onClick={() => setIsVisibilityDropdownOpen(false)}
                        className="text-neutral-500 hover:text-white cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar text-xs">
                    {allModules.map((mod) => {
                      const isChecked = currentVisibleIds.includes(mod.id);
                      return (
                        <label
                          key={mod.id}
                          className="flex items-center justify-between p-1.5 rounded-lg hover:bg-neutral-800/80 cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleModuleVisibility(mod.id)}
                              className="rounded border-neutral-700 text-cyan-500 focus:ring-0 accent-cyan-500"
                            />
                            <span className={isChecked ? 'text-white' : 'text-neutral-500'}>
                              {mod.title}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-neutral-500">
                            {mod.category}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Category Filter Pills & Search */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
              <button
                onClick={() => setCurrentCategoryFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors cursor-pointer ${
                  currentCategoryFilter === 'all'
                    ? 'bg-neutral-800 text-white font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Все категории
              </button>
              {allCategories.slice(0, 4).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCurrentCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors cursor-pointer ${
                    currentCategoryFilter === cat
                      ? 'bg-cyan-600 text-white font-bold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Quick Search */}
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 pointer-events-none" />
              <input
                type="text"
                value={widgetSearchQuery}
                onChange={(e) => setWidgetSearchQuery(e.target.value)}
                placeholder="Поиск модуля..."
                className="pl-8 pr-3 py-1.5 bg-neutral-950 border border-neutral-800 focus:border-cyan-500/70 rounded-xl text-xs text-neutral-200 placeholder:text-neutral-500 outline-none w-36 sm:w-44 transition-colors font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 15 MODULES DYNAMIC GRID (FILTERED & SCALED) */}
      {/* ===================================================================== */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-neutral-200 uppercase tracking-wider font-mono flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Статус Модулей Системы</span>
            <span className="text-xs text-cyan-400/80 font-normal font-mono">
              ({displayedModules.length} из {allModules.length} отображаются в сетке)
            </span>
          </h2>
          <span className="text-xs text-neutral-400 font-mono">
            Перспектива: <strong className="text-white">{activePerspective.name}</strong>
          </span>
        </div>

        {displayedModules.length === 0 ? (
          <div className="py-12 bg-neutral-900/40 border border-neutral-800 rounded-2xl text-center flex flex-col items-center justify-center gap-2 text-neutral-400">
            <Filter className="w-8 h-8 text-neutral-600 mb-1" />
            <span className="font-mono text-sm text-neutral-300">
              Нет модулей, удовлетворяющих активным фильтрам
            </span>
            <p className="text-xs text-neutral-500 max-w-md">
              Сбросьте поиск или выберите категорию «Все категории» в панели перспективы выше.
            </p>
            <button
              onClick={() => {
                setCurrentCategoryFilter('all');
                setWidgetSearchQuery('');
                setCurrentVisibleIds(allModules.map((m) => m.id));
              }}
              className="mt-2 text-xs font-mono text-cyan-400 hover:underline cursor-pointer"
            >
              Сбросить все фильтры
            </button>
          </div>
        ) : (
          <div className={`grid ${gridColsClass} gap-3.5`}>
            {displayedModules.map((mod) => (
              <ModuleCard
                key={mod.id}
                id={mod.id}
                title={mod.title}
                category={mod.category}
                icon={mod.icon}
                badge={mod.badge}
                badgeColor={mod.badgeColor}
                stats={mod.stats}
                statusText={mod.statusText}
                statusType={mod.statusType}
                density={currentDensity}
                onNavigate={setActiveTab}
              />
            ))}
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* MODAL: CREATE / SAVE NEW PERSPECTIVE */}
      {/* ===================================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <BookmarkPlus className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">
                  Сохранить текущую перспективу (Saved Perspective)
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs font-sans">
              <div>
                <label className="block text-neutral-300 font-medium mb-1">
                  Название перспективы:
                </label>
                <input
                  type="text"
                  value={newPerspectiveName}
                  onChange={(e) => setNewPerspectiveName(e.target.value)}
                  placeholder="Например: Мониторинг SRE & Релизов"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-white outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">
                  Описание:
                </label>
                <input
                  type="text"
                  value={newPerspectiveDesc}
                  onChange={(e) => setNewPerspectiveDesc(e.target.value)}
                  placeholder="Краткое описание конфигурации..."
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-neutral-200 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-neutral-950/80 rounded-xl border border-neutral-850">
                <div>
                  <span className="text-neutral-400 block mb-1">Сетка колонок:</span>
                  <span className="font-mono font-bold text-cyan-300">{currentColumns} колонок</span>
                </div>
                <div>
                  <span className="text-neutral-400 block mb-1">Плотность карточек:</span>
                  <span className="font-mono font-bold text-cyan-300">
                    {currentDensity === 'compact' ? 'Компактная' : currentDensity === 'spacious' ? 'Просторная' : 'Обычная'}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 block mb-1">Фильтр категории:</span>
                  <span className="font-mono font-bold text-neutral-200">
                    {currentCategoryFilter === 'all' ? 'Все категории' : currentCategoryFilter}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 block mb-1">Выбрано модулей:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {currentVisibleIds.length} из {allModules.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs font-medium cursor-pointer transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleSaveNewPerspective}
                disabled={!newPerspectiveName.trim()}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-neutral-800 disabled:text-neutral-600 text-white text-xs font-semibold shadow-md shadow-cyan-900/30 transition-all cursor-pointer"
              >
                Сохранить в localStorage
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
