import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Activity, Radio, Zap, Clock, RefreshCw, Server, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Tenant } from '../../types';

interface JetStreamMetricsPoint {
  time: string;
  throughputMsgsSec: number;
  ingressBytesSec: number;
  latencyP50Ms: number;
  latencyP99Ms: number;
  pendingAcks: number;
  droppedMsgs: number;
}

interface NatsJetStreamMonitoringWidgetProps {
  tenant: Tenant;
}

export const NatsJetStreamMonitoringWidget: React.FC<NatsJetStreamMonitoringWidgetProps> = ({
  tenant,
}) => {
  const [streamSubject, setStreamSubject] = useState<string>('all');
  const [timeWindow, setTimeWindow] = useState<'5m' | '15m' | '1h'>('15m');
  const [dataPoints, setDataPoints] = useState<JetStreamMetricsPoint[]>([]);
  const [isLive, setIsLive] = useState<boolean>(true);

  // Generate initial points based on tenant characteristics
  useEffect(() => {
    const pointsCount = timeWindow === '5m' ? 12 : timeWindow === '15m' ? 20 : 30;
    const baseThroughput = tenant.tier === 'holding' ? 450 : tenant.tier === 'division' ? 260 : 140;
    const baseLatency = tenant.tier === 'holding' ? 3.2 : tenant.tier === 'division' ? 4.8 : 6.1;

    const initial: JetStreamMetricsPoint[] = [];
    const now = Date.now();
    const intervalSec = timeWindow === '5m' ? 25 : timeWindow === '15m' ? 45 : 120;

    for (let i = pointsCount - 1; i >= 0; i--) {
      const timestamp = new Date(now - i * intervalSec * 1000);
      const timeStr = timestamp.toTimeString().slice(0, 8);
      const variation = Math.sin(i / 3) * 35 + (Math.random() * 25 - 12);
      const throughput = Math.max(20, Math.round(baseThroughput + variation));
      const p50 = +(baseLatency + Math.random() * 1.5 - 0.7).toFixed(2);
      const p99 = +(p50 * 2.4 + Math.random() * 2.2).toFixed(2);
      const bytes = throughput * 640 + Math.floor(Math.random() * 2000);

      initial.push({
        time: timeStr,
        throughputMsgsSec: throughput,
        ingressBytesSec: bytes,
        latencyP50Ms: Math.max(1, p50),
        latencyP99Ms: Math.max(2, p99),
        pendingAcks: Math.max(0, Math.floor(throughput * 0.05 + Math.random() * 5)),
        droppedMsgs: Math.random() > 0.92 ? 1 : 0,
      });
    }

    setDataPoints(initial);
  }, [tenant.id, tenant.tier, timeWindow]);

  // Live real-time stream simulation ticker (updates every 3 seconds)
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const baseThroughput = tenant.tier === 'holding' ? 450 : tenant.tier === 'division' ? 260 : 140;
      const baseLatency = tenant.tier === 'holding' ? 3.2 : tenant.tier === 'division' ? 4.8 : 6.1;
      const now = new Date();
      const timeStr = now.toTimeString().slice(0, 8);

      const jitter = Math.sin(Date.now() / 6000) * 30 + (Math.random() * 20 - 10);
      const throughput = Math.max(30, Math.round(baseThroughput + jitter));
      const p50 = +(baseLatency + Math.random() * 1.4 - 0.7).toFixed(2);
      const p99 = +(p50 * 2.4 + Math.random() * 2.5).toFixed(2);
      const bytes = throughput * 640 + Math.floor(Math.random() * 2500);

      const newPoint: JetStreamMetricsPoint = {
        time: timeStr,
        throughputMsgsSec: throughput,
        ingressBytesSec: bytes,
        latencyP50Ms: Math.max(1, p50),
        latencyP99Ms: Math.max(2, p99),
        pendingAcks: Math.max(0, Math.floor(throughput * 0.04 + Math.random() * 4)),
        droppedMsgs: Math.random() > 0.96 ? 1 : 0,
      };

      setDataPoints((prev) => [...prev.slice(1), newPoint]);
    }, 3000);

    return () => clearInterval(interval);
  }, [isLive, tenant.id, tenant.tier]);

  const latest = dataPoints[dataPoints.length - 1] || {
    throughputMsgsSec: 0,
    latencyP50Ms: 0,
    latencyP99Ms: 0,
    ingressBytesSec: 0,
    pendingAcks: 0,
    droppedMsgs: 0,
  };

  return (
    <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-4 shadow-xl space-y-4">
      {/* Widget Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-800/80 text-cyan-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide font-mono">
                NATS JETSTREAM 2.10 TELEMETRY MONITOR
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/80 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Stream: TENANT_{tenant.schema.toUpperCase()}
              </span>
            </div>
            <div className="text-xs text-neutral-400 mt-0.5 flex items-center gap-2">
              <span>Тенант: <b className="text-cyan-300">{tenant.name}</b></span>
              <span>·</span>
              <span>Subject: <code className="text-white bg-neutral-950 px-1 py-0.5 rounded text-[11px]">{tenant.schema}.events.*</code></span>
              <span>·</span>
              <span>Провайдер: <span className="text-neutral-300 font-mono">Clustered JetStream Raft (3 Nodes)</span></span>
            </div>
          </div>
        </div>

        {/* Controls: Time window, Stream filter, Live toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs">
            {(['5m', '15m', '1h'] as const).map((w) => (
              <button
                key={w}
                onClick={() => setTimeWindow(w)}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-colors ${
                  timeWindow === w
                    ? 'bg-cyan-600 text-white font-bold shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {w}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsLive(!isLive)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-colors ${
              isLive
                ? 'bg-emerald-950/70 border-emerald-700 text-emerald-300'
                : 'bg-neutral-800 border-neutral-700 text-neutral-400'
            }`}
            title={isLive ? 'Приостановить поступление метрик' : 'Включить живой опрос'}
          >
            <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-500'}`} />
            <span>{isLive ? 'LIVE ПОТОК' : 'ПАУЗА'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 bg-neutral-950/70 border border-neutral-850 rounded-xl">
          <span className="text-[11px] text-neutral-400 block mb-1">Пропускная способность (Throughput)</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-cyan-400">{latest.throughputMsgsSec}</span>
            <span className="text-xs text-neutral-400 font-mono">сообщ/сек</span>
          </div>
          <span className="text-[10px] text-neutral-500 font-mono block mt-1">
            Поток: ~{(latest.ingressBytesSec / 1024).toFixed(1)} KB/s
          </span>
        </div>

        <div className="p-3 bg-neutral-950/70 border border-neutral-850 rounded-xl">
          <span className="text-[11px] text-neutral-400 block mb-1">Задержка доставки p50 / p99</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-emerald-400">{latest.latencyP50Ms}</span>
            <span className="text-xs text-neutral-400 font-mono">/ {latest.latencyP99Ms} ms</span>
          </div>
          <span className="text-[10px] text-emerald-500 font-mono block mt-1">
            SLA целевое &lt; 10ms (Raft ack)
          </span>
        </div>

        <div className="p-3 bg-neutral-950/70 border border-neutral-850 rounded-xl">
          <span className="text-[11px] text-neutral-400 block mb-1">Ожидающие подтверждения (Pending ACKs)</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-purple-400">{latest.pendingAcks}</span>
            <span className="text-xs text-neutral-400 font-mono">ack-inflight</span>
          </div>
          <span className="text-[10px] text-neutral-500 font-mono block mt-1">
            Max ack_wait: 30 сек
          </span>
        </div>

        <div className="p-3 bg-neutral-950/70 border border-neutral-850 rounded-xl">
          <span className="text-[11px] text-neutral-400 block mb-1">Сброшенные сообщения (Drop Rate)</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-white">{latest.droppedMsgs}</span>
            <span className="text-xs text-neutral-400 font-mono">дропов</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono block mt-1">
            Retention: Limits (max_bytes 10GB)
          </span>
        </div>
      </div>

      {/* Two Recharts Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Message Throughput Area Chart */}
        <div className="p-3.5 bg-neutral-950/80 border border-neutral-850 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-neutral-200 flex items-center gap-1.5 font-mono">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              ИНТЕНСИВНОСТЬ СООБЩЕНИЙ NATS (MSG/SEC)
            </h4>
            <span className="text-[10px] font-mono text-cyan-400">
              По тенанту: {tenant.name}
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dataPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="natsThroughputGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#262626" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="#737373" tick={{ fontSize: 10 }} />
                <YAxis stroke="#737373" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#171717',
                    border: '1px solid #404040',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#f5f5f5',
                  }}
                  formatter={(val: any) => [`${val} msg/s`, 'Throughput']}
                />
                <Area
                  type="monotone"
                  dataKey="throughputMsgsSec"
                  name="Интенсивность"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#natsThroughputGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Latency Dual Line Chart (p50 and p99 in ms) */}
        <div className="p-3.5 bg-neutral-950/80 border border-neutral-850 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-neutral-200 flex items-center gap-1.5 font-mono">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              ЗАДЕРЖКА NATS JETSTREAM P50 & P99 (MS)
            </h4>
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-0.5 bg-emerald-400 inline-block" /> p50
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2 h-0.5 bg-amber-400 inline-block" /> p99
              </span>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dataPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#262626" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="#737373" tick={{ fontSize: 10 }} />
                <YAxis stroke="#737373" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#171717',
                    border: '1px solid #404040',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#f5f5f5',
                  }}
                  formatter={(val: any, name: any) => [`${val} ms`, name === 'latencyP50Ms' ? 'p50 Latency' : 'p99 Latency']}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }}
                  formatter={(val) => (val === 'latencyP50Ms' ? 'p50 Latency (ms)' : 'p99 Latency (ms)')}
                />
                <Line
                  type="monotone"
                  dataKey="latencyP50Ms"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="latencyP99Ms"
                  stroke="#fbbf24"
                  strokeWidth={2}
                  strokeDasharray="4 2"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
