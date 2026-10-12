import React, { useState, useMemo } from 'react';
import { 
  Network, 
  Layers, 
  Briefcase, 
  Boxes, 
  Users, 
  GraduationCap, 
  ShieldCheck, 
  Activity, 
  BookOpen, 
  Search, 
  ChevronDown, 
  ChevronRight,
  CornerDownRight,
  Sparkles,
  Terminal,
  Mic,
  Lock,
  Building,
  FolderTree,
  X
} from 'lucide-react';
import { Tenant, User } from '../../types';

interface TenantTreeNode {
  tenant: Tenant;
  children: TenantTreeNode[];
}

export type NavTabId = 
  | 'visualizer' 
  | 'pipelines'
  | 'kanban' 
  | 'tenants'
  | 'pluginstudio'
  | 'crm' 
  | 'univer' 
  | 'plugins' 
  | 'social' 
  | 'lms' 
  | 'security' 
  | 'observability' 
  | 'wiki';

interface HeaderProps {
  activeTab: NavTabId;
  onTabChange: (tab: NavTabId) => void;
  tenants: Tenant[];
  activeTenant: Tenant;
  onSelectTenant: (tenant: Tenant) => void;
  currentUser: User;
  onOpenSearch: () => void;
  onOpenTerminal: () => void;
  onOpenVoice: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  tenants,
  activeTenant,
  onSelectTenant,
  currentUser,
  onOpenSearch,
  onOpenTerminal,
  onOpenVoice,
}) => {
  const [showTenantDropdown, setShowTenantDropdown] = useState<boolean>(false);
  const [tenantSearchQuery, setTenantSearchQuery] = useState<string>('');
  const [expandedTenantIds, setExpandedTenantIds] = useState<Set<string>>(() => new Set(['tenant_acme', 'tenant_betalabs']));

  const toggleExpand = (tenantId: string) => {
    setExpandedTenantIds((prev) => {
      const next = new Set(prev);
      if (next.has(tenantId)) {
        next.delete(tenantId);
      } else {
        next.add(tenantId);
      }
      return next;
    });
  };

  // Build hierarchical tree grouping parent and child tenants
  const hierarchicalRoots = useMemo(() => {
    const query = tenantSearchQuery.trim().toLowerCase();

    // Map all tenants into node structures
    const nodeMap = new Map<string, TenantTreeNode>();
    tenants.forEach((t) => {
      nodeMap.set(t.id, { tenant: t, children: [] });
    });

    const roots: TenantTreeNode[] = [];

    // Establish parent/child links
    tenants.forEach((t) => {
      const node = nodeMap.get(t.id)!;
      if (t.parentTenantId && nodeMap.has(t.parentTenantId)) {
        nodeMap.get(t.parentTenantId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    // If no query, return full hierarchy tree
    if (!query) {
      return roots;
    }

    // Filter tree matching query: include root if root matches OR if any of its children match
    const filterNode = (node: TenantTreeNode): TenantTreeNode | null => {
      const matchesSelf =
        node.tenant.name.toLowerCase().includes(query) ||
        node.tenant.schema.toLowerCase().includes(query) ||
        node.tenant.visibility.toLowerCase().includes(query) ||
        (node.tenant.tags && node.tenant.tags.some((tag) => tag.toLowerCase().includes(query)));

      const matchingChildren: TenantTreeNode[] = [];
      for (const child of node.children) {
        const filteredChild = filterNode(child);
        if (filteredChild) matchingChildren.push(filteredChild);
      }

      if (matchesSelf || matchingChildren.length > 0) {
        return {
          tenant: node.tenant,
          children: matchingChildren,
        };
      }
      return null;
    };

    return roots
      .map((r) => filterNode(r))
      .filter((r): r is TenantTreeNode => r !== null);
  }, [tenants, tenantSearchQuery]);

  const tabs: { id: NavTabId; label: string; icon: React.ReactNode }[] = [
    { id: 'visualizer', label: 'Визуализатор', icon: <Network className="w-3.5 h-3.5" /> },
    { id: 'pipelines', label: 'CI/CD Пайплайны', icon: <Terminal className="w-3.5 h-3.5" /> },
    { id: 'kanban', label: 'Канбан Идей', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'tenants', label: 'Мультитенантность', icon: <Building className="w-3.5 h-3.5" /> },
    { id: 'pluginstudio', label: 'Backstage Студия', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'crm', label: 'Gauzy ERP', icon: <Briefcase className="w-3.5 h-3.5" /> },
    { id: 'univer', label: 'Univer Office', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'plugins', label: 'Каталог Плагинов', icon: <Boxes className="w-3.5 h-3.5" /> },
    { id: 'social', label: 'Сообщество', icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'lms', label: 'LMS Курсы', icon: <GraduationCap className="w-3.5 h-3.5" /> },
    { id: 'security', label: 'Безопасность', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { id: 'observability', label: 'Метрики', icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'wiki', label: 'LLM Wiki', icon: <BookOpen className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="bg-neutral-950 border-b border-neutral-800/80 sticky top-0 z-40">
      {/* Top Main Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 gap-4">
        {/* Brand / Title & Tenant Switcher */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-cyan-900/30 font-mono text-sm shrink-0">
            М
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-extrabold tracking-wider text-white">
                МИРОВИЗОР
              </h1>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded font-semibold">
                v1.0 ENTERPRISE
              </span>
            </div>

            {/* Tenant Switcher immediately below the portal title */}
            <div className="relative mt-0.5">
              <button
                type="button"
                onClick={() => {
                  setShowTenantDropdown(!showTenantDropdown);
                  if (!showTenantDropdown) setTenantSearchQuery('');
                }}
                className="group flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-neutral-900/90 hover:bg-neutral-850 border border-neutral-800 hover:border-cyan-500/50 text-[11px] font-mono transition-all text-left shadow-xs"
                title="Сменить рабочий тенант"
              >
                <Building className="w-3 h-3 text-cyan-400 group-hover:text-cyan-300 shrink-0" />
                <span className="font-semibold text-neutral-200 group-hover:text-white truncate max-w-[150px]">
                  {activeTenant.name}
                </span>
                <span className="text-[10px] text-neutral-500 font-mono">
                  ({activeTenant.schema})
                </span>
                <ChevronDown className={`w-3 h-3 text-neutral-400 transition-transform duration-200 ml-0.5 group-hover:text-cyan-400 ${showTenantDropdown ? 'rotate-180 text-cyan-400' : ''}`} />
              </button>

              {showTenantDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs"
                    onClick={() => {
                      setShowTenantDropdown(false);
                      setTenantSearchQuery('');
                    }}
                  />
                  <div className="absolute left-0 mt-1.5 w-80 bg-neutral-900/95 backdrop-blur-md border border-neutral-800 rounded-xl shadow-2xl p-2 z-50 text-xs flex flex-col">
                    <div className="text-[10px] font-mono uppercase text-neutral-400 px-2 py-1 flex items-center justify-between border-b border-neutral-800/80 mb-2">
                      <span className="flex items-center gap-1.5 font-semibold text-neutral-300">
                        <FolderTree className="w-3.5 h-3.5 text-cyan-400" />
                        Дерево тенантов
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (expandedTenantIds.size > 0) {
                              setExpandedTenantIds(new Set());
                            } else {
                              setExpandedTenantIds(new Set(tenants.map((t) => t.id)));
                            }
                          }}
                          className="text-[10px] text-cyan-400 hover:text-cyan-300 hover:underline transition-colors lowercase"
                          title="Развернуть/свернуть все уровни"
                        >
                          {expandedTenantIds.size > 0 ? 'свернуть все' : 'развернуть все'}
                        </button>
                        <span className="text-neutral-500">·</span>
                        <span className="text-neutral-400 font-mono">
                          {tenants.length}
                        </span>
                      </div>
                    </div>

                    {/* Search bar inside dropdown when list exceeds 5 entries */}
                    {(tenants.length > 5 || tenantSearchQuery.length > 0) && (
                      <div className="relative mb-2 px-0.5">
                        <div className="relative flex items-center">
                          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 pointer-events-none" />
                          <input
                            type="text"
                            value={tenantSearchQuery}
                            onChange={(e) => setTenantSearchQuery(e.target.value)}
                            placeholder="Поиск по названию или схеме..."
                            className="w-full bg-neutral-950/90 border border-neutral-800 focus:border-cyan-500/70 rounded-lg pl-8 pr-7 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-500 outline-none transition-colors font-sans"
                            autoFocus
                          />
                          {tenantSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setTenantSearchQuery('')}
                              className="absolute right-2 p-0.5 text-neutral-500 hover:text-neutral-300 rounded"
                              title="Очистить поиск"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Tenants hierarchical tree view */}
                    <div className="max-h-72 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                      {hierarchicalRoots.length === 0 ? (
                        <div className="py-6 text-center text-neutral-500 text-xs font-mono">
                          Тенанты не найдены по запросу «{tenantSearchQuery}»
                        </div>
                      ) : (
                        hierarchicalRoots.map((rootNode) => {
                          const hasChildren = rootNode.children.length > 0;
                          const isExpanded = expandedTenantIds.has(rootNode.tenant.id);
                          const isActive = rootNode.tenant.id === activeTenant.id;
                          const hasActiveChild = rootNode.children.some((c) => c.tenant.id === activeTenant.id);

                          return (
                            <div key={rootNode.tenant.id} className="space-y-1">
                              {/* Parent / Root Tenant Card */}
                              <div
                                className={`group/item w-full text-left p-2 rounded-lg flex items-center justify-between transition-all ${
                                  isActive
                                    ? 'bg-cyan-950/50 border border-cyan-800/70 text-white font-semibold shadow-xs'
                                    : hasActiveChild
                                    ? 'bg-neutral-850/80 border border-neutral-750 text-neutral-200'
                                    : 'text-neutral-300 hover:bg-neutral-800/80 border border-transparent'
                                }`}
                              >
                                {hasChildren && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleExpand(rootNode.tenant.id);
                                    }}
                                    className="p-1 -ml-1 mr-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-700/50 transition-colors"
                                    title={isExpanded ? 'Свернуть подразделы' : 'Развернуть подразделы'}
                                  >
                                    <ChevronRight
                                      className={`w-3.5 h-3.5 transition-transform duration-150 ${
                                        isExpanded ? 'rotate-90 text-cyan-400' : ''
                                      }`}
                                    />
                                  </button>
                                )}

                                <div
                                  className="min-w-0 flex-1 mr-2 cursor-pointer"
                                  onClick={() => {
                                    onSelectTenant(rootNode.tenant);
                                    setShowTenantDropdown(false);
                                    setTenantSearchQuery('');
                                  }}
                                >
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="truncate font-medium">{rootNode.tenant.name}</span>
                                    {rootNode.tenant.tier === 'holding' && (
                                      <span className="text-[9px] px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded font-mono font-medium">
                                        ХОЛДИНГ
                                      </span>
                                    )}
                                    {isActive && (
                                      <span className="text-[9px] px-1.5 py-0.2 bg-cyan-500/20 text-cyan-300 rounded font-mono font-medium">
                                        АКТИВЕН
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-neutral-500 font-mono truncate">
                                    {rootNode.tenant.schema} · {rootNode.tenant.visibility} · {rootNode.tenant.memberCount} уч.
                                    {hasChildren && ` · ${rootNode.children.length} дочерних`}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  {isActive && (
                                    <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
                                  )}
                                </div>
                              </div>

                              {/* Nested Children Tree */}
                              {hasChildren && isExpanded && (
                                <div className="ml-4 pl-3 border-l-2 border-cyan-900/40 space-y-1 py-0.5 relative">
                                  {rootNode.children.map((childNode, idx) => {
                                    const isChildActive = childNode.tenant.id === activeTenant.id;
                                    return (
                                      <div
                                        key={childNode.tenant.id}
                                        onClick={() => {
                                          onSelectTenant(childNode.tenant);
                                          setShowTenantDropdown(false);
                                          setTenantSearchQuery('');
                                        }}
                                        className={`group/child w-full text-left p-1.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors relative ${
                                          isChildActive
                                            ? 'bg-cyan-950/45 border border-cyan-800/60 text-white font-semibold'
                                            : 'text-neutral-300 hover:bg-neutral-800/70 border border-transparent'
                                        }`}
                                      >
                                        {/* Tree connector branch glyph */}
                                        <div className="min-w-0 flex-1 mr-2 flex items-start gap-1.5">
                                          <CornerDownRight className="w-3.5 h-3.5 text-neutral-600 group-hover/child:text-cyan-400 mt-0.5 shrink-0" />
                                          <div className="min-w-0">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                              <span className="truncate">{childNode.tenant.name}</span>
                                              {childNode.tenant.tier === 'division' && (
                                                <span className="text-[8px] px-1 py-0.2 bg-neutral-800 text-neutral-400 border border-neutral-700 rounded font-mono">
                                                  ДИВИЗИОН
                                                </span>
                                              )}
                                              {isChildActive && (
                                                <span className="text-[8px] px-1.5 py-0.2 bg-cyan-500/20 text-cyan-300 rounded font-mono font-medium">
                                                  АКТИВЕН
                                                </span>
                                              )}
                                            </div>
                                            <div className="text-[10px] text-neutral-500 font-mono truncate">
                                              {childNode.tenant.schema} · {childNode.tenant.visibility} · {childNode.tenant.memberCount} уч.
                                            </div>
                                          </div>
                                        </div>
                                        {isChildActive && (
                                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400 shrink-0" />
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Search trigger */}
        <button
          onClick={onOpenSearch}
          className="hidden md:flex items-center gap-3 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-400 hover:border-neutral-700 hover:text-neutral-200 transition-colors w-64"
        >
          <Search className="w-3.5 h-3.5 text-neutral-500" />
          <span className="flex-1 text-left">Кросс-поиск по системе...</span>
          <kbd className="px-1.5 py-0.5 bg-neutral-950 text-[10px] font-mono text-neutral-500 rounded border border-neutral-800">
            ⌘K
          </kbd>
        </button>

        {/* User Profile & Quick Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenVoice}
            className="p-1.5 bg-neutral-900 hover:bg-neutral-800 text-purple-400 border border-neutral-800 rounded-lg transition-colors"
            title="Голосовой ассистент Gemini Live (Ctrl+V)"
          >
            <Mic className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenTerminal}
            className="p-1.5 bg-neutral-900 hover:bg-neutral-800 text-cyan-400 border border-neutral-800 rounded-lg transition-colors"
            title="Открыть DevTools терминал"
          >
            <Terminal className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 pl-2 border-l border-neutral-800 text-xs">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.fullName}
              className="w-7 h-7 rounded-full object-cover border border-neutral-700"
            />
            <div className="hidden lg:block text-left">
              <span className="font-semibold text-white block leading-tight">{currentUser.fullName}</span>
              <span className="text-[10px] text-cyan-400 font-mono">Суперадмин (RLS Bypass)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Bar */}
      <div className="flex items-center gap-1 px-4 overflow-x-auto border-t border-neutral-850 bg-neutral-900/40 text-xs py-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                isActive
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-850/60'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
