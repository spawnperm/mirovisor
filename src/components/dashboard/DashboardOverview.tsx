import React, { useMemo } from 'react';
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
  Play
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { NavTabId } from '../layout/Header';

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

  return (
    <div className="group relative rounded-xl bg-neutral-900/70 border border-neutral-800/80 hover:border-cyan-500/40 p-4 transition-all duration-200 hover:shadow-lg hover:shadow-cyan-950/20 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
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
        <div className="grid grid-cols-2 gap-2 my-3 p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-850">
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
          <span className="truncate max-w-[150px]">{statusText}</span>
        </div>
        <button
          onClick={() => onNavigate(id)}
          className="flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 px-2 py-1 rounded hover:bg-neutral-800 transition-colors focus-visible:ring-1 focus-visible:ring-cyan-400"
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

  // High-level aggregates
  const inProgressCards = cards.filter((c) => c.column === 'in_progress').length;
  const criticalFindings = securityFindings.filter(
    (f) => f.severity === 'CRITICAL' && f.status === 'open'
  ).length;
  const latestBuild = builds[0];
  const totalDealValue = crmDeals.reduce((sum, d) => sum + (d.amountRub || 0), 0);
  const activePluginsCount = plugins.filter((p) => p.status === 'active').length;

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
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-xs font-medium text-neutral-200 border border-neutral-700 transition-colors"
          >
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Синхронизировать</span>
          </button>
          <button
            onClick={() => setActiveTab('kanban')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white shadow-md shadow-cyan-900/30 transition-colors"
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

      {/* 15 Modules Grid (Aggregated Cards) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-neutral-200 uppercase tracking-wider font-mono flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Статус 15 Модулей Системы</span>
          </h2>
          <span className="text-xs text-neutral-400 font-mono">15 из 15 сервисов в сети</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
          {/* 1. Audit */}
          <ModuleCard
            id="audit"
            title="Инженерный Аудит"
            category="Архитектура"
            icon={<Cpu className="w-4 h-4" />}
            badge="100% готовность"
            badgeColor="text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
            stats={[
              { label: 'Стандарты', value: '4/4', isPositive: true },
              { label: 'Соответствие', value: '100%' },
            ]}
            statusText="Соответствует ТЗ"
            statusType="success"
            onNavigate={setActiveTab}
          />

          {/* 2. Visualizer */}
          <ModuleCard
            id="visualizer"
            title="Визуализатор D3"
            category="Аналитика"
            icon={<Network className="w-4 h-4" />}
            badge="Force-mesh"
            stats={[
              { label: 'Тенант-узлы', value: tenants.length },
              { label: 'CRDT Yjs', value: 'Активно' },
            ]}
            statusText="Топология синхронизирована"
            statusType="active"
            onNavigate={setActiveTab}
          />

          {/* 3. Pipelines */}
          <ModuleCard
            id="pipelines"
            title="CI/CD Пайплайны"
            category="DevOps"
            icon={<Terminal className="w-4 h-4" />}
            badge={latestBuild?.status || 'Active'}
            stats={[
              { label: 'Всего сборок', value: builds.length },
              { label: 'Security Gate', value: 'Строгий' },
            ]}
            statusText="Ветка main защищена"
            statusType="success"
            onNavigate={setActiveTab}
          />

          {/* 4. Kanban */}
          <ModuleCard
            id="kanban"
            title="Канбан & Eisenhower"
            category="Задачи"
            icon={<Layers className="w-4 h-4" />}
            badge="Свимлейны"
            stats={[
              { label: 'Всего задач', value: cards.length },
              { label: 'В работе', value: inProgressCards },
            ]}
            statusText="2x2 матрица доступна"
            statusType="active"
            onNavigate={setActiveTab}
          />

          {/* 5. Tenants */}
          <ModuleCard
            id="tenants"
            title="Мультитенантность"
            category="Ядро RLS"
            icon={<Building className="w-4 h-4" />}
            badge="PostgreSQL RLS"
            stats={[
              { label: 'Организации', value: tenants.length },
              { label: 'Изоляция', value: 'Схема/Строка' },
            ]}
            statusText={`Активен: ${activeTenant.schema}`}
            statusType="success"
            onNavigate={setActiveTab}
          />

          {/* 6. Plugin Studio */}
          <ModuleCard
            id="pluginstudio"
            title="Backstage Studio"
            category="SDK & Расширения"
            icon={<Sparkles className="w-4 h-4" />}
            badge="Scaffolder"
            stats={[
              { label: 'Шаблоны', value: '4 вида' },
              { label: 'Версии', value: 'SemVer' },
            ]}
            statusText="Песочница доступна"
            statusType="info"
            onNavigate={setActiveTab}
          />

          {/* 7. CRM */}
          <ModuleCard
            id="crm"
            title="Gauzy ERP / CRM"
            category="Бизнес"
            icon={<Briefcase className="w-4 h-4" />}
            badge={`$${(totalDealValue / 1000).toFixed(0)}k`}
            badgeColor="text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
            stats={[
              { label: 'Сделки', value: crmDeals.length },
              { label: 'Контакты', value: crmContacts.length },
            ]}
            statusText="Воронка продаж активна"
            statusType="active"
            onNavigate={setActiveTab}
          />

          {/* 8. Univer */}
          <ModuleCard
            id="univer"
            title="Univer Office"
            category="Документы"
            icon={<BookOpen className="w-4 h-4" />}
            badge="Таблицы"
            stats={[
              { label: 'Синхронизация', value: 'Realtime' },
              { label: 'Формулы', value: 'Включены' },
            ]}
            statusText="Ядро готово"
            statusType="success"
            onNavigate={setActiveTab}
          />

          {/* 9. Plugins */}
          <ModuleCard
            id="plugins"
            title="Каталог Verdaccio"
            category="Пакеты"
            icon={<Boxes className="w-4 h-4" />}
            badge={`${activePluginsCount} активно`}
            stats={[
              { label: 'В каталоге', value: plugins.length },
              { label: 'Подписи', value: 'Ed25519' },
            ]}
            statusText="Проверено подписями"
            statusType="success"
            onNavigate={setActiveTab}
          />

          {/* 10. Social */}
          <ModuleCard
            id="social"
            title="Лента Сообщества"
            category="Коллаборация"
            icon={<Users className="w-4 h-4" />}
            badge={`${posts.length} постов`}
            stats={[
              { label: 'Публикации', value: posts.length },
              { label: 'Каналы', value: 'Инженерия' },
            ]}
            statusText="Синхронизировано"
            statusType="info"
            onNavigate={setActiveTab}
          />

          {/* 11. LMS */}
          <ModuleCard
            id="lms"
            title="LMS Обучение"
            category="Знания"
            icon={<GraduationCap className="w-4 h-4" />}
            badge={`${courses.length} курсов`}
            stats={[
              { label: 'Курсы', value: courses.length },
              { label: 'Прогресс', value: 'Индивидуально' },
            ]}
            statusText="Курсы доступны"
            statusType="info"
            onNavigate={setActiveTab}
          />

          {/* 12. Security */}
          <ModuleCard
            id="security"
            title="ASVS Security Gate"
            category="Безопасность"
            icon={<ShieldCheck className="w-4 h-4" />}
            badge={`${securityFindings.length} находок`}
            badgeColor={criticalFindings > 0 ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'}
            stats={[
              { label: 'Критические', value: criticalFindings },
              { label: 'Всего CWE', value: securityFindings.length },
            ]}
            statusText={criticalFindings === 0 ? 'Сканирование чисто' : 'Требуется исправление'}
            statusType={criticalFindings === 0 ? 'success' : 'warning'}
            onNavigate={setActiveTab}
          />

          {/* 13. Observability */}
          <ModuleCard
            id="observability"
            title="Метрики & D3 Тренды"
            category="Наблюдаемость"
            icon={<Activity className="w-4 h-4" />}
            badge="D3 Dual-Axis"
            stats={[
              { label: 'Квота диска', value: `${(activeTenant.storageQuotaMb / 1024).toFixed(1)} GB` },
              { label: 'Участники', value: activeTenant.memberCount },
            ]}
            statusText="D3 Trendline активна"
            statusType="success"
            onNavigate={setActiveTab}
          />

          {/* 14. Wiki */}
          <ModuleCard
            id="wiki"
            title="LLM Wiki & ADR"
            category="Документация"
            icon={<BookOpen className="w-4 h-4" />}
            badge="15 ADR"
            stats={[
              { label: 'Архитектура', value: '15 ADR' },
              { label: 'Векторы', value: 'Готово' },
            ]}
            statusText="База знаний актуальна"
            statusType="info"
            onNavigate={setActiveTab}
          />

          {/* 15. DevTools */}
          <ModuleCard
            id="devtools"
            title="DevTools & Voice AI"
            category="Инструменты"
            icon={<Terminal className="w-4 h-4 text-cyan-400" />}
            badge={`${macros.length} макросов`}
            stats={[
              { label: 'Макросы', value: macros.length },
              { label: 'Voice реплики', value: voiceMemory.length },
            ]}
            statusText="Deploy Nightly готов"
            statusType="active"
            onNavigate={setActiveTab}
          />
        </div>
      </div>
    </div>
  );
};
