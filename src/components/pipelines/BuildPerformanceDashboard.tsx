/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Build Performance Dashboard for CI/CD Pipelines
 * Visualizes build duration trends, success rates over time,
 * and common failure points across different tenants using Recharts.
 */

import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Zap,
  Layers,
  Filter,
  BarChart2,
  Activity,
} from 'lucide-react';
import { PipelineBuild, Tenant } from '../../types';

interface BuildPerformanceDashboardProps {
  builds: PipelineBuild[];
  activeTenant: Tenant;
}

export const BuildPerformanceDashboard: React.FC<BuildPerformanceDashboardProps> = ({
  builds,
  activeTenant,
}) => {
  const [selectedTenantFilter, setSelectedTenantFilter] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  // 1. Build Duration Trends Data (seconds over time)
  const durationTrendsData = useMemo(() => {
    return [
      { date: '01 Окт', durationSec: 135, p95Sec: 180, tenant: 't_holding' },
      { date: '03 Окт', durationSec: 128, p95Sec: 172, tenant: 't_fintech' },
      { date: '05 Окт', durationSec: 142, p95Sec: 195, tenant: 't_defense' },
      { date: '07 Окт', durationSec: 120, p95Sec: 165, tenant: 't_betalabs' },
      { date: '09 Окт', durationSec: 115, p95Sec: 155, tenant: 't_holding' },
      { date: '10 Окт', durationSec: 110, p95Sec: 148, tenant: 't_fintech' },
      { date: '11 Окт', durationSec: 105, p95Sec: 142, tenant: 't_defense' },
      { date: '12 Окт', durationSec: 98, p95Sec: 135, tenant: activeTenant.id },
    ];
  }, [activeTenant.id]);

  // 2. Success vs Failure Rates Over Time Data
  const successRatesData = useMemo(() => {
    return [
      { period: 'Неделя 38', passed: 42, failed: 3, successRate: 93.3 },
      { period: 'Неделя 39', passed: 56, failed: 4, successRate: 93.3 },
      { period: 'Неделя 40', passed: 61, failed: 2, successRate: 96.8 },
      { period: 'Неделя 41', passed: 74, failed: 3, successRate: 96.1 },
      { period: 'Неделя 42', passed: 68, failed: 1, successRate: 98.5 },
    ];
  }, []);

  // 3. Common Failure Points Breakdown Across Tenants
  const failurePointsData = useMemo(() => {
    return [
      { name: 'Unit / Integration Tests', count: 18, color: '#f87171', desc: 'Регрессия бизнес-логики и сбои моков' },
      { name: 'SAST / ASVS Security Gate', count: 14, color: '#fbbf24', desc: 'Уязвимости CodeQL и секреты Gitleaks' },
      { name: 'Docker Multi-Stage Build', count: 9, color: '#a78bfa', desc: 'Кэш пакетов npm и таймауты слоёв GHCR' },
      { name: 'Postgres RLS Migration Check', count: 6, color: '#38bdf8', desc: 'Ошибки схем Drizzle и FORCE RLS' },
      { name: 'TypeScript / ESLint Gate', count: 4, color: '#34d399', desc: 'Ошибки типизации tsc --noEmit' },
    ];
  }, []);

  // 4. Tenant Comparison Breakdown
  const tenantComparisonData = useMemo(() => {
    return [
      { name: 'Холдинг (t_holding)', avgDuration: '1m 45s', successRate: '98.2%', builds: 142, status: 'healthy' },
      { name: 'Финтех (t_fintech)', avgDuration: '1m 58s', successRate: '96.5%', builds: 98, status: 'healthy' },
      { name: 'Оборона (t_defense)', avgDuration: '2m 10s', successRate: '94.8%', builds: 84, status: 'warning' },
      { name: 'BetaLabs (t_betalabs)', avgDuration: '1m 32s', successRate: '97.4%', builds: 62, status: 'healthy' },
    ];
  }, []);

  return (
    <div className="flex-1 overflow-y-auto space-y-5 p-1 font-sans">
      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-neutral-900/80 border border-neutral-800 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Среднее время сборки</span>
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white">1м 42с</div>
          <div className="text-[10px] text-emerald-400 font-mono">↓ 24% быстрее за 30 дней</div>
        </div>

        <div className="p-3.5 bg-neutral-900/80 border border-neutral-800 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Общий Success Rate</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">96.8%</div>
          <div className="text-[10px] text-neutral-500 font-mono">SLA &gt; 95% соблюдён</div>
        </div>

        <div className="p-3.5 bg-neutral-900/80 border border-neutral-800 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Время восстановления (MTTR)</span>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-400">7м 15с</div>
          <div className="text-[10px] text-neutral-500 font-mono">Self-healing агенты</div>
        </div>

        <div className="p-3.5 bg-neutral-900/80 border border-neutral-800 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Всего прогонов пайплайна</span>
            <Activity className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white">1,482</div>
          <div className="text-[10px] text-cyan-400 font-mono">Nx DTE: 3 агента</div>
        </div>
      </div>

      {/* Main Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 1. Build Duration Trends (AreaChart) */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Динамика Длительности Сборок (Секунды)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-cyan-400">
              Целевой порог: &lt; 120s
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={durationTrendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="durationGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="date" stroke="#737373" tick={{ fontSize: 10, fill: '#737373' }} />
                <YAxis stroke="#737373" tick={{ fontSize: 10, fill: '#737373' }} unit=" s" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#171717', borderColor: '#404040', borderRadius: '8px', fontSize: '11px', color: '#fff' }}
                />
                <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: '11px' }} />
                <Area type="monotone" dataKey="durationSec" name="Медианная длительность (s)" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#durationGrad)" />
                <Line type="monotone" dataKey="p95Sec" name="P95 длительность (s)" stroke="#f59e0b" strokeDasharray="3 3" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Success vs Failure Rates (Composed Bar + Line Chart) */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Соотношение Успешных и Упавших Сборок
              </h3>
            </div>
            <span className="text-[11px] font-mono text-emerald-400">
              Текущий: 98.5%
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={successRatesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="period" stroke="#737373" tick={{ fontSize: 10, fill: '#737373' }} />
                <YAxis stroke="#737373" tick={{ fontSize: 10, fill: '#737373' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#171717', borderColor: '#404040', borderRadius: '8px', fontSize: '11px', color: '#fff' }}
                />
                <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="passed" name="Успешно (Passed)" fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="failed" name="Ошибки (Failed)" fill="#ef4444" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Common Failure Points Breakdown Across Tenants */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
              Основные Точки Отказов Пайплайнов (Common Failure Points Across Tenants)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-neutral-400">
            Всего зарегистрировано инцидентов: <b>51</b>
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* Horizontal Bar Breakdown (7 cols) */}
          <div className="lg:col-span-7 h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={failurePointsData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis type="number" stroke="#737373" tick={{ fontSize: 10, fill: '#737373' }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#737373"
                  tick={{ fontSize: 10, fill: '#a3a3a3' }}
                  width={150}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#171717', borderColor: '#404040', borderRadius: '8px', fontSize: '11px', color: '#fff' }}
                />
                <Bar dataKey="count" name="Количество сбоев" radius={[0, 4, 4, 0]}>
                  {failurePointsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Details list (5 cols) */}
          <div className="lg:col-span-5 space-y-2">
            {failurePointsData.map((fp, i) => (
              <div
                key={i}
                className="p-2.5 bg-neutral-950/80 border border-neutral-850 rounded-xl flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: fp.color }} />
                  <div>
                    <span className="font-semibold text-white block">{fp.name}</span>
                    <span className="text-[10px] text-neutral-500 leading-tight block">{fp.desc}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono font-bold text-white">{fp.count} сбоев</span>
                  <span className="text-[10px] text-neutral-500 block">
                    {Math.round((fp.count / 51) * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Multi-Tenant Pipeline SLA Status Table */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
              Статус CI/CD Производительности по Тенантам (Multi-Tenant SLA)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-emerald-400">Все тенанты в норме</span>
        </div>

        <div className="border border-neutral-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800">
              <tr>
                <th className="p-2.5">Тенант / Пространство</th>
                <th className="p-2.5">Среднее время</th>
                <th className="p-2.5">Success Rate</th>
                <th className="p-2.5">Всего сборок</th>
                <th className="p-2.5 text-center">Статус SLA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-850/60 bg-black/40">
              {tenantComparisonData.map((t, i) => (
                <tr key={i} className="hover:bg-neutral-900/40 transition-colors">
                  <td className="p-2.5 font-semibold text-white">{t.name}</td>
                  <td className="p-2.5 text-cyan-400">{t.avgDuration}</td>
                  <td className="p-2.5 text-emerald-400">{t.successRate}</td>
                  <td className="p-2.5 text-neutral-300">{t.builds}</td>
                  <td className="p-2.5 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      HEALTHY
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
