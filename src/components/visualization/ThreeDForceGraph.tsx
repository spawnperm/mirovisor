/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 3D Force-Directed Graph Visualization
 * Renders an interactive 3D perspective topological graph of tenants
 * and their connected infrastructure nodes (PostgreSQL, NATS, S3, Redis, K8s, WAF)
 * using Canvas 3D projection, depth shading, orbital rotation, and physics forces.
 */

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Play,
  Pause,
  Layers,
  Database,
  Radio,
  HardDrive,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { Tenant } from '../../types';

interface ThreeDForceGraphProps {
  tenants: Tenant[];
  activeTenant: Tenant;
  onSelectTenant?: (tenant: Tenant) => void;
}

interface Node3D {
  id: string;
  name: string;
  type: 'tenant' | 'database' | 'nats' | 'storage' | 'compute' | 'security';
  tenantId?: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  radius: number;
  color: string;
  glowColor: string;
  metrics?: { label: string; value: string };
  details: string;
}

interface Link3D {
  source: string;
  target: string;
  color: string;
  dashed?: boolean;
}

export const ThreeDForceGraph: React.FC<ThreeDForceGraphProps> = ({
  tenants,
  activeTenant,
  onSelectTenant,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [selectedNode, setSelectedNode] = useState<Node3D | null>(null);
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [filterType, setFilterType] = useState<string>('all');

  // 3D Camera Angles
  const cameraRef = useRef({
    yaw: 0.35,
    pitch: 0.25,
    distance: 680,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
  });

  // Construct 3D Nodes and Links representing tenants & connected infrastructure
  const { initialNodes, initialLinks } = useMemo(() => {
    const nodes: Node3D[] = [];
    const links: Link3D[] = [];

    // Colors by type
    const typeColors = {
      tenant: { fill: '#06b6d4', glow: 'rgba(6, 182, 212, 0.4)' },
      database: { fill: '#3b82f6', glow: 'rgba(59, 130, 246, 0.4)' },
      nats: { fill: '#a855f7', glow: 'rgba(168, 85, 247, 0.4)' },
      storage: { fill: '#10b981', glow: 'rgba(16, 185, 129, 0.4)' },
      compute: { fill: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)' },
      security: { fill: '#ef4444', glow: 'rgba(239, 68, 68, 0.4)' },
    };

    // Central Multi-Tenant Cluster Core
    nodes.push({
      id: 'core_gateway',
      name: 'Mirovisor Ingress Mesh (Traefik)',
      type: 'compute',
      x: 0,
      y: 0,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      radius: 14,
      color: '#f59e0b',
      glowColor: 'rgba(245, 158, 11, 0.5)',
      metrics: { label: 'Cluster Ingress', value: '1.8k RPS' },
      details: 'Центральный L7 Traefik Proxy и CrowdSec AppSec шлюз',
    });

    // Populate each tenant in 3D orbit
    tenants.forEach((tenant, idx) => {
      const angle = (idx / tenants.length) * Math.PI * 2;
      const tenantRadius = 180;
      const tx = Math.cos(angle) * tenantRadius;
      const tz = Math.sin(angle) * tenantRadius;
      const ty = (idx % 2 === 0 ? 30 : -30);

      const tenantNodeId = `tenant_${tenant.id}`;

      nodes.push({
        id: tenantNodeId,
        name: `${tenant.name}`,
        type: 'tenant',
        tenantId: tenant.id,
        x: tx,
        y: ty,
        z: tz,
        vx: 0,
        vy: 0,
        vz: 0,
        radius: 12,
        color: tenant.id === activeTenant.id ? '#38bdf8' : typeColors.tenant.fill,
        glowColor: tenant.id === activeTenant.id ? 'rgba(56, 189, 248, 0.6)' : typeColors.tenant.glow,
        metrics: { label: 'Schema', value: tenant.schema },
        details: `Пространство тенанта: ${tenant.name}. Изолированная среда RLS.`,
      });

      links.push({
        source: 'core_gateway',
        target: tenantNodeId,
        color: 'rgba(6, 182, 212, 0.5)',
      });

      // 1. PostgreSQL Schema Node
      const dbId = `pg_${tenant.id}`;
      nodes.push({
        id: dbId,
        name: `PostgreSQL (${tenant.schema})`,
        type: 'database',
        tenantId: tenant.id,
        x: tx + 60,
        y: ty - 40,
        z: tz + 30,
        vx: 0,
        vy: 0,
        vz: 0,
        radius: 8,
        color: typeColors.database.fill,
        glowColor: typeColors.database.glow,
        metrics: { label: 'RLS', value: 'FORCE ACTIVE' },
        details: `Схема ${tenant.schema} в PostgreSQL 16 с принудительной изоляцией строк`,
      });
      links.push({ source: tenantNodeId, target: dbId, color: 'rgba(59, 130, 246, 0.4)' });

      // 2. NATS JetStream Subject Node
      const natsId = `nats_${tenant.id}`;
      nodes.push({
        id: natsId,
        name: `NATS (${tenant.slug}.events)`,
        type: 'nats',
        tenantId: tenant.id,
        x: tx - 50,
        y: ty + 40,
        z: tz - 30,
        vx: 0,
        vy: 0,
        vz: 0,
        radius: 7,
        color: typeColors.nats.fill,
        glowColor: typeColors.nats.glow,
        metrics: { label: 'Stream', value: '100% Ack' },
        details: `Субъект очереди NATS JetStream для асинхронных событий ${tenant.slug}`,
      });
      links.push({ source: tenantNodeId, target: natsId, color: 'rgba(168, 85, 247, 0.4)' });

      // 3. Garage S3 Bucket Node
      const s3Id = `s3_${tenant.id}`;
      nodes.push({
        id: s3Id,
        name: `S3 (bucket-${tenant.slug})`,
        type: 'storage',
        tenantId: tenant.id,
        x: tx + 40,
        y: ty + 50,
        z: tz - 40,
        vx: 0,
        vy: 0,
        vz: 0,
        radius: 7,
        color: typeColors.storage.fill,
        glowColor: typeColors.storage.glow,
        metrics: { label: 'S3 Capacity', value: '10 GB' },
        details: `Хранилище Garage S3 для защищённых документов и артефактов ${tenant.name}`,
      });
      links.push({ source: tenantNodeId, target: s3Id, color: 'rgba(16, 185, 129, 0.4)' });

      // 4. Kubernetes Replica Pods Node
      const podId = `k8s_${tenant.id}`;
      nodes.push({
        id: podId,
        name: `K8s Pods (${tenant.slug}-api)`,
        type: 'compute',
        tenantId: tenant.id,
        x: tx - 60,
        y: ty - 30,
        z: tz + 40,
        vx: 0,
        vy: 0,
        vz: 0,
        radius: 7,
        color: typeColors.compute.fill,
        glowColor: typeColors.compute.glow,
        metrics: { label: 'Replicas', value: '3/3 Pods' },
        details: `HPA автомасштабирование подов NestJS для ${tenant.schema}`,
      });
      links.push({ source: tenantNodeId, target: podId, color: 'rgba(245, 158, 11, 0.4)' });
    });

    return { initialNodes: nodes, initialLinks: links };
  }, [tenants, activeTenant]);

  // Nodes state for physics simulation
  const nodesRef = useRef<Node3D[]>(initialNodes);
  useEffect(() => {
    nodesRef.current = initialNodes;
  }, [initialNodes]);

  // Main 3D Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;

      // Clear Canvas
      ctx.fillStyle = '#090a0f';
      ctx.fillRect(0, 0, width, height);

      // Auto-rotation when enabled and not dragging
      if (isRotating && !cameraRef.current.isDragging) {
        cameraRef.current.yaw += 0.003;
      }

      const { yaw, pitch, distance } = cameraRef.current;
      const cosYaw = Math.cos(yaw);
      const sinYaw = Math.sin(yaw);
      const cosPitch = Math.cos(pitch);
      const sinPitch = Math.sin(pitch);
      const fov = 450 * zoomLevel;

      // Project 3D coordinate to 2D screen coordinate
      const project = (x: number, y: number, z: number) => {
        // Yaw rotation around Y axis
        const x1 = x * cosYaw - z * sinYaw;
        const z1 = z * cosYaw + x * sinYaw;

        // Pitch rotation around X axis
        const y2 = y * cosPitch - z1 * sinPitch;
        const z2 = z1 * cosPitch + y * sinPitch;

        // Perspective division
        const depth = z2 + distance;
        if (depth <= 10) return null;

        const scale = fov / depth;
        return {
          px: cx + x1 * scale,
          py: cy + y2 * scale,
          scale,
          depth,
        };
      };

      // 1. Draw 3D Grid floor
      ctx.strokeStyle = 'rgba(38, 38, 38, 0.3)';
      ctx.lineWidth = 1;
      const gridSize = 250;
      const gridStep = 50;
      for (let gx = -gridSize; gx <= gridSize; gx += gridStep) {
        const p1 = project(gx, 100, -gridSize);
        const p2 = project(gx, 100, gridSize);
        if (p1 && p2) {
          ctx.beginPath();
          ctx.moveTo(p1.px, p1.py);
          ctx.lineTo(p2.px, p2.py);
          ctx.stroke();
        }
      }
      for (let gz = -gridSize; gz <= gridSize; gz += gridStep) {
        const p1 = project(-gridSize, 100, gz);
        const p2 = project(gridSize, 100, gz);
        if (p1 && p2) {
          ctx.beginPath();
          ctx.moveTo(p1.px, p1.py);
          ctx.lineTo(p2.px, p2.py);
          ctx.stroke();
        }
      }

      // Map nodes to projected coordinates
      const projectedNodes: Array<Node3D & { px: number; py: number; scale: number; depth: number }> = [];
      const nodeMap = new Map<string, typeof projectedNodes[0]>();

      for (const node of nodesRef.current) {
        if (filterType !== 'all' && node.type !== filterType && node.id !== 'core_gateway') {
          continue;
        }

        const p = project(node.x, node.y, node.z);
        if (p) {
          const item = { ...node, ...p };
          projectedNodes.push(item);
          nodeMap.set(node.id, item);
        }
      }

      // Sort by depth (Painter's algorithm: draw farthest objects first)
      projectedNodes.sort((a, b) => b.depth - a.depth);

      // 2. Draw 3D Links
      for (const link of initialLinks) {
        const s = nodeMap.get(link.source);
        const t = nodeMap.get(link.target);
        if (s && t) {
          const avgDepth = (s.depth + t.depth) / 2;
          const alpha = Math.max(0.1, Math.min(0.7, 500 / avgDepth));

          ctx.beginPath();
          ctx.moveTo(s.px, s.py);
          ctx.lineTo(t.px, t.py);
          ctx.strokeStyle = link.color;
          ctx.lineWidth = Math.max(1, 2 * ((s.scale + t.scale) / 2));
          ctx.stroke();
        }
      }

      // 3. Draw 3D Nodes (Spheres with radial gradient and glow)
      for (const pnode of projectedNodes) {
        const r = Math.max(3, pnode.radius * pnode.scale);

        // Outer glow
        const glowR = r * 2.2;
        const grad = ctx.createRadialGradient(pnode.px, pnode.py, r * 0.5, pnode.px, pnode.py, glowR);
        grad.addColorStop(0, pnode.color);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(pnode.px, pnode.py, glowR, 0, Math.PI * 2);
        ctx.fill();

        // Solid Sphere Core
        const sphereGrad = ctx.createRadialGradient(
          pnode.px - r * 0.3,
          pnode.py - r * 0.3,
          r * 0.1,
          pnode.px,
          pnode.py,
          r
        );
        sphereGrad.addColorStop(0, '#ffffff');
        sphereGrad.addColorStop(0.3, pnode.color);
        sphereGrad.addColorStop(1, '#020617');

        ctx.fillStyle = sphereGrad;
        ctx.beginPath();
        ctx.arc(pnode.px, pnode.py, r, 0, Math.PI * 2);
        ctx.fill();

        // Selection highlight ring
        if (selectedNode?.id === pnode.id) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(pnode.px, pnode.py, r + 4, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Node Label
        if (pnode.scale > 0.45) {
          ctx.font = `${Math.max(9, Math.round(11 * pnode.scale))}px JetBrains Mono, monospace`;
          ctx.fillStyle = pnode.id === selectedNode?.id ? '#38bdf8' : '#e2e8f0';
          ctx.textAlign = 'center';
          ctx.fillText(pnode.name, pnode.px, pnode.py + r + 13 * pnode.scale);
        }
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationId);
  }, [isRotating, zoomLevel, filterType, selectedNode, initialLinks]);

  // Handle Resize of Canvas
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && containerRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mouse Interaction: Orbital 3D rotation and Click selection
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    cameraRef.current.isDragging = true;
    cameraRef.current.lastMouseX = e.clientX;
    cameraRef.current.lastMouseY = e.clientY;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!cameraRef.current.isDragging) return;
    const dx = e.clientX - cameraRef.current.lastMouseX;
    const dy = e.clientY - cameraRef.current.lastMouseY;
    cameraRef.current.lastMouseX = e.clientX;
    cameraRef.current.lastMouseY = e.clientY;

    cameraRef.current.yaw += dx * 0.008;
    cameraRef.current.pitch = Math.max(-1.4, Math.min(1.4, cameraRef.current.pitch + dy * 0.008));
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    cameraRef.current.isDragging = false;

    // Detect click on node
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const { yaw, pitch, distance } = cameraRef.current;
    const cosYaw = Math.cos(yaw);
    const sinYaw = Math.sin(yaw);
    const cosPitch = Math.cos(pitch);
    const sinPitch = Math.sin(pitch);
    const fov = 450 * zoomLevel;

    let clicked: Node3D | null = null;
    let closestDist = Infinity;

    for (const node of nodesRef.current) {
      if (filterType !== 'all' && node.type !== filterType && node.id !== 'core_gateway') continue;

      const x1 = node.x * cosYaw - node.z * sinYaw;
      const z1 = node.z * cosYaw + node.x * sinYaw;
      const y2 = node.y * cosPitch - z1 * sinPitch;
      const z2 = z1 * cosPitch + node.y * sinPitch;

      const depth = z2 + distance;
      if (depth <= 10) continue;

      const scale = fov / depth;
      const px = cx + x1 * scale;
      const py = cy + y2 * scale;
      const r = Math.max(8, node.radius * scale);

      const dist = Math.hypot(clickX - px, clickY - py);
      if (dist <= r + 8 && dist < closestDist) {
        closestDist = dist;
        clicked = node;
      }
    }

    if (clicked) {
      setSelectedNode(clicked);
      if (clicked.type === 'tenant' && clicked.tenantId && onSelectTenant) {
        const t = tenants.find((item) => item.id === clicked!.tenantId);
        if (t) onSelectTenant(t);
      }
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setZoomLevel((prev) => Math.max(0.4, Math.min(2.5, prev - e.deltaY * 0.001)));
  };

  const handleResetCamera = () => {
    cameraRef.current.yaw = 0.35;
    cameraRef.current.pitch = 0.25;
    setZoomLevel(1);
    setSelectedNode(null);
  };

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#090a0f] overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />

      {/* Top Floating Overlay Controls */}
      <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="flex items-center gap-2 bg-neutral-900/90 backdrop-blur-md p-1.5 rounded-xl border border-neutral-800 pointer-events-auto shadow-xl">
          <div className="px-2 text-xs font-bold text-white flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            3D Force Graph: Мультитенантная Сеть & Инфраструктура
          </div>

          <div className="h-4 w-px bg-neutral-800" />

          {/* Filter Dropdown */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-neutral-300 rounded-lg px-2 py-1 outline-none"
          >
            <option value="all">Все узлы (All)</option>
            <option value="tenant">Тенанты (Tenants)</option>
            <option value="database">PostgreSQL Schemas</option>
            <option value="nats">NATS JetStream</option>
            <option value="storage">Garage S3 Buckets</option>
            <option value="compute">K8s Pods</option>
          </select>
        </div>

        {/* Viewport Action Buttons */}
        <div className="flex items-center gap-1.5 bg-neutral-900/90 backdrop-blur-md p-1.5 rounded-xl border border-neutral-800 pointer-events-auto shadow-xl">
          <button
            onClick={() => setIsRotating(!isRotating)}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
              isRotating
                ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
            }`}
            title={isRotating ? 'Остановить авто-вращение' : 'Включить авто-вращение 3D'}
          >
            {isRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="text-[10px] font-mono font-semibold">3D Spin</span>
          </button>

          <button
            onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
            className="p-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
            title="Приблизить (+)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setZoomLevel((z) => Math.max(0.4, z - 0.2))}
            className="p-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
            title="Отдалить (-)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleResetCamera}
            className="p-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
            title="Сбросить ракурс камеры"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Selected Node 3D HUD Inspector */}
      {selectedNode && (
        <div className="absolute bottom-4 left-4 max-w-sm w-full bg-neutral-900/95 backdrop-blur-xl border border-cyan-500/50 rounded-2xl p-4 shadow-2xl pointer-events-auto space-y-3 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedNode.color }} />
              <div>
                <h4 className="text-xs font-bold text-white font-mono leading-tight">{selectedNode.name}</h4>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400">
                  {selectedNode.type}
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-neutral-500 hover:text-white text-xs p-1"
            >
              ✕
            </button>
          </div>

          <p className="text-[11px] text-neutral-300 leading-relaxed font-sans">
            {selectedNode.details}
          </p>

          {selectedNode.metrics && (
            <div className="p-2.5 bg-neutral-950/90 border border-neutral-800 rounded-xl flex items-center justify-between font-mono text-xs">
              <span className="text-neutral-400 text-[11px]">{selectedNode.metrics.label}:</span>
              <span className="font-bold text-cyan-300">{selectedNode.metrics.value}</span>
            </div>
          )}

          {selectedNode.type === 'tenant' && (
            <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-neutral-400">
              <span>Связанных сервисов: <b className="text-white">4 узла</b></span>
              <span className="text-emerald-400">RLS Изоляция ✓</span>
            </div>
          )}
        </div>
      )}

      {/* 3D Legend Bar */}
      <div className="absolute bottom-4 right-4 bg-neutral-900/85 backdrop-blur-md border border-neutral-800 rounded-xl px-3 py-2 flex items-center gap-3 text-[10px] font-mono text-neutral-400 pointer-events-none">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400" /> Тенант
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500" /> PostgreSQL
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-purple-500" /> NATS
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" /> S3
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500" /> K8s
        </span>
      </div>
    </div>
  );
};
