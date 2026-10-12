import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Layers, Shield, Boxes, Briefcase, GraduationCap, BookOpen, ArrowRight, Terminal } from 'lucide-react';
import { Tenant, KanbanCard, PluginManifest, CrmDeal, LmsCourse, SecurityFinding, PipelineBuild } from '../../types';
import { INITIAL_WIKI_DOCS } from '../../data/mockData';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface UniversalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenants: Tenant[];
  cards: KanbanCard[];
  plugins: PluginManifest[];
  deals: CrmDeal[];
  courses: LmsCourse[];
  findings: SecurityFinding[];
  builds?: PipelineBuild[];
  onSelectResult: (category: string, id: string) => void;
}

interface SearchItem {
  id: string;
  category: 'tenant' | 'kanban' | 'plugin' | 'crm' | 'lms' | 'security' | 'wiki' | 'pipeline';
  title: string;
  subtitle: string;
  meta: string;
}

export const UniversalSearchModal: React.FC<UniversalSearchModalProps> = ({
  isOpen,
  onClose,
  tenants,
  cards,
  plugins,
  deals,
  courses,
  findings,
  builds = [],
  onSelectResult,
}) => {
  const [query, setQuery] = useState<string>('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { containerRef } = useFocusTrap({
    isOpen,
    onClose,
    initialFocusRef: inputRef,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Aggregate all entities for cross-platform indexing
  const allItems: SearchItem[] = [
    ...tenants.map((t) => ({
      id: t.id,
      category: 'tenant' as const,
      title: t.name,
      subtitle: t.description,
      meta: `Схема: ${t.schema} · ${t.visibility}`,
    })),
    ...cards.map((c) => ({
      id: c.id,
      category: 'kanban' as const,
      title: c.title,
      subtitle: c.description,
      meta: `${c.createdBy} · ${c.column} · ${c.priority}`,
    })),
    ...plugins.map((p) => ({
      id: p.id,
      category: 'plugin' as const,
      title: p.name,
      subtitle: p.description,
      meta: `v${p.version} · ${p.category}`,
    })),
    ...deals.map((d) => ({
      id: d.id,
      category: 'crm' as const,
      title: d.title,
      subtitle: d.company,
      meta: `${d.amountRub.toLocaleString('ru-RU')} ₽ · ${d.stage}`,
    })),
    ...courses.map((crs) => ({
      id: crs.id,
      category: 'lms' as const,
      title: crs.title,
      subtitle: crs.description,
      meta: `${crs.difficulty} · ${crs.badge}`,
    })),
    ...findings.map((f) => ({
      id: f.id,
      category: 'security' as const,
      title: f.title,
      subtitle: f.description,
      meta: `${f.scanner} · ${f.severity} · ${f.cwe}`,
    })),
    ...INITIAL_WIKI_DOCS.map((w) => ({
      id: w.slug,
      category: 'wiki' as const,
      title: w.title,
      subtitle: w.summary,
      meta: `Wiki: ${w.type}`,
    })),
    ...(builds || []).map((b) => ({
      id: b.id,
      category: 'pipeline' as const,
      title: `CI/CD Сборка #${b.buildNumber} (${b.environment})`,
      subtitle: b.commitMessage,
      meta: `${b.branch} · ${b.status} · ${b.durationSec}s`,
    })),
  ];

  const results = query.trim()
    ? allItems.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
          item.meta.toLowerCase().includes(query.toLowerCase())
      )
    : allItems.slice(0, 8);

  const getCategoryIcon = (cat: SearchItem['category']) => {
    switch (cat) {
      case 'tenant':
        return <Layers className="w-3.5 h-3.5 text-cyan-400" />;
      case 'kanban':
        return <Shield className="w-3.5 h-3.5 text-purple-400" />;
      case 'plugin':
        return <Boxes className="w-3.5 h-3.5 text-indigo-400" />;
      case 'crm':
        return <Briefcase className="w-3.5 h-3.5 text-emerald-400" />;
      case 'lms':
        return <GraduationCap className="w-3.5 h-3.5 text-amber-400" />;
      case 'security':
        return <Shield className="w-3.5 h-3.5 text-rose-400" />;
      case 'wiki':
        return <BookOpen className="w-3.5 h-3.5 text-sky-400" />;
      case 'pipeline':
        return <Terminal className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Универсальный поиск по платформе"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
    >
      <div
        ref={containerRef}
        tabIndex={-1}
        className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[75vh] focus:outline-none"
      >
        {/* Search Input Bar */}
        <div className="p-3 bg-neutral-950 border-b border-neutral-800 flex items-center gap-3">
          <Search className="w-4 h-4 text-neutral-400 shrink-0 ml-1" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Кросс-платформенный поиск: тенанты, плагины, карточки, код, CVE, вики..."
            aria-label="Поисковый запрос"
            className="flex-1 bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none font-sans"
          />
          <kbd className="px-2 py-0.5 bg-neutral-800 text-[10px] font-mono text-neutral-400 rounded">ESC</kbd>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть поиск"
            className="text-neutral-400 hover:text-white p-1 rounded focus-visible:ring-2 focus-visible:ring-cyan-400 focus:outline-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="p-2 overflow-y-auto space-y-1 flex-1">
          {results.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-500">
              По запросу «{query}» ничего не найдено в индексе платформы.
            </div>
          ) : (
            results.map((item) => (
              <button
                key={`${item.category}_${item.id}`}
                onClick={() => {
                  onSelectResult(item.category, item.id);
                  onClose();
                }}
                className="w-full text-left p-2.5 rounded-xl hover:bg-neutral-800/80 transition-colors flex items-center justify-between gap-3 group text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 bg-neutral-950 rounded-lg border border-neutral-800 shrink-0">
                    {getCategoryIcon(item.category)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white truncate">{item.title}</span>
                      <span className="text-[10px] font-mono text-neutral-500 uppercase px-1.5 py-0.2 bg-neutral-950 rounded border border-neutral-800">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 truncate mt-0.5">{item.subtitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono text-neutral-500 hidden sm:inline">{item.meta}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-600 group-hover:text-cyan-400 transition-colors" />
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-2.5 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
          <span>Найдено: {results.length} записей</span>
          <div className="flex items-center gap-2">
            <span>Нажмите</span>
            <kbd className="px-1.5 py-0.5 bg-neutral-800 text-neutral-300 rounded">↵</kbd>
            <span>для перехода</span>
          </div>
        </div>
      </div>
    </div>
  );
};
