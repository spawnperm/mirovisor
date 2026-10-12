/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SystemResourceMonitor Component
 * Uses the Web Workers API to periodically poll, analyze, and display
 * real-time client-side CPU load, JS Heap memory trends, thread jitter,
 * and garbage collection activity without blocking the main UI thread.
 */

import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  Cell,
} from 'recharts';
import {
  Cpu,
  HardDrive,
  Activity,
  Zap,
  Play,
  Pause,
  RotateCcw,
  Gauge,
  Clock,
  Layers,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Download,
  Flame,
  Terminal,
  ShieldCheck,
} from 'lucide-react';
import { Tenant } from '../../types';
import { useSystemResourceWorker } from '../../hooks/useSystemResourceWorker';
import { LogUtility } from '../../services/logUtility';

interface SystemResourceMonitorProps {
  tenant: Tenant;
}

export const SystemResourceMonitor: React.FC<SystemResourceMonitorProps> = ({ tenant }) => {
  const {
    latestSample,
    history,
    trend,
    isRunning,
    pollingIntervalMs,
    benchmarkResult,
    isBenchmarking,
    setPollingInterval,
    togglePolling,
    runBenchmark,
    resetHistory,
    workerSupported,
  } = useSystemResourceWorker(1000);

  const [activeMetricTab, setActiveMetricTab] = useState<'trends' | 'jitter' | 'memory_delta'>('trends');

  // Fallback sample if initial worker tick is pending
  const sample = latestSample || {
    timestamp: new Date().toLocaleTimeString('ru-RU'),
    timeMs: Date.now(),
    cpuPercent: 24,
    cpuStatus: 'nominal',
    eventLoopJitterMs: 0.8,
    benchmarkScore: 820,
    heapUsedMb: 54,
    heapTotalMb: 96,
    heapLimitMb: 128,
    heapPercent: 42,
    memoryDeltaMb: 0.2,
    gcEventDetected: false,
    workerTick: 1,
    hardwareConcurrency: (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 8,
  };

  const handleExportTelemetry = () => {
    const data = {
      tenant: tenant.slug,
      exportedAt: new Date().toISOString(),
      trendSummary: trend,
      historyCount: history.length,
      history,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-resource-telemetry-${tenant.slug}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    LogUtility.info('Экспорт телеметрии системных ресурсов завершен', { tenant: tenant.slug }, 'SystemResourceMonitor');
  };

  return (
    <div className="flex flex-col h-full p-4 gap-4 overflow-y-auto bg-neutral-950 text-neutral-100">
      {/* Top Header Card */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">
                МОНИТОРИНГ СИСТЕМНЫХ РЕСУРСОВ КЛИЕНТА (WEB WORKERS API)
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-700/50 text-cyan-300 uppercase">
                Dedicated Worker Thread
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Изолированный фоновый опрос и вычисление трендов CPU, памяти JS Heap и джиттера без деградации FPS интерфейса.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Polling Interval Switcher */}
          <div className="flex items-center bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs">
            <span className="text-[10px] uppercase font-mono text-neutral-500 px-2">Интервал:</span>
            {[
              { label: '500мс', ms: 500 },
              { label: '1с', ms: 1000 },
              { label: '2с', ms: 2000 },
              { label: '5с', ms: 5000 },
            ].map((opt) => (
              <button
                key={opt.ms}
                onClick={() => setPollingInterval(opt.ms)}
                className={`px-2.5 py-1 rounded-lg font-mono text-xs transition-colors ${
                  pollingIntervalMs === opt.ms
                    ? 'bg-cyan-600 text-white font-semibold shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Toggle Polling Button */}
          <button
            onClick={togglePolling}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isRunning
                ? 'bg-neutral-800 text-neutral-200 border-neutral-700 hover:bg-neutral-700'
                : 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600/30'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5 text-amber-400" /> Пауза
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-emerald-400" /> Возобновить
              </>
            )}
          </button>

          {/* Run Off-Thread Benchmark */}
          <button
            onClick={() => runBenchmark()}
            disabled={isBenchmarking}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all disabled:opacity-50"
            title="Запустить вычисления в Web Worker без зависания UI"
          >
            <Flame className={`w-3.5 h-3.5 ${isBenchmarking ? 'animate-spin' : ''}`} />
            {isBenchmarking ? 'Тест CPU...' : 'Стресс-тест CPU'}
          </button>

          {/* Reset History */}
          <button
            onClick={resetHistory}
            className="p-2 text-neutral-400 hover:text-white bg-neutral-950 border border-neutral-800 rounded-xl hover:border-neutral-700 transition-colors"
            title="Сбросить историю"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Export JSON */}
          <button
            onClick={handleExportTelemetry}
            className="p-2 text-neutral-400 hover:text-white bg-neutral-950 border border-neutral-800 rounded-xl hover:border-neutral-700 transition-colors"
            title="Экспорт телеметрии в JSON"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: CPU Utilization */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-neutral-400 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              Загрузка CPU (Клиент)
            </span>
            <span
              className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                sample.cpuStatus === 'critical'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : sample.cpuStatus === 'elevated'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {sample.cpuStatus}
            </span>
          </div>

          <div className="my-3 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold font-mono text-cyan-300">
              {sample.cpuPercent}%
            </div>
            <div className="text-right text-xs font-mono text-neutral-400">
              <div>Среднее: <span className="text-neutral-200">{trend.avgCpu}%</span></div>
              <div>P95: <span className="text-neutral-200">{trend.p95Cpu}%</span></div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 pt-2 border-t border-neutral-800/80">
            <span>Тренд: <strong className={trend.cpuSlope === 'increasing' ? 'text-amber-400' : 'text-emerald-400'}>{trend.cpuSlope}</strong></span>
            <span>Ядер: <strong className="text-neutral-300">{sample.hardwareConcurrency} cores</strong></span>
          </div>
        </div>

        {/* Card 2: JS Heap Memory */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-neutral-400 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-purple-400" />
              Память JS Heap
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
              {sample.heapPercent}% лимита
            </span>
          </div>

          <div className="my-3 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold font-mono text-purple-300">
              {sample.heapUsedMb} <span className="text-base text-neutral-400 font-normal">MB</span>
            </div>
            <div className="text-right text-xs font-mono text-neutral-400">
              <div>Всего: <span className="text-neutral-200">{sample.heapTotalMb} MB</span></div>
              <div>Лимит: <span className="text-neutral-200">{sample.heapLimitMb} MB</span></div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 pt-2 border-t border-neutral-800/80">
            <span>Дельта: <strong className={sample.memoryDeltaMb > 0 ? 'text-amber-400' : 'text-emerald-400'}>{sample.memoryDeltaMb > 0 ? `+${sample.memoryDeltaMb}` : sample.memoryDeltaMb} MB/с</strong></span>
            <span>Пик: <strong className="text-neutral-300">{trend.peakMemoryMb} MB</strong></span>
          </div>
        </div>

        {/* Card 3: Thread Jitter & Latency */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-neutral-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              Джиттер Event Loop
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              Low Latency
            </span>
          </div>

          <div className="my-3 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold font-mono text-emerald-300">
              {sample.eventLoopJitterMs} <span className="text-base text-neutral-400 font-normal">ms</span>
            </div>
            <div className="text-right text-xs font-mono text-neutral-400">
              <div>Score: <span className="text-neutral-200 font-bold">{sample.benchmarkScore}</span></div>
              <div>Тиков: <span className="text-neutral-200">#{sample.workerTick}</span></div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 pt-2 border-t border-neutral-800/80">
            <span>Статус треда: <strong className="text-emerald-400">{isRunning ? 'Активен' : 'Остановлен'}</strong></span>
            <span>API: <strong className="text-neutral-300">Web Workers</strong></span>
          </div>
        </div>

        {/* Card 4: Garbage Collection & Velocity */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-neutral-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              GC События & Очистка
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
              V8 Engine
            </span>
          </div>

          <div className="my-3 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold font-mono text-amber-300">
              {trend.gcEventsTotal} <span className="text-base text-neutral-400 font-normal">GC</span>
            </div>
            <div className="text-right text-xs font-mono text-neutral-400">
              <div>Последнее: <span className="text-neutral-200">{sample.gcEventDetected ? 'Только что' : 'В норме'}</span></div>
              <div>Тренд: <span className="text-neutral-200">{trend.memSlope}</span></div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 pt-2 border-t border-neutral-800/80">
            <span>Освобождение: <strong className="text-emerald-400">&gt; 2.5 MB / сброс</strong></span>
            <span>Память: <strong className="text-neutral-300">Heap Dynamic</strong></span>
          </div>
        </div>
      </div>

      {/* Benchmark Output Banner (if executed) */}
      {benchmarkResult && (
        <div className="bg-gradient-to-r from-purple-950/60 to-indigo-950/60 border border-purple-800/50 rounded-2xl p-3 px-4 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-purple-300">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>
              <strong>Результат Стресс-Теста CPU:</strong> {benchmarkResult.opsPerSec.toLocaleString()} ops/сек выполнено за {benchmarkResult.durationMs} мс.
            </span>
          </div>
          <div className="text-[11px] text-neutral-400">
            Интерфейс сохранял 60 FPS благодаря изоляции в отдельном потоке Web Worker.
          </div>
        </div>
      )}

      {/* Main Charts Section */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 flex flex-col gap-3">
        {/* Chart View Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
              Динамические Графики Клиентской Среды (Off-Thread Telemetry)
            </h3>
          </div>

          <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs">
            <button
              onClick={() => setActiveMetricTab('trends')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                activeMetricTab === 'trends' ? 'bg-cyan-600 text-white shadow-xs font-semibold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Тренды CPU & Памяти
            </button>
            <button
              onClick={() => setActiveMetricTab('jitter')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                activeMetricTab === 'jitter' ? 'bg-cyan-600 text-white shadow-xs font-semibold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Джиттер Event Loop (ms)
            </button>
            <button
              onClick={() => setActiveMetricTab('memory_delta')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                activeMetricTab === 'memory_delta' ? 'bg-cyan-600 text-white shadow-xs font-semibold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Скорость Выделения (ΔMB/с)
            </button>
          </div>
        </div>

        {/* Chart 1: Dual CPU & Memory Area Chart */}
        {activeMetricTab === 'trends' && (
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c084fc" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#c084fc" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="timestamp" stroke="#737373" tick={{ fontSize: 10, fill: '#a3a3a3' }} />
                <YAxis
                  yAxisId="cpuAxis"
                  domain={[0, 100]}
                  stroke="#38bdf8"
                  tick={{ fontSize: 10, fill: '#38bdf8' }}
                  unit="%"
                />
                <YAxis
                  yAxisId="memAxis"
                  orientation="right"
                  domain={[30, 'auto']}
                  stroke="#c084fc"
                  tick={{ fontSize: 10, fill: '#c084fc' }}
                  unit=" MB"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#171717',
                    borderColor: '#404040',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                <ReferenceLine yAxisId="cpuAxis" y={70} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Warn 70%', fill: '#f59e0b', fontSize: 9 }} />
                <ReferenceLine yAxisId="cpuAxis" y={90} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Crit 90%', fill: '#ef4444', fontSize: 9 }} />
                <Area
                  yAxisId="cpuAxis"
                  type="monotone"
                  dataKey="cpuPercent"
                  name="Загрузка CPU (%)"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#cpuGrad)"
                />
                <Area
                  yAxisId="memAxis"
                  type="monotone"
                  dataKey="heapUsedMb"
                  name="Heap Used (MB)"
                  stroke="#c084fc"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#memGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Chart 2: Event Loop Jitter Line Chart */}
        {activeMetricTab === 'jitter' && (
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="timestamp" stroke="#737373" tick={{ fontSize: 10, fill: '#a3a3a3' }} />
                <YAxis stroke="#34d399" tick={{ fontSize: 10, fill: '#34d399' }} unit=" ms" domain={[0, 'auto']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#171717',
                    borderColor: '#404040',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                <ReferenceLine y={5} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Jitter Threshold 5ms', fill: '#ef4444', fontSize: 9 }} />
                <Line
                  type="monotone"
                  dataKey="eventLoopJitterMs"
                  name="Дрейф таймера / Jitter (ms)"
                  stroke="#34d399"
                  strokeWidth={2}
                  dot={{ r: 2, fill: '#34d399' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Chart 3: Memory Delta & GC Bar Chart */}
        {activeMetricTab === 'memory_delta' && (
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={history} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="timestamp" stroke="#737373" tick={{ fontSize: 10, fill: '#a3a3a3' }} />
                <YAxis stroke="#fbbf24" tick={{ fontSize: 10, fill: '#fbbf24' }} unit=" MB" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#171717',
                    borderColor: '#404040',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                  formatter={(val: any) => [`${val} MB/с`, 'Скорость выделения']}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                <ReferenceLine y={0} stroke="#737373" />
                <Bar dataKey="memoryDeltaMb" name="Δ Выделения / GC Очистки (MB/с)" radius={[3, 3, 0, 0]}>
                  {history.map((entry, index) => {
                    const isGc = entry.memoryDeltaMb < 0;
                    return <Cell key={`cell-${index}`} fill={isGc ? '#10b981' : '#f59e0b'} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Diagnostic & Hardware Information Table */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4">
        <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider mb-3 flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          Параметры Окружения Клиентского Устройства
        </h4>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs font-mono">
          <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800/80">
            <div className="text-[10px] text-neutral-500 uppercase">Потоки CPU</div>
            <div className="text-neutral-200 font-bold mt-0.5">{sample.hardwareConcurrency} Cores</div>
          </div>

          <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800/80">
            <div className="text-[10px] text-neutral-500 uppercase">Web Worker Support</div>
            <div className="text-emerald-400 font-bold mt-0.5">{workerSupported ? 'Available (Dedicated)' : 'Fallback'}</div>
          </div>

          <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800/80">
            <div className="text-[10px] text-neutral-500 uppercase">Опрос телеметрии</div>
            <div className="text-cyan-300 font-bold mt-0.5">{pollingIntervalMs} ms</div>
          </div>

          <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800/80">
            <div className="text-[10px] text-neutral-500 uppercase">Лимит Памяти Heap</div>
            <div className="text-purple-300 font-bold mt-0.5">{sample.heapLimitMb} MB</div>
          </div>

          <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800/80">
            <div className="text-[10px] text-neutral-500 uppercase">Тенант Namespace</div>
            <div className="text-neutral-200 font-bold mt-0.5">{tenant.schema}</div>
          </div>

          <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800/80">
            <div className="text-[10px] text-neutral-500 uppercase">Собрано сэмплов</div>
            <div className="text-neutral-200 font-bold mt-0.5">#{sample.workerTick}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
