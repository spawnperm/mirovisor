import React, { useState } from 'react';
import { 
  Boxes, 
  Code2, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Plus, 
  Sparkles, 
  Trash2, 
  RefreshCw, 
  Send,
  Terminal,
  ExternalLink,
  Layers,
  FileCode
} from 'lucide-react';
import { BackstagePluginCode, PluginManifest, Tenant } from '../../types';
import { INITIAL_BACKSTAGE_PLUGINS } from '../../data/mockData';

interface PluginStudioViewProps {
  activeTenant: Tenant;
  onRegisterBackstagePlugin: (plugin: BackstagePluginCode) => void;
  onInstallPluginManifest: (manifest: PluginManifest) => void;
}

export const PluginStudioView: React.FC<PluginStudioViewProps> = ({
  activeTenant,
  onRegisterBackstagePlugin,
  onInstallPluginManifest,
}) => {
  const [plugins, setPlugins] = useState<BackstagePluginCode[]>(INITIAL_BACKSTAGE_PLUGINS);
  const [selectedPlugin, setSelectedPlugin] = useState<BackstagePluginCode>(INITIAL_BACKSTAGE_PLUGINS[0]);
  const [activeCode, setActiveCode] = useState<string>(INITIAL_BACKSTAGE_PLUGINS[0].typescriptCode);
  const [sandboxLogs, setSandboxLogs] = useState<string[]>([]);
  const [isRunningSandbox, setIsRunningSandbox] = useState<boolean>(false);
  const [publishStatus, setPublishStatus] = useState<string | null>(null);

  // New plugin scaffolding template
  const handleSelectTemplate = (templateId: string) => {
    const found = plugins.find((p) => p.id === templateId);
    if (found) {
      setSelectedPlugin(found);
      setActiveCode(found.typescriptCode);
      setSandboxLogs([]);
    }
  };

  const handleCreateNewScaffold = () => {
    const newId = `plugin-custom-${Date.now().toString().slice(-4)}`;
    const scaffold: BackstagePluginCode = {
      id: newId,
      title: 'Новый микрофронтенд-плагин',
      version: '1.0.0',
      author: 'Команда разработчиков',
      category: 'devtools',
      description: 'Пользовательский плагин на базе Backstage SDK с регистрацией UI-виджета и MCP-инструмента.',
      extensionPoint: 'ui-dashboard-card',
      lifecycleState: 'discovered',
      permissions: ['audit.codebase.read'],
      typescriptCode: `import { createPlugin, createComponentExtension } from '@mirovisor/plugin-sdk';

export const customPlugin = createPlugin({
  id: '${newId}',
  title: 'Custom Extension Widget',
  async onInstall({ tenantId }) {
    console.log(\`[Plugin] Mounted in schema \${tenantId}\`);
  },
  async onTeardown({ tenantId }) {
    console.log(\`[Plugin] Teardown executed\`);
  },
});

export const CustomCard = createComponentExtension({
  name: 'CustomCard',
  component: () => ({
    render: () => ({
      status: 'Active',
      message: 'Привет из изолированного плагина Backstage!',
    }),
  }),
});`,
    };

    setPlugins([scaffold, ...plugins]);
    setSelectedPlugin(scaffold);
    setActiveCode(scaffold.typescriptCode);
    setSandboxLogs(['[Scaffold] Создан новый шаблон плагина Backstage SDK.']);
  };

  // Run in WebContainer simulation
  const handleRunInSandbox = () => {
    setIsRunningSandbox(true);
    setSandboxLogs([
      `[WebContainer] Инициализация изолированного контекста Node.js v20...`,
      `[Backstage SDK] Парсинг манифеста: ${selectedPlugin.id} (v${selectedPlugin.version})...`,
      `[Linter & SemVer] Проверка зависимостей и отсутствия циклических импортов (DFS)... OK`,
      `[Security Guard] Проверка разрешений: ${selectedPlugin.permissions.join(', ')}... РАЗРЕШЕНО`,
    ]);

    setTimeout(() => {
      setIsRunningSandbox(false);
      setSandboxLogs((prev) => [
        ...prev,
        `[Plugin Lifecycle] Хук onInstall() успешно выполнен для тенанта ${activeTenant.schema}!`,
        `[Extension Point] Зарегистрирована точка расширения: ${selectedPlugin.extensionPoint}`,
        `✓ Плагин валиден и готов к публикации в Verdaccio реестр!`,
      ]);
    }, 1200);
  };

  // Publish to Verdaccio and install in active tenant
  const handlePublishToVerdaccio = () => {
    const manifest: PluginManifest = {
      id: selectedPlugin.id,
      name: selectedPlugin.title,
      version: selectedPlugin.version,
      description: selectedPlugin.description,
      author: selectedPlugin.author,
      license: 'MIT',
      dependencies: [],
      conflicts: [],
      permissions: selectedPlugin.permissions,
      category: selectedPlugin.category,
      priceRub: 0,
      installedInTenants: [activeTenant.id],
      status: 'active',
    };

    onInstallPluginManifest(manifest);
    setPublishStatus(`Пакет ${selectedPlugin.id}@${selectedPlugin.version} опубликован в Verdaccio и подключен к ${activeTenant.name}!`);
    setTimeout(() => setPublishStatus(null), 4000);
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 p-4 gap-4 overflow-hidden">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900/80 p-3 rounded-xl border border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-400">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              BACKSTAGE-INSPIRED PLUGIN DEVELOPER STUDIO
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-neutral-800 text-neutral-300 rounded">
                SDK · Lifecycle · WebContainers
              </span>
            </h2>
            <div className="text-xs text-neutral-400">
              Архитектура плагинов: <code className="text-purple-300 font-mono">@mirovisor/plugin-sdk</code> · Изоляция в среде тенанта
            </div>
          </div>
        </div>

        {/* Top actions */}
        <div className="flex items-center gap-2">
          {publishStatus && (
            <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-lg animate-pulse font-mono">
              {publishStatus}
            </span>
          )}

          <button
            onClick={handleCreateNewScaffold}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg flex items-center gap-1.5 border border-neutral-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Создать плагин из шаблона
          </button>

          <button
            onClick={handlePublishToVerdaccio}
            className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs rounded-lg flex items-center gap-1.5 shadow-md shadow-purple-900/30 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            Опубликовать в Verdaccio
          </button>
        </div>
      </div>

      {/* Main Grid: Left Plugins & Templates / Middle Code Editor / Right Lifecycle Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 overflow-hidden">
        {/* Left: Plugin Registry Directory (3 cols) */}
        <div className="lg:col-span-3 bg-neutral-900/60 border border-neutral-800 rounded-xl p-3 flex flex-col gap-2 overflow-hidden">
          <span className="text-[10px] font-mono uppercase text-neutral-500 font-bold px-1">
            Каталог плагинов Backstage SDK:
          </span>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {plugins.map((p) => {
              const isSelected = selectedPlugin.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectTemplate(p.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all text-xs ${
                    isSelected
                      ? 'bg-neutral-800 border-purple-500/50 text-white shadow-md'
                      : 'bg-neutral-950/70 border-neutral-850 text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-white text-[11px] truncate">{p.title}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-neutral-950 text-purple-300 rounded border border-neutral-800">
                      v{p.version}
                    </span>
                  </div>

                  <p className="text-[11px] text-neutral-400 line-clamp-2 mb-2">{p.description}</p>

                  <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono pt-1 border-t border-neutral-800">
                    <span className="text-cyan-400">{p.extensionPoint}</span>
                    <span className="capitalize">{p.lifecycleState}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Plugin Lifecycle Diagram */}
          <div className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-800 text-[10px] font-mono text-neutral-400 space-y-1">
            <span className="text-purple-400 font-bold block">Жизненный цикл плагина:</span>
            <div className="leading-tight">
              Discovered → Validating → Registered → Installing → Active
            </div>
          </div>
        </div>

        {/* Middle: TypeScript Code Editor (5 cols) */}
        <div className="lg:col-span-5 bg-neutral-900/60 border border-neutral-800 rounded-xl p-3 flex flex-col gap-2 overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <div>
              <h3 className="text-xs font-bold text-white font-mono flex items-center gap-2">
                <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                {selectedPlugin.id}.ts
              </h3>
              <span className="text-[10px] text-neutral-400 font-mono">
                Точка расширения: <strong className="text-purple-300">{selectedPlugin.extensionPoint}</strong>
              </span>
            </div>

            <button
              onClick={handleRunInSandbox}
              disabled={isRunningSandbox}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {isRunningSandbox ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Компиляция...
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" />
                  Тест в Sandbox
                </>
              )}
            </button>
          </div>

          <div className="flex-1 bg-black/95 border border-neutral-850 rounded-xl p-3 overflow-hidden flex flex-col shadow-inner">
            <textarea
              value={activeCode}
              onChange={(e) => setActiveCode(e.target.value)}
              className="w-full h-full bg-transparent font-mono text-xs text-neutral-200 leading-relaxed focus:outline-none resize-none"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Right: Sandbox Execution Logs & Live Extension Widget Preview (4 cols) */}
        <div className="lg:col-span-4 bg-neutral-900/60 border border-neutral-800 rounded-xl p-3 flex flex-col gap-3 overflow-hidden">
          <div className="pb-2 border-b border-neutral-800">
            <h3 className="text-xs font-bold text-white font-mono flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              WEBCONTAINER SANDBOX RUNNER
            </h3>
            <span className="text-[10px] text-neutral-400 font-mono">
              Статический анализ, песочница и изолированный вывод
            </span>
          </div>

          {/* Sandbox console */}
          <div className="flex-1 bg-black/90 border border-neutral-850 rounded-xl p-3 font-mono text-[11px] overflow-y-auto space-y-1 text-neutral-300 shadow-inner">
            {sandboxLogs.length === 0 ? (
              <div className="text-neutral-600 italic">
                Нажмите «Тест в Sandbox» для компиляции кода плагина и проверки разрешений...
              </div>
            ) : (
              sandboxLogs.map((log, idx) => (
                <div
                  key={idx}
                  className={`leading-relaxed ${
                    log.includes('✓') || log.includes('OK')
                      ? 'text-emerald-400 font-bold'
                      : log.includes('[Security Guard]')
                      ? 'text-purple-300'
                      : 'text-neutral-400'
                  }`}
                >
                  {log}
                </div>
              ))
            )}
          </div>

          {/* Live Extension Widget Preview */}
          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2 text-xs">
            <span className="font-mono text-[10px] text-cyan-400 uppercase font-bold block">
              Превью смонтированного виджета плагина:
            </span>

            <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-white">{selectedPlugin.title}</span>
                <span className="text-emerald-400 font-mono font-bold">MOUNTED</span>
              </div>
              <p className="text-[11px] text-neutral-400">{selectedPlugin.description}</p>
              <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono pt-1 border-t border-neutral-850">
                <span>Tenant: {activeTenant.slug}</span>
                <span>Permissions: {selectedPlugin.permissions.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
