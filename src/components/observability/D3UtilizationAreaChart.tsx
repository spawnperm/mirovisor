import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ResourceUtilizationPoint } from '../../types';

interface D3UtilizationAreaChartProps {
  data: ResourceUtilizationPoint[];
  metricKey: 'cpuPercent' | 'memoryUsedMb' | 'storageUsedGb' | 'iops';
  limitKey?: 'cpuLimitCores' | 'memoryLimitMb' | 'storageLimitGb';
  title: string;
  unit: string;
  gradientColorStart: string;
  gradientColorEnd: string;
  strokeColor: string;
  limitLabel?: string;
  height?: number;
}

export const D3UtilizationAreaChart: React.FC<D3UtilizationAreaChartProps> = ({
  data,
  metricKey,
  limitKey,
  title,
  unit,
  gradientColorStart,
  gradientColorEnd,
  strokeColor,
  limitLabel = 'Лимит квоты',
  height = 240,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const containerWidth = svgRef.current.clientWidth || 500;
    const margin = { top: 20, right: 24, bottom: 35, left: 45 };
    const width = containerWidth - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    if (width <= 0 || chartHeight <= 0) return;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale
    const x = d3
      .scalePoint<string>()
      .domain(data.map((d) => d.timeLabel))
      .range([0, width])
      .padding(0.1);

    // Compute Y domain
    const maxVal = d3.max(data, (d) => Number(d[metricKey])) || 100;
    const limitVal = limitKey ? d3.max(data, (d) => Number(d[limitKey])) || 0 : 0;
    const yMax = Math.max(maxVal, limitVal) * 1.15;

    // Y Scale
    const y = d3
      .scaleLinear()
      .domain([0, yMax])
      .nice()
      .range([chartHeight, 0]);

    // Define unique gradient ID
    const gradientId = `gradient-${metricKey}-${Math.random().toString(36).substring(2, 7)}`;
    const defs = svg.append('defs');
    const linearGradient = defs
      .append('linearGradient')
      .attr('id', gradientId)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    linearGradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', gradientColorStart)
      .attr('stop-opacity', 0.45);

    linearGradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', gradientColorEnd)
      .attr('stop-opacity', 0.02);

    // Background horizontal grid lines
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(y)
          .ticks(5)
          .tickSize(-width)
          .tickFormat(() => '')
      )
      .call((gGroup) => gGroup.select('.domain').remove())
      .call((gGroup) =>
        gGroup
          .selectAll('.tick line')
          .attr('stroke', '#262626')
          .attr('stroke-dasharray', '3 3')
      );

    // Area Generator
    const area = d3
      .area<ResourceUtilizationPoint>()
      .x((d) => x(d.timeLabel) || 0)
      .y0(chartHeight)
      .y1((d) => y(Number(d[metricKey])))
      .curve(d3.curveMonotoneX);

    // Line Generator
    const line = d3
      .line<ResourceUtilizationPoint>()
      .x((d) => x(d.timeLabel) || 0)
      .y((d) => y(Number(d[metricKey])))
      .curve(d3.curveMonotoneX);

    // Render Area
    g.append('path')
      .datum(data)
      .attr('fill', `url(#${gradientId})`)
      .attr('d', area);

    // Render Line
    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', strokeColor)
      .attr('stroke-width', 2.2)
      .attr('d', line);

    // Render Optional Quota Limit Line
    if (limitKey && limitVal > 0) {
      g.append('line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', y(limitVal))
        .attr('y2', y(limitVal))
        .attr('stroke', '#f43f5e')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '5 4')
        .attr('opacity', 0.85);

      g.append('text')
        .attr('x', width - 6)
        .attr('y', y(limitVal) - 6)
        .attr('text-anchor', 'end')
        .attr('fill', '#fb7185')
        .attr('font-size', '10px')
        .attr('font-family', 'monospace')
        .text(`${limitLabel}: ${limitVal} ${unit}`);
    }

    // Render Data Circles
    const dots = g
      .selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', (d) => x(d.timeLabel) || 0)
      .attr('cy', (d) => y(Number(d[metricKey])))
      .attr('r', 3)
      .attr('fill', strokeColor)
      .attr('stroke', '#0a0a0a')
      .attr('stroke-width', 1.5)
      .style('cursor', 'pointer');

    // Tooltip overlay interactions
    const tooltip = d3.select(tooltipRef.current);

    dots
      .on('mouseenter', function (event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('r', 6)
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 2);

        const [mouseX, mouseY] = d3.pointer(event, svgRef.current);
        const val = Number(d[metricKey]);

        tooltip
          .style('opacity', '1')
          .style('left', `${mouseX + 15}px`)
          .style('top', `${mouseY - 20}px`)
          .html(`
            <div class="font-bold text-white mb-0.5 text-[11px]">${d.timeLabel} (${new Date(d.timestamp).toLocaleDateString()})</div>
            <div class="text-cyan-400 font-mono text-xs font-semibold">${title}: ${val} ${unit}</div>
            ${limitKey ? `<div class="text-rose-400 font-mono text-[10px]">Лимит: ${d[limitKey]} ${unit}</div>` : ''}
            <div class="text-neutral-400 font-mono text-[10px] mt-1">Подов: ${d.activePods} · IOPS: ${d.iops}</div>
          `);
      })
      .on('mouseleave', function () {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('r', 3)
          .attr('stroke', '#0a0a0a')
          .attr('stroke-width', 1.5);

        tooltip.style('opacity', '0');
      });

    // Render X Axis
    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(
        d3
          .axisBottom(x)
          .tickValues(
            data
              .map((d) => d.timeLabel)
              .filter((_, idx) => idx % 3 === 0 || idx === data.length - 1)
          )
      )
      .call((gGroup) => gGroup.select('.domain').attr('stroke', '#333333'))
      .call((gGroup) =>
        gGroup
          .selectAll('text')
          .attr('fill', '#a3a3a3')
          .attr('font-size', '10px')
          .attr('font-family', 'monospace')
      );

    // Render Y Axis
    g.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .call((gGroup) => gGroup.select('.domain').attr('stroke', '#333333'))
      .call((gGroup) =>
        gGroup
          .selectAll('text')
          .attr('fill', '#a3a3a3')
          .attr('font-size', '10px')
          .attr('font-family', 'monospace')
      );
  }, [data, metricKey, limitKey, height, strokeColor, gradientColorStart, gradientColorEnd, title, unit, limitLabel]);

  return (
    <div className="relative w-full overflow-hidden bg-neutral-900/60 border border-neutral-800 rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">{title}</h4>
          <span className="text-[10px] text-neutral-400 font-mono">Тренд потребления за 24ч (D3.js)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] font-mono text-neutral-300">
            <span className="w-2.5 h-0.5 rounded" style={{ backgroundColor: strokeColor }} />
            Факт
          </span>
          {limitKey && (
            <span className="flex items-center gap-1 text-[10px] font-mono text-rose-400">
              <span className="w-2.5 h-0.5 bg-rose-500 rounded border border-rose-400" />
              Лимит
            </span>
          )}
        </div>
      </div>

      <div className="relative w-full" style={{ height: `${height}px` }}>
        <svg ref={svgRef} className="w-full h-full overflow-visible" />
        <div
          ref={tooltipRef}
          className="pointer-events-none absolute z-50 px-2.5 py-1.5 bg-neutral-950/95 border border-neutral-700 rounded-lg shadow-2xl transition-opacity duration-150 opacity-0 backdrop-blur-md"
        />
      </div>
    </div>
  );
};
