import React, { useState, useEffect, useRef, useId } from 'react';
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
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listboxId = useId();

  const { containerRef } = useFocusTrap({
    isOpen,
    onClose,
    initialFocusRef: inputRef,
  });

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
      subtitle: f.fileOrUrl,
      meta: `${f.severity} · ${f.cwe} · ${f.scanner}`,
    })),
    ...INITIAL_WIKI_DOCS.map((w) => ({
      id: w.slug,
      category: 'wiki' as const,
      title: w.title,
      subtitle: w.summary,
      meta: `${w.type} · ${w.tags.slice(0, 2).join(', ')}`,
    })),
    ...builds.map((b) => ({
      id: b.id,
      category: 'pipeline' as const,
      title: `Сборка #${b.buildNumber}: ${b.commitMessage}`,
      subtitle: `Ветка: ${b.branch} · Автор: ${b.author}`,
      meta: `${b.status} · ${b.durationSec}s`,
    })),
  ];

  const results = query.trim()
    ? allItems.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
          item.meta.toLowerCase().includes(query.toLowerCase())
      )
    : allItems.slice(0, 12);

  // Reset selected index when query results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation for arrow keys and Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0));
      } else if (e.key === 'Enter') {
        if (results.length > 0 && results[selectedIndex]) {
          e.preventDefault();
          const target = results[selectedIndex];
          onSelectResult(target.category, target.id);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, results, selectedIndex, onSelectResult]);

  if (!isOpen) return null;

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

  const activeItemId = results[selectedIndex] ? `search-item-${results[selectedIndex].id}` : undefined;

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
            role="combobox"
            aria-expanded="true"
            aria-controls={listboxId}
            aria-activedescendant={activeItemId}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Кросс-платформенный поиск: тенанты, плагины, карточки, CVE, wiki..."
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
        <div
          id={listboxId}
          role="listbox"
          aria-label="Результаты поиска"
          className="p-2 overflow-y-auto space-y-1 flex-1"
        >
          {results.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-500">
              По запросу «{query}» ничего не найдено в индексе платформы.
            </div>
          ) : (
            results.map((item, idx) => {
              const isSelected = selectedIndex === idx;
              return (
                <button
                  key={`${item.category}_${item.id}`}
                  id={`search-item-${item.id}`}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onSelectResult(item.category, item.id);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between gap-3 text-xs ${
                    isSelected
                      ? 'bg-neutral-800 text-white ring-1 ring-cyan-500/50 shadow-sm'
                      : 'hover:bg-neutral-800/60 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-neutral-950 rounded-lg border border-neutral-800 shrink-0">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white truncate">{item.title}</span>
                        <span className="text-[10px] font-mono text-neutral-400 uppercase px-1.5 py-0.2 bg-neutral-950 rounded border border-neutral-800">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 truncate mt-0.5">{item.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-neutral-400 hidden sm:inline">{item.meta}</span>
                    <ArrowRight className={`w-3.5 h-3.5 transition-colors ${isSelected ? 'text-cyan-400 translate-x-0.5' : 'text-neutral-600'}`} />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-2.5 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
          <span>Найдено: {results.length} записей</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-neutral-800 text-neutral-300 rounded">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-neutral-800 text-neutral-300 rounded">↓</kbd>
              навигация
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-neutral-800 text-neutral-300 rounded">↵</kbd>
              выбрать
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
