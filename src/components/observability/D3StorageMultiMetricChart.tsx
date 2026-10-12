import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ResourceUtilizationPoint } from '../../types';

interface D3StorageMultiMetricChartProps {
  data: ResourceUtilizationPoint[];
  height?: number;
}

export const D3StorageMultiMetricChart: React.FC<D3StorageMultiMetricChartProps> = ({
  data,
  height = 240,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const containerWidth = svgRef.current.clientWidth || 500;
    const margin = { top: 20, right: 55, bottom: 35, left: 45 };
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

    // Left Y Scale (Storage GB)
    const maxStorage = d3.max(data, (d) => Math.max(d.storageUsedGb, d.storageLimitGb)) || 50;
    const yStorage = d3
      .scaleLinear()
      .domain([0, maxStorage * 1.15])
      .nice()
      .range([chartHeight, 0]);

    // Right Y Scale (IOPS)
    const maxIops = d3.max(data, (d) => d.iops) || 500;
    const yIops = d3
      .scaleLinear()
      .domain([0, maxIops * 1.2])
      .nice()
      .range([chartHeight, 0]);

    // Grid lines for storage
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(yStorage)
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

    // Storage Area
    const storageArea = d3
      .area<ResourceUtilizationPoint>()
      .x((d) => x(d.timeLabel) || 0)
      .y0(chartHeight)
      .y1((d) => yStorage(d.storageUsedGb))
      .curve(d3.curveMonotoneX);

    // Gradient for Storage
    const gradId = 'storage-grad';
    const defs = svg.append('defs');
    const grad = defs
      .append('linearGradient')
      .attr('id', gradId)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    grad.append('stop').attr('offset', '0%').attr('stop-color', '#10b981').attr('stop-opacity', 0.4);
    grad.append('stop').attr('offset', '100%').attr('stop-color', '#059669').attr('stop-opacity', 0.02);

    g.append('path')
      .datum(data)
      .attr('fill', `url(#${gradId})`)
      .attr('d', storageArea);

    // Storage Line
    const storageLine = d3
      .line<ResourceUtilizationPoint>()
      .x((d) => x(d.timeLabel) || 0)
      .y((d) => yStorage(d.storageUsedGb))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#10b981')
      .attr('stroke-width', 2.2)
      .attr('d', storageLine);

    // Storage Quota Limit Line
    const quotaVal = data[0]?.storageLimitGb || 0;
    if (quotaVal > 0) {
      g.append('line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', yStorage(quotaVal))
        .attr('y2', yStorage(quotaVal))
        .attr('stroke', '#f43f5e')
        .attr('stroke-dasharray', '4 3')
        .attr('stroke-width', 1.5);

      g.append('text')
        .attr('x', width - 6)
        .attr('y', yStorage(quotaVal) - 6)
        .attr('text-anchor', 'end')
        .attr('fill', '#fb7185')
        .attr('font-size', '10px')
        .attr('font-family', 'monospace')
        .text(`Квота: ${quotaVal} GB`);
    }

    // IOPS Line (Secondary Axis)
    const iopsLine = d3
      .line<ResourceUtilizationPoint>()
      .x((d) => x(d.timeLabel) || 0)
      .y((d) => yIops(d.iops))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#f59e0b')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5 3')
      .attr('d', iopsLine);

    // IOPS Dots
    const dots = g
      .selectAll('.dot-iops')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', (d) => x(d.timeLabel) || 0)
      .attr('cy', (d) => yStorage(d.storageUsedGb))
      .attr('r', 3)
      .attr('fill', '#10b981')
      .attr('stroke', '#0a0a0a')
      .attr('stroke-width', 1.5)
      .style('cursor', 'pointer');

    // Tooltip
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

        tooltip
          .style('opacity', '1')
          .style('left', `${mouseX + 15}px`)
          .style('top', `${mouseY - 20}px`)
          .html(`
            <div class="font-bold text-white mb-0.5 text-[11px]">${d.timeLabel} (${new Date(d.timestamp).toLocaleDateString()})</div>
            <div class="text-emerald-400 font-mono text-xs font-semibold">Хранилище: ${d.storageUsedGb} GB / ${d.storageLimitGb} GB</div>
            <div class="text-amber-400 font-mono text-xs font-semibold">IOPS: ${d.iops} ops/s</div>
            <div class="text-cyan-400 font-mono text-[10px]">Трафик: ${d.bandwidthMbps} Mbps</div>
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

    // Left Axis (Storage GB)
    g.append('g')
      .call(d3.axisLeft(yStorage).ticks(5))
      .call((gGroup) => gGroup.select('.domain').attr('stroke', '#333333'))
      .call((gGroup) =>
        gGroup
          .selectAll('text')
          .attr('fill', '#34d399')
          .attr('font-size', '10px')
          .attr('font-family', 'monospace')
      );

    // Right Axis (IOPS)
    g.append('g')
      .attr('transform', `translate(${width}, 0)`)
      .call(d3.axisRight(yIops).ticks(5))
      .call((gGroup) => gGroup.select('.domain').attr('stroke', '#333333'))
      .call((gGroup) =>
        gGroup
          .selectAll('text')
          .attr('fill', '#fbbf24')
          .attr('font-size', '10px')
          .attr('font-family', 'monospace')
      );
  }, [data, height]);

  return (
    <div className="relative w-full overflow-hidden bg-neutral-900/60 border border-neutral-800 rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Хранилище & IOPS активности
          </h4>
          <span className="text-[10px] text-neutral-400 font-mono">
            Двухосевой график корреляции диска и операций ввода-вывода (D3.js)
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
            <span className="w-2.5 h-1 bg-emerald-500 rounded" />
            Хранилище (GB)
          </span>
          <span className="flex items-center gap-1 text-[10px] font-mono text-amber-400">
            <span className="w-2.5 h-0.5 bg-amber-500 rounded border-dashed" />
            IOPS (ops/s)
          </span>
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
