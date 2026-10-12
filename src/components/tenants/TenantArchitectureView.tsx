import React, { useState } from 'react';
import { 
  Building, 
  Layers, 
  Lock, 
  Palette, 
  Settings, 
  Database, 
  ShieldCheck, 
  CheckCircle2, 
  Plus, 
  Save, 
  ExternalLink,
  Sliders,
  Sparkles
} from 'lucide-react';
import { Tenant, TenantConfiguration } from '../../types';

interface TenantArchitectureViewProps {
  tenants: Tenant[];
  activeTenant: Tenant;
  onUpdateTenantConfig: (tenantId: string, updatedConfig: TenantConfiguration) => void;
  onCreateTenant: (newTenant: Partial<Tenant>) => void;
}

export const TenantArchitectureView: React.FC<TenantArchitectureViewProps> = ({
  tenants,
  activeTenant,
  onUpdateTenantConfig,
  onCreateTenant,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'branding' | 'patterns' | 'simulator' | 'create'>('branding');
  
  // Branding state for current active tenant
  const currentConfig: TenantConfiguration = activeTenant.config || {
    features: {
      enableCrm: true,
      enableLms: true,
      enableUniverOffice: true,
      enableWebContainers: true,
      enableSelfHealingCi: true,
    },
    quotas: {
      maxUsers: 200,
      storageQuotaMb: 10240,
      apiRateLimitRps: 500,
    },
    branding: {
      primaryColor: '#0ea5e9',
      accentColor: '#6366f1',
      customTitle: activeTenant.name,
      themeStyle: 'slate-enterprise',
    },
  };

  const [formConfig, setFormConfig] = useState<TenantConfiguration>(currentConfig);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Simulator state
  const [testQuery, setTestQuery] = useState<string>('SELECT * FROM invoices;');
  const [simulatorOutput, setSimulatorOutput] = useState<string>('');

  // New Tenant Modal state
  const [newTenantName, setNewTenantName] = useState<string>('');
  const [newTenantSlug, setNewTenantSlug] = useState<string>('');
  const [newTenantDesc, setNewTenantDesc] = useState<string>('');
  const [newTenantVisibility, setNewTenantVisibility] = useState<Tenant['visibility']>('private');

  const handleSaveConfig = () => {
    onUpdateTenantConfig(activeTenant.id, formConfig);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const runRlsTestQuery = () => {
    setSimulatorOutput(`-- ВЫПОЛНЕНИЕ В КОНТЕКСТЕ ТЕНАНТА: ${activeTenant.name} (${activeTenant.schema})
BEGIN TRANSACTION;
SET LOCAL app.current_user = 'usr_superadmin';
SET LOCAL app.current_tenant = '${activeTenant.id}'::UUID;

-- Попытка выборки: ${testQuery}
-- Проверка RLS FORCE:
SELECT id, amount, tenant_id FROM ${activeTenant.schema}.invoices;

РЕЗУЛЬТАТ:
[
  { "id": "inv_901", "amount": 1250000, "tenant_id": "${activeTenant.id}" },
  { "id": "inv_902", "amount": 3400000, "tenant_id": "${activeTenant.id}" }
]
✓ Доступ к строкам других 3 схем физически заблокирован политикой PostgreSQL Row-Level Security!
COMMIT;`);
  };

  const handleCreateNewTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName || !newTenantSlug) return;
    onCreateTenant({
      name: newTenantName,
      slug: newTenantSlug,
      description: newTenantDesc,
      visibility: newTenantVisibility,
    });
    setNewTenantName('');
    setNewTenantSlug('');
    setNewTenantDesc('');
    setActiveSubTab('branding');
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 p-4 gap-4 overflow-hidden">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900/80 p-3 rounded-xl border border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              МУЛЬТИТЕНАНТНАЯ АРХИТЕКТУРА И КАСТОМИЗАЦИЯ ТЕНАНТОВ
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-neutral-800 text-neutral-300 rounded">
                Ever Gauzy & WingtipTickets Patterns
              </span>
            </h2>
            <div className="text-xs text-neutral-400">
              Текущий тенант: <strong className="text-white">{activeTenant.name}</strong> ({activeTenant.schema})
            </div>
          </div>
        </div>

        {/* Subtabs Switcher */}
        <div className="flex bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs">
          <button
            onClick={() => setActiveSubTab('branding')}
            className={`px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'branding' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            Брендинг и Квоты
          </button>
          <button
            onClick={() => setActiveSubTab('patterns')}
            className={`px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'patterns' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Паттерны изоляции
          </button>
          <button
            onClick={() => setActiveSubTab('simulator')}
            className={`px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'simulator' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            RLS Тестер
          </button>
          <button
            onClick={() => setActiveSubTab('create')}
            className={`px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'create' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Создать тенант
          </button>
        </div>
      </div>

      {/* SUBTAB: BRANDING & CONFIGURATION */}
      {activeSubTab === 'branding' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 overflow-y-auto">
          {/* Left Form: Settings (7 cols) */}
          <div className="lg:col-span-7 bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 space-y-5 text-xs">
            {saveSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Настройки и брендинг тенанта {activeTenant.name} успешно сохранены в схеме!
              </div>
            )}

            {/* Custom Branding section */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Palette className="w-4 h-4 text-cyan-400" />
                1. Индивидуальный брендинг и стиль портала
              </h3>

              <div>
                <label className="text-neutral-400 block mb-1">Кастомный заголовок портала для тенанта</label>
                <input
                  type="text"
                  value={formConfig.branding.customTitle}
                  onChange={(e) =>
                    setFormConfig({
                      ...formConfig,
                      branding: { ...formConfig.branding, customTitle: e.target.value },
                    })
                  }
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-400 block mb-1">Основной цвет бренда (Primary)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formConfig.branding.primaryColor}
                      onChange={(e) =>
                        setFormConfig({
                          ...formConfig,
                          branding: { ...formConfig.branding, primaryColor: e.target.value },
                        })
                      }
                      className="w-8 h-8 rounded border border-neutral-700 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formConfig.branding.primaryColor}
                      onChange={(e) =>
                        setFormConfig({
                          ...formConfig,
                          branding: { ...formConfig.branding, primaryColor: e.target.value },
                        })
                      }
                      className="bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 font-mono text-white text-xs w-28"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-neutral-400 block mb-1">Акцентный цвет (Accent)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formConfig.branding.accentColor}
                      onChange={(e) =>
                        setFormConfig({
                          ...formConfig,
                          branding: { ...formConfig.branding, accentColor: e.target.value },
                        })
                      }
                      className="w-8 h-8 rounded border border-neutral-700 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formConfig.branding.accentColor}
                      onChange={(e) =>
                        setFormConfig({
                          ...formConfig,
                          branding: { ...formConfig.branding, accentColor: e.target.value },
                        })
                      }
                      className="bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 font-mono text-white text-xs w-28"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Стилевой пресет темы (Design Theme Preset)</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'slate-enterprise', label: 'Slate Enterprise' },
                    { id: 'cyber-dark', label: 'Cyber Dark' },
                    { id: 'violet-glow', label: 'Violet Glow' },
                    { id: 'emerald-minimal', label: 'Emerald Clean' },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() =>
                        setFormConfig({
                          ...formConfig,
                          branding: { ...formConfig.branding, themeStyle: preset.id as any },
                        })
                      }
                      className={`p-2 rounded-lg border text-center transition-colors text-[11px] ${
                        formConfig.branding.themeStyle === preset.id
                          ? 'bg-neutral-800 border-cyan-500 text-white font-bold'
                          : 'bg-neutral-950 border-neutral-850 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Feature Flags for Tenant */}
            <div className="space-y-3 pt-3 border-t border-neutral-800">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-400" />
                2. Фича-флаги модулей (Feature Toggles)
              </h3>

              <div className="space-y-2">
                {[
                  { key: 'enableCrm', label: 'ERP / CRM Модуль Ever Gauzy', desc: 'Воронка сделок, контакты контрагентов и расчет зарплат' },
                  { key: 'enableLms', label: 'Корпоративный университет LMS', desc: 'Курсы, сертификация и проверка требований для ролей' },
                  { key: 'enableUniverOffice', label: 'Univer Office Harness (MCP)', desc: 'Серверная генерация таблиц Excel и документов Word' },
                  { key: 'enableWebContainers', label: 'Встроенная IDE WebContainers', desc: 'Терминал xterm и браузерный Node.js рантайм' },
                  { key: 'enableSelfHealingCi', label: 'Self-Healing CI & Nx Cloud DTE', desc: 'Автоматический анализ сбоев CI и предложения фиксов' },
                ].map((feat) => {
                  const isChecked = formConfig.features[feat.key as keyof typeof formConfig.features];
                  return (
                    <label
                      key={feat.key}
                      className="flex items-start gap-3 p-2.5 bg-neutral-950/70 border border-neutral-800 rounded-lg cursor-pointer hover:bg-neutral-950 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) =>
                          setFormConfig({
                            ...formConfig,
                            features: {
                              ...formConfig.features,
                              [feat.key]: e.target.checked,
                            },
                          })
                        }
                        className="mt-0.5 rounded border-neutral-700 text-cyan-500 focus:ring-0"
                      />
                      <div>
                        <div className="font-semibold text-white">{feat.label}</div>
                        <div className="text-[11px] text-neutral-400">{feat.desc}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Quotas & Resource Limits */}
            <div className="space-y-3 pt-3 border-t border-neutral-800">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                3. Квоты и ограничения ресурсов
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-neutral-400 block mb-1">Макс. мест (Users)</label>
                  <input
                    type="number"
                    value={formConfig.quotas.maxUsers}
                    onChange={(e) =>
                      setFormConfig({
                        ...formConfig,
                        quotas: { ...formConfig.quotas, maxUsers: parseInt(e.target.value) || 50 },
                      })
                    }
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 font-mono text-white text-xs"
                  />
                </div>

                <div>
                  <label className="text-neutral-400 block mb-1">Диск Garage S3 (MB)</label>
                  <input
                    type="number"
                    value={formConfig.quotas.storageQuotaMb}
                    onChange={(e) =>
                      setFormConfig({
                        ...formConfig,
                        quotas: { ...formConfig.quotas, storageQuotaMb: parseInt(e.target.value) || 5120 },
                      })
                    }
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 font-mono text-white text-xs"
                  />
                </div>

                <div>
                  <label className="text-neutral-400 block mb-1">Лимит RPS (RateLimit)</label>
                  <input
                    type="number"
                    value={formConfig.quotas.apiRateLimitRps}
                    onChange={(e) =>
                      setFormConfig({
                        ...formConfig,
                        quotas: { ...formConfig.quotas, apiRateLimitRps: parseInt(e.target.value) || 100 },
                      })
                    }
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 font-mono text-white text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleSaveConfig}
                className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 shadow-md transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                Сохранить конфигурацию тенанта
              </button>
            </div>
          </div>

          {/* Right: Live Preview of Tenant Portal Branding (5 cols) */}
          <div className="lg:col-span-5 bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Интерактивное превью брендированного портала
            </h3>

            {/* Mock Tenant Portal Header */}
            <div
              className="p-4 rounded-xl border border-neutral-700 shadow-2xl space-y-3"
              style={{
                backgroundColor: '#0c0f17',
                borderLeft: `4px solid ${formConfig.branding.primaryColor}`,
              }}
            >
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-xs font-mono shadow-sm"
                    style={{ backgroundColor: formConfig.branding.primaryColor }}
                  >
                    {activeTenant.name.charAt(0)}
                  </div>
                  <span className="font-bold text-white text-xs">{formConfig.branding.customTitle}</span>
                </div>
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold"
                  style={{
                    backgroundColor: `${formConfig.branding.accentColor}20`,
                    color: formConfig.branding.accentColor,
                  }}
                >
                  {formConfig.branding.themeStyle}
                </span>
              </div>

              {/* Sample Widget */}
              <div className="p-3 bg-neutral-950/80 rounded-lg border border-neutral-800 space-y-2 text-xs">
                <div className="flex justify-between text-[11px] text-neutral-400">
                  <span>Статус схемы {activeTenant.schema}:</span>
                  <span className="font-mono text-emerald-400 font-bold">RLS FORCE ONLINE</span>
                </div>
                <div className="flex justify-between text-[11px] text-neutral-400">
                  <span>Доступных модулей:</span>
                  <span className="font-mono text-white">
                    {Object.values(formConfig.features).filter(Boolean).length} из 5
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-neutral-400">
                  <span>Квота диска:</span>
                  <span className="font-mono text-cyan-300">
                    {activeTenant.storageUsedMb} / {formConfig.quotas.storageQuotaMb} MB
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  className="px-3 py-1 text-white rounded text-[11px] font-medium"
                  style={{ backgroundColor: formConfig.branding.primaryColor }}
                >
                  Действие
                </button>
                <button
                  className="px-3 py-1 rounded text-[11px] font-medium text-white border"
                  style={{
                    borderColor: formConfig.branding.accentColor,
                    color: formConfig.branding.accentColor,
                  }}
                >
                  Подробнее
                </button>
              </div>
            </div>

            {/* Architecture note */}
            <div className="p-3 bg-neutral-950 border border-neutral-850 rounded-xl text-neutral-400 text-xs space-y-1.5 leading-relaxed">
              <span className="font-mono text-[10px] text-cyan-400 uppercase font-bold block">
                Архитектурная справка (Ever Gauzy & WingtipTickets):
              </span>
              <p>
                Каждый тенант в Мировизоре является изолированным контуром: схема PostgreSQL{' '}
                <code className="text-white font-mono">{activeTenant.schema}</code> изолирует бизнес-данные,
                отдельный бакет Garage S3 <code className="text-white font-mono">tenant-{activeTenant.id}</code>{' '}
                хранит файлы, а Authentik группа обеспечивает ролевое разделение.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB: ARCHITECTURAL PATTERNS */}
      {activeSubTab === 'patterns' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 overflow-y-auto">
          <div className="p-5 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-3 text-xs">
            <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">
              Ever Gauzy Pattern (Используется в ядре)
            </span>
            <h3 className="text-sm font-bold text-white">Schema-per-Tenant + RLS Force</h3>
            <p className="text-neutral-300 leading-relaxed">
              Каждый клиент получает отдельную схему PostgreSQL внутри общей БД. Пул соединений переиспользуется,
              а разграничение обеспечивается через транзакционный <code className="text-cyan-300 font-mono">SET LOCAL app.current_tenant</code>.
            </p>
            <div className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-850 font-mono text-[11px] text-neutral-400 space-y-1">
              <div>+ Экономия ресурсов пула БД</div>
              <div>+ Быстрый provisioning (~2 сек)</div>
              <div>+ Параллельные миграции Drizzle</div>
            </div>
          </div>

          <div className="p-5 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-3 text-xs">
            <span className="text-[10px] font-mono text-purple-400 font-bold uppercase">
              Microsoft WingtipTicketsSaaS Pattern
            </span>
            <h3 className="text-sm font-bold text-white">Database-per-Tenant (Полная изоляция)</h3>
            <p className="text-neutral-300 leading-relaxed">
              Физически отдельная база данных для каждого арендатора. Идеально подходит для контуров высокой безопасности
              (FinTech / CyberShield) с индивидуальным бэкапом и восстановлением.
            </p>
            <div className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-850 font-mono text-[11px] text-neutral-400 space-y-1">
              <div>+ Нулевой риск утечки через баг в коде</div>
              <div>+ Независимый PITR бэкап</div>
              <div>- Больше накладных расходов на RAM</div>
            </div>
          </div>

          <div className="p-5 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-3 text-xs">
            <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">
              Open Mercato Pattern
            </span>
            <h3 className="text-sm font-bold text-white">Shared-Schema Discriminator Column</h3>
            <p className="text-neutral-300 leading-relaxed">
              Все записи хранятся в одной таблице с обязательным столбцом <code className="text-amber-300 font-mono">tenant_id</code>.
              В Мировизоре применяется только для общих сущностей Core-схемы (каталог плагинов, курсы LMS, пользователи).
            </p>
            <div className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-850 font-mono text-[11px] text-neutral-400 space-y-1">
              <div>+ Простые агрегированные запросы</div>
              <div>+ Единый индекс каталога</div>
              <div>- Требует строгой проверки в Guard</div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB: RLS TEST SIMULATOR */}
      {activeSubTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 overflow-hidden">
          <div className="lg:col-span-5 bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 flex flex-col gap-3 text-xs">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              Интерактивный тест изоляции RLS
            </h3>
            <p className="text-neutral-400">
              Проверьте выполнение SQL запроса через призму политики Row-Level Security текущего тенанта{' '}
              <strong className="text-white">{activeTenant.schema}</strong>.
            </p>

            <div className="space-y-1.5 flex-1 flex flex-col">
              <label className="text-neutral-400 block font-mono text-[11px]">SQL Тестовый запрос:</label>
              <textarea
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                rows={4}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 font-mono text-cyan-300 text-xs focus:outline-none"
              />
            </div>

            <button
              onClick={runRlsTestQuery}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              Выполнить запрос с изоляцией RLS
            </button>
          </div>

          <div className="lg:col-span-7 bg-black/90 border border-neutral-800 rounded-xl p-4 font-mono text-xs overflow-y-auto flex flex-col">
            <span className="text-[10px] text-neutral-500 uppercase font-bold pb-2 border-b border-neutral-800 block mb-2">
              Результат выполнения в изолированной транзакции PostgreSQL:
            </span>
            <pre className="text-emerald-400 flex-1 whitespace-pre-wrap leading-relaxed text-[11px]">
              {simulatorOutput || 'Нажмите "Выполнить запрос с изоляцией RLS" для запуска симуляции...'}
            </pre>
          </div>
        </div>
      )}

      {/* SUBTAB: CREATE NEW TENANT */}
      {activeSubTab === 'create' && (
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 max-w-2xl mx-auto w-full text-xs space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-cyan-400" />
            Мастер создания нового тенанта (Schema-per-Tenant Provisioning)
          </h3>
          <p className="text-neutral-400 leading-relaxed">
            Система автоматически создаст изолированную схему <code className="text-cyan-300 font-mono">tenant_[slug]</code>,
            применит миграции Drizzle ORM, настроит принудительную политику <code className="text-cyan-300 font-mono">FORCE ROW LEVEL SECURITY</code>,
            создаст бакет в Garage S3 и группу пользователей в Authentik.
          </p>

          <form onSubmit={handleCreateNewTenant} className="space-y-3">
            <div>
              <label className="text-neutral-400 block mb-1">Название тенанта / организации</label>
              <input
                type="text"
                value={newTenantName}
                onChange={(e) => setNewTenantName(e.target.value)}
                placeholder="Например: Альфа Банк Корпоратив"
                required
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500 text-xs"
              />
            </div>

            <div>
              <label className="text-neutral-400 block mb-1">URL Slug / Имя схемы (PostgreSQL Schema)</label>
              <input
                type="text"
                value={newTenantSlug}
                onChange={(e) => setNewTenantSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                placeholder="Например: alpha-bank (будет схема: tenant_alphabank)"
                required
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 text-xs"
              />
            </div>

            <div>
              <label className="text-neutral-400 block mb-1">Описание деятельности</label>
              <textarea
                value={newTenantDesc}
                onChange={(e) => setNewTenantDesc(e.target.value)}
                placeholder="Краткое описание назначения пространства..."
                rows={2}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500 text-xs"
              />
            </div>

            <div>
              <label className="text-neutral-400 block mb-1">Тип видимости в каталоге</label>
              <select
                value={newTenantVisibility}
                onChange={(e) => setNewTenantVisibility(e.target.value as any)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white focus:outline-none text-xs"
              >
                <option value="public">Public (Открытый каталог сообществ)</option>
                <option value="private">Private (Закрытый контур по заявке)</option>
                <option value="hidden">Hidden (Скрытый контур только по прямой ссылке)</option>
              </select>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 transition-colors"
              >
                Инициализировать схему и создать тенант
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
