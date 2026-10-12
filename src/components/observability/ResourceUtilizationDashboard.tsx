import React, { useState, useMemo } from 'react';
import {
  Activity,
  Cpu,
  HardDrive,
  Database,
  TrendingUp,
  Server,
  Zap,
  Clock,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Maximize2,
  Boxes,
  ArrowUpRight,
  ShieldCheck,
  Radio
} from 'lucide-react';
import { Tenant, ResourceUtilizationPoint } from '../../types';
import { generateTenantUtilizationHistory } from '../../data/utilizationData';
import { D3UtilizationAreaChart } from './D3UtilizationAreaChart';
import { D3StorageMultiMetricChart } from './D3StorageMultiMetricChart';

interface ResourceUtilizationDashboardProps {
  activeTenant: Tenant;
}

export const ResourceUtilizationDashboard: React.FC<ResourceUtilizationDashboardProps> = ({
  activeTenant,
}) => {
  const [timeRange, setTimeRange] = useState<'24h' | '12h' | '6h'>('24h');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [refreshSeed, setRefreshSeed] = useState<number>(0);

  // Derive autoscaling configurations or defaults
  const autoScaling = activeTenant.config?.autoScaling || {
    enabled: true,
    minPods: 2,
    maxPods: 8,
    currentPods: 3,
    targetCpuUtilizationPct: 70,
    targetRpsThreshold: 450,
    scaleUpCooldownSec: 60,
    scaleDownCooldownSec: 300,
    elasticStorageEnabled: true,
    storageUsageThresholdPct: 80,
    autoExpandChunkMb: 2048,
    maxStorageCeilingMb: 51200,
    alertOnScaleEvent: true,
  };

  // Generate 24-hour time series utilization points
  const rawData: ResourceUtilizationPoint[] = useMemo(() => {
    return generateTenantUtilizationHistory(
      `${activeTenant.id}_${refreshSeed}`,
      activeTenant.storageQuotaMb || 10240,
      activeTenant.storageUsedMb || 4000,
      autoScaling.currentPods || 3,
      48
    );
  }, [activeTenant.id, activeTenant.storageQuotaMb, activeTenant.storageUsedMb, autoScaling.currentPods, refreshSeed]);

  // Filter based on selected time window
  const chartData = useMemo(() => {
    if (timeRange === '6h') return rawData.slice(-6);
    if (timeRange === '12h') return rawData.slice(-12);
    return rawData;
  }, [rawData, timeRange]);

  const latestPoint = chartData[chartData.length - 1] || rawData[rawData.length - 1];

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setRefreshSeed((prev) => prev + 1);
      setIsRefreshing(false);
    }, 400);
  };

  // Compute summary aggregations
  const avgCpu = Math.round(chartData.reduce((acc, p) => acc + p.cpuPercent, 0) / chartData.length);
  const peakCpu = Math.max(...chartData.map((p) => p.cpuPercent));
  const avgMemory = Math.round(chartData.reduce((acc, p) => acc + p.memoryUsedMb, 0) / chartData.length);
  const storagePct = Math.round((latestPoint.storageUsedGb / latestPoint.storageLimitGb) * 100);

  return (
    <div className="h-full flex flex-col bg-neutral-950 text-neutral-100 overflow-y-auto p-4 space-y-4">
      {/* Top Header Card */}
      <div className="p-4 bg-neutral-900/80 border border-neutral-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-900/40">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">
                Resource Utilization Dashboard
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded font-semibold uppercase">
                D3.js ENGINE
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Мониторинг утилизации вычислительных ресурсов (vCPU/RAM), эластичного хранилища и трендов потребления арендатора <span className="text-cyan-300 font-medium font-mono">{activeTenant.name}</span> ({activeTenant.schema})
            </p>
          </div>
        </div>

        {/* Controls: Time Filter + Refresh */}
        <div className="flex items-center gap-2">
          <div className="flex bg-neutral-950 border border-neutral-800 rounded-lg p-0.5 text-xs font-mono">
            {(['6h', '12h', '24h'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  timeRange === range
                    ? 'bg-cyan-600 text-white font-semibold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg border border-neutral-750 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            Обновить
          </button>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* CPU Cores & Load */}
        <div className="p-3.5 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Compute Load (vCPU)
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
              latestPoint.cpuPercent > 75 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}>
              {latestPoint.cpuPercent > 75 ? 'ВЫСОКАЯ' : 'НОРМА'}
            </span>
          </div>
          <div className="text-xl font-bold text-white font-mono flex items-baseline gap-1.5">
            {latestPoint.cpuCoresUsed} <span className="text-xs text-neutral-400 font-sans font-normal">/ {latestPoint.cpuLimitCores} ядер</span>
          </div>
          <div className="text-[11px] text-neutral-400 font-mono flex items-center justify-between pt-1">
            <span>Утилизация: <b className="text-cyan-300">{latestPoint.cpuPercent}%</b></span>
            <span>Пик 24ч: <b className="text-neutral-200">{peakCpu}%</b></span>
          </div>
        </div>

        {/* Memory RAM */}
        <div className="p-3.5 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-purple-400" /> RAM Memory Pool
            </span>
            <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.2 rounded border border-purple-500/20 font-semibold">
              {Math.round((latestPoint.memoryUsedMb / latestPoint.memoryLimitMb) * 100)}%
            </span>
          </div>
          <div className="text-xl font-bold text-white font-mono flex items-baseline gap-1.5">
            {(latestPoint.memoryUsedMb / 1024).toFixed(1)} GB <span className="text-xs text-neutral-400 font-sans font-normal">/ {(latestPoint.memoryLimitMb / 1024).toFixed(1)} GB</span>
          </div>
          <div className="text-[11px] text-neutral-400 font-mono flex items-center justify-between pt-1">
            <span>Среднее: <b className="text-purple-300">{(avgMemory / 1024).toFixed(1)} GB</b></span>
            <span>Подов: <b className="text-neutral-200">{latestPoint.activePods}</b></span>
          </div>
        </div>

        {/* Storage Capacity */}
        <div className="p-3.5 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" /> NVMe Storage Quota
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
              storagePct > 80 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}>
              {storagePct}%
            </span>
          </div>
          <div className="text-xl font-bold text-white font-mono flex items-baseline gap-1.5">
            {latestPoint.storageUsedGb} GB <span className="text-xs text-neutral-400 font-sans font-normal">/ {latestPoint.storageLimitGb} GB</span>
          </div>
          <div className="text-[11px] text-neutral-400 font-mono flex items-center justify-between pt-1">
            <span>Эластично: <b className={autoScaling.elasticStorageEnabled ? 'text-emerald-400' : 'text-neutral-500'}>
              {autoScaling.elasticStorageEnabled ? 'ВКЛ (+2GB)' : 'ВЫКЛ'}
            </b></span>
            <span>Лимит: <b className="text-neutral-200">50 GB</b></span>
          </div>
        </div>

        {/* Pod Autoscaling & IOPS */}
        <div className="p-3.5 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium flex items-center gap-1.5">
              <Boxes className="w-3.5 h-3.5 text-amber-400" /> Active Pods & IOPS
            </span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.2 rounded border border-cyan-500/20 font-semibold">
              HPA {autoScaling.minPods}-{autoScaling.maxPods}
            </span>
          </div>
          <div className="text-xl font-bold text-white font-mono flex items-baseline gap-1.5">
            {latestPoint.activePods} подов <span className="text-xs text-neutral-400 font-sans font-normal">· {latestPoint.iops} IOPS</span>
          </div>
          <div className="text-[11px] text-neutral-400 font-mono flex items-center justify-between pt-1">
            <span>Трафик: <b className="text-amber-300">{latestPoint.bandwidthMbps} Mbps</b></span>
            <span>Порог HPA: <b className="text-neutral-200">{autoScaling.targetCpuUtilizationPct}% CPU</b></span>
          </div>
        </div>
      </div>

      {/* D3.js Charts Visualization Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Compute (CPU) Utilization Trend with Quota/Target Limit */}
        <D3UtilizationAreaChart
          data={chartData}
          metricKey="cpuPercent"
          title="Compute Утилизация (CPU %)"
          unit="%"
          gradientColorStart="#06b6d4"
          gradientColorEnd="#0891b2"
          strokeColor="#06b6d4"
          limitKey={undefined}
          height={260}
        />

        {/* Chart 2: Memory (RAM) Consumption in MB with Pod Limit */}
        <D3UtilizationAreaChart
          data={chartData}
          metricKey="memoryUsedMb"
          limitKey="memoryLimitMb"
          title="Потребление памяти RAM (MB)"
          unit="MB"
          gradientColorStart="#a855f7"
          gradientColorEnd="#7e22ce"
          strokeColor="#c084fc"
          limitLabel="RAM Limit"
          height={260}
        />
      </div>

      {/* Full-width Dual Axis Chart: Storage Consumption + Disk IOPS */}
      <D3StorageMultiMetricChart data={chartData} height={270} />

      {/* Auto-scaling & Resource Quota Policy Summary for Active Tenant */}
      <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Текущие правила аллокации ресурсов тенанта ({activeTenant.name})
            </h4>
          </div>
          <span className="text-[10px] font-mono text-neutral-400">
            Подсистема K8s HPA + Ceph CSI Volume Expansion
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-neutral-950 border border-neutral-850 rounded-lg space-y-1">
            <div className="text-neutral-400 text-[11px] font-semibold flex items-center gap-1.5">
              <Cpu className="w-3 h-3 text-cyan-400" /> Политика Pod Auto-scaling
            </div>
            <div className="font-mono text-cyan-300 font-bold">
              {autoScaling.minPods}..{autoScaling.maxPods} подов (Текущее: {latestPoint.activePods})
            </div>
            <p className="text-[10px] text-neutral-500 leading-tight">
              Триггер масштабирования при CPU &gt; {autoScaling.targetCpuUtilizationPct}% или RPS &gt; {autoScaling.targetRpsThreshold}.
            </p>
          </div>

          <div className="p-3 bg-neutral-950 border border-neutral-850 rounded-lg space-y-1">
            <div className="text-neutral-400 text-[11px] font-semibold flex items-center gap-1.5">
              <HardDrive className="w-3 h-3 text-emerald-400" /> Эластичное хранилище (Thin Provisioning)
            </div>
            <div className="font-mono text-emerald-300 font-bold">
              {autoScaling.elasticStorageEnabled ? 'Активно (+2048 MB при 80%)' : 'Фиксированный размер'}
            </div>
            <p className="text-[10px] text-neutral-500 leading-tight">
              Авторасширение тома без перезапуска сервисов базы данных и остановки ввода-вывода.
            </p>
          </div>

          <div className="p-3 bg-neutral-950 border border-neutral-850 rounded-lg space-y-1">
            <div className="text-neutral-400 text-[11px] font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-indigo-400" /> Изоляция ресурсов в кластере
            </div>
            <div className="font-mono text-indigo-300 font-bold">
              Namespace: {activeTenant.schema}
            </div>
            <p className="text-[10px] text-neutral-500 leading-tight">
              Строгие Kubernetes ResourceQuotas и LimitRanges на уровне пространства имён тенанта.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
