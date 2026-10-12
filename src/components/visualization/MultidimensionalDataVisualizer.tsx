import React, { useState, useMemo } from 'react';
import { 
  Network, 
  Layers, 
  ShieldCheck, 
  Cpu, 
  Database, 
  Activity, 
  Search, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Boxes,
  Zap,
  Radio
} from 'lucide-react';
import { Tenant, KanbanCard, SecurityFinding } from '../../types';
import { ActiveVoiceSession } from '../devtools/ActiveVoiceSession';
import { ConversationTurn } from '../devtools/VoiceControlModal';
import { VoiceMacro } from '../../types/macros';
import { D3ForceDirectedMesh } from './D3ForceDirectedMesh';

interface MultidimensionalVisualizerProps {
  tenants: Tenant[];
  activeTenant: Tenant;
  cards: KanbanCard[];
  securityFindings: SecurityFinding[];
  onSelectEntity?: (type: string, id: string) => void;
  onSelectTenant?: (tenant: Tenant) => void;
  voiceMemory?: ConversationTurn[];
  macros?: VoiceMacro[];
  onOpenVoice?: () => void;
  onOpenMacroRegistry?: () => void;
  onExecuteVoiceCommand?: (commandText: string) => void;
  onExecuteMacro?: (macro: VoiceMacro) => void;
}

type DimensionMode = 'force_mesh' | 'topology' | 'tenants_cluster' | 'agent_flow' | 'security_matrix';

interface GraphNode {
  id: string;
  name: string;
  layer: 'frontend' | 'api' | 'data' | 'ai' | 'security' | 'infra';
  type: string;
  x: number;
  y: number;
  status: 'healthy' | 'warning' | 'critical' | 'active';
  metrics?: { label: string; value: string };
  details: string;
}

interface GraphLink {
  source: string;
  target: string;
  label?: string;
  protocol?: string;
}

export const MultidimensionalDataVisualizer: React.FC<MultidimensionalVisualizerProps> = ({
  tenants,
  activeTenant,
  cards,
  securityFindings,
  onSelectEntity,
  onSelectTenant,
  voiceMemory,
  macros,
  onOpenVoice,
  onOpenMacroRegistry,
  onExecuteVoiceCommand,
  onExecuteMacro,
}) => {
  const [dimension, setDimension] = useState<DimensionMode>('force_mesh');
  const [zoom, setZoom] = useState<number>(1);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [filterLayer, setFilterLayer] = useState<string>('all');

  // Topology Nodes definition
  const topologyNodes: GraphNode[] = useMemo(() => [
    // Frontend
    { id: 'web_portal', name: 'UI TripleD (Next.js)', layer: 'frontend', type: 'Frontend App', x: 120, y: 150, status: 'healthy', metrics: { label: 'RPS', value: '480' }, details: 'Пользовательский интерфейс на Tailwind v4, Refine и Framer Motion' },
    { id: 'admin_panel', name: 'Refine Admin Console', layer: 'frontend', type: 'SuperAdmin UI', x: 120, y: 270, status: 'healthy', metrics: { label: 'Users', value: '14' }, details: 'Интерфейс суперадминистратора для управления тенантами и RBAC' },
    { id: 'devtools_ide', name: 'DevTools (WebContainers)', layer: 'frontend', type: 'Embedded IDE', x: 120, y: 390, status: 'healthy', metrics: { label: 'Sessions', value: '3' }, details: 'Встроенный терминал xterm.js и WebContainer Node.js sandbox' },

    // Ingress / Proxy
    { id: 'traefik_proxy', name: 'Traefik v3 Proxy', layer: 'infra', type: 'Reverse Proxy', x: 300, y: 260, status: 'healthy', metrics: { label: 'TLS', value: 'Let\'s Encrypt' }, details: 'Маршрутизация трафика, CrowdSec L7 middleware, Security headers' },

    // API Gateway / Backend
    { id: 'nest_api', name: 'NestJS Multi-Tenant Core', layer: 'api', type: 'Microservice Hub', x: 480, y: 200, status: 'healthy', metrics: { label: 'p95', value: '24ms' }, details: 'tRPC/REST API с TenantMiddleware и защитой Scoping' },
    { id: 'mcp_bridge', name: 'MCP Server Gateway', layer: 'ai', type: 'Cordis Bridge', x: 480, y: 340, status: 'healthy', metrics: { label: 'Tools', value: '18 active' }, details: 'Model Context Protocol мост к Gauzy CRM, Univer и Канбан-доске' },

    // Data Layer
    { id: 'pg_cluster', name: 'PostgreSQL 16 (Schemas)', layer: 'data', type: 'Relational DB', x: 680, y: 140, status: 'healthy', metrics: { label: 'Schemas', value: '4 + public' }, details: 'Изоляция Schema-per-Tenant с принудительной политикой RLS FORCE' },
    { id: 'redis_cluster', name: 'Redis 7 (Fan-Out Feed)', layer: 'data', type: 'In-Memory Cache', x: 680, y: 250, status: 'healthy', metrics: { label: 'Memory', value: '280MB' }, details: 'Fan-out on write лент новостей, RBAC кэш и сессии' },
    { id: 'nats_broker', name: 'NATS JetStream 2.10', layer: 'data', type: 'Message Broker', x: 680, y: 360, status: 'warning', metrics: { label: 'Quota', value: '72%' }, details: 'Шина событий: BuildCompleted, активности тенантов, перемещение карточек' },
    { id: 'garage_s3', name: 'Garage S3 Object Storage', layer: 'data', type: 'Distributed S3', x: 680, y: 470, status: 'healthy', metrics: { label: 'Capacity', value: '100GB' }, details: 'Распределённое хранилище вложений, артефактов и офисных файлов' },

    // AI Layer
    { id: 'cordis_engine', name: 'DeepSeek Harness & Cordis', layer: 'ai', type: 'Multi-Agent Runtime', x: 880, y: 220, status: 'active', metrics: { label: 'Agents', value: '6 Live' }, details: 'Цикл «Наблюдай → Предлагай → Решай → Внедряй» и генерация карточек' },
    { id: 'gemini_voice', name: 'Gemini Live Speech API', layer: 'ai', type: 'Voice Intelligence', x: 880, y: 340, status: 'healthy', metrics: { label: 'Latency', value: '180ms' }, details: 'Двунаправленный голосовой диалог, выполнение системных CLI команд' },

    // Security & Auth
    { id: 'authentik_idp', name: 'Authentik IdP (SSO)', layer: 'security', type: 'Identity Provider', x: 300, y: 430, status: 'healthy', metrics: { label: 'OIDC', value: 'v2024.8' }, details: 'Мультитенантная авторизация, группы тенантов и OAuth2 токены' },
    { id: 'crowdsec_appsec', name: 'CrowdSec L7 AppSec WAF', layer: 'security', type: 'Virtual Patching', x: 300, y: 110, status: 'healthy', metrics: { label: 'Banned IPs', value: '14' }, details: 'Виртуальный патчинг уязвимостей и блокировка атак до бэкенда' },
  ], []);

  const topologyLinks: GraphLink[] = useMemo(() => [
    { source: 'web_portal', target: 'traefik_proxy', protocol: 'HTTPS' },
    { source: 'admin_panel', target: 'traefik_proxy', protocol: 'HTTPS' },
    { source: 'devtools_ide', target: 'traefik_proxy', protocol: 'WSS' },
    { source: 'crowdsec_appsec', target: 'traefik_proxy', protocol: 'L7 Hook' },
    { source: 'traefik_proxy', target: 'nest_api', protocol: 'HTTP/2' },
    { source: 'traefik_proxy', target: 'authentik_idp', protocol: 'OIDC' },
    { source: 'nest_api', target: 'pg_cluster', label: 'RLS Context', protocol: 'SQL' },
    { source: 'nest_api', target: 'redis_cluster', protocol: 'RESP' },
    { source: 'nest_api', target: 'nats_broker', label: 'Pub/Sub', protocol: 'NATS' },
    { source: 'nest_api', target: 'garage_s3', protocol: 'S3 API' },
    { source: 'nest_api', target: 'mcp_bridge', protocol: 'JSON-RPC' },
    { source: 'mcp_bridge', target: 'cordis_engine', protocol: 'MCP' },
    { source: 'mcp_bridge', target: 'gemini_voice', protocol: 'WebSocket' },
    { source: 'nats_broker', target: 'cordis_engine', label: 'BuildCompleted', protocol: 'JetStream' },
  ], []);

  // Filtered nodes based on search and layer
  const filteredNodes = useMemo(() => {
    return topologyNodes.filter((node) => {
      const matchesSearch =
        node.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        node.type.toLowerCase().includes(searchFilter.toLowerCase()) ||
        node.details.toLowerCase().includes(searchFilter.toLowerCase());
      const matchesLayer = filterLayer === 'all' || node.layer === filterLayer;
      return matchesSearch && matchesLayer;
    });
  }, [topologyNodes, searchFilter, filterLayer]);

  const getNodeColor = (node: GraphNode) => {
    switch (node.layer) {
      case 'frontend':
        return '#38bdf8'; // sky
      case 'api':
        return '#818cf8'; // indigo
      case 'data':
        return '#34d399'; // emerald
      case 'ai':
        return '#c084fc'; // purple
      case 'security':
        return '#f87171'; // red/rose
      case 'infra':
        return '#fb923c'; // orange
      default:
        return '#94a3b8';
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl relative">
      {/* Top Controller Bar */}
      <div className="flex flex-wrap items-center justify-between p-3 bg-neutral-900/90 border-b border-neutral-800 gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              МНОГОМЕРНЫЙ ВИЗУАЛИЗАТОР «МИРОВИЗОР»
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-neutral-800 text-neutral-400 rounded">
                Live Topology
              </span>
            </h2>
            <div className="text-xs text-neutral-400 flex items-center gap-2">
              <span>Срез: {dimension}</span>
              <span>·</span>
              <span>Текущий тенант: <strong className="text-neutral-200">{activeTenant.name}</strong></span>
            </div>
          </div>
        </div>

        {/* Dimension Switcher */}
        <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs">
          <button
            onClick={() => setDimension('force_mesh')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              dimension === 'force_mesh'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            D3.js Силовой граф
          </button>
          <button
            onClick={() => setDimension('topology')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              dimension === 'topology'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            Сервисный меш
          </button>
          <button
            onClick={() => setDimension('tenants_cluster')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              dimension === 'tenants_cluster'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Кластер тенантов
          </button>
          <button
            onClick={() => setDimension('agent_flow')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              dimension === 'agent_flow'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Поток «Идеи → Работа»
          </button>
          <button
            onClick={() => setDimension('security_matrix')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              dimension === 'security_matrix'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Вектор безопасности
          </button>
        </div>

        {/* Zoom & Filters */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-500" />
            <input
              type="text"
              placeholder="Поиск по узлам..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-8 pr-2 py-1 bg-neutral-950 border border-neutral-800 rounded-md text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-cyan-500 w-36 lg:w-44"
            />
          </div>
          <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-md p-0.5">
            <button
              onClick={() => setZoom((z) => Math.min(1.6, z + 0.1))}
              className="p-1 text-neutral-400 hover:text-white"
              title="Увеличить"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}
              className="p-1 text-neutral-400 hover:text-white"
              title="Уменьшить"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-1 text-neutral-400 hover:text-white"
              title="Сброс масштаба"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Layer Filter Toolbar */}
      {dimension === 'topology' && (
        <div className="flex items-center gap-2 px-4 py-2 bg-neutral-900/40 border-b border-neutral-800/80 text-xs text-neutral-400 overflow-x-auto">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-500">Слои:</span>
          {['all', 'frontend', 'api', 'data', 'ai', 'security', 'infra'].map((layer) => (
            <button
              key={layer}
              onClick={() => setFilterLayer(layer)}
              className={`px-2 py-1 rounded transition-colors ${
                filterLayer === layer
                  ? 'bg-neutral-800 text-neutral-100 font-medium'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {layer.toUpperCase()}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> 13 узлов онлайн</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400"></span> NATS квота 72%</span>
          </div>
        </div>
      )}

      {/* Canvas / Visualization Surface */}
      <div className="relative flex-1 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] overflow-auto flex items-center justify-center p-0">
        {/* DIMENSION: D3 FORCE-DIRECTED MESH */}
        {dimension === 'force_mesh' && (
          <div className="w-full h-full absolute inset-0">
            <D3ForceDirectedMesh
              tenants={tenants}
              activeTenant={activeTenant}
              onSelectTenant={onSelectTenant}
              onSelectEntity={onSelectEntity}
            />
          </div>
        )}

        {/* DIMENSION: SERVICE MESH / TOPOLOGY */}
        {dimension === 'topology' && (
          <div
            className="transition-transform duration-200 origin-center relative w-[1040px] h-[580px] border border-neutral-800/50 rounded-2xl bg-neutral-950/60 backdrop-blur-sm shadow-inner"
            style={{ transform: `scale(${zoom})` }}
          >
            {/* SVG Link Connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <linearGradient id="linkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity="0.7" />
                </linearGradient>
              </defs>
              {topologyLinks.map((link, idx) => {
                const s = topologyNodes.find((n) => n.id === link.source);
                const t = topologyNodes.find((n) => n.id === link.target);
                if (!s || !t) return null;
                const isHighlighted = selectedNode && (selectedNode.id === s.id || selectedNode.id === t.id);

                return (
                  <g key={idx}>
                    <line
                      x1={s.x + 80}
                      y1={s.y + 24}
                      x2={t.x + 80}
                      y2={t.y + 24}
                      stroke={isHighlighted ? '#38bdf8' : '#334155'}
                      strokeWidth={isHighlighted ? 2.5 : 1.5}
                      strokeDasharray={link.label ? '4 3' : undefined}
                    />
                    {link.label && (
                      <text
                        x={(s.x + t.x) / 2 + 80}
                        y={(s.y + t.y) / 2 + 20}
                        fill="#94a3b8"
                        fontSize="9"
                        fontFamily="monospace"
                        textAnchor="middle"
                        className="bg-neutral-950"
                      >
                        {link.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Interactive Nodes */}
            {filteredNodes.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              const color = getNodeColor(node);

              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`absolute w-44 p-2.5 rounded-xl border transition-all cursor-pointer shadow-lg hover:scale-105 ${
                    isSelected
                      ? 'ring-2 ring-cyan-400 bg-neutral-900 border-cyan-500 shadow-cyan-500/20'
                      : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-600'
                  }`}
                  style={{
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="text-[10px] font-mono uppercase tracking-wider font-bold"
                      style={{ color }}
                    >
                      {node.layer}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        node.status === 'healthy'
                          ? 'bg-emerald-400'
                          : node.status === 'warning'
                          ? 'bg-amber-400 animate-pulse'
                          : node.status === 'active'
                          ? 'bg-purple-400 animate-ping'
                          : 'bg-rose-500'
                      }`}
                    />
                  </div>
                  <h4 className="text-xs font-semibold text-neutral-100 truncate">{node.name}</h4>
                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-neutral-800 text-[10px] text-neutral-400">
                    <span>{node.type}</span>
                    {node.metrics && (
                      <span className="font-mono text-neutral-300 font-medium">
                        {node.metrics.label}: {node.metrics.value}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* DIMENSION: MULTI-TENANT CLUSTER PROJECTION */}
        {dimension === 'tenants_cluster' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-5xl">
            {tenants.map((t) => {
              const isActive = t.id === activeTenant.id;
              const quotaUsagePct = Math.round((t.storageUsedMb / t.storageQuotaMb) * 100);

              return (
                <div
                  key={t.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-neutral-900 border-cyan-500 ring-1 ring-cyan-500 shadow-xl shadow-cyan-500/10'
                      : 'bg-neutral-900/70 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={t.avatarUrl}
                        alt={t.name}
                        className="w-8 h-8 rounded-lg object-cover border border-neutral-700"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-neutral-100">{t.name}</h4>
                        <span className="text-[10px] font-mono text-neutral-500">
                          schema: {t.schema}
                        </span>
                      </div>
                    </div>
                    {isActive && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/30">
                        ACTIVE
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-neutral-400 mb-4 line-clamp-2">{t.description}</p>

                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="flex justify-between text-neutral-400 text-[11px] mb-1">
                        <span>Garage S3 Диск</span>
                        <span className="font-mono">{t.storageUsedMb} / {t.storageQuotaMb} MB ({quotaUsagePct}%)</span>
                      </div>
                      <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${quotaUsagePct > 80 ? 'bg-amber-400' : 'bg-cyan-500'}`}
                          style={{ width: `${quotaUsagePct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-neutral-400 text-[11px] pt-2 border-t border-neutral-800">
                      <span>Участники:</span>
                      <span className="font-mono text-neutral-200">{t.memberCount} пользователей</span>
                    </div>

                    <div className="flex items-center justify-between text-neutral-400 text-[11px]">
                      <span>Видимость:</span>
                      <span className="font-mono capitalize text-neutral-300">{t.visibility}</span>
                    </div>

                    <div className="flex items-center justify-between text-neutral-400 text-[11px]">
                      <span>Политика RLS:</span>
                      <span className="font-mono text-emerald-400 font-semibold">FORCE ENABLED</span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {t.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] text-neutral-400 font-mono"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* DIMENSION: AGENT FLOW «НАБЛЮДАЙ → ПРЕДЛАГАЙ → РЕШАЙ → ВНЕДРЯЙ» */}
        {dimension === 'agent_flow' && (
          <div className="w-full max-w-5xl space-y-4">
            <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
              <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-purple-400" />
                Непрерывный цикл эволюции «Идеи → Работа»
              </h3>
              <p className="text-xs text-neutral-400">
                После каждого CI/CD запуска в NATS публикуется событие <code className="text-purple-300 font-mono">BuildCompleted</code>.
                6 специализированных агентов Cordis анализируют телеметрию и генерируют структурированные карточки на Канбан-доске.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="p-3 bg-neutral-900/80 border border-neutral-800 rounded-lg">
                <span className="text-[10px] font-mono text-cyan-400 font-bold block mb-1">ФАЗА 1</span>
                <h4 className="text-xs font-bold text-white mb-1">1. Наблюдение</h4>
                <p className="text-[11px] text-neutral-400">
                  Сбор сырых логов CI/CD, отчетов CodeQL, Snyk, ZAP, метрик Prometheus и долга DebtPilot.
                </p>
                <div className="mt-2 text-[10px] font-mono text-neutral-500">Event: NATS JetStream</div>
              </div>

              <div className="p-3 bg-neutral-900/80 border border-neutral-800 rounded-lg">
                <span className="text-[10px] font-mono text-purple-400 font-bold block mb-1">ФАЗА 2</span>
                <h4 className="text-xs font-bold text-white mb-1">2. Анализ (Cordis)</h4>
                <p className="text-[11px] text-neutral-400">
                  Мультиагентный ансамбль: Security, Architecture, Testing, DevOps, UX и Docs агенты.
                </p>
                <div className="mt-2 text-[10px] font-mono text-neutral-500">LLM: DeepSeek / Gemini</div>
              </div>

              <div className="p-3 bg-neutral-900/80 border border-neutral-800 rounded-lg">
                <span className="text-[10px] font-mono text-amber-400 font-bold block mb-1">ФАЗА 3</span>
                <h4 className="text-xs font-bold text-white mb-1">3. Решение</h4>
                <p className="text-[11px] text-neutral-400">
                  Суперадмин перемещает карточки. Соблюдается лимит WIP $\le 3$. Выбор причины отказа обучает агента.
                </p>
                <div className="mt-2 text-[10px] font-mono text-neutral-500">Human-in-the-loop</div>
              </div>

              <div className="p-3 bg-neutral-900/80 border border-neutral-800 rounded-lg">
                <span className="text-[10px] font-mono text-emerald-400 font-bold block mb-1">ФАЗА 4</span>
                <h4 className="text-xs font-bold text-white mb-1">4. Внедрение</h4>
                <p className="text-[11px] text-neutral-400">
                  AutoRemediation создает PR или задачу. Оценка кода пользователем с возможностью мгновенного отката.
                </p>
                <div className="mt-2 text-[10px] font-mono text-neutral-500">Self-Healing CI & PR</div>
              </div>
            </div>

            {/* Live active cards flow overview */}
            <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl">
              <h4 className="text-xs font-semibold text-neutral-300 mb-3">
                Актуальные идеи в обработке конвейера ({cards.length}):
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {cards.slice(0, 6).map((c) => (
                  <div key={c.id} className="p-2.5 bg-neutral-950 border border-neutral-800/80 rounded-lg text-xs">
                    <div className="flex items-center justify-between text-[10px] text-neutral-500 mb-1">
                      <span className="uppercase font-mono text-purple-400">{c.createdBy.split(' ')[0]}</span>
                      <span className="font-mono capitalize">{c.column}</span>
                    </div>
                    <div className="font-medium text-neutral-200 line-clamp-1">{c.title}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DIMENSION: SECURITY MATRIX */}
        {dimension === 'security_matrix' && (
          <div className="w-full max-w-4xl space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
                <span className="text-xs text-neutral-400">Соответствие OWASP ASVS 5.0</span>
                <div className="text-2xl font-bold text-emerald-400 mt-1">Level 2 (94%)</div>
                <p className="text-[11px] text-neutral-500 mt-1">
                  Подтверждено автоматизированными тестами и RLS политиками базы данных.
                </p>
              </div>
              <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
                <span className="text-xs text-neutral-400">Активных уязвимостей</span>
                <div className="text-2xl font-bold text-rose-400 mt-1">
                  {securityFindings.filter((f) => f.status === 'open').length} находок
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">
                  1 критическая (CodeQL eval), 1 средняя (Snyk lodash).
                </p>
              </div>
              <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
                <span className="text-xs text-neutral-400">CrowdSec WAF L7 Блокировки</span>
                <div className="text-2xl font-bold text-cyan-400 mt-1">142 угрозы</div>
                <p className="text-[11px] text-neutral-500 mt-1">
                  Виртуальный патчинг предотвратил неавторизованные запросы.
                </p>
              </div>
            </div>

            <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
              <h4 className="text-xs font-bold text-white mb-3">Детальный реестр сканирований безопасности:</h4>
              <div className="space-y-2">
                {securityFindings.map((finding) => (
                  <div
                    key={finding.id}
                    className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-lg flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          finding.severity === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : finding.severity === 'HIGH'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {finding.severity}
                      </span>
                      <div>
                        <div className="font-semibold text-neutral-200">{finding.title}</div>
                        <div className="text-[11px] text-neutral-500 font-mono">
                          {finding.scanner} · {finding.fileOrUrl}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-mono uppercase ${
                        finding.status === 'remediated'
                          ? 'text-emerald-400'
                          : finding.status === 'open'
                          ? 'text-rose-400'
                          : 'text-neutral-500'
                      }`}
                    >
                      {finding.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selected Node Details Drawer */}
      {selectedNode && (
        <div className="p-3 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getNodeColor(selectedNode) }}
            />
            <div>
              <span className="font-bold text-white">{selectedNode.name}</span>
              <span className="text-neutral-400 ml-2">({selectedNode.type})</span>
              <p className="text-neutral-400 text-[11px] mt-0.5">{selectedNode.details}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedNode.metrics && (
              <span className="font-mono text-neutral-300 bg-neutral-950 px-2.5 py-1 rounded border border-neutral-800">
                {selectedNode.metrics.label}: {selectedNode.metrics.value}
              </span>
            )}
            <button
              onClick={() => setSelectedNode(null)}
              className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-xs"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* Persistent AI Dashboard Presence: ActiveVoiceSession Widget */}
      {voiceMemory && (
        <div className="absolute bottom-4 right-4 z-30 w-80 sm:w-96 max-w-[calc(100vw-2rem)] pointer-events-auto">
          <ActiveVoiceSession
            turns={voiceMemory}
            activeTenant={activeTenant}
            macros={macros || []}
            onOpenVoice={onOpenVoice || (() => {})}
            onOpenMacroRegistry={onOpenMacroRegistry || (() => {})}
            onExecuteVoiceCommand={onExecuteVoiceCommand || (() => {})}
            onExecuteMacro={onExecuteMacro}
          />
        </div>
      )}
    </div>
  );
};
