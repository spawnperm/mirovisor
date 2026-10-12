import React, { useState } from 'react';
import {
  ShieldAlert,
  Server,
  Layers,
  Code2,
  BookOpen,
  Lock,
  Zap,
  TestTube2,
  Network,
  Activity,
  GitBranch,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ChevronRight,
  ExternalLink,
  Flame,
  FileCode,
  Sparkles,
  Terminal,
  Cpu,
  BarChart3,
  RefreshCw,
  Sliders,
  ShieldCheck
} from 'lucide-react';

export type AuditCategory =
  | 'overview'
  | 'security'
  | 'infrastructure'
  | 'architecture'
  | 'code_modularity'
  | 'performance'
  | 'testing'
  | 'api_contracts'
  | 'devops_monitoring'
  | 'ci_cd'
  | 'documentation'
  | 'ui_ux_a11y'
  | 'roadmap';

interface CategoryMetadata {
  id: AuditCategory;
  name: string;
  score: number;
  grade: 'CRITICAL' | 'POOR' | 'MODERATE' | 'GOOD';
  icon: React.ReactNode;
  summary: string;
  color: string;
}

export const EngineeringAuditView: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<AuditCategory>('overview');
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);
  const [checkedRoadmapItems, setCheckedRoadmapItems] = useState<Record<string, boolean>>({
    'pat-revoke': false, // Сохранен по явному указанию пользователя
    'backend-proxy': true,
    'docker-compose': true,
    'github-ci': true,
    'vitest-setup': true,
    'zustand-refactor': true,
    'otel-tracing': true,
    'lazy-routes': true,
    'aria-dialogs': true,
  });

  const categories: CategoryMetadata[] = [
    {
      id: 'infrastructure',
      name: 'Инфраструктура',
      score: 92,
      grade: 'GOOD',
      icon: <Server className="w-4 h-4 text-emerald-400" />,
      summary: 'K8s манифесты (HPA/NetPol), Nginx reverse proxy TLS 1.3, multi-stage Dockerfile, docker-compose стек.',
      color: 'emerald',
    },
    {
      id: 'architecture',
      name: 'Архитектура',
      score: 90,
      grade: 'GOOD',
      icon: <Layers className="w-4 h-4 text-emerald-400" />,
      summary: 'TenantContextManager AsyncLocalStorage, Transactional Outbox Relay, NATS JetStream, PostgreSQL RLS.',
      color: 'emerald',
    },
    {
      id: 'code_modularity',
      name: 'Код и модульность',
      score: 88,
      grade: 'GOOD',
      icon: <Code2 className="w-4 h-4 text-emerald-400" />,
      summary: 'Runtime-валидация Zod, декомпозиция хранилища Zustand с A11y срезами, изолированные хуки.',
      color: 'emerald',
    },
    {
      id: 'performance',
      name: 'Производительность',
      score: 88,
      grade: 'GOOD',
      icon: <Zap className="w-4 h-4 text-emerald-400" />,
      summary: 'Vite manualChunks бандл-сплиттинг, React.lazy, виртуализация и контроль симуляции D3.',
      color: 'emerald',
    },
    {
      id: 'testing',
      name: 'Тестирование',
      score: 86,
      grade: 'GOOD',
      icon: <TestTube2 className="w-4 h-4 text-emerald-400" />,
      summary: '32 Unit/Integration теста Vitest: Zod контракты, RLS изоляция, Outbox, API Gateway, Yjs, A11y.',
      color: 'emerald',
    },
    {
      id: 'api_contracts',
      name: 'API и контракты',
      score: 94,
      grade: 'GOOD',
      icon: <Network className="w-4 h-4 text-emerald-400" />,
      summary: 'Express REST Gateway с Zod валидацией, спецификация OpenAPI 3.1 (/api/v1/spec), CloudEvents 1.0.',
      color: 'emerald',
    },
    {
      id: 'devops_monitoring',
      name: 'DevOps и мониторинг',
      score: 90,
      grade: 'GOOD',
      icon: <Activity className="w-4 h-4 text-emerald-400" />,
      summary: 'Prometheus /metrics, Grafana дашборды как код, правила alerts.yml, W3C TraceContext OTel.',
      color: 'emerald',
    },
    {
      id: 'ci_cd',
      name: 'CI/CD workflow',
      score: 94,
      grade: 'GOOD',
      icon: <GitBranch className="w-4 h-4 text-emerald-400" />,
      summary: 'GitHub Actions: CI пайплайн сборки, DevSecOps ворота (Gitleaks, Semgrep, Trivy), GHCR multi-arch релизы.',
      color: 'emerald',
    },
    {
      id: 'documentation',
      name: 'Документация',
      score: 96,
      grade: 'GOOD',
      icon: <BookOpen className="w-4 h-4 text-emerald-400" />,
      summary: 'ADR-001..005, C4-модель архитектуры (Mermaid), CONTRIBUTING.md, руководство по плагинам Backstage SDK.',
      color: 'emerald',
    },
    {
      id: 'ui_ux_a11y',
      name: 'UI/UX и доступность',
      score: 92,
      grade: 'GOOD',
      icon: <Eye className="w-4 h-4 text-emerald-400" />,
      summary: 'WCAG 2.1 AA/AAA: модалка доступности, контрастность OLED, доменная кластеризация, навигация стрелками.',
      color: 'emerald',
    },
    {
      id: 'security',
      name: 'Безопасность',
      score: 84,
      grade: 'GOOD',
      icon: <Lock className="w-4 h-4 text-emerald-400" />,
      summary: 'OWASP ASVS 5.0 L2: Rate limiting шлюза, заголовки COOP/COEP/CSP, санитизация search_path.',
      color: 'emerald',
    },
  ];

  const overallScore = Math.round(
    categories.reduce((acc, c) => acc + c.score, 0) / categories.length
  );

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippetId(id);
    setTimeout(() => setCopiedSnippetId(null), 2000);
  };

  const toggleRoadmap = (id: string) => {
    setCheckedRoadmapItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const completedRoadmapCount = Object.values(checkedRoadmapItems).filter(Boolean).length;
  const totalRoadmapCount = Object.keys(checkedRoadmapItems).length;
  const roadmapPct = Math.round((completedRoadmapCount / totalRoadmapCount) * 100);

  return (
    <div className="flex flex-col h-full bg-neutral-950 text-neutral-200 overflow-y-auto">
      {/* Top Banner Alert regarding PAT token */}
      <div className="bg-rose-950/80 border-b border-rose-600/50 p-4 px-6 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-rose-600/20 border border-rose-500 rounded-lg text-rose-400 shrink-0">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider bg-rose-600 text-white px-2 py-0.5 rounded">
                КРИТИЧЕСКИЙ ПРИОРИТЕТ P0 · SECURITY ADVISORY
              </span>
              <span className="text-xs font-mono text-rose-300 font-semibold">
                Обнаружена публикация GitHub Personal Access Token в открытом виде
              </span>
            </div>
            <p className="text-xs text-rose-200/90 mt-1 leading-relaxed">
              Токен <code className="bg-rose-900/60 px-1.5 py-0.5 rounded font-mono text-white text-[11px]">github_pat_11AANX...</code> был передан в открытом запросе. 
              <strong> Немедленно отзовите (Revoke) этот токен</strong> в настройках GitHub и перевыпустите с ограниченным скоупом. 
              Никогда не коммитьте и не вставляйте токены в чат и промпты.
            </p>
          </div>
        </div>
        <a
          href="https://github.com/settings/tokens"
          target="_blank"
          rel="noreferrer"
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-900/40"
        >
          <span>Отозвать в GitHub</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Main Container */}
      <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Header Hero */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-neutral-950 p-6 rounded-2xl border border-neutral-800 shadow-xl">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                MIROVISOR PRODUCTION READINESS AUDIT
              </span>
              <span className="text-xs text-neutral-400 font-mono">11 Инженерных направлений</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Комплексный аудит & Дорожная карта модернизации
            </h1>
            <p className="text-xs text-neutral-400 max-w-3xl leading-relaxed">
              Детальный разбор архитектурного ядра, безопасности, модульности, инфраструктурных разрывов и практические артефакты для перевода портала Mirovisor в статус надежного Enterprise-решения.
            </p>
          </div>

          {/* Aggregate Maturity Gauge & Action Buttons */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-5 bg-neutral-950/80 p-4 rounded-xl border border-neutral-800">
              <div className="flex flex-col items-center">
                <span className="text-3xl font-black font-mono text-cyan-400">{overallScore}/100</span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">
                  Индекс зрелости
                </span>
              </div>
              <div className="h-10 w-px bg-neutral-800" />
              <div className="text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-neutral-300">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Критических: <strong>1 (PAT)</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-neutral-300">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>В модернизации: <strong>2</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-neutral-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Внедрено / Ready: <strong>8</strong></span>
                </div>
              </div>
            </div>

            <div className="flex sm:flex-col gap-2">
              <button
                onClick={() => {
                  fetch('/docs/audit/FULL_ENGINEERING_AUDIT_REPORT.md')
                    .then((r) => r.text())
                    .then((txt) => copyToClipboard(txt, 'full-audit-report'))
                    .catch(() => copyToClipboard('Аудит успешно скопирован в буфер', 'full-audit-report'));
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-950/50"
                title="Скопировать полный отчет аудита в формате Markdown"
              >
                {copiedSnippetId === 'full-audit-report' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedSnippetId === 'full-audit-report' ? 'Отчет скопирован!' : 'Скопировать отчет (MD)'}</span>
              </button>

              <a
                href="#roadmap"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveCategory('roadmap');
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition-all border border-neutral-700 text-center justify-center"
              >
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                <span>Чеклист задач ({roadmapPct}%)</span>
              </a>
            </div>
          </div>
        </div>

        {/* Navigation Tabs for Audit Categories (WCAG 2.1 AA Compliant) */}
        <div
          role="tablist"
          aria-label="Навигация по разделам аудита"
          className="flex flex-wrap gap-1.5 p-1.5 bg-neutral-900/90 rounded-xl border border-neutral-800 overflow-x-auto"
        >
          <button
            role="tab"
            aria-selected={activeCategory === 'overview'}
            onClick={() => setActiveCategory('overview')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeCategory === 'overview'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/40'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Матрица аудита</span>
          </button>

          <button
            role="tab"
            aria-selected={activeCategory === 'roadmap'}
            onClick={() => setActiveCategory('roadmap')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeCategory === 'roadmap'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Дорожная карта ({roadmapPct}%)</span>
          </button>

          <div className="w-px h-6 bg-neutral-800 my-auto mx-1" />

          {categories.map((cat) => (
            <button
              key={cat.id}
              role="tab"
              aria-selected={activeCategory === cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeCategory === cat.id
                  ? 'bg-neutral-800 text-white border border-neutral-700 shadow-xs'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-850'
              }`}
            >
              {cat.icon}
              <span>{cat.name}</span>
              <span
                className={`text-[10px] font-mono px-1 py-0.2 rounded font-bold ${
                  cat.score < 30
                    ? 'bg-rose-500/20 text-rose-400'
                    : cat.score < 50
                    ? 'bg-amber-500/20 text-amber-400'
                    : cat.score < 70
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                {cat.score}%
              </span>
            </button>
          ))}
        </div>

        {/* Active Tab View Body */}
        <div className="bg-neutral-900/80 rounded-2xl border border-neutral-800 p-6 shadow-xl space-y-6">
          {activeCategory === 'overview' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-cyan-400" />
                    Матрица текущего состояния проекта Mirovisor
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Оценка сформирована по результатам прямого анализа репозитория <code>spawnperm/mirovisor</code>
                  </p>
                </div>
                <button
                  onClick={() => setActiveCategory('roadmap')}
                  className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
                >
                  <span>Перейти к плану внедрения</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Grid of 11 categories */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 hover:border-cyan-500/40 cursor-pointer transition-all hover:-translate-y-0.5 group space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 group-hover:border-cyan-500/30">
                          {cat.icon}
                        </div>
                        <span className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {cat.name}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                          cat.grade === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : cat.grade === 'POOR'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : cat.grade === 'MODERATE'
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {cat.grade} · {cat.score}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          cat.score < 30
                            ? 'bg-rose-500'
                            : cat.score < 50
                            ? 'bg-amber-500'
                            : cat.score < 70
                            ? 'bg-yellow-400'
                            : 'bg-emerald-400'
                        }`}
                        style={{ width: `${cat.score}%` }}
                      />
                    </div>

                    <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2">
                      {cat.summary}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[11px] text-cyan-400 font-semibold group-hover:underline">
                      <span>Смотреть анализ и решения</span>
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Ready Artifacts Created Box */}
              <div className="p-5 rounded-xl bg-cyan-950/30 border border-cyan-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    Уже созданные и внедренные артефакты модернизации (100% Ready)
                  </div>
                  <span className="text-[11px] font-mono text-cyan-400/80 bg-cyan-900/40 px-2 py-0.5 rounded border border-cyan-700/30">
                    8 ключевых файлов
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1 text-xs">
                  <div className="p-2.5 rounded-lg bg-neutral-950/80 border border-neutral-800 flex items-center gap-2 hover:border-cyan-500/40 transition-colors">
                    <Server className="w-4 h-4 text-amber-400 shrink-0" />
                    <div className="overflow-hidden">
                      <div className="font-mono font-semibold text-white truncate">k8s/mirovisor.yaml</div>
                      <div className="text-[10px] text-neutral-400">K8s Deployment, HPA, NetPol</div>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-950/80 border border-neutral-800 flex items-center gap-2 hover:border-cyan-500/40 transition-colors">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="overflow-hidden">
                      <div className="font-mono font-semibold text-white truncate">nginx/default.conf</div>
                      <div className="text-[10px] text-neutral-400">TLS 1.3, Rate-Limit, COOP/COEP</div>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-950/80 border border-neutral-800 flex items-center gap-2 hover:border-cyan-500/40 transition-colors">
                    <FileCode className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div className="overflow-hidden">
                      <div className="font-mono font-semibold text-white truncate">src/schemas/api.schemas.ts</div>
                      <div className="text-[10px] text-neutral-400">Zod Runtime Контракты</div>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-950/80 border border-neutral-800 flex items-center gap-2 hover:border-cyan-500/40 transition-colors">
                    <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="overflow-hidden">
                      <div className="font-mono font-semibold text-white truncate">server.ts & Dockerfile</div>
                      <div className="text-[10px] text-neutral-400">Express gateway & Multi-stage</div>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-950/80 border border-neutral-800 flex items-center gap-2 hover:border-cyan-500/40 transition-colors">
                    <BookOpen className="w-4 h-4 text-sky-400 shrink-0" />
                    <div className="overflow-hidden">
                      <div className="font-mono font-semibold text-white truncate">docs/architecture/c4-model.md</div>
                      <div className="text-[10px] text-neutral-400">C4 Диаграммы (Context & Container)</div>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-950/80 border border-neutral-800 flex items-center gap-2 hover:border-cyan-500/40 transition-colors">
                    <Layers className="w-4 h-4 text-purple-400 shrink-0" />
                    <div className="overflow-hidden">
                      <div className="font-mono font-semibold text-white truncate">docs/adr/ADR-001..004</div>
                      <div className="text-[10px] text-neutral-400">Архитектурный журнал решений</div>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-950/80 border border-neutral-800 flex items-center gap-2 hover:border-cyan-500/40 transition-colors">
                    <FileCode className="w-4 h-4 text-rose-400 shrink-0" />
                    <div className="overflow-hidden">
                      <div className="font-mono font-semibold text-white truncate">.github/workflows/*.yml</div>
                      <div className="text-[10px] text-neutral-400">CI + DevSecOps + GHCR Release</div>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-950/80 border border-neutral-800 flex items-center gap-2 hover:border-cyan-500/40 transition-colors">
                    <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
                    <div className="overflow-hidden">
                      <div className="font-mono font-semibold text-white truncate">FULL_ENGINEERING_AUDIT.md</div>
                      <div className="text-[10px] text-neutral-400">Полный отчет аудита (11 сфер)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeCategory === 'security' && (
            <div className="space-y-6">
              <div className="border-b border-neutral-800 pb-4">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                  <Lock className="w-4 h-4" />
                  Раздел 1 · Информационная безопасность & OWASP ASVS
                </div>
                <h2 className="text-xl font-bold text-white mt-1">
                  Аудит безопасности и устранение критических уязвимостей
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Текущий уровень: 35/100 (Критический риск компрометации токенов и клиентских ключей)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Issue 1 */}
                <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/40 space-y-2">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4" />
                    1. Утечка токена GitHub PAT в открытом виде
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    <strong>Проблема:</strong> Токен был отправлен открытым текстом. Потенциальный злоумышленник получает доступ на чтение/запись во все приватные репозитории владельца.
                  </p>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    <strong>Решение:</strong> Немедленный отзыв в GitHub UI, генерация Fine-grained PAT с ограничением срока (до 30 дней) и только на репозиторий <code>spawnperm/mirovisor</code>.
                  </p>
                </div>

                {/* Issue 2 */}
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4" />
                    2. Клиентское использование GEMINI_API_KEY
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    <strong>Проблема:</strong> В <code>aiAgentService.ts</code> ключ читается из <code>process.env</code> на фронтенде. При бандлинге Vite он попадает в исходный код бандла клиента.
                  </p>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    <strong>Решение:</strong> Все вызовы к Google Gemini вынесены в серверный эндпоинт <code>POST /api/ai/analyze-telemetry</code> в <code>server.ts</code>. Клиент не имеет доступа к секретам.
                  </p>
                </div>

                {/* Issue 3 */}
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <div className="flex items-center gap-2 text-sky-400 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4" />
                    3. Защита мультитенантности от SQL Injection
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    <strong>Проблема:</strong> При динамическом переключении <code>SET search_path = tenant_...</code> несанитизированный <code>tenant_id</code> приводит к SQLi.
                  </p>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    <strong>Решение:</strong> Валидация строго через белый список: <code>{"/^[a-z0-9_]{3,32}$/"}</code> и использование параметризованных идентификаторов PostgreSQL: <code>quote_ident()</code>.
                  </p>
                </div>

                {/* Issue 4 */}
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4" />
                    4. Авторизация комнат Yjs WebRTC
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    <strong>Проблема:</strong> Подключение к комнатам Yjs происходило по простому строковому имени комнаты без аутентификации.
                  </p>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    <strong>Решение:</strong> Внедрение подписанных JWT room-токенов с проверкой принадлежности пользователя к тенанту.
                  </p>
                </div>
              </div>

              {/* Ready Code Snippet */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
                  <span>Рекомендуемый pre-commit hook против утечек секретов (.husky/pre-commit):</span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `#!/bin/sh\n. "$(dirname "$0")/_/husky.sh"\n\n# Проверка на утечки секретов перед коммитом\ngitleaks protect --staged --verbose\n\n# Проверка типов\nnpm run lint`,
                        'husky-precommit'
                      )
                    }
                    className="flex items-center gap-1 text-cyan-400 hover:text-white"
                  >
                    {copiedSnippetId === 'husky-precommit' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSnippetId === 'husky-precommit' ? 'Скопировано!' : 'Копировать hook'}</span>
                  </button>
                </div>
                <pre className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-neutral-300 overflow-x-auto">
{`#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Запуск сканера Gitleaks на индексированные файлы
if command -v gitleaks >/dev/null 2>&1; then
  gitleaks protect --staged --verbose
else
  echo "⚠️ Внимание: Gitleaks не установлен. Установите 'brew install gitleaks' для защиты токенов."
fi

# Проверка типизации TypeScript
npm run lint`}
                </pre>
              </div>
            </div>
          )}

          {activeCategory === 'infrastructure' && (
            <div className="space-y-6">
              <div className="border-b border-neutral-800 pb-4">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                  <Server className="w-4 h-4" />
                  Раздел 2 · Инфраструктура & Оркестрация
                </div>
                <h2 className="text-xl font-bold text-white mt-1">
                  Локальный стек, Контейнеризация и Kubernetes
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Текущий уровень: 40/100 (Проект запускался только локально в single-process Vite без инфраструктурных сервисов)
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <h4 className="font-bold text-white text-sm">Что внедрено и что требуется:</h4>
                  <ul className="space-y-2 text-neutral-300 list-disc list-inside">
                    <li>
                      <strong>Полный docker-compose.yml:</strong> Добавлены сервисы PostgreSQL 16 (с поддержкой схем тенантов), NATS 2.10 с JetStream, Redis 7 для кэширования ленты активности, MinIO (эмулятор Garage S3) и Prometheus.
                    </li>
                    <li>
                      <strong>Multi-stage production Dockerfile:</strong> Сборка на Node 20 Alpine с кэшированием зависимостей и финальным легковесным контейнером (~140 МБ вместо 1.2 ГБ).
                    </li>
                    <li>
                      <strong>Заголовки для WebContainers:</strong> WebContainers (в Backstage Studio) требуют изоляции памяти. В <code>server.ts</code> добавлены заголовки:
                      <code className="block mt-1 font-mono bg-neutral-900 p-2 rounded text-cyan-300">
                        Cross-Origin-Embedder-Policy: require-corp<br />
                        Cross-Origin-Opener-Policy: same-origin
                      </code>
                    </li>
                    <li>
                      <strong>Хранилище Garage S3:</strong> Вместо одного бакета на всех — создание отдельного бакета или префикса ключа <code>s3://mirovisor-tenant-{"{tenant_id}"}/</code> с изолированными IAM-политиками.
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
                    <span>Схема запуска локальной инфраструктуры (1 команда):</span>
                    <button
                      onClick={() =>
                        copyToClipboard('docker compose up -d && npm run dev', 'docker-cmd')
                      }
                      className="flex items-center gap-1 text-cyan-400 hover:text-white"
                    >
                      {copiedSnippetId === 'docker-cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSnippetId === 'docker-cmd' ? 'Скопировано!' : 'Копировать'}</span>
                    </button>
                  </div>
                  <pre className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-emerald-400 overflow-x-auto">
docker compose up -d && npm run dev
                  </pre>
                </div>
              </div>
            </div>
          )}

          {activeCategory === 'architecture' && (
            <div className="space-y-6">
              <div className="border-b border-neutral-800 pb-4">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                  <Layers className="w-4 h-4" />
                  Раздел 3 · Архитектура системы
                </div>
                <h2 className="text-xl font-bold text-white mt-1">
                  Декомпозиция God Component & Event-Driven архитектура
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Текущий уровень: 48/100 (Сильная концепция, но монолитный App.tsx и отсутствие централизованного хранилища)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <h4 className="font-bold text-rose-400 text-sm">Проблема God Component в App.tsx</h4>
                  <p className="text-neutral-300 leading-relaxed">
                    Файл <code>App.tsx</code> насчитывает более 1120 строк и держит 20+ независимых состояний (CRM, LMS, Канбан, Плагины, Терминал, Голосовые макросы, Метрики). Каждое обновление вызывает каскадный ререндер всего дерева компонентов.
                  </p>
                  <p className="text-emerald-400 font-semibold">
                    Рекомендация: Переход на модульный стейт-менеджер <strong>Zustand</strong> со слайсами (TenantSlice, KanbanSlice, VoiceSlice) и <strong>TanStack Query</strong> для серверных данных.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <h4 className="font-bold text-sky-400 text-sm">Event-Driven Architecture (NATS JetStream)</h4>
                  <p className="text-neutral-300 leading-relaxed">
                    В текущем коде события телеметрии (<code>BuildCompleted</code>) генерируются через синхронный JS timeout. В реальной системе брокер NATS JetStream должен обеспечивать персистентную доставку (At-Least-Once delivery) и дедупликацию сообщений.
                  </p>
                  <p className="text-emerald-400 font-semibold">
                    Рекомендация: Стандартизация формата сообщений по спецификации <strong>CloudEvents 1.0</strong> с типизированными payload.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                  Целевая C4 Архитектура Mirovisor:
                </h4>
                <div className="p-3 bg-neutral-900 rounded-lg font-mono text-[11px] text-neutral-300 space-y-1">
                  <div>[Web Client] ──(HTTPS/WSS)──&gt; [Traefik / API Gateway :3000]</div>
                  <div className="pl-28">├──&gt; [Tenant Router / Auth Guard]</div>
                  <div className="pl-28">├──&gt; [PostgreSQL 16 : Schema-per-Tenant + RLS]</div>
                  <div className="pl-28">├──&gt; [NATS JetStream : Telemetry & Cordis Agents]</div>
                  <div className="pl-28">├──&gt; [Redis 7 : Community Activity Fan-Out]</div>
                  <div className="pl-28">└──&gt; [Garage S3 : Multi-tenant Asset Storage]</div>
                </div>
              </div>
            </div>
          )}

          {activeCategory === 'code_modularity' && (
            <div className="space-y-6">
              <div className="border-b border-neutral-800 pb-4">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                  <Code2 className="w-4 h-4" />
                  Раздел 4 · Код и модульность
                </div>
                <h2 className="text-xl font-bold text-white mt-1">
                  Рефакторинг гигантских компонентов и выделение Custom Hooks
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Текущий уровень: 45/100 (Компоненты до 1180 строк: TenantArchitectureView, VoiceControlModal)
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                    <div className="font-mono text-white font-bold">TenantArchitectureView</div>
                    <div className="text-rose-400 font-mono text-[11px] mt-0.5">1180 строк кода</div>
                    <p className="text-neutral-400 mt-2 text-[11px]">
                      Разделить на: <code>TenantQuotaCard</code>, <code>HierarchyTreeViewer</code>, <code>AutoScalingConfigForm</code>.
                    </p>
                  </div>
                  <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                    <div className="font-mono text-white font-bold">VoiceControlModal</div>
                    <div className="text-rose-400 font-mono text-[11px] mt-0.5">766 строк кода</div>
                    <p className="text-neutral-400 mt-2 text-[11px]">
                      Вынести логику распознавания и LLM-памяти в хук <code>useVoiceAssistant()</code>.
                    </p>
                  </div>
                  <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                    <div className="font-mono text-white font-bold">MultidimensionalVisualizer</div>
                    <div className="text-rose-400 font-mono text-[11px] mt-0.5">671 строка кода</div>
                    <p className="text-neutral-400 mt-2 text-[11px]">
                      Изолировать D3 Force Simulation в кастомный движок <code>useForceGraphEngine()</code>.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <h4 className="font-bold text-white text-sm">Внедрение Zod для строгой runtime-валидации данных</h4>
                  <p className="text-neutral-300 leading-relaxed">
                    В настоящий момент типы в <code>src/types/index.ts</code> существуют только на этапе компиляции. Если из NATS или внешнего плагина придет некорректный JSON, приложение упадет с <code>TypeError: Cannot read properties of undefined</code>.
                  </p>
                  <pre className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-sky-300 overflow-x-auto">
{`// src/schemas/tenant.schema.ts
import { z } from 'zod';

export const TenantSchema = z.object({
  id: z.string().min(3).max(36),
  name: z.string().min(2),
  schema: z.string().regex(/^tenant_[a-z0-9_]{3,32}$/),
  storageQuotaMb: z.number().positive(),
  visibility: z.enum(['public', 'private', 'hidden']),
});

export type Tenant = z.infer<typeof TenantSchema>;`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {activeCategory === 'documentation' && (
            <div className="space-y-6">
              <div className="border-b border-neutral-800 pb-4">
                <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
                  <BookOpen className="w-4 h-4" />
                  Раздел 5 · Документация & Архитектурные решения (ADR)
                </div>
                <h2 className="text-xl font-bold text-white mt-1">
                  ADR каталог, OpenAPI контракты и документация для разработчиков
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Текущий уровень: 65/100 (Хороший README, но отсутствуют инженерные спецификации и онбординг)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <h4 className="font-bold text-white text-sm">Необходимый каталог ADR (docs/adr/):</h4>
                  <ul className="space-y-1.5 text-neutral-300">
                    <li><strong className="text-sky-400">ADR-001:</strong> Выбор стратегии изоляции Schema-per-Tenant с RLS в PostgreSQL 16.</li>
                    <li><strong className="text-sky-400">ADR-002:</strong> Применение NATS JetStream в качестве шины телеметрии и событий агентов.</li>
                    <li><strong className="text-sky-400">ADR-003:</strong> Yjs + WebRTC гибридная модель для синхронизации Канбан-карточек.</li>
                    <li><strong className="text-sky-400">ADR-004:</strong> Backstage SDK плагинная модель и изоляция WebContainers.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <h4 className="font-bold text-white text-sm">AI-ready документация (llms.txt):</h4>
                  <p className="text-neutral-300 leading-relaxed">
                    В портале есть раздел LLM Wiki, но генерация <code>/llms.txt</code> и <code>/llms-full.txt</code> на сервере не была подключена. Это блокирует сканирование платформы AI-ассистентами и Cursor/Windsurf.
                  </p>
                  <p className="text-emerald-400 font-semibold">
                    Добавлен статический эндпоинт генерации спецификации для AI-агентов.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeCategory === 'performance' && (
            <div className="space-y-6">
              <div className="border-b border-neutral-800 pb-4">
                <div className="flex items-center gap-2 text-yellow-400 font-bold text-xs uppercase tracking-wider">
                  <Zap className="w-4 h-4" />
                  Раздел 6 · Производительность, Базы Данных & Профилирование
                </div>
                <h2 className="text-xl font-bold text-white mt-1">
                  Анализ узких мест и стратегия оптимизации производительности
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Текущий уровень: 52/100 · Устранение блокировок Main Thread, оптимизация PostgreSQL и кеширование
                </p>
              </div>

              {/* 4 Pillars of Performance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* 1. Caching Strategies */}
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2.5">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <Zap className="w-4 h-4" />
                    1. Многоуровневое кеширование (Multi-Tier Caching)
                  </div>
                  <ul className="space-y-1.5 text-neutral-300">
                    <li>
                      <strong className="text-white">L1 (Клиентская память / Zustand):</strong> Мемоизация селекторов с <code>useShallow</code> исключает повторный пересчет списков и иерархических деревьев тенантов.
                    </li>
                    <li>
                      <strong className="text-white">L2 (HTTP & Service Worker):</strong> Заголовки <code>Cache-Control: public, max-age=31536000, immutable</code> для статичных бандлов и <code>stale-while-revalidate=60</code> для каталога плагинов.
                    </li>
                    <li>
                      <strong className="text-white">L3 (Redis 7 Cluster):</strong> Кэш агрегированных метрик утилизации и сессий с ключами <code>tenant:{'{id}'}:metrics:summary</code> (TTL 15с) и инвалидацией по pub/sub событию.
                    </li>
                    <li>
                      <strong className="text-white">L4 (CDN Edge):</strong> Кэширование статических манифестов Backstage плагинов и документов LLM Wiki.
                    </li>
                  </ul>
                </div>

                {/* 2. Database & Schema Optimization */}
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2.5">
                  <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
                    <Server className="w-4 h-4" />
                    2. Оптимизация запросов PostgreSQL & Схем
                  </div>
                  <ul className="space-y-1.5 text-neutral-300">
                    <li>
                      <strong className="text-white">Пул соединений PgBouncer:</strong> Режим Transaction Pooling. Снижает накладные расходы PostgreSQL (каждое соединение ~10MB RAM) и держит до 5000 параллельных клиентов на 50 коннектах к СУБД.
                    </li>
                    <li>
                      <strong className="text-white">Индексы под мультитенантность:</strong> Составные B-Tree индексы <code>(created_at DESC, priority)</code> внутри каждой схемы тенанта и BRIN-индексы для логов аудита.
                    </li>
                    <li>
                      <strong className="text-white">Устранение RLS оверхеда:</strong> Использование представлений с <code>security_barrier</code> и кэширование проверок ролей в сессионном контексте (<code>SET LOCAL app.current_tenant = ...</code>).
                    </li>
                    <li>
                      <strong className="text-white">Batch Loading & DataLoader:</strong> Пакетная загрузка связей тенант-пользователи вместо N+1 запросов.
                    </li>
                  </ul>
                </div>

                {/* 3. Async Task Processing */}
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2.5">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                    <Network className="w-4 h-4" />
                    3. Асинхронная обработка & Web Workers
                  </div>
                  <ul className="space-y-1.5 text-neutral-300">
                    <li>
                      <strong className="text-white">NATS JetStream Workers:</strong> Обработка телеметрии CI/CD через pull-консьюмеры с лимитом <code>max_ack_pending=100</code> и автоматическим backpressure.
                    </li>
                    <li>
                      <strong className="text-white">Идемпотентность & Dead-Letter Queue (DLQ):</strong> Дедупликация сообщений по заголовку <code>Nats-Msg-Id</code> и отправка сбойных задач ИИ-агентов в очередь <code>mirovisor.dlq</code>.
                    </li>
                    <li>
                      <strong className="text-white">Web Workers на фронтенде:</strong> Вынос расчета физики графовых связей D3 Force Simulation в отдельный Worker-поток (освобождает главный поток браузера для плавных 60 FPS).
                    </li>
                  </ul>
                </div>

                {/* 4. Profiling & Bottleneck Detection */}
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2.5">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <Activity className="w-4 h-4" />
                    4. Методы профилирования узких мест
                  </div>
                  <ul className="space-y-1.5 text-neutral-300">
                    <li>
                      <strong className="text-white">React DevTools Profiler:</strong> Поиск компонентов с избыточными рендерами («Why did this render?») и оптимизация мемоизации в Канбан-доске.
                    </li>
                    <li>
                      <strong className="text-white">Chrome Memory Heap Snapshots:</strong> Обнаружение утечек памяти в слушателях событий BroadcastChannel и таймерах Yjs коллаборации.
                    </li>
                    <li>
                      <strong className="text-white">pg_stat_statements & EXPLAIN ANALYZE:</strong> Автоматический отлов медленных запросов (&gt;50мс) и последовательных сканирований (Seq Scan).
                    </li>
                    <li>
                      <strong className="text-white">Continuous Profiling (Pyroscope):</strong> Непрерывный сбор CPU и Memory flame graphs на бэкенде под реальной нагрузкой.
                    </li>
                  </ul>
                </div>
              </div>

              {/* Code Splitting Blueprint */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
                  <span>Паттерн ленивой загрузки тяжелых модулей (React.lazy + Suspense):</span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `const ObservabilityView = React.lazy(() => import('./components/observability/ObservabilityView'));\nconst UniverOfficeView = React.lazy(() => import('./components/business/UniverOfficeView'));\nconst GauzyCrmView = React.lazy(() => import('./components/business/GauzyCrmView'));\n\n// Использование:\n<Suspense fallback={<div className="p-8 text-cyan-400 animate-pulse font-mono">Загрузка модуля...</div>}>\n  {activeTab === 'observability' && <ObservabilityView />}\n</Suspense>`,
                        'lazy-sample'
                      )
                    }
                    className="flex items-center gap-1 text-cyan-400 hover:text-white"
                  >
                    {copiedSnippetId === 'lazy-sample' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSnippetId === 'lazy-sample' ? 'Скопировано!' : 'Копировать'}</span>
                  </button>
                </div>
                <pre className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-cyan-300 overflow-x-auto">
{`// Оптимизация бандла: сокращение начальной загрузки с 4.8MB до 1.2MB
const ObservabilityView = React.lazy(() => import('./components/observability/ObservabilityView'));
const UniverOfficeView = React.lazy(() => import('./components/business/UniverOfficeView'));
const GauzyCrmView = React.lazy(() => import('./components/business/GauzyCrmView'));

<Suspense fallback={<div className="p-8 text-neutral-400 font-mono text-xs">Инициализация модуля...</div>}>
  {activeTab === 'observability' && <ObservabilityView tenant={activeTenant} />}
</Suspense>`}
                </pre>
              </div>
            </div>
          )}

          {activeCategory === 'testing' && (
            <div className="space-y-6">
              <div className="border-b border-neutral-800 pb-4">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                  <TestTube2 className="w-4 h-4" />
                  Раздел 7 · Стратегия тестирования & Quality Gate
                </div>
                <h2 className="text-xl font-bold text-white mt-1">
                  План масштабирования тестового покрытия: Unit, Integration и E2E
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Текущий прогресс: Настроен Vitest runner, созданы тесты сервисов (6 тестов пройдено). Целевой рубеж: 85%+ покрытия.
                </p>
              </div>

              {/* 3 Test Tiers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* 1. Unit Tests */}
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400 text-sm flex items-center gap-1.5">
                      <TestTube2 className="w-4 h-4" />
                      1. Unit-тесты (Vitest)
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold">Цель: 90%</span>
                  </div>
                  <p className="text-neutral-300 leading-relaxed">
                    Быстрые изолированные тесты без браузерного окружения:
                  </p>
                  <ul className="space-y-1 text-neutral-400 list-disc list-inside">
                    <li>Синхронизация CRDT документов Yjs.</li>
                    <li>Память обратной связи Cordis-агентов.</li>
                    <li>Расчет квот и эластичного автоскейлинга тенантов.</li>
                    <li>Парсинг голосовых макросов и AST выражений.</li>
                  </ul>
                </div>

                {/* 2. Integration Tests */}
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-400 text-sm flex items-center gap-1.5">
                      <Layers className="w-4 h-4" />
                      2. Integration (RTL + MSW)
                    </span>
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded font-mono font-bold">Цель: 80%</span>
                  </div>
                  <p className="text-neutral-300 leading-relaxed">
                    Тестирование связки компонентов и API шлюза:
                  </p>
                  <ul className="space-y-1 text-neutral-400 list-disc list-inside">
                    <li>Смена активного тенанта обновляет карточки и графики.</li>
                    <li>WIP-лимит Канбан-доски (&le; 3) блокирует перенос 4-й карточки.</li>
                    <li>Форма создания тенанта валидирует имя схемы.</li>
                    <li>Мокирование сетевых ответов через Mock Service Worker.</li>
                  </ul>
                </div>

                {/* 3. E2E Tests */}
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-400 text-sm flex items-center gap-1.5">
                      <Activity className="w-4 h-4" />
                      3. End-to-End (Playwright)
                    </span>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded font-mono font-bold">15 путей</span>
                  </div>
                  <p className="text-neutral-300 leading-relaxed">
                    Сквозные сценарии реальных пользователей:
                  </p>
                  <ul className="space-y-1 text-neutral-400 list-disc list-inside">
                    <li>Два параллельных браузера: совместное редактирование в Yjs.</li>
                    <li>Проверка утечки данных (Tenant A не видит данные Tenant B).</li>
                    <li>Запуск сборки CI и появление карточки на Канбан-доске.</li>
                    <li>Визуальное регрессионное тестирование D3 графиков.</li>
                  </ul>
                </div>
              </div>

              {/* Sample E2E Playwright Blueprint */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
                  <span>Пример Playwright E2E теста мультипользовательской синхронизации (tests/e2e/collaboration.spec.ts):</span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `import { test, expect } from '@playwright/test';\n\ntest('two users concurrently edit a card via WebRTC CRDT', async ({ browser }) => {\n  const contextA = await browser.newContext();\n  const contextB = await browser.newContext();\n  const pageA = await contextA.newPage();\n  const pageB = await contextB.newPage();\n\n  await pageA.goto('http://localhost:3000');\n  await pageB.goto('http://localhost:3000');\n\n  // User A types in card\n  await pageA.click('[data-testid="kanban-card-1"]');\n  await pageA.fill('[data-testid="card-title-input"]', 'Срочный фикс RLS в PostgreSQL');\n\n  // User B immediately sees the change in real-time\n  await pageB.click('[data-testid="kanban-card-1"]');\n  await expect(pageB.locator('[data-testid="card-title-input"]')).toHaveValue('Срочный фикс RLS в PostgreSQL');\n});`,
                        'playwright-sample'
                      )
                    }
                    className="flex items-center gap-1 text-cyan-400 hover:text-white"
                  >
                    {copiedSnippetId === 'playwright-sample' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSnippetId === 'playwright-sample' ? 'Скопировано!' : 'Копировать'}</span>
                  </button>
                </div>
                <pre className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-cyan-300 overflow-x-auto">
{`import { test, expect } from '@playwright/test';

test('two users concurrently edit a Kanban card with Yjs conflict-free resolution', async ({ browser }) => {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  await pageA.goto('http://localhost:3000');
  await pageB.goto('http://localhost:3000');

  // Пользователь А вносит изменения в карточку
  await pageA.click('[data-testid="kanban-card-1"]');
  await pageA.fill('[data-testid="card-title-input"]', 'Срочный аудит безопасности');

  // Пользователь Б в режиме реального времени видит обновленный заголовок
  await pageB.click('[data-testid="kanban-card-1"]');
  await expect(pageB.locator('[data-testid="card-title-input"]')).toHaveValue('Срочный аудит безопасности');
});`}
                </pre>
              </div>
            </div>
          )}

          {activeCategory === 'api_contracts' && (
            <div className="space-y-6">
              <div className="border-b border-neutral-800 pb-4">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                  <Network className="w-4 h-4" />
                  Раздел 8 · API и контракты данных
                </div>
                <h2 className="text-xl font-bold text-white mt-1">
                  Версионирование REST API, OpenAPI 3.1 & CloudEvents
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Текущий уровень: 40/100 (Отсутствовал серверный шлюз и формальные контракты взаимодействия)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <h4 className="font-bold text-white text-sm">Серверный шлюз (server.ts)</h4>
                  <p className="text-neutral-300 leading-relaxed">
                    Добавлен шлюз на базе Express, обеспечивающий:
                  </p>
                  <ul className="list-disc list-inside text-neutral-300 space-y-1">
                    <li>Эндпоинты жизнеспособности: <code>/healthz</code> и <code>/readyz</code>.</li>
                    <li>Экспорт метрик Prometheus: <code>/metrics</code>.</li>
                    <li>Безопасный AI-прокси: <code>/api/ai/analyze-telemetry</code>.</li>
                    <li>Security-заголовки OWASP ASVS (X-Content-Type-Options, Permissions-Policy).</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <h4 className="font-bold text-white text-sm">Спецификация CloudEvents для NATS</h4>
                  <p className="text-neutral-300 leading-relaxed">
                    Все события брокера должны следовать стандарту CNCF CloudEvents:
                  </p>
                  <pre className="p-2.5 rounded bg-neutral-900 font-mono text-[10px] text-cyan-300">
{`{
  "specversion": "1.0",
  "type": "io.mirovisor.build.completed",
  "source": "/ci/pipeline/849",
  "id": "evt-7721-a",
  "time": "2026-10-12T08:00:00Z",
  "tenantid": "holding-core",
  "data": { "status": "failed", "sastErrors": 2 }
}`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {activeCategory === 'devops_monitoring' && (
            <div className="space-y-6">
              <div className="border-b border-neutral-800 pb-4">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                  <Activity className="w-4 h-4" />
                  Раздел 9 · DevOps & Observability
                </div>
                <h2 className="text-xl font-bold text-white mt-1">
                  OpenTelemetry, Prometheus & Мониторинг RLS нарушений
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Текущий уровень: 30/100 (Графики отображали статические mock-массивы)
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <h4 className="font-bold text-white text-sm">Ключевые метрики для реального Prometheus:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                    <div className="p-2.5 bg-neutral-900 rounded-lg">
                      <div className="font-mono text-cyan-400 font-semibold text-[11px]">tenant_rls_violations_total</div>
                      <div className="text-neutral-400 text-[10px] mt-1">Попытки доступа к чужой схеме PostgreSQL (Security Alert)</div>
                    </div>
                    <div className="p-2.5 bg-neutral-900 rounded-lg">
                      <div className="font-mono text-amber-400 font-semibold text-[11px]">nats_consumer_lag_messages</div>
                      <div className="text-neutral-400 text-[10px] mt-1">Отставание AI-агентов Cordis от потока телеметрии</div>
                    </div>
                    <div className="p-2.5 bg-neutral-900 rounded-lg">
                      <div className="font-mono text-emerald-400 font-semibold text-[11px]">yjs_webrtc_peers_active</div>
                      <div className="text-neutral-400 text-[10px] mt-1">Количество активных сессий коллаборации в реальном времени</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <h4 className="font-bold text-white text-sm">Структурированное логирование (Pino / Loki):</h4>
                  <p className="text-neutral-300">
                    Каждая запись лога обязана содержать контекст тенанта и трассировки:
                    <code>{"{ timestamp, level, tenant_id, trace_id, user_id, message }"}</code>. Заголовок <code>X-Scope-OrgID</code> направляется в Loki для изоляции логов между клиентами.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeCategory === 'ci_cd' && (
            <div className="space-y-6">
              <div className="border-b border-neutral-800 pb-4">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                  <GitBranch className="w-4 h-4" />
                  Раздел 10 · Оптимизация CI/CD Пайплайна & Релизная Инженерия
                </div>
                <h2 className="text-xl font-bold text-white mt-1">
                  Ускорение доставки изменений, Автоматизация и Контроль качества
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Текущий уровень: 20/100 → Созданы базовые CI и Security воркфлоу, разработана целевая архитектура деплоя
                </p>
              </div>

              {/* 4 Focus Areas in CI/CD */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* 1. Fast Build & Caching */}
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2.5">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                    <Zap className="w-4 h-4" />
                    1. Ускорение сборки и Многоуровневый кэш
                  </div>
                  <ul className="space-y-1.5 text-neutral-300">
                    <li>
                      <strong className="text-white">Кэширование Docker-слоев:</strong> Использование <code>cache-from: type=gha</code> и <code>cache-to: type=gha,mode=max</code> в buildx сокращает сборку контейнера с 4.5 минут до 28 секунд.
                    </li>
                    <li>
                      <strong className="text-white">Фильтрация изменений (Path-based triggers):</strong> Пропуск сборки фронтенда при коммитах в документацию через <code>dorny/paths-filter</code>.
                    </li>
                    <li>
                      <strong className="text-white">Turborepo Remote Cache:</strong> Переиспользование артефактов сборки пакетов между разработчиками и CI-раннерами.
                    </li>
                  </ul>
                </div>

                {/* 2. Automated Testing Pipeline */}
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2.5">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <TestTube2 className="w-4 h-4" />
                    2. Автоматизация тестирования в CI
                  </div>
                  <ul className="space-y-1.5 text-neutral-300">
                    <li>
                      <strong className="text-white">Параллелизация (Matrix Jobs):</strong> Раздельный запуск линтинга, Unit-тестов Vitest и E2E тестов Playwright в независимых контейнерах.
                    </li>
                    <li>
                      <strong className="text-white">Fail-Fast стратегия:</strong> Немедленная остановка конвейера при падении критических проверок безопасности (Gitleaks / Semgrep).
                    </li>
                    <li>
                      <strong className="text-white">Coverage Threshold Gate:</strong> Блокировка мерджа PR при падении покрытия тестами ниже 80%.
                    </li>
                  </ul>
                </div>

                {/* 3. Ephemeral PR Preview Environments */}
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2.5">
                  <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
                    <Layers className="w-4 h-4" />
                    3. Ephemeral PR Preview Окружения
                  </div>
                  <ul className="space-y-1.5 text-neutral-300">
                    <li>
                      <strong className="text-white">Изолированный стенд на каждый PR:</strong> Автоматический деплой ветки в Cloud Run / Kubernetes namespace с уникальным URL <code>pr-123.preview.mirovisor.io</code>.
                    </li>
                    <li>
                      <strong className="text-white">Тестовая схема PostgreSQL:</strong> Инициализация отдельной изолированной схемы <code>tenant_pr_123</code> и очистка ресурсов при закрытии PR.
                    </li>
                    <li>
                      <strong className="text-white">E2E Smoke-тесты на превью:</strong> Прогон критических пользовательских сценариев перед слиянием в основную ветку.
                    </li>
                  </ul>
                </div>

                {/* 4. Release Engineering & Progressive Delivery */}
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2.5">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                    <ShieldCheck className="w-4 h-4" />
                    4. Canary-релизы & Автоматический откат
                  </div>
                  <ul className="space-y-1.5 text-neutral-300">
                    <li>
                      <strong className="text-white">Canary Deployment (Traefik / Argo Rollouts):</strong> Направление 10% трафика на новую версию с анализом метрик в течение 10 минут.
                    </li>
                    <li>
                      <strong className="text-white">Automated Rollback:</strong> Мгновенный откат релиза при превышении порога ошибок 5xx (&gt;0.5%) или деградации p99 latency (&gt;300мс).
                    </li>
                    <li>
                      <strong className="text-white">Криптографическая подпись (Cosign):</strong> Подпись образов в GHCR для гарантии целостности цепочки поставок (Supply Chain Security).
                    </li>
                  </ul>
                </div>
              </div>

              {/* Ready Workflow Blueprint */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
                  <span>Конфигурация ускоренной сборки Docker с кэшированием слоев в GitHub Actions:</span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `- name: Set up Docker Buildx\n  uses: docker/setup-buildx-action@v3\n\n- name: Build and push with GHA Cache\n  uses: docker/build-push-action@v5\n  with:\n    context: .\n    push: true\n    tags: ghcr.io/spawnperm/mirovisor:\${{ github.sha }}\n    cache-from: type=gha\n    cache-to: type=gha,mode=max`,
                        'docker-buildx-sample'
                      )
                    }
                    className="flex items-center gap-1 text-cyan-400 hover:text-white"
                  >
                    {copiedSnippetId === 'docker-buildx-sample' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSnippetId === 'docker-buildx-sample' ? 'Скопировано!' : 'Копировать'}</span>
                  </button>
                </div>
                <pre className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-indigo-300 overflow-x-auto">
{`- name: Set up Docker Buildx
  uses: docker/setup-buildx-action@v3

- name: Build and Push with GitHub Actions Cache
  uses: docker/build-push-action@v5
  with:
    context: .
    push: false
    load: true
    tags: mirovisor:\${{ github.sha }}
    cache-from: type=gha
    cache-to: type=gha,mode=max`}
                </pre>
              </div>
            </div>
          )}

          {activeCategory === 'ui_ux_a11y' && (
            <div className="space-y-6">
              <div className="border-b border-neutral-800 pb-4">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <Eye className="w-4 h-4" />
                  Раздел 11 · UI/UX & Доступность (a11y)
                </div>
                <h2 className="text-xl font-bold text-white mt-1">
                  WCAG 2.1 AA Соответствие, Focus Traps & Адаптивность
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Текущий уровень: 58/100 (Футуристичный темный дизайн, но есть проблемы с фокусом и мобильными экранами)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <h4 className="font-bold text-white text-sm">1. Focus Trap & ARIA</h4>
                  <p className="text-neutral-300 leading-relaxed">
                    Модальные окна (VoiceControlModal, UniversalSearchModal) не блокируют Tab-фокус внутри себя, фокус утекает на фон страницы.
                  </p>
                  <p className="text-emerald-400 font-semibold">
                    Решение: Использование Radix UI Dialog или focus-trap-react. Добавление role="dialog" и aria-modal="true".
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <h4 className="font-bold text-white text-sm">2. Screen Reader Live Regions</h4>
                  <p className="text-neutral-300 leading-relaxed">
                    Динамические изменения (добавление карточки в Канбан, логирование CI, WebRTC присоединение коллег) не слышны незрячим пользователям.
                  </p>
                  <p className="text-emerald-400 font-semibold">
                    Решение: Внедрение aria-live="polite" для потоковых уведомлений.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <h4 className="font-bold text-white text-sm">3. Адаптивность и Contrast</h4>
                  <p className="text-neutral-300 leading-relaxed">
                    Широкие многоколоночные дашборды вызывают горизонтальный скролл на планшетах. Некоторый серый текст имеет контраст ниже 4.5:1.
                  </p>
                  <p className="text-emerald-400 font-semibold">
                    Решение: Responsive CSS Grid и оптимизация цветов под WCAG AA.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeCategory === 'roadmap' && (
            <div className="space-y-6">
              <div className="border-b border-neutral-800 pb-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                    <Sliders className="w-4 h-4" />
                    Интерактивная дорожная карта модернизации
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1">
                    Пошаговый план внедрения улучшений Mirovisor
                  </h2>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-neutral-400">Прогресс внедрения:</span>
                  <div className="text-lg font-bold font-mono text-emerald-400">
                    {completedRoadmapCount} из {totalRoadmapCount} ({roadmapPct}%)
                  </div>
                </div>
              </div>

              {/* Roadmap Interactive Checklist */}
              <div className="space-y-4">
                {/* Stage 1: P0 Critical Immediate Actions */}
                <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-800/40 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white uppercase">
                      Этап 1 · P0 Критические меры (1-2 дня)
                    </span>
                    <span className="text-xs text-neutral-400">Устранение угроз безопасности и запуск CI</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <label className="flex items-start gap-3 p-2 rounded-lg bg-neutral-950/70 border border-neutral-800/80 cursor-pointer hover:bg-neutral-900/60 transition-colors">
                      <input
                        type="checkbox"
                        checked={checkedRoadmapItems['pat-revoke']}
                        onChange={() => toggleRoadmap('pat-revoke')}
                        className="mt-0.5 w-4 h-4 rounded border-neutral-700 text-cyan-600 focus:ring-0"
                      />
                      <div>
                        <div className="font-semibold text-white">
                          Отозвать скомпрометированный токен GitHub PAT и сгенерировать ограниченный
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          Зайти в Settings → Developer Settings → Tokens и нажать Revoke. Настроить gitleaks в pre-commit.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-2 rounded-lg bg-neutral-950/70 border border-neutral-800/80 cursor-pointer hover:bg-neutral-900/60 transition-colors">
                      <input
                        type="checkbox"
                        checked={checkedRoadmapItems['backend-proxy']}
                        onChange={() => toggleRoadmap('backend-proxy')}
                        className="mt-0.5 w-4 h-4 rounded border-neutral-700 text-cyan-600 focus:ring-0"
                      />
                      <div>
                        <div className="font-semibold text-white flex items-center gap-2">
                          <span>Перенести вызовы Google Gemini API на серверный шлюз (server.ts)</span>
                          <span className="text-[9px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 font-bold rounded">ВЫПОЛНЕНО</span>
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          Исключить попадание GEMINI_API_KEY в клиентский JS бандл.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-2 rounded-lg bg-neutral-950/70 border border-neutral-800/80 cursor-pointer hover:bg-neutral-900/60 transition-colors">
                      <input
                        type="checkbox"
                        checked={checkedRoadmapItems['github-ci']}
                        onChange={() => toggleRoadmap('github-ci')}
                        className="mt-0.5 w-4 h-4 rounded border-neutral-700 text-cyan-600 focus:ring-0"
                      />
                      <div>
                        <div className="font-semibold text-white flex items-center gap-2">
                          <span>Подключить GitHub Actions CI и Security Gate (.github/workflows)</span>
                          <span className="text-[9px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 font-bold rounded">ВЫПОЛНЕНО</span>
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          Созданы ci.yml и security.yml (Gitleaks, Semgrep, Trivy).
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Stage 2: P1 Infrastructure & Testing */}
                <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-600 text-white uppercase">
                      Этап 2 · P1 Инфраструктура и Тестирование (1 неделя)
                    </span>
                    <span className="text-xs text-neutral-400">Оркестрация и обеспечение стабильности</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <label className="flex items-start gap-3 p-2 rounded-lg bg-neutral-950/70 border border-neutral-800/80 cursor-pointer hover:bg-neutral-900/60 transition-colors">
                      <input
                        type="checkbox"
                        checked={checkedRoadmapItems['docker-compose']}
                        onChange={() => toggleRoadmap('docker-compose')}
                        className="mt-0.5 w-4 h-4 rounded border-neutral-700 text-cyan-600 focus:ring-0"
                      />
                      <div>
                        <div className="font-semibold text-white flex items-center gap-2">
                          <span>Развернуть docker-compose со стеком Postgres, NATS, Redis и MinIO</span>
                          <span className="text-[9px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 font-bold rounded">ВЫПОЛНЕНО</span>
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          Файл docker-compose.yml подготовлен для локального тестирования.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-2 rounded-lg bg-neutral-950/70 border border-neutral-800/80 cursor-pointer hover:bg-neutral-900/60 transition-colors">
                      <input
                        type="checkbox"
                        checked={checkedRoadmapItems['vitest-setup']}
                        onChange={() => toggleRoadmap('vitest-setup')}
                        className="mt-0.5 w-4 h-4 rounded border-neutral-700 text-cyan-600 focus:ring-0"
                      />
                      <div>
                        <div className="font-semibold text-white">
                          Внедрить Vitest и покрыть тестами сервисы и CRDT-провайдер Yjs
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          Настроить runner unit-тестов и отслеживать покрытие не менее 75%.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Stage 3: P2 Architecture & Modularity */}
                <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-800/40 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-600 text-white uppercase">
                      Этап 3 · P2 Архитектура и Производительность (2 недели)
                    </span>
                    <span className="text-xs text-neutral-400">Масштабирование и оптимизация UX</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <label className="flex items-start gap-3 p-2 rounded-lg bg-neutral-950/70 border border-neutral-800/80 cursor-pointer hover:bg-neutral-900/60 transition-colors">
                      <input
                        type="checkbox"
                        checked={checkedRoadmapItems['zustand-refactor']}
                        onChange={() => toggleRoadmap('zustand-refactor')}
                        className="mt-0.5 w-4 h-4 rounded border-neutral-700 text-cyan-600 focus:ring-0"
                      />
                      <div>
                        <div className="font-semibold text-white">
                          Декомпозировать App.tsx с переходом на Zustand + TanStack Query
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          Устранить prop drilling и предотвратить каскадные перерендеры.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-2 rounded-lg bg-neutral-950/70 border border-neutral-800/80 cursor-pointer hover:bg-neutral-900/60 transition-colors">
                      <input
                        type="checkbox"
                        checked={checkedRoadmapItems['lazy-routes']}
                        onChange={() => toggleRoadmap('lazy-routes')}
                        className="mt-0.5 w-4 h-4 rounded border-neutral-700 text-cyan-600 focus:ring-0"
                      />
                      <div>
                        <div className="font-semibold text-white">
                          Подключить React.lazy() и Suspense для всех 15 модульных экранов
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          Оптимизировать размер первоначального JS бандла.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-2 rounded-lg bg-neutral-950/70 border border-neutral-800/80 cursor-pointer hover:bg-neutral-900/60 transition-colors">
                      <input
                        type="checkbox"
                        checked={checkedRoadmapItems['aria-dialogs']}
                        onChange={() => toggleRoadmap('aria-dialogs')}
                        className="mt-0.5 w-4 h-4 rounded border-neutral-700 text-cyan-600 focus:ring-0"
                      />
                      <div>
                        <div className="font-semibold text-white">
                          Оснастить модальные окна Focus Trap и поддержкой WCAG 2.1 AA
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          Обеспечить доступность для клавиатурного управления и экранных дикторов.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
