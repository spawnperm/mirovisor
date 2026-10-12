import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  TrendingUp, 
  HardDrive, 
  Activity, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Maximize2,
  Clock,
  Layers,
  ArrowUpRight,
  Info
} from 'lucide-react';
import { HistoricalTrendPoint, Tenant } from '../../types';
import { generateHistoricalTrendData } from '../../data/utilizationData';

interface D3HistoricalTrendLineChartProps {
  tenant: Tenant;
  height?: number;
}

export const D3HistoricalTrendLineChart: React.FC<D3HistoricalTrendLineChartProps> = ({
  tenant,
  height = 360,
}) => {
  const [daysRange, setDaysRange] = useState<number>(30);
  const [showStorage, setShowStorage] = useState<boolean>(true);
  const [showRps, setShowRps] = useState<boolean>(true);
  const [showRegression, setShowRegression] = useState<boolean>(true);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  // Generate historical data based on tenant storage & rate limit
  const data: HistoricalTrendPoint[] = useMemo(() => {
    return generateHistoricalTrendData(
      tenant.id,
      tenant.storageQuotaMb || 10240,
      tenant.storageUsedMb || 4200,
      tenant.config?.quotas?.apiRateLimitRps ? Math.round(tenant.config.quotas.apiRateLimitRps * 0.4) : 240,
      daysRange
    );
  }, [tenant.id, tenant.storageQuotaMb, tenant.storageUsedMb, tenant.config, daysRange]);

  // Derived statistics for analytics badges
  const stats = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        growthPct: 0,
        currentStorage: 0,
        quotaGb: 10,
        runwayDays: 999,
        avgRps: 0,
        peakRps: 0,
        latestRps: 0,
      };
    }

    const first = data[0];
    const last = data[data.length - 1];
    const growthPct = first.storageUsedGb > 0
      ? Math.round(((last.storageUsedGb - first.storageUsedGb) / first.storageUsedGb) * 100)
      : 0;

    const currentStorage = last.storageUsedGb;
    const quotaGb = last.storageQuotaGb;
    const remainingGb = Math.max(0, quotaGb - currentStorage);

    // Estimate daily storage growth rate from regression
    const dailyGrowthGb = data.length > 1
      ? Math.max(0.01, (last.storageTrendGb || last.storageUsedGb) - (first.storageTrendGb || first.storageUsedGb)) / (data.length - 1)
      : 0.05;

    const runwayDays = Math.round(remainingGb / dailyGrowthGb);

    const rpsValues = data.map((d) => d.apiRps);
    const avgRps = Math.round(d3.mean(rpsValues) || 0);
    const peakRps = Math.round(d3.max(rpsValues) || 0);
    const latestRps = last.apiRps;

    return {
      growthPct,
      currentStorage,
      quotaGb,
      runwayDays,
      avgRps,
      peakRps,
      latestRps,
    };
  }, [data]);

  // Render D3 Dual-Axis Trend Line Chart
  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const containerWidth = svgRef.current.clientWidth || 800;
    const margin = { top: 25, right: 65, bottom: 45, left: 55 };
    const width = containerWidth - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    if (width <= 0 || chartHeight <= 0) return;

    // Define gradients for areas & lines
    const defs = svg.append('defs');

    // Storage Cyan Gradient
    const storageGrad = defs
      .append('linearGradient')
      .attr('id', 'storageGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    storageGrad.append('stop').attr('offset', '0%').attr('stop-color', '#06b6d4').attr('stop-opacity', 0.25);
    storageGrad.append('stop').attr('offset', '100%').attr('stop-color', '#06b6d4').attr('stop-opacity', 0.0);

    // RPS Violet Gradient
    const rpsGrad = defs
      .append('linearGradient')
      .attr('id', 'rpsGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    rpsGrad.append('stop').attr('offset', '0%').attr('stop-color', '#8b5cf6').attr('stop-opacity', 0.2);
    rpsGrad.append('stop').attr('offset', '100%').attr('stop-color', '#8b5cf6').attr('stop-opacity', 0.0);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale: Dates
    const x = d3
      .scalePoint<string>()
      .domain(data.map((d) => d.dateLabel))
      .range([0, width])
      .padding(0.1);

    // Left Y Scale: Storage (GB)
    const maxStorageVal = Math.max(
      d3.max(data, (d) => Math.max(d.storageUsedGb, d.storageQuotaGb)) || 10,
      1
    );
    const yStorage = d3
      .scaleLinear()
      .domain([0, maxStorageVal * 1.15])
      .nice()
      .range([chartHeight, 0]);

    // Right Y Scale: API Request Rate (RPS)
    const maxRpsVal = Math.max(d3.max(data, (d) => d.apiRps) || 300, 100);
    const yRps = d3
      .scaleLinear()
      .domain([0, maxRpsVal * 1.25])
      .nice()
      .range([chartHeight, 0]);

    // Horizontal Grid Lines
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(yStorage)
          .ticks(5)
          .tickSize(-width)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', '#262626')
      .attr('stroke-dasharray', '3,3');
    g.selectAll('.grid .domain').remove();

    // Storage Quota Line (Red dashed)
    const quotaY = yStorage(data[0].storageQuotaGb);
    if (quotaY >= 0 && quotaY <= chartHeight) {
      g.append('line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', quotaY)
        .attr('y2', quotaY)
        .attr('stroke', '#f43f5e')
        .attr('stroke-dasharray', '5,4')
        .attr('stroke-width', 1.5)
        .attr('opacity', 0.7);

      g.append('text')
        .attr('x', width - 8)
        .attr('y', quotaY - 5)
        .attr('text-anchor', 'end')
        .attr('fill', '#f43f5e')
        .attr('font-size', '10px')
        .attr('font-family', 'monospace')
        .text(`Квота хранилища: ${data[0].storageQuotaGb} ГБ`);
    }

    // 1. STORAGE AREA & LINE (Cyan)
    if (showStorage) {
      const storageArea = d3
        .area<HistoricalTrendPoint>()
        .x((d) => x(d.dateLabel) || 0)
        .y0(chartHeight)
        .y1((d) => yStorage(d.storageUsedGb))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(data)
        .attr('fill', 'url(#storageGradient)')
        .attr('d', storageArea);

      const storageLine = d3
        .line<HistoricalTrendPoint>()
        .x((d) => x(d.dateLabel) || 0)
        .y((d) => yStorage(d.storageUsedGb))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', '#06b6d4')
        .attr('stroke-width', 2.5)
        .attr('d', storageLine);
    }

    // 2. API RPS LINE (Violet)
    if (showRps) {
      const rpsArea = d3
        .area<HistoricalTrendPoint>()
        .x((d) => x(d.dateLabel) || 0)
        .y0(chartHeight)
        .y1((d) => yRps(d.apiRps))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(data)
        .attr('fill', 'url(#rpsGradient)')
        .attr('d', rpsArea);

      const rpsLine = d3
        .line<HistoricalTrendPoint>()
        .x((d) => x(d.dateLabel) || 0)
        .y((d) => yRps(d.apiRps))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', '#a855f7')
        .attr('stroke-width', 2)
        .attr('d', rpsLine);
    }

    // 3. REGRESSION TRENDLINES (Dashed Glow)
    if (showRegression) {
      if (showStorage) {
        const storageTrendLine = d3
          .line<HistoricalTrendPoint>()
          .x((d) => x(d.dateLabel) || 0)
          .y((d) => yStorage(d.storageTrendGb || d.storageUsedGb))
          .curve(d3.curveLinear);

        g.append('path')
          .datum(data)
          .attr('fill', 'none')
          .attr('stroke', '#38bdf8')
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '4,4')
          .attr('opacity', 0.8)
          .attr('d', storageTrendLine);
      }

      if (showRps) {
        const rpsTrendLine = d3
          .line<HistoricalTrendPoint>()
          .x((d) => x(d.dateLabel) || 0)
          .y((d) => yRps(d.rpsTrend || d.apiRps))
          .curve(d3.curveLinear);

        g.append('path')
          .datum(data)
          .attr('fill', 'none')
          .attr('stroke', '#c084fc')
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '4,4')
          .attr('opacity', 0.8)
          .attr('d', rpsTrendLine);
      }
    }

    // X Axis
    const tickInterval = Math.ceil(data.length / 8);
    const tickValues = data
      .filter((_, idx) => idx % tickInterval === 0 || idx === data.length - 1)
      .map((d) => d.dateLabel);

    const xAxis = d3
      .axisBottom(x)
      .tickValues(tickValues)
      .tickSize(5);

    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(xAxis)
      .call((axis) => axis.select('.domain').attr('stroke', '#404040'))
      .selectAll('text')
      .attr('fill', '#a3a3a3')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .attr('dy', '0.8em');

    // Left Axis: Storage (GB)
    const yAxisStorage = d3
      .axisLeft(yStorage)
      .ticks(5)
      .tickFormat((d) => `${d} ГБ`);

    g.append('g')
      .call(yAxisStorage)
      .call((axis) => axis.select('.domain').attr('stroke', '#404040'))
      .selectAll('text')
      .attr('fill', '#06b6d4')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace');

    // Right Axis: API RPS
    const yAxisRps = d3
      .axisRight(yRps)
      .ticks(5)
      .tickFormat((d) => `${d} rps`);

    g.append('g')
      .attr('transform', `translate(${width},0)`)
      .call(yAxisRps)
      .call((axis) => axis.select('.domain').attr('stroke', '#404040'))
      .selectAll('text')
      .attr('fill', '#a855f7')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace');

    // Interactive Hover Overlay & Crosshair
    const focusGroup = g.append('g').style('display', 'none');

    // Vertical line
    const focusLine = focusGroup
      .append('line')
      .attr('y1', 0)
      .attr('y2', chartHeight)
      .attr('stroke', '#737373')
      .attr('stroke-dasharray', '3,3');

    // Dots on points
    const storageDot = focusGroup
      .append('circle')
      .attr('r', 5)
      .attr('fill', '#06b6d4')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2);

    const rpsDot = focusGroup
      .append('circle')
      .attr('r', 5)
      .attr('fill', '#a855f7')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2);

    const overlay = g
      .append('rect')
      .attr('width', width)
      .attr('height', chartHeight)
      .attr('fill', 'transparent')
      .attr('cursor', 'crosshair');

    overlay
      .on('mouseenter', () => {
        focusGroup.style('display', null);
        if (tooltipRef.current) tooltipRef.current.style.opacity = '1';
      })
      .on('mouseleave', () => {
        focusGroup.style('display', 'none');
        if (tooltipRef.current) tooltipRef.current.style.opacity = '0';
      })
      .on('mousemove', (event) => {
        const [mouseX] = d3.pointer(event);
        const eachBand = width / data.length;
        const index = Math.min(
          data.length - 1,
          Math.max(0, Math.floor(mouseX / eachBand))
        );
        const d = data[index];
        const posX = x(d.dateLabel) || 0;
        const posYStorage = yStorage(d.storageUsedGb);
        const posYRps = yRps(d.apiRps);

        focusLine.attr('x1', posX).attr('x2', posX);
        storageDot.attr('cx', posX).attr('cy', posYStorage);
        rpsDot.attr('cx', posX).attr('cy', posYRps);

        // Tooltip rendering
        if (tooltipRef.current) {
          const utilPct = Math.round((d.storageUsedGb / d.storageQuotaGb) * 100);
          const tooltipContent = `
            <div class="font-mono text-[11px] font-semibold text-neutral-200 border-b border-neutral-750 pb-1 mb-1.5 flex items-center justify-between gap-3">
              <span>📅 Дата: ${d.dateLabel}</span>
              <span class="text-[10px] text-neutral-400">${new Date(d.timestamp).toLocaleDateString('ru-RU')}</span>
            </div>
            <div class="space-y-1 text-[11px] font-mono">
              <div class="flex items-center justify-between gap-4 text-cyan-400">
                <span class="flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-cyan-400 inline-block"></span>
                  Хранилище:
                </span>
                <span class="font-bold">${d.storageUsedGb} ГБ (${utilPct}%)</span>
              </div>
              <div class="flex items-center justify-between gap-4 text-purple-400">
                <span class="flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-purple-400 inline-block"></span>
                  Нагрузка API:
                </span>
                <span class="font-bold">${d.apiRps} rps</span>
              </div>
              ${
                showRegression && d.storageTrendGb
                  ? `
                <div class="flex items-center justify-between gap-4 text-neutral-400 text-[10px] pt-0.5 border-t border-neutral-800">
                  <span>Тренд хранилища:</span>
                  <span>${d.storageTrendGb} ГБ</span>
                </div>
              `
                  : ''
              }
            </div>
          `;
          tooltipRef.current.innerHTML = tooltipContent;

          // Tooltip position clamped
          const tooltipRect = tooltipRef.current.getBoundingClientRect();
          let left = event.pageX + 15;
          if (left + tooltipRect.width > window.innerWidth - 20) {
            left = event.pageX - tooltipRect.width - 15;
          }
          tooltipRef.current.style.left = `${left}px`;
          tooltipRef.current.style.top = `${event.pageY - 35}px`;
        }
      });
  }, [data, height, showStorage, showRps, showRegression]);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col gap-4 shadow-lg shadow-black/40">
      {/* Header and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              ИСТОРИЧЕСКИЙ ТРЕНД ХРАНИЛИЩА И API (D3.js Trend Line)
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/50">
              Схема: {tenant.schema}
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Двухосевой анализ динамики роста потребления дискового пространства и частоты сетевых запросов с линейной регрессией.
          </p>
        </div>

        {/* Action Controls & Range Selector */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Toggles */}
          <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-[11px]">
            <button
              onClick={() => setShowStorage(!showStorage)}
              className={`px-2 py-1 rounded transition-colors flex items-center gap-1 ${
                showStorage ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              Хранилище (ГБ)
            </button>
            <button
              onClick={() => setShowRps(!showRps)}
              className={`px-2 py-1 rounded transition-colors flex items-center gap-1 ${
                showRps ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
              API RPS
            </button>
            <button
              onClick={() => setShowRegression(!showRegression)}
              className={`px-2 py-1 rounded transition-colors flex items-center gap-1 ${
                showRegression ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'text-neutral-500 hover:text-neutral-300'
              }`}
              title="Показать линию регрессионного тренда"
            >
              Линии тренда
            </button>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800 font-mono text-[11px]">
            {[7, 14, 30, 60, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDaysRange(d)}
                className={`px-2 py-1 rounded transition-colors ${
                  daysRange === d ? 'bg-neutral-800 text-cyan-400 font-bold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                {d}д
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Analytics KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Storage Growth KPI */}
        <div className="p-3 bg-neutral-950/70 border border-neutral-800/80 rounded-lg flex items-center justify-between">
          <div>
            <div className="text-[10px] text-neutral-400 uppercase font-mono tracking-wider flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-cyan-400" />
              Прирост за {daysRange}д
            </div>
            <div className="text-base font-extrabold text-cyan-400 font-mono mt-0.5 flex items-center gap-1">
              <span>+{stats.growthPct}%</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
              {stats.currentStorage} / {stats.quotaGb} ГБ
            </div>
          </div>
          <div className="w-8 h-8 rounded bg-cyan-950/50 border border-cyan-800/30 flex items-center justify-center text-cyan-400 text-xs font-bold">
            📈
          </div>
        </div>

        {/* Estimated Storage Runway KPI */}
        <div className="p-3 bg-neutral-950/70 border border-neutral-800/80 rounded-lg flex items-center justify-between">
          <div>
            <div className="text-[10px] text-neutral-400 uppercase font-mono tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" />
              Запас до квоты (Runway)
            </div>
            <div className="text-base font-extrabold text-amber-400 font-mono mt-0.5">
              ~{stats.runwayDays} дней
            </div>
            <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
              при текущем темпе роста
            </div>
          </div>
          <div className="w-8 h-8 rounded bg-amber-950/50 border border-amber-800/30 flex items-center justify-center text-amber-400 text-xs font-bold">
            ⏳
          </div>
        </div>

        {/* Average RPS KPI */}
        <div className="p-3 bg-neutral-950/70 border border-neutral-800/80 rounded-lg flex items-center justify-between">
          <div>
            <div className="text-[10px] text-neutral-400 uppercase font-mono tracking-wider flex items-center gap-1">
              <Activity className="w-3 h-3 text-purple-400" />
              Средний RPS
            </div>
            <div className="text-base font-extrabold text-purple-400 font-mono mt-0.5">
              {stats.avgRps} rps
            </div>
            <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
              текущий: {stats.latestRps} rps
            </div>
          </div>
          <div className="w-8 h-8 rounded bg-purple-950/50 border border-purple-800/30 flex items-center justify-center text-purple-400 text-xs font-bold">
            ⚡
          </div>
        </div>

        {/* Peak RPS KPI */}
        <div className="p-3 bg-neutral-950/70 border border-neutral-800/80 rounded-lg flex items-center justify-between">
          <div>
            <div className="text-[10px] text-neutral-400 uppercase font-mono tracking-wider flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              Пиковый RPS
            </div>
            <div className="text-base font-extrabold text-emerald-400 font-mono mt-0.5">
              {stats.peakRps} rps
            </div>
            <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
              лимит: {tenant.config?.quotas?.apiRateLimitRps || 300} rps
            </div>
          </div>
          <div className="w-8 h-8 rounded bg-emerald-950/50 border border-emerald-800/30 flex items-center justify-center text-emerald-400 text-xs font-bold">
            🚀
          </div>
        </div>
      </div>

      {/* SVG Container with D3 visualization */}
      <div className="relative w-full rounded-lg bg-neutral-950/80 border border-neutral-800/60 overflow-hidden">
        <svg
          ref={svgRef}
          className="w-full"
          style={{ height: `${height}px` }}
          aria-label={`График исторического тренда хранилища и RPS для тенанта ${tenant.name}`}
          role="img"
        />

        {/* Floating Tooltip */}
        <div
          ref={tooltipRef}
          className="fixed pointer-events-none z-50 p-2.5 bg-neutral-900/95 border border-neutral-700/80 rounded-lg shadow-xl shadow-black/80 backdrop-blur-md opacity-0 transition-opacity duration-150 min-w-[200px]"
          style={{ left: 0, top: 0 }}
        />
      </div>

      {/* Legend & Note */}
      <div className="flex flex-wrap items-center justify-between text-xs text-neutral-400 border-t border-neutral-800/60 pt-2 px-1">
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <span className="flex items-center gap-1.5 text-cyan-400">
            <span className="w-3 h-1 bg-cyan-400 rounded-full inline-block"></span>
            Хранилище (левая ось, ГБ)
          </span>
          <span className="flex items-center gap-1.5 text-purple-400">
            <span className="w-3 h-1 bg-purple-400 rounded-full inline-block"></span>
            API RPS (правая ось)
          </span>
          <span className="flex items-center gap-1.5 text-sky-400">
            <span className="w-3 h-0.5 border-t border-dashed border-sky-400 inline-block"></span>
            Линейный тренд
          </span>
          <span className="flex items-center gap-1.5 text-rose-400">
            <span className="w-3 h-0.5 border-t border-dashed border-rose-500 inline-block"></span>
            Квота тенанта
          </span>
        </div>
        <div className="text-[10px] text-neutral-400 flex items-center gap-1">
          <Info className="w-3 h-3 text-neutral-400" />
          Данные агрегируются через Prometheus TSDB & Garage S3 Telemetry
        </div>
      </div>
    </div>
  );
};
