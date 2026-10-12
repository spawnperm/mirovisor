import React, { useState } from 'react';
import { Activity, Server, AlertTriangle, Cpu, Database, HardDrive, Terminal, RefreshCw, BarChart2, Radio, TrendingUp } from 'lucide-react';
import { Tenant, SystemMetric } from '../../types';
import { ResourceUtilizationDashboard } from './ResourceUtilizationDashboard';
import { NatsJetStreamMonitoringWidget } from './NatsJetStreamMonitoringWidget';
import { D3HistoricalTrendLineChart } from './D3HistoricalTrendLineChart';

interface ObservabilityViewProps {
  tenant: Tenant;
  metrics: Record<string, SystemMetric>;
}

interface LokiLog {
  id: string;
  timestamp: string;
  service: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  orgId: string;
}

export const ObservabilityView: React.FC<ObservabilityViewProps> = ({ tenant, metrics }) => {
  const [activeTab, setActiveTab] = useState<'utilization' | 'nats_jetstream' | 'trend_history' | 'prometheus_loki'>('trend_history');

  const currentMetric = metrics[tenant.id] || {
    tenantId: tenant.id,
    rps: 240,
    p95LatencyMs: 28,
    errorRatePercent: 0.02,
    cpuUsage: 25,
    memoryUsageMb: 820,
    dbQueriesPerSec: 900,
  };

  const [logFilter, setLogFilter] = useState<string>('all');
  const [logs, setLogs] = useState<LokiLog[]>([
    { id: '1', timestamp: '23:14:02.102', service: 'NestJS-API', level: 'info', message: `TenantMiddleware: session validated for orgId: ${tenant.id}`, orgId: tenant.id },
    { id: '2', timestamp: '23:14:05.441', service: 'Drizzle-ORM', level: 'info', message: `SET LOCAL app.current_tenant = '${tenant.id}'; RLS Active.`, orgId: tenant.id },
    { id: '3', timestamp: '23:14:08.812', service: 'NATS-JetStream', level: 'info', message: `ACK: stream TENANT_EVENTS sequence #4892 published`, orgId: tenant.id },
    { id: '4', timestamp: '23:14:12.339', service: 'CrowdSec-WAF', level: 'warn', message: `AppSec virtual patch inspected: GET /api/v1/invoices - ALLOW`, orgId: tenant.id },
    { id: '5', timestamp: '23:14:15.901', service: 'Loki-Querier', level: 'info', message: `Multi-tenant query executed: {org_id="${tenant.id}"}`, orgId: tenant.id },
    { id: '6', timestamp: '23:14:20.124', service: 'Temporal-Worker', level: 'info', message: `OrderWorkflow heartbeat OK (time-skipping test suite passed)`, orgId: tenant.id },
  ]);

  const addSimulatedLog = () => {
    const services = ['NestJS-API', 'Drizzle-ORM', 'NATS-Broker', 'Redis-Feed', 'CrowdSec'];
    const s = services[Math.floor(Math.random() * services.length)];
    const newEntry: LokiLog = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString() + '.' + Math.floor(100 + Math.random() * 900),
      service: s,
      level: Math.random() > 0.85 ? 'warn' : 'info',
      message: `[${s}] Live telemetry sync for ${tenant.schema} (RPS: ${currentMetric.rps + Math.floor(Math.random() * 20)})`,
      orgId: tenant.id,
    };
    setLogs((prev) => [newEntry, ...prev.slice(0, 15)]);
  };

  const filteredLogs = logs.filter((l) => (logFilter === 'all' ? true : l.level === logFilter));

  return (
    <div className="flex flex-col h-full bg-neutral-950 overflow-hidden">
      {/* Subtab Navigation Switcher */}
      <div className="px-4 pt-3 pb-2 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-neutral-900 border border-neutral-800 rounded-xl text-xs">
          <button
            onClick={() => setActiveTab('trend_history')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'trend_history'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Тренды Хранилища & API (D3.js)
          </button>

          <button
            onClick={() => setActiveTab('nats_jetstream')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'nats_jetstream'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            NATS JetStream (Recharts)
          </button>

          <button
            onClick={() => setActiveTab('utilization')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'utilization'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Утилизация Ресурсов (D3.js)
          </button>

          <button
            onClick={() => setActiveTab('prometheus_loki')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'prometheus_loki'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Prometheus Метрики & Loki Логи
          </button>
        </div>

        <div className="text-[11px] font-mono text-neutral-400 hidden sm:flex items-center gap-2">
          <span>Тенант: <b className="text-cyan-400">{tenant.name}</b></span>
          <span>·</span>
          <span>Namespace: <b className="text-white">{tenant.schema}</b></span>
        </div>
      </div>

      {/* Main View Render */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'trend_history' ? (
          <div className="h-full p-4 overflow-y-auto space-y-4">
            <D3HistoricalTrendLineChart tenant={tenant} height={380} />
          </div>
        ) : activeTab === 'nats_jetstream' ? (
          <div className="h-full p-4 overflow-y-auto">
            <NatsJetStreamMonitoringWidget tenant={tenant} />
          </div>
        ) : activeTab === 'utilization' ? (
          <ResourceUtilizationDashboard activeTenant={tenant} />
        ) : (
          <div className="flex flex-col h-full p-4 gap-4 overflow-y-auto">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900/80 p-3 rounded-xl border border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    OBSERVABILITY & MONITORING HUB (PROMETHEUS · LOKI · GRAFANA)
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-neutral-800 text-neutral-300 rounded">
                      X-Scope-OrgID: {tenant.id}
                    </span>
                  </h2>
                  <div className="text-xs text-neutral-400">
                    Схема мониторинга: <strong className="text-white">{tenant.schema}</strong> · Метрики Prometheus v2.52
                  </div>
                </div>
              </div>

              <button
                onClick={addSimulatedLog}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-mono flex items-center gap-1.5 border border-neutral-700"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Сгенерировать лог
              </button>
            </div>

            {/* Real-time KPI Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-xl">
                <span className="text-[11px] text-neutral-400 block mb-1">Запросов/сек (RPS)</span>
                <span className="text-xl font-bold font-mono text-cyan-400">{currentMetric.rps}</span>
                <span className="text-[10px] text-neutral-500 block mt-1">+4.2% за 15 мин</span>
              </div>

              <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-xl">
                <span className="text-[11px] text-neutral-400 block mb-1">p95 Latency</span>
                <span className="text-xl font-bold font-mono text-emerald-400">{currentMetric.p95LatencyMs} ms</span>
                <span className="text-[10px] text-neutral-500 block mt-1">SLA &lt; 50ms (OK)</span>
              </div>

              <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-xl">
                <span className="text-[11px] text-neutral-400 block mb-1">Доля ошибок (5xx)</span>
                <span className="text-xl font-bold font-mono text-white">{currentMetric.errorRatePercent}%</span>
                <span className="text-[10px] text-emerald-400 block mt-1">Порог 0.05%</span>
              </div>

              <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-xl">
                <span className="text-[11px] text-neutral-400 block mb-1">Нагрузка CPU</span>
                <span className="text-xl font-bold font-mono text-purple-400">{currentMetric.cpuUsage}%</span>
                <span className="text-[10px] text-neutral-500 block mt-1">Pod: 250m / 500m</span>
              </div>

              <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-xl">
                <span className="text-[11px] text-neutral-400 block mb-1">RAM Память</span>
                <span className="text-xl font-bold font-mono text-amber-400">{currentMetric.memoryUsageMb} MB</span>
                <span className="text-[10px] text-neutral-500 block mt-1">Лимит 1.5GB</span>
              </div>

              <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-xl">
                <span className="text-[11px] text-neutral-400 block mb-1">SQL QPS (Drizzle)</span>
                <span className="text-xl font-bold font-mono text-indigo-400">{currentMetric.dbQueriesPerSec}</span>
                <span className="text-[10px] text-neutral-500 block mt-1">RLS Scoped</span>
              </div>
            </div>

            {/* Loki Multi-Tenant Log Stream */}
            <div className="flex-1 bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden flex flex-col min-h-[300px]">
              <div className="p-3 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white">LOKI ЖУРНАЛ СОБЫТИЙ (auth_enabled: true)</span>
                  <span className="text-[11px] font-mono text-neutral-500">
                    Query: &#123;app="mirovisor", org_id="{tenant.id}"&#125;
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {['all', 'info', 'warn', 'error'].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setLogFilter(lvl)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono capitalize ${
                        logFilter === lvl
                          ? 'bg-neutral-800 text-white font-medium'
                          : 'text-neutral-500 hover:text-white'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Logs Output */}
              <div className="flex-1 p-3 overflow-y-auto space-y-1 font-mono text-xs bg-black/70">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`flex items-start gap-3 py-1 border-b border-neutral-850/60 ${
                      log.level === 'warn' ? 'text-amber-300' : log.level === 'error' ? 'text-rose-400' : 'text-neutral-300'
                    }`}
                  >
                    <span className="text-neutral-500 text-[11px] shrink-0">{log.timestamp}</span>
                    <span className="text-cyan-400 font-bold shrink-0 w-32 truncate">[{log.service}]</span>
                    <span className="text-[10px] font-mono px-1 rounded bg-neutral-900 text-neutral-400 shrink-0">
                      {log.orgId}
                    </span>
                    <span className="flex-1 break-all">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
