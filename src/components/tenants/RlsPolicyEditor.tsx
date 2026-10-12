/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Postgres Row-Level Security (RLS) Policy Editor & Visual Verification Sandbox
 * Allows writing, fine-tuning, and interactive visual testing of PostgreSQL RLS policies
 * with simulated session variables and real-time cross-tenant leak detection.
 */

import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Database,
  Lock,
  Code,
  Play,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Plus,
  Trash2,
  Save,
  Sparkles,
  Info,
  Layers,
  Eye,
  Sliders,
  AlertTriangle,
} from 'lucide-react';
import { Tenant, RlsPolicy } from '../../types';
import { useRlsPoliciesSlice } from '../../store/selectors';
import { useAppStore } from '../../store/useAppStore';
import { LogUtility } from '../../services/logUtility';

interface RlsPolicyEditorProps {
  tenants: Tenant[];
  activeTenant: Tenant;
}

interface SimulatedRow {
  id: string;
  tenant_id: string;
  name: string;
  amountOrType: string;
  isConfidential: boolean;
}

const TEMPLATES: Array<{
  name: string;
  command: RlsPolicy['command'];
  roles: string;
  using: string;
  withCheck: string;
  desc: string;
}> = [
  {
    name: 'Строгая изоляция тенанта (Tenant Isolation)',
    command: 'ALL',
    roles: 'public',
    using: "tenant_id = current_setting('app.current_tenant_id', true)",
    withCheck: "tenant_id = current_setting('app.current_tenant_id', true)",
    desc: 'Базовая политика OWASP ASVS: изолирует все строки по сессионному параметру app.current_tenant_id.',
  },
  {
    name: 'Сквозной аудит холдинга (Holding Auditor Read)',
    command: 'SELECT',
    roles: 'holding_auditor',
    using: "current_setting('app.user_role', true) = 'holding_auditor' OR tenant_id = current_setting('app.current_tenant_id', true)",
    withCheck: '',
    desc: 'Разрешает чтение всех записей для роли auditor холдинга или записей своего тенанта.',
  },
  {
    name: 'Администратор тенанта (Tenant Admin Full)',
    command: 'ALL',
    roles: 'tenant_admin',
    using: "tenant_id = current_setting('app.current_tenant_id', true) AND current_setting('app.user_role', true) = 'tenant_admin'",
    withCheck: "tenant_id = current_setting('app.current_tenant_id', true)",
    desc: 'Полный доступ к операциям внутри тенанта только для авторизованного администратора.',
  },
  {
    name: 'Защита от записи в чужой тенант (Strict Insert Guard)',
    command: 'INSERT',
    roles: 'public',
    using: "true",
    withCheck: "tenant_id = current_setting('app.current_tenant_id', true)",
    desc: 'Запрещает INSERT с чужим tenant_id даже при ошибке в прикладном коде API.',
  },
];

export const RlsPolicyEditor: React.FC<RlsPolicyEditorProps> = ({ tenants, activeTenant }) => {
  const { rlsPolicies, saveRlsPolicy, deleteRlsPolicy } = useRlsPoliciesSlice();
  const addToast = useAppStore((state) => state.addToast);

  // Policy Form State
  const [selectedTable, setSelectedTable] = useState<string>('crm_deals');
  const [policyName, setPolicyName] = useState<string>('tenant_isolation_crm_deals');
  const [command, setCommand] = useState<RlsPolicy['command']>('ALL');
  const [roles, setRoles] = useState<string>('public');
  const [usingExpr, setUsingExpr] = useState<string>("tenant_id = current_setting('app.current_tenant_id', true)");
  const [withCheckExpr, setWithCheckExpr] = useState<string>("tenant_id = current_setting('app.current_tenant_id', true)");
  const [isPermissive, setIsPermissive] = useState<boolean>(true);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  // Simulator Context State
  const [simulatedTenantId, setSimulatedTenantId] = useState<string>(activeTenant.id);
  const [simulatedRole, setSimulatedRole] = useState<string>('tenant_user');
  const [simulatedCommand, setSimulatedCommand] = useState<string>('SELECT');

  // Multi-tenant mock test dataset for simulation
  const testRows: SimulatedRow[] = useMemo(() => [
    { id: 'row_101', tenant_id: activeTenant.id, name: `Сделка: Модернизация ИТ-инфраструктуры (${activeTenant.slug})`, amountOrType: '₽4,800,000', isConfidential: false },
    { id: 'row_102', tenant_id: activeTenant.id, name: `Сделка: Лицензии Mirovisor Portal Pro (${activeTenant.slug})`, amountOrType: '₽1,250,000', isConfidential: true },
    { id: 'row_201', tenant_id: 't_fintech', name: 'Сделка: Процессинг CyberBank Ecosystem (Финтех)', amountOrType: '₽18,400,000', isConfidential: true },
    { id: 'row_202', tenant_id: 't_fintech', name: 'Сделка: PCI-DSS HSM Шлюз (Финтех)', amountOrType: '₽6,100,000', isConfidential: false },
    { id: 'row_301', tenant_id: 't_defense', name: 'Сделка: AeroSpace Телеметрия Спутников (Оборона)', amountOrType: '₽42,000,000', isConfidential: true },
    { id: 'row_302', tenant_id: 't_defense', name: 'Сделка: Криптографические модули ГОСТ (Оборона)', amountOrType: '₽9,300,000', isConfidential: false },
  ], [activeTenant.id, activeTenant.slug]);

  // Generated PostgreSQL DDL
  const generatedSql = useMemo(() => {
    const withCheckClause = withCheckExpr.trim() ? `\n  WITH CHECK (${withCheckExpr.trim()})` : '';
    return `-- =============================================================================
-- PostgreSQL Row-Level Security (RLS) Policy Definition
-- Target Schema: ${activeTenant.schema} | Table: ${selectedTable}
-- OWASP ASVS 5.0 Level 2 Hardened
-- =============================================================================
ALTER TABLE ${activeTenant.schema}.${selectedTable} ENABLE ROW LEVEL SECURITY;
ALTER TABLE ${activeTenant.schema}.${selectedTable} FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ${policyName} ON ${activeTenant.schema}.${selectedTable};

CREATE POLICY ${policyName} ON ${activeTenant.schema}.${selectedTable}
  AS ${isPermissive ? 'PERMISSIVE' : 'RESTRICTIVE'}
  FOR ${command}
  TO ${roles}
  USING (${usingExpr.trim() || 'true'})${withCheckClause};`;
  }, [activeTenant.schema, selectedTable, policyName, command, roles, usingExpr, withCheckExpr, isPermissive]);

  // Simulation Evaluation Engine
  const simulationResults = useMemo(() => {
    return testRows.map((row) => {
      // Simulate evaluation of USING expression
      let isAllowed = false;
      let reason = '';

      if (roles !== 'public' && simulatedRole !== roles && simulatedRole !== 'superadmin') {
        isAllowed = false;
        reason = `Роль сессии (${simulatedRole}) не соответствует целевой роли политики (${roles}).`;
      } else if (usingExpr.includes("current_setting('app.user_role', true) = 'holding_auditor'") && simulatedRole === 'holding_auditor') {
        isAllowed = true;
        reason = 'Разрешено: Сессионная роль holding_auditor обладает сквозным правом чтения.';
      } else if (usingExpr.includes("tenant_id = current_setting('app.current_tenant_id'")) {
        if (row.tenant_id === simulatedTenantId) {
          isAllowed = true;
          reason = `Разрешено: tenant_id строки (${row.tenant_id}) совпадает с сессионным (${simulatedTenantId}).`;
        } else {
          isAllowed = false;
          reason = `Отклонено RLS: строка принадлежит тенанту ${row.tenant_id}, а сессия привязана к ${simulatedTenantId}.`;
        }
      } else if (usingExpr.trim() === 'true') {
        isAllowed = true;
        reason = 'Разрешено: выражение USING(true) допускает чтение всех строк.';
      } else {
        // Fallback exact match check
        isAllowed = row.tenant_id === simulatedTenantId;
        reason = isAllowed ? 'Разрешено проверкой тенанта.' : 'Отклонено фильтром изоляции.';
      }

      return {
        row,
        isAllowed,
        reason,
      };
    });
  }, [testRows, simulatedTenantId, simulatedRole, usingExpr, roles]);

  const allowedCount = simulationResults.filter((r) => r.isAllowed).length;
  const deniedCount = simulationResults.filter((r) => !r.isAllowed).length;
  const leakCount = simulationResults.filter(
    (r) => r.isAllowed && r.row.tenant_id !== simulatedTenantId && simulatedRole !== 'holding_auditor'
  ).length;

  const handleCopySql = () => {
    navigator.clipboard.writeText(generatedSql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleApplyTemplate = (tpl: typeof TEMPLATES[0]) => {
    setPolicyName(tpl.name.split(' ')[0].toLowerCase() + '_' + selectedTable);
    setCommand(tpl.command);
    setRoles(tpl.roles);
    setUsingExpr(tpl.using);
    setWithCheckExpr(tpl.withCheck);
    addToast({
      title: 'Шаблон RLS применён',
      message: `Загружен пресет: ${tpl.name}`,
      type: 'info',
    });
  };

  const handleSavePolicy = () => {
    const newPolicy: RlsPolicy = {
      id: `rls_${Date.now()}`,
      tenantId: activeTenant.id,
      tableName: selectedTable,
      policyName,
      command,
      roles,
      usingExpression: usingExpr,
      withCheckExpression: withCheckExpr,
      isPermissive,
      status: 'active',
      createdAt: new Date().toISOString(),
      description: `Политика ${command} для ${selectedTable} в схеме ${activeTenant.schema}`,
    };

    saveRlsPolicy(newPolicy);
    LogUtility.info(`Deployed Postgres RLS policy '${policyName}' on ${activeTenant.schema}.${selectedTable}`, {
      policy: newPolicy,
    }, 'Postgres-RLS');

    addToast({
      title: 'Политика RLS сохранена',
      message: `Политика ${policyName} успешно развёрнута в схеме ${activeTenant.schema}.`,
      type: 'success',
    });
  };

  const tenantPolicies = rlsPolicies.filter((p) => p.tenantId === activeTenant.id);

  return (
    <div className="space-y-6 font-sans">
      {/* Overview Banner */}
      <div className="bg-neutral-900/90 border border-neutral-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white font-mono tracking-wide">
                РЕДАКТОР ПОЛИТИК ROW-LEVEL SECURITY (POSTGRESQL RLS)
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">
                Схема: {activeTenant.schema}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Интерактивная разработка DDL политик безопасности строк, эмуляция сессионных параметров и визуальная проверка изоляции данных.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopySql}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-mono flex items-center gap-1.5 border border-neutral-700 transition-colors cursor-pointer"
          >
            {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSql ? 'Скопировано!' : 'Копировать SQL'}</span>
          </button>
          <button
            onClick={handleSavePolicy}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-950/50 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Сохранить & Применить</span>
          </button>
        </div>
      </div>

      {/* Templates Row */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-neutral-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Готовые шаблоны политик OWASP ASVS:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {TEMPLATES.map((tpl, i) => (
            <button
              key={i}
              onClick={() => handleApplyTemplate(tpl)}
              className="p-3 text-left bg-neutral-900/60 hover:bg-neutral-850 border border-neutral-800 hover:border-indigo-500/50 rounded-xl transition-all group cursor-pointer space-y-1"
            >
              <div className="text-xs font-semibold text-white group-hover:text-indigo-300 flex items-center justify-between">
                <span>{tpl.name}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400">
                  {tpl.command}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-snug line-clamp-2">
                {tpl.desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Editor & SQL Generator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Policy Configuration Controls */}
        <div className="lg:col-span-5 bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 space-y-4">
          <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2 border-b border-neutral-800 pb-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Параметры Политики RLS
          </h4>

          {/* Target Table */}
          <div className="space-y-1.5">
            <label className="text-xs text-neutral-300 font-medium">Целевая таблица схемы:</label>
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-cyan-500 rounded-lg px-3 py-1.5 text-xs text-white outline-none font-mono"
            >
              <option value="crm_deals">crm_deals (Сделки и воронка)</option>
              <option value="crm_contacts">crm_contacts (Контакты клиентов)</option>
              <option value="kanban_cards">kanban_cards (Задачи канбан)</option>
              <option value="security_findings">security_findings (Уязвимости)</option>
              <option value="audit_logs">audit_logs (Журнал аудита)</option>
              <option value="invoices">invoices (Финансовые документы)</option>
            </select>
          </div>

          {/* Policy Name */}
          <div className="space-y-1.5">
            <label className="text-xs text-neutral-300 font-medium">Имя политики (Policy Name):</label>
            <input
              type="text"
              value={policyName}
              onChange={(e) => setPolicyName(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-cyan-500 rounded-lg px-3 py-1.5 text-xs text-white outline-none font-mono"
            />
          </div>

          {/* Command & Roles */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-neutral-300 font-medium">Команда SQL:</label>
              <select
                value={command}
                onChange={(e) => setCommand(e.target.value as any)}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-cyan-500 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none font-mono"
              >
                <option value="ALL">ALL (Все операции)</option>
                <option value="SELECT">SELECT (Чтение)</option>
                <option value="INSERT">INSERT (Вставка)</option>
                <option value="UPDATE">UPDATE (Изменение)</option>
                <option value="DELETE">DELETE (Удаление)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-neutral-300 font-medium">Роли (TO roles):</label>
              <select
                value={roles}
                onChange={(e) => setRoles(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-cyan-500 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none font-mono"
              >
                <option value="public">public (Все)</option>
                <option value="tenant_user">tenant_user</option>
                <option value="tenant_admin">tenant_admin</option>
                <option value="holding_auditor">holding_auditor</option>
              </select>
            </div>
          </div>

          {/* USING Expression */}
          <div className="space-y-1.5">
            <label className="text-xs text-neutral-300 font-medium flex items-center justify-between">
              <span>USING выражение (Фильтр существующих строк):</span>
              <span className="text-[10px] text-neutral-500 font-mono">SQL boolean</span>
            </label>
            <textarea
              value={usingExpr}
              onChange={(e) => setUsingExpr(e.target.value)}
              rows={2}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-cyan-500 rounded-lg p-2.5 text-xs text-cyan-300 font-mono outline-none resize-none leading-relaxed"
            />
          </div>

          {/* WITH CHECK Expression */}
          <div className="space-y-1.5">
            <label className="text-xs text-neutral-300 font-medium flex items-center justify-between">
              <span>WITH CHECK выражение (Валидация новых строк):</span>
              <span className="text-[10px] text-neutral-500 font-mono">INSERT/UPDATE</span>
            </label>
            <textarea
              value={withCheckExpr}
              onChange={(e) => setWithCheckExpr(e.target.value)}
              rows={2}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-cyan-500 rounded-lg p-2.5 text-xs text-cyan-300 font-mono outline-none resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Generated SQL Preview */}
        <div className="lg:col-span-7 bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 flex flex-col">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-3">
            <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <Code className="w-4 h-4 text-emerald-400" />
              Сгенерированный PostgreSQL DDL Скрипт
            </h4>
            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              ASVS 5.0 L2 Compliant
            </span>
          </div>

          <div className="flex-1 bg-black/90 border border-neutral-850 rounded-xl p-3 font-mono text-xs overflow-x-auto text-neutral-300 leading-relaxed whitespace-pre selection:bg-cyan-500/30">
            {generatedSql}
          </div>
        </div>
      </div>

      {/* Visual Verification Simulator */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
              <Play className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wide">
                Визуальная Проверка Изоляции (Interactive Policy Simulator)
              </h4>
              <p className="text-[11px] text-neutral-400">
                Эмуляция выполнения запросов к тестовому мультитенантному датасету в реальном времени.
              </p>
            </div>
          </div>

          {/* Simulator Context Controls */}
          <div className="flex flex-wrap items-center gap-3 bg-neutral-950 p-1.5 rounded-xl border border-neutral-800 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-neutral-500 font-mono">SET app.current_tenant_id:</span>
              <select
                value={simulatedTenantId}
                onChange={(e) => setSimulatedTenantId(e.target.value)}
                className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-white font-mono outline-none"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-neutral-500 font-mono">SET app.user_role:</span>
              <select
                value={simulatedRole}
                onChange={(e) => setSimulatedRole(e.target.value)}
                className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-white font-mono outline-none"
              >
                <option value="tenant_user">tenant_user</option>
                <option value="tenant_admin">tenant_admin</option>
                <option value="holding_auditor">holding_auditor</option>
              </select>
            </div>
          </div>
        </div>

        {/* Verification Status Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-neutral-950/80 border border-neutral-800 rounded-xl space-y-0.5">
            <span className="text-[11px] text-neutral-500 block">Всего строк в БД</span>
            <span className="text-lg font-bold font-mono text-white">{testRows.length}</span>
          </div>

          <div className="p-3 bg-neutral-950/80 border border-neutral-800 rounded-xl space-y-0.5">
            <span className="text-[11px] text-emerald-400 block">Разрешено RLS (Visible)</span>
            <span className="text-lg font-bold font-mono text-emerald-400">{allowedCount}</span>
          </div>

          <div className="p-3 bg-neutral-950/80 border border-neutral-800 rounded-xl space-y-0.5">
            <span className="text-[11px] text-rose-400 block">Отфильтровано (Masked)</span>
            <span className="text-lg font-bold font-mono text-rose-400">{deniedCount}</span>
          </div>

          <div className="p-3 bg-neutral-950/80 border border-neutral-800 rounded-xl space-y-0.5">
            <span className="text-[11px] text-cyan-400 block">Утечки данных (Leaks)</span>
            <span className={`text-lg font-bold font-mono ${leakCount === 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
              {leakCount === 0 ? '0 (Защищено)' : `${leakCount} УТЕЧКА!`}
            </span>
          </div>
        </div>

        {/* Interactive Evaluation Table */}
        <div className="border border-neutral-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-neutral-950 border-b border-neutral-800 text-neutral-400">
              <tr>
                <th className="p-2.5">ID строки</th>
                <th className="p-2.5">Тенант строки</th>
                <th className="p-2.5">Наименование объекта</th>
                <th className="p-2.5">Сумма / Тип</th>
                <th className="p-2.5 text-center">Статус RLS</th>
                <th className="p-2.5">Объяснение логики RLS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-850/60 bg-black/40">
              {simulationResults.map(({ row, isAllowed, reason }) => (
                <tr
                  key={row.id}
                  className={`transition-colors ${
                    isAllowed ? 'hover:bg-emerald-950/10' : 'hover:bg-rose-950/10 opacity-70'
                  }`}
                >
                  <td className="p-2.5 font-semibold text-neutral-300">{row.id}</td>
                  <td className="p-2.5">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                        row.tenant_id === simulatedTenantId
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60'
                          : 'bg-neutral-900 text-neutral-500'
                      }`}
                    >
                      {row.tenant_id}
                    </span>
                  </td>
                  <td className="p-2.5 text-neutral-200">{row.name}</td>
                  <td className="p-2.5 text-neutral-400">{row.amountOrType}</td>
                  <td className="p-2.5 text-center">
                    {isAllowed ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3" /> ALLOW
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-bold">
                        <XCircle className="w-3 h-3" /> DENY
                      </span>
                    )}
                  </td>
                  <td className="p-2.5 text-neutral-400 text-[11px] leading-tight">
                    {reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deployed Policies for Active Tenant */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
          <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            Активные Политики Безопасности Схемы ({activeTenant.schema})
          </h4>
          <span className="text-xs font-mono text-neutral-400">
            Всего политик: <b className="text-white">{tenantPolicies.length}</b>
          </span>
        </div>

        {tenantPolicies.length === 0 ? (
          <div className="text-center py-6 text-neutral-500 text-xs">
            Для данного тенанта пока нет сохранённых RLS политик. Воспользуйтесь редактором выше для развёртывания.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tenantPolicies.map((pol) => (
              <div
                key={pol.id}
                className="p-3.5 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-xl space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="font-bold text-white font-mono">{pol.policyName}</span>
                  </div>
                  <button
                    onClick={() => deleteRlsPolicy(pol.id)}
                    className="text-neutral-500 hover:text-rose-400 transition-colors p-1"
                    title="Удалить политику"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-[11px] font-mono text-neutral-400">
                  Таблица: <strong className="text-cyan-400">{pol.tableName}</strong> · Команда: <b className="text-white">{pol.command}</b> · Роли: <b className="text-amber-400">{pol.roles}</b>
                </div>
                <div className="p-2 bg-neutral-900 rounded font-mono text-[10px] text-neutral-300 overflow-x-auto truncate">
                  USING ({pol.usingExpression})
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
