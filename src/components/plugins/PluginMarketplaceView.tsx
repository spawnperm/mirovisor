import React, { useState } from 'react';
import { 
  Boxes, 
  Download, 
  CheckCircle, 
  AlertTriangle, 
  ShieldAlert, 
  Tag, 
  Info, 
  ExternalLink,
  Trash2,
  RefreshCw,
  Search
} from 'lucide-react';
import { PluginManifest, Tenant } from '../../types';
import { PluginRegistryService } from '../../services/pluginRegistryService';

interface PluginMarketplaceViewProps {
  plugins: PluginManifest[];
  activeTenant: Tenant;
  onInstallPlugin: (pluginId: string) => void;
  onUninstallPlugin: (pluginId: string) => void;
}

export const PluginMarketplaceView: React.FC<PluginMarketplaceViewProps> = ({
  plugins,
  activeTenant,
  onInstallPlugin,
  onUninstallPlugin,
}) => {
  const [selectedPlugin, setSelectedPlugin] = useState<PluginManifest | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const registry = new PluginRegistryService(plugins);

  const filteredPlugins = plugins.filter((plugin) => {
    const matchesCat = filterCategory === 'all' || plugin.category === filterCategory;
    const matchesSearch =
      plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plugin.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plugin.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleInstall = (plugin: PluginManifest) => {
    const validation = registry.validate(plugin);
    if (!validation.valid) {
      alert(`Ошибка установки: ${validation.errors.join('; ')}`);
      return;
    }
    onInstallPlugin(plugin.id);
    setStatusMessage(`Плагин ${plugin.name} успешно подключен к схеме ${activeTenant.schema}`);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleUninstall = (plugin: PluginManifest) => {
    onUninstallPlugin(plugin.id);
    setStatusMessage(`Плагин ${plugin.name} деактивирован для ${activeTenant.name}`);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 p-4 gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900/80 p-3 rounded-xl border border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-400">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              РЕЕСТР ПЛАГИНОВ И МАРКЕТПЛЕЙС РАСШИРЕНИЙ
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-neutral-800 text-neutral-300 rounded">
                SemVer + DFS Cycle Check
              </span>
            </h2>
            <div className="text-xs text-neutral-400">
              Целевой тенант: <strong className="text-white">{activeTenant.name}</strong> ({activeTenant.schema})
            </div>
          </div>
        </div>

        {/* Search & Status */}
        <div className="flex items-center gap-3">
          {statusMessage && (
            <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg animate-pulse">
              {statusMessage}
            </span>
          )}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-500" />
            <input
              type="text"
              placeholder="Поиск по плагинам..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500 w-48"
            />
          </div>
        </div>
      </div>

      {/* Categories Filter */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-[11px] font-semibold text-neutral-500 uppercase">Категории:</span>
        {['all', 'crm', 'security', 'devtools', 'office'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1 rounded-lg transition-colors capitalize ${
              filterCategory === cat
                ? 'bg-neutral-800 text-white font-medium'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            {cat === 'all' ? 'Все плагины' : cat}
          </button>
        ))}
      </div>

      {/* Plugin Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 flex-1 overflow-y-auto">
        {filteredPlugins.map((plugin) => {
          const isInstalled = plugin.installedInTenants.includes(activeTenant.id);
          const validation = registry.validate(plugin);

          return (
            <div
              key={plugin.id}
              className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                isInstalled
                  ? 'bg-neutral-900/90 border-purple-500/50 shadow-md shadow-purple-950/20'
                  : 'bg-neutral-900/50 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      {plugin.name}
                      <span className="text-[10px] font-mono text-neutral-400 px-1.5 py-0.5 bg-neutral-950 rounded border border-neutral-800">
                        v{plugin.version}
                      </span>
                    </h3>
                    <span className="text-[11px] text-neutral-500 font-mono">{plugin.id}</span>
                  </div>

                  {isInstalled ? (
                    <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Установлен
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono font-bold text-purple-400">
                      {plugin.priceRub === 0 ? 'Бесплатно' : `${plugin.priceRub.toLocaleString('ru-RU')} ₽`}
                    </span>
                  )}
                </div>

                <p className="text-xs text-neutral-300 leading-relaxed mb-3">{plugin.description}</p>

                {/* Dependencies */}
                {plugin.dependencies.length > 0 && (
                  <div className="text-[11px] text-neutral-400 mb-2">
                    <span className="text-neutral-500">Зависимости: </span>
                    {plugin.dependencies.map((d) => (
                      <span key={d.pluginId} className="font-mono text-cyan-400 mr-2">
                        {d.pluginId} ({d.minVersion})
                      </span>
                    ))}
                  </div>
                )}

                {/* Required Permissions */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {plugin.permissions.map((p) => (
                    <span
                      key={p}
                      className="text-[10px] font-mono text-neutral-400 bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800/80"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-neutral-800/80 text-xs">
                <button
                  onClick={() => setSelectedPlugin(plugin)}
                  className="text-neutral-400 hover:text-white text-[11px] underline flex items-center gap-1"
                >
                  <Info className="w-3 h-3" /> Манифест
                </button>

                {isInstalled ? (
                  <button
                    onClick={() => handleUninstall(plugin)}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-rose-950 hover:text-rose-400 text-neutral-300 rounded-lg font-medium transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Удалить
                  </button>
                ) : (
                  <button
                    onClick={() => handleInstall(plugin)}
                    className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" /> Подключить
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Manifest Inspector Modal */}
      {selectedPlugin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">Манифест: {selectedPlugin.name}</h3>
              <button onClick={() => setSelectedPlugin(null)} className="text-neutral-400 hover:text-white">
                ✕
              </button>
            </div>
            <pre className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 text-[11px] font-mono text-cyan-300 overflow-x-auto max-h-96">
              {JSON.stringify(selectedPlugin, null, 2)}
            </pre>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelectedPlugin(null)}
                className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
