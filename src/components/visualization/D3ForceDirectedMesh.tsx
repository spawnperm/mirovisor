import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  Building, 
  Boxes, 
  Server, 
  Activity, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Play, 
  Pause, 
  RotateCcw, 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink,
  Layers,
  ShieldCheck,
  Cpu,
  Database,
  Radio,
  Zap
} from 'lucide-react';
import { Tenant } from '../../types';

export interface MeshNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: 'tenant' | 'plugin' | 'infra';
  subtype: string;
  radius: number;
  status: 'healthy' | 'warning' | 'active';
  metrics: { label: string; value: string };
  description: string;
  meta?: any;
}

export interface MeshLink extends d3.SimulationLinkDatum<MeshNode> {
  source: string | MeshNode;
  target: string | MeshNode;
  relation: string;
  protocol?: string;
  trafficIntensity?: 'high' | 'medium' | 'low';
}

interface D3ForceDirectedMeshProps {
  tenants: Tenant[];
  activeTenant: Tenant;
  onSelectTenant?: (tenant: Tenant) => void;
  onSelectEntity?: (type: string, id: string) => void;
}

export const D3ForceDirectedMesh: React.FC<D3ForceDirectedMeshProps> = ({
  tenants,
  activeTenant,
  onSelectTenant,
  onSelectEntity,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const simulationRef = useRef<d3.Simulation<MeshNode, MeshLink> | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const [selectedNode, setSelectedNode] = useState<MeshNode | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'tenant' | 'plugin' | 'infra'>('all');
  const [isPhysicsRunning, setIsPhysicsRunning] = useState<boolean>(true);
  const [pulseCount, setPulseCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fixed set of Backstage Plugins
  const defaultPlugins = useMemo(() => [
    { id: 'plugin_gauzy', name: 'Ever Gauzy CRM/ERP', subtype: 'Backstage Plugin', radius: 22, status: 'healthy', metrics: { label: 'Deals', value: '4 активных' }, description: 'Модуль управления сделками, воронкой продаж и рабочим временем.' },
    { id: 'plugin_univer', name: 'Univer Office (MCP)', subtype: 'Backstage Plugin', radius: 22, status: 'healthy', metrics: { label: 'Sheets', value: 'MCP harness' }, description: 'Электронные таблицы Univer со шлюзом Model Context Protocol.' },
    { id: 'plugin_cordis', name: 'Cordis Multi-Agent Core', subtype: 'AI Runtime', radius: 25, status: 'active', metrics: { label: 'Agents', value: '6 Live' }, description: 'Мультиагентный анализ телеметрии: Security, DevOps, Architecture, Tests.' },
    { id: 'plugin_security', name: 'Security Center (ASVS)', subtype: 'DevSecOps Gate', radius: 24, status: 'healthy', metrics: { label: 'ASVS', value: 'L2 Verified' }, description: 'Центр безопасности: SAST (CodeQL), SCA (Trivy), Secrets (Gitleaks).' },
    { id: 'plugin_observability', name: 'Observability & Metrics', subtype: 'Telemetry Dashboard', radius: 22, status: 'healthy', metrics: { label: 'Prometheus', value: '99.98%' }, description: 'Дашборды Prometheus и логи Loki с мультитенантным разделением.' },
    { id: 'plugin_webcontainers', name: 'WebContainers Sandbox', subtype: 'DevTools IDE', radius: 21, status: 'healthy', metrics: { label: 'Runtimes', value: 'Node.js 20' }, description: 'Изолированная среда выполнения в браузере для тестирования плагинов.' },
    { id: 'plugin_social', name: 'Community Activity Feed', subtype: 'Social Layer', radius: 20, status: 'healthy', metrics: { label: 'Posts', value: '18 в ленте' }, description: 'Мультитенантная лента сообщений с fan-out на Redis и NATS.' },
    { id: 'plugin_lms', name: 'LMS Корпоративный Университет', subtype: 'Education LMS', radius: 20, status: 'healthy', metrics: { label: 'Courses', value: '4 курса' }, description: 'Обучающие курсы с привязкой сертификатов к ролям в тенантах.' },
  ], []);

  // Shared Infrastructure Resources
  const infraResources = useMemo(() => [
    { id: 'infra_postgres', name: 'PostgreSQL 16 Cluster', subtype: 'RDBMS (Schemas)', radius: 32, status: 'healthy', metrics: { label: 'Schemas', value: `${tenants.length} + sys` }, description: 'Реляционная СУБД с изоляцией Schema-per-Tenant и политиками FORCE RLS.' },
    { id: 'infra_nats', name: 'NATS JetStream 2.10', subtype: 'Event Broker', radius: 30, status: 'warning', metrics: { label: 'Quota', value: '72% max_bytes' }, description: 'Центральная шина событий, логов сборки и очередей AI-агентов.' },
    { id: 'infra_redis', name: 'Redis 7 Cluster', subtype: 'In-Memory Cache', radius: 28, status: 'healthy', metrics: { label: 'Memory', value: '280 MB' }, description: 'Кэширование сессий пользователей, RBAC прав и fan-out лент сообщества.' },
    { id: 'infra_s3', name: 'Garage S3 Object Storage', subtype: 'Distributed S3', radius: 28, status: 'healthy', metrics: { label: 'Quota', value: '38 GB used' }, description: 'Распределенное S3-хранилище вложений, артефактов и документов Univer.' },
    { id: 'infra_traefik', name: 'Traefik v3 Ingress Proxy', subtype: 'Reverse Proxy', radius: 26, status: 'healthy', metrics: { label: 'TLS', value: 'TLS 1.3 / mTLS' }, description: 'Пограничный прокси, CrowdSec AppSec WAF и маршрутизация тенантов.' },
    { id: 'infra_prom', name: 'Prometheus & Loki Stack', subtype: 'Monitoring Engine', radius: 26, status: 'healthy', metrics: { label: 'Retention', value: '15d' }, description: 'Сбор метрик RED/USE и распределенная мультитенантная телеметрия.' },
  ], [tenants.length]);

  // Generate full Graph Nodes and Links
  const { initialNodes, initialLinks } = useMemo(() => {
    const nodes: MeshNode[] = [];
    const links: MeshLink[] = [];

    // 1. Add Tenants
    tenants.forEach((t) => {
      const isCurrentActive = t.id === activeTenant.id;
      nodes.push({
        id: t.id,
        name: t.name,
        type: 'tenant',
        subtype: t.tier ? `Тенант (${t.tier})` : 'Тенант',
        radius: isCurrentActive ? 28 : 24,
        status: 'healthy',
        metrics: {
          label: 'Storage',
          value: `${t.storageUsedMb}/${t.storageQuotaMb}MB`,
        },
        description: t.description || `Схема БД: ${t.schema}`,
        meta: t,
      });

      // Tenant to PostgreSQL (schema link)
      links.push({
        source: t.id,
        target: 'infra_postgres',
        relation: `schema: ${t.schema}`,
        protocol: 'TCP / RLS',
        trafficIntensity: isCurrentActive ? 'high' : 'medium',
      });

      // Tenant to Garage S3
      links.push({
        source: t.id,
        target: 'infra_s3',
        relation: 's3 bucket',
        protocol: 'HTTPS S3',
        trafficIntensity: 'low',
      });

      // Tenant to Traefik
      links.push({
        source: t.id,
        target: 'infra_traefik',
        relation: `${t.slug}.mirovisor.io`,
        protocol: 'HTTPS / WSS',
        trafficIntensity: isCurrentActive ? 'high' : 'medium',
      });
    });

    // 2. Add Plugins
    defaultPlugins.forEach((p) => {
      nodes.push({
        id: p.id,
        name: p.name,
        type: 'plugin',
        subtype: p.subtype,
        radius: p.radius,
        status: p.status as any,
        metrics: p.metrics,
        description: p.description,
      });
    });

    // 3. Add Infrastructure
    infraResources.forEach((r) => {
      nodes.push({
        id: r.id,
        name: r.name,
        type: 'infra',
        subtype: r.subtype,
        radius: r.radius,
        status: r.status as any,
        metrics: r.metrics,
        description: r.description,
      });
    });

    // 4. Links: Tenants to Plugins (who uses what)
    // Active Tenant connects to primary plugins
    links.push({ source: activeTenant.id, target: 'plugin_gauzy', relation: 'активен', trafficIntensity: 'high' });
    links.push({ source: activeTenant.id, target: 'plugin_univer', relation: 'активен', trafficIntensity: 'high' });
    links.push({ source: activeTenant.id, target: 'plugin_cordis', relation: 'агенты', trafficIntensity: 'high' });
    links.push({ source: activeTenant.id, target: 'plugin_security', relation: 'сканирование', trafficIntensity: 'medium' });

    // Connect other tenants to some plugins
    tenants.forEach((t, idx) => {
      if (t.id === activeTenant.id) return;
      if (idx % 2 === 0) {
        links.push({ source: t.id, target: 'plugin_observability', relation: 'метрики', trafficIntensity: 'low' });
      } else {
        links.push({ source: t.id, target: 'plugin_social', relation: 'сообщество', trafficIntensity: 'low' });
      }
    });

    // 5. Links: Plugins to Infrastructure
    links.push({ source: 'plugin_gauzy', target: 'infra_postgres', relation: 'crm_entities', protocol: 'SQL', trafficIntensity: 'high' });
    links.push({ source: 'plugin_gauzy', target: 'infra_redis', relation: 'cache', protocol: 'RESP', trafficIntensity: 'medium' });
    links.push({ source: 'plugin_univer', target: 'infra_s3', relation: 'worksheets', protocol: 'S3 API', trafficIntensity: 'high' });
    links.push({ source: 'plugin_cordis', target: 'infra_nats', relation: 'BuildCompleted', protocol: 'NATS JS', trafficIntensity: 'high' });
    links.push({ source: 'plugin_cordis', target: 'infra_postgres', relation: 'kanban_cards', protocol: 'SQL', trafficIntensity: 'medium' });
    links.push({ source: 'plugin_security', target: 'infra_nats', relation: 'sec_events', protocol: 'NATS', trafficIntensity: 'medium' });
    links.push({ source: 'plugin_security', target: 'infra_traefik', relation: 'waf_rules', protocol: 'mTLS', trafficIntensity: 'low' });
    links.push({ source: 'plugin_observability', target: 'infra_prom', relation: 'telemetry_scrape', protocol: 'HTTP', trafficIntensity: 'high' });
    links.push({ source: 'plugin_social', target: 'infra_redis', relation: 'fan_out_timeline', protocol: 'Redis PubSub', trafficIntensity: 'high' });
    links.push({ source: 'plugin_social', target: 'infra_nats', relation: 'user_activities', protocol: 'NATS', trafficIntensity: 'medium' });
    links.push({ source: 'plugin_webcontainers', target: 'infra_traefik', relation: 'coop_coep_headers', protocol: 'HTTP/2', trafficIntensity: 'low' });
    links.push({ source: 'plugin_lms', target: 'infra_postgres', relation: 'course_grades', protocol: 'SQL', trafficIntensity: 'low' });

    // 6. Links between Infra core
    links.push({ source: 'infra_traefik', target: 'infra_prom', relation: 'metrics_stream', protocol: 'Prom/HTTP', trafficIntensity: 'high' });
    links.push({ source: 'infra_nats', target: 'infra_prom', relation: 'queue_metrics', protocol: 'Prom/HTTP', trafficIntensity: 'medium' });

    return { initialNodes: nodes, initialLinks: links };
  }, [tenants, activeTenant, defaultPlugins, infraResources]);

  // Filter nodes based on search & category
  const filteredNodes = useMemo(() => {
    return initialNodes.filter((node) => {
      const matchesType = filterType === 'all' || node.type === filterType;
      const matchesSearch = !searchQuery.trim() || 
        node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.subtype.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [initialNodes, filterType, searchQuery]);

  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);

  const filteredLinks = useMemo(() => {
    return initialLinks.filter((link) => {
      const srcId = typeof link.source === 'object' ? (link.source as MeshNode).id : link.source;
      const tgtId = typeof link.target === 'object' ? (link.target as MeshNode).id : link.target;
      return filteredNodeIds.has(srcId) && filteredNodeIds.has(tgtId);
    });
  }, [initialLinks, filteredNodeIds]);

  // Real-time pulse interval to stimulate simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setPulseCount((c) => c + 1);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Main D3 Force Directed Graph Setup
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    const container = containerRef.current;
    const width = container.clientWidth || 960;
    const height = container.clientHeight || 560;

    svg.attr('viewBox', `0 0 ${width} ${height}`);
    svg.selectAll('*').remove();

    // Defs: Gradients, Glow filters, and Markers
    const defs = svg.append('defs');

    // Glow filter
    const filter = defs.append('filter').attr('id', 'meshGlow').attr('x', '-30%').attr('y', '-30%').attr('width', '160%').attr('height', '160%');
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'blur');
    filter.append('feMerge').selectAll('feMergeNode')
      .data(['blur', 'SourceGraphic'])
      .enter()
      .append('feMergeNode')
      .attr('in', (d) => d);

    // Arrow markers
    defs.append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 28)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#475569');

    defs.append('marker')
      .attr('id', 'arrow-active')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 30)
      .attr('refY', 0)
      .attr('markerWidth', 7)
      .attr('markerHeight', 7)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#06b6d4');

    // Root zoom group
    const g = svg.append('g').attr('class', 'mesh-zoom-group');

    // Zoom behavior
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoomBehavior);
    zoomBehaviorRef.current = zoomBehavior;

    // Clone data for D3 mutation
    const nodesData: MeshNode[] = filteredNodes.map((n) => ({ ...n }));
    const linksData: MeshLink[] = filteredLinks.map((l) => ({
      ...l,
      source: typeof l.source === 'object' ? (l.source as MeshNode).id : l.source,
      target: typeof l.target === 'object' ? (l.target as MeshNode).id : l.target,
    }));

    // Setup Force Simulation
    const simulation = d3.forceSimulation<MeshNode, MeshLink>(nodesData)
      .force(
        'link',
        d3.forceLink<MeshNode, MeshLink>(linksData)
          .id((d) => d.id)
          .distance((d) => {
            const src = d.source as MeshNode;
            const tgt = d.target as MeshNode;
            if (src.type === 'infra' || tgt.type === 'infra') return 160;
            return 110;
          })
          .strength(0.4)
      )
      .force('charge', d3.forceManyBody().strength((d: any) => (d.type === 'infra' ? -520 : -320)))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<MeshNode>().radius((d) => d.radius + 18).iterations(2));

    simulationRef.current = simulation;

    // Draw Links
    const linkGroup = g.append('g').attr('class', 'links');
    const link = linkGroup
      .selectAll('line')
      .data(linksData)
      .enter()
      .append('line')
      .attr('stroke', (d) => (d.trafficIntensity === 'high' ? '#0891b2' : '#334155'))
      .attr('stroke-width', (d) => (d.trafficIntensity === 'high' ? 2 : 1.2))
      .attr('stroke-opacity', 0.6)
      .attr('stroke-dasharray', (d) => (d.trafficIntensity === 'high' ? '4 2' : 'none'))
      .attr('marker-end', (d) => (d.trafficIntensity === 'high' ? 'url(#arrow-active)' : 'url(#arrow)'));

    // Link labels (relationship names)
    const linkText = linkGroup
      .selectAll('text')
      .data(linksData)
      .enter()
      .append('text')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .attr('fill', '#64748b')
      .attr('text-anchor', 'middle')
      .text((d) => d.relation || '');

    // Draw Nodes
    const nodeGroup = g.append('g').attr('class', 'nodes');
    const node = nodeGroup
      .selectAll('g')
      .data(nodesData)
      .enter()
      .append('g')
      .attr('class', 'node-item')
      .style('cursor', 'pointer');

    // Drag behavior
    const dragBehavior = d3.drag<SVGGElement, MeshNode>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    node.call(dragBehavior as any);

    // Node Outer Pulsing Halo (for active tenant or active infra)
    node
      .filter((d) => d.id === activeTenant.id || d.status === 'active')
      .append('circle')
      .attr('r', (d) => d.radius + 8)
      .attr('fill', 'none')
      .attr('stroke', (d) => (d.id === activeTenant.id ? '#06b6d4' : '#a855f7'))
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.5)
      .attr('stroke-dasharray', '3 3')
      .attr('class', 'animate-spin');

    // Node Base Circle
    node
      .append('circle')
      .attr('r', (d) => d.radius)
      .attr('fill', (d) => {
        if (d.type === 'tenant') return d.id === activeTenant.id ? '#083344' : '#0f172a';
        if (d.type === 'plugin') return '#1e1b4b';
        return '#022c22'; // infra
      })
      .attr('stroke', (d) => {
        if (d.id === activeTenant.id) return '#22d3ee';
        if (d.type === 'tenant') return '#0284c7';
        if (d.type === 'plugin') return '#818cf8';
        return '#10b981'; // infra
      })
      .attr('stroke-width', (d) => (d.id === activeTenant.id ? 2.5 : 1.8))
      .attr('filter', (d) => (d.id === activeTenant.id || d.type === 'infra' ? 'url(#meshGlow)' : null));

    // Status Indicator Dot
    node
      .append('circle')
      .attr('cx', (d) => d.radius * 0.7)
      .attr('cy', (d) => -d.radius * 0.7)
      .attr('r', 4)
      .attr('fill', (d) => {
        if (d.status === 'healthy') return '#34d399';
        if (d.status === 'warning') return '#fbbf24';
        return '#c084fc';
      })
      .attr('stroke', '#090d16')
      .attr('stroke-width', 1.5);

    // Node Glyphs / Letter
    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', (d) => (d.type === 'infra' ? '12px' : '10px'))
      .attr('font-weight', 'bold')
      .attr('font-family', 'sans-serif')
      .attr('fill', (d) => {
        if (d.id === activeTenant.id) return '#38bdf8';
        if (d.type === 'tenant') return '#7dd3fc';
        if (d.type === 'plugin') return '#c7d2fe';
        return '#6ee7b7';
      })
      .text((d) => {
        if (d.type === 'tenant') return '🏢';
        if (d.type === 'plugin') return '🧩';
        return '⚡';
      });

    // Node Title label under circle
    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', (d) => d.radius + 14)
      .attr('font-size', '10px')
      .attr('font-weight', '600')
      .attr('font-family', 'sans-serif')
      .attr('fill', (d) => (d.id === activeTenant.id ? '#38bdf8' : '#e2e8f0'))
      .text((d) => {
        const title = d.name;
        return title.length > 16 ? title.substring(0, 15) + '…' : title;
      });

    // Subtitle type
    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', (d) => d.radius + 25)
      .attr('font-size', '8px')
      .attr('font-family', 'monospace')
      .attr('fill', '#94a3b8')
      .text((d) => d.subtype);

    // Node click handler: interactive highlighting and inspection
    node.on('click', (event, d) => {
      event.stopPropagation();
      setSelectedNode(d);
    });

    svg.on('click', () => {
      setSelectedNode(null);
    });

    // Simulation tick handler
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      linkText
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2 - 4);

      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [filteredNodes, filteredLinks, activeTenant.id, pulseCount]);

  // Dynamic interactive node & link highlighting effect when selectedNode changes
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    if (!selectedNode) {
      // Reset all to default opacity and vibrant styles
      svg.selectAll('.node-item')
        .transition().duration(200)
        .style('opacity', 1);

      svg.selectAll('.node-item circle')
        .attr('stroke-width', (d: any) => (d.id === activeTenant.id ? 2.5 : 1.8));

      svg.selectAll('.links line')
        .transition().duration(200)
        .attr('stroke-opacity', 0.6)
        .attr('stroke-width', (d: any) => (d.trafficIntensity === 'high' ? 2 : 1.2));

      svg.selectAll('.links text')
        .transition().duration(200)
        .style('opacity', 1);

      return;
    }

    // Determine the set of connected node IDs (direct connections and 2nd degree infra if clicked node is tenant)
    const connectedIds = new Set<string>();
    connectedIds.add(selectedNode.id);

    // 1st pass: find all directly connected targets/sources from filteredLinks
    const directConnected = new Set<string>();
    filteredLinks.forEach((link) => {
      const srcId = typeof link.source === 'object' ? (link.source as MeshNode).id : (link.source as string);
      const tgtId = typeof link.target === 'object' ? (link.target as MeshNode).id : (link.target as string);

      if (srcId === selectedNode.id) {
        directConnected.add(tgtId);
        connectedIds.add(tgtId);
      } else if (tgtId === selectedNode.id) {
        directConnected.add(srcId);
        connectedIds.add(srcId);
      }
    });

    // If a tenant node is selected, also include infrastructure resources connected through its plugins!
    if (selectedNode.type === 'tenant') {
      filteredLinks.forEach((link) => {
        const srcId = typeof link.source === 'object' ? (link.source as MeshNode).id : (link.source as string);
        const tgtId = typeof link.target === 'object' ? (link.target as MeshNode).id : (link.target as string);

        if (directConnected.has(srcId)) {
          connectedIds.add(tgtId);
        } else if (directConnected.has(tgtId)) {
          connectedIds.add(srcId);
        }
      });
    }

    // Apply dimming / highlighting to Nodes
    svg.selectAll('.node-item')
      .transition().duration(250)
      .style('opacity', (d: any) => (connectedIds.has(d.id) ? 1 : 0.15));

    svg.selectAll('.node-item')
      .filter((d: any) => d.id === selectedNode.id)
      .select('circle')
      .transition().duration(250)
      .attr('stroke-width', 4)
      .attr('stroke', '#38bdf8');

    // Apply highlighting to Links connected to the selected entity
    svg.selectAll('.links line')
      .transition().duration(250)
      .attr('stroke-opacity', (d: any) => {
        const srcId = typeof d.source === 'object' ? d.source.id : d.source;
        const tgtId = typeof d.target === 'object' ? d.target.id : d.target;
        return connectedIds.has(srcId) && connectedIds.has(tgtId) ? 0.95 : 0.05;
      })
      .attr('stroke-width', (d: any) => {
        const srcId = typeof d.source === 'object' ? d.source.id : d.source;
        const tgtId = typeof d.target === 'object' ? d.target.id : d.target;
        return connectedIds.has(srcId) && connectedIds.has(tgtId) ? 3 : 0.8;
      });

    // Link texts
    svg.selectAll('.links text')
      .transition().duration(250)
      .style('opacity', (d: any) => {
        const srcId = typeof d.source === 'object' ? d.source.id : d.source;
        const tgtId = typeof d.target === 'object' ? d.target.id : d.target;
        return connectedIds.has(srcId) && connectedIds.has(tgtId) ? 1 : 0.05;
      });
  }, [selectedNode, filteredLinks, activeTenant.id]);

  // Handle Zoom In / Out / Reset
  const handleZoom = (scaleFactor: number) => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(250).call(zoomBehaviorRef.current.scaleBy, scaleFactor);
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(350).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
  };

  const togglePhysics = () => {
    if (!simulationRef.current) return;
    if (isPhysicsRunning) {
      simulationRef.current.stop();
      setIsPhysicsRunning(false);
    } else {
      simulationRef.current.alpha(0.4).restart();
      setIsPhysicsRunning(true);
    }
  };

  const reheatSimulation = () => {
    if (!simulationRef.current) return;
    simulationRef.current.alpha(0.8).restart();
    setIsPhysicsRunning(true);
  };

  return (
    <div className="flex flex-col h-full w-full bg-neutral-950 relative overflow-hidden select-none">
      {/* Mesh Toolbar */}
      <div className="flex flex-wrap items-center justify-between p-2.5 px-4 bg-neutral-900/90 border-b border-neutral-800 gap-3 z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white tracking-wide flex items-center gap-2">
              D3.js СИЛОВОЙ ГРАФ СВЯЗЕЙ (FORCE-DIRECTED MESH)
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
                REAL-TIME D3 V7
              </span>
            </h3>
            <div className="text-[11px] text-neutral-400 flex items-center gap-2 mt-0.5">
              <span>Узлов: <strong className="text-white">{filteredNodes.length}</strong></span>
              <span>·</span>
              <span>Связей: <strong className="text-white">{filteredLinks.length}</strong></span>
              <span>·</span>
              <span>Активный тенант: <strong className="text-cyan-400">{activeTenant.name}</strong></span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 rounded font-medium transition-all ${
              filterType === 'all'
                ? 'bg-neutral-800 text-white font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Все ({initialNodes.length})
          </button>
          <button
            onClick={() => setFilterType('tenant')}
            className={`px-2.5 py-1 rounded font-medium transition-all flex items-center gap-1 ${
              filterType === 'tenant'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold'
                : 'text-neutral-400 hover:text-cyan-300'
            }`}
          >
            <Building className="w-3 h-3" />
            <span>Тенанты ({tenants.length})</span>
          </button>
          <button
            onClick={() => setFilterType('plugin')}
            className={`px-2.5 py-1 rounded font-medium transition-all flex items-center gap-1 ${
              filterType === 'plugin'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold'
                : 'text-neutral-400 hover:text-purple-300'
            }`}
          >
            <Boxes className="w-3 h-3" />
            <span>Плагины ({defaultPlugins.length})</span>
          </button>
          <button
            onClick={() => setFilterType('infra')}
            className={`px-2.5 py-1 rounded font-medium transition-all flex items-center gap-1 ${
              filterType === 'infra'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold'
                : 'text-neutral-400 hover:text-emerald-300'
            }`}
          >
            <Server className="w-3 h-3" />
            <span>Инфраструктура ({infraResources.length})</span>
          </button>
        </div>

        {/* Physics & Zoom Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={togglePhysics}
            className={`p-1.5 rounded-lg border text-xs transition-colors flex items-center gap-1 ${
              isPhysicsRunning
                ? 'bg-neutral-900 border-neutral-700 text-neutral-200 hover:bg-neutral-800'
                : 'bg-amber-500/20 border-amber-500/40 text-amber-300 font-semibold'
            }`}
            title={isPhysicsRunning ? 'Приостановить расчет физики' : 'Возобновить физику'}
          >
            {isPhysicsRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="text-[11px] font-mono hidden sm:inline">{isPhysicsRunning ? 'Пауза' : 'Пуск'}</span>
          </button>

          <button
            onClick={reheatSimulation}
            className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-300 hover:text-cyan-400 hover:border-cyan-500 transition-colors"
            title="Встряхнуть граф (Reheat simulation)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-neutral-800 mx-0.5" />

          <button
            onClick={() => handleZoom(1.2)}
            className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white"
            title="Увеличить"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleZoom(0.8)}
            className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white"
            title="Уменьшить"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white"
            title="Центрировать и сбросить масштаб"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div 
        ref={containerRef}
        className="flex-1 w-full h-full relative bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px]"
      >
        <svg 
          ref={svgRef} 
          className="w-full h-full cursor-grab active:cursor-grabbing block"
        />

        {/* Legend Overlay at Bottom-Left */}
        <div className="absolute bottom-4 left-4 p-3 bg-neutral-900/90 backdrop-blur-md rounded-xl border border-neutral-800 shadow-xl space-y-1.5 text-[11px] pointer-events-auto max-w-xs">
          <div className="font-bold text-neutral-200 uppercase tracking-wider text-[10px] flex items-center justify-between">
            <span>Легенда силового графа</span>
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          </div>
          <div className="flex items-center gap-2 text-neutral-300">
            <span className="w-3 h-3 rounded-full border border-cyan-400 bg-cyan-950/80 inline-block shrink-0" />
            <span><strong>Тенанты:</strong> изолированные схемы и квоты</span>
          </div>
          <div className="flex items-center gap-2 text-neutral-300">
            <span className="w-3 h-3 rounded-full border border-indigo-400 bg-indigo-950/80 inline-block shrink-0" />
            <span><strong>Плагины:</strong> расширения Backstage SDK</span>
          </div>
          <div className="flex items-center gap-2 text-neutral-300">
            <span className="w-3 h-3 rounded-full border border-emerald-400 bg-emerald-950/80 inline-block shrink-0" />
            <span><strong>Инфраструктура:</strong> PostgreSQL, NATS, Redis, S3</span>
          </div>
          <div className="pt-1 border-t border-neutral-800 text-[10px] text-neutral-400 font-mono">
            Кликните по узлу для инспекции связей. Перетаскивайте узлы мышью.
          </div>
        </div>

        {/* Node Inspector Drawer at Bottom-Right */}
        {selectedNode && (
          <div className="absolute top-4 right-4 w-80 bg-neutral-900/95 backdrop-blur-md rounded-2xl border border-neutral-750 p-4 shadow-2xl space-y-3 pointer-events-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`p-2 rounded-xl border ${
                    selectedNode.type === 'tenant'
                      ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                      : selectedNode.type === 'plugin'
                      ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  }`}
                >
                  {selectedNode.type === 'tenant' && <Building className="w-5 h-5" />}
                  {selectedNode.type === 'plugin' && <Boxes className="w-5 h-5" />}
                  {selectedNode.type === 'infra' && <Server className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white leading-tight">{selectedNode.name}</h4>
                  <span className="text-[10px] font-mono text-neutral-400">{selectedNode.subtype}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-neutral-400 hover:text-white p-1 rounded hover:bg-neutral-800"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">{selectedNode.description}</p>

            <div className="p-2.5 rounded-lg bg-neutral-950/80 border border-neutral-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Статус узла:</span>
                <span className="font-mono font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {selectedNode.status.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">{selectedNode.metrics.label}:</span>
                <span className="font-mono font-bold text-white">{selectedNode.metrics.value}</span>
              </div>
            </div>

            {/* Actions depending on node type */}
            <div className="pt-1 flex flex-col gap-1.5">
              {selectedNode.type === 'tenant' && selectedNode.meta && (
                <button
                  onClick={() => {
                    if (onSelectTenant) onSelectTenant(selectedNode.meta);
                    setSelectedNode(null);
                  }}
                  className="w-full py-1.5 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <Building className="w-3.5 h-3.5" />
                  <span>Переключиться на этот тенант</span>
                </button>
              )}

              {selectedNode.type === 'plugin' && (
                <button
                  onClick={() => {
                    if (onSelectEntity) onSelectEntity('plugin', selectedNode.id);
                  }}
                  className="w-full py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <Boxes className="w-3.5 h-3.5" />
                  <span>Открыть манифест плагина</span>
                </button>
              )}

              {selectedNode.type === 'infra' && (
                <div className="text-[11px] font-mono text-neutral-400 text-center py-1">
                  ⚡ Общий инфраструктурный ресурс платформы
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
