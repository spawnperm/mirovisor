import React, { useState } from 'react';
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
  Sparkles,
  Terminal,
  Mic,
  Lock,
  Building
} from 'lucide-react';
import { Tenant, User } from '../../types';

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
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-cyan-900/30 font-mono text-sm">
            М
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-wider text-white flex items-center gap-2">
              МИРОВИЗОР
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded font-semibold">
                v1.0 ENTERPRISE
              </span>
            </h1>

            {/* Tenant Switcher in place of subtitle */}
            <div className="relative mt-0.5">
              <button
                onClick={() => setShowTenantDropdown(!showTenantDropdown)}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-cyan-500/40 text-[11px] font-mono text-cyan-400 transition-colors group text-left shadow-sm"
                title="Сменить рабочий тенант"
              >
                <Building className="w-3 h-3 text-cyan-400 group-hover:text-cyan-300 shrink-0" />
                <span className="font-semibold text-neutral-200 group-hover:text-white leading-tight">
                  {activeTenant.name}
                </span>
                <span className="text-[10px] text-neutral-500 font-mono">
                  ({activeTenant.schema})
                </span>
                <ChevronDown className={`w-3 h-3 text-neutral-400 transition-transform ${showTenantDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showTenantDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-black/20"
                    onClick={() => setShowTenantDropdown(false)}
                  />
                  <div className="absolute left-0 mt-1.5 w-72 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-1.5 z-50 text-xs">
                    <div className="text-[10px] font-mono uppercase text-neutral-400 px-2 py-1 flex items-center justify-between border-b border-neutral-800/80 mb-1">
                      <span>Выберите тенант:</span>
                      <span className="text-cyan-400 font-semibold">Schema-per-Tenant</span>
                    </div>
                    {tenants.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          onSelectTenant(t);
                          setShowTenantDropdown(false);
                        }}
                        className={`w-full text-left p-2 rounded-lg flex items-center justify-between transition-colors ${
                          t.id === activeTenant.id
                            ? 'bg-neutral-800 text-white font-semibold'
                            : 'text-neutral-300 hover:bg-neutral-850'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span>{t.name}</span>
                            {t.id === activeTenant.id && (
                              <span className="text-[9px] px-1 py-0.2 bg-cyan-500/20 text-cyan-300 rounded font-mono">АКТИВЕН</span>
                            )}
                          </div>
                          <div className="text-[10px] text-neutral-500 font-mono">
                            {t.schema} · {t.visibility}
                          </div>
                        </div>
                        {t.id === activeTenant.id && (
                          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
                        )}
                      </button>
                    ))}
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
