import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  FileCode, 
  Server, 
  ExternalLink,
  Play,
  RotateCcw
} from 'lucide-react';
import { SecurityFinding, Tenant } from '../../types';

interface SecurityCenterViewProps {
  tenant: Tenant;
  findings: SecurityFinding[];
  onTriggerScan: () => void;
  onRemediateFinding: (findingId: string) => void;
}

export const SecurityCenterView: React.FC<SecurityCenterViewProps> = ({
  tenant,
  findings,
  onTriggerScan,
  onRemediateFinding,
}) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'findings' | 'scanners'>('matrix');
  const [isScanning, setIsScanning] = useState<boolean>(false);

  const asvsCategories = [
    { id: 'v1', code: 'V1', name: 'Архитектура и моделирование угроз', status: 'PASS', score: '100%', level: 'L2', desc: 'Schema-per-Tenant и изоляция схем подтверждены' },
    { id: 'v2', code: 'V2', name: 'Аутентификация (Authentik SSO / OIDC)', status: 'PASS', score: '98%', level: 'L2', desc: 'Multi-org токены и 2FA проверка сессий' },
    { id: 'v3', code: 'V3', name: 'Управление сессиями и Scoping', status: 'PASS', score: '100%', level: 'L2', desc: 'tenant_id извлекается только из проверенного JWT' },
    { id: 'v4', code: 'V4', name: 'Контроль доступа (Broken Access Control)', status: 'PASS', score: '100%', level: 'L2', desc: 'Трёхуровневая защита: Scoping + RBAC Guard + RLS FORCE' },
    { id: 'v5', code: 'V5', name: 'Валидация и санитизация (SAST CodeQL)', status: 'WARN', score: '84%', level: 'L2', desc: 'Обнаружен небезопасный eval() в платежном шлюзе' },
    { id: 'v6', code: 'V6', name: 'Криптография и защита трафика', status: 'PASS', score: '100%', level: 'L2', desc: 'Traefik TLS 1.3 + HSTS + Security headers' },
    { id: 'v7', code: 'V7', name: 'Сетевая защита и WAF (CrowdSec AppSec)', status: 'PASS', score: '96%', level: 'L2', desc: 'Виртуальный патчинг L7 активен' },
  ];

  const handleStartFullScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      onTriggerScan();
    }, 1200);
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 p-4 gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900/80 p-3 rounded-xl border border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              ЦЕНТР БЕЗОПАСНОСТИ OWASP ASVS 5.0 (LEVEL 2 VERIFIED)
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-neutral-800 text-neutral-300 rounded">
                Scoping · RBAC · RLS FORCE
              </span>
            </h2>
            <div className="text-xs text-neutral-400">
              Целевая схема: <strong className="text-white">{tenant.schema}</strong> · Режим WAF: CrowdSec Live L7
            </div>
          </div>
        </div>

        <button
          onClick={handleStartFullScan}
          disabled={isScanning}
          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          {isScanning ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Сканирование CodeQL + Snyk...
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              Запустить аудит безопасности
            </>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-2 text-xs">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'matrix' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Матрица верификации ASVS 5.0
        </button>
        <button
          onClick={() => setActiveTab('findings')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'findings' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Реестр уязвимостей ({findings.length})
        </button>
        <button
          onClick={() => setActiveTab('scanners')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'scanners' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Статус сканеров (SAST/SCA/DAST/WAF)
        </button>
      </div>

      {/* Content: ASVS Matrix */}
      {activeTab === 'matrix' && (
        <div className="space-y-3 flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {asvsCategories.map((cat) => (
              <div
                key={cat.id}
                className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-neutral-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                    {cat.code} · {cat.level}
                  </span>
                  <span
                    className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                      cat.status === 'PASS'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {cat.status} ({cat.score})
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white leading-snug">{cat.name}</h4>
                <p className="text-[11px] text-neutral-400 leading-relaxed">{cat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content: Findings */}
      {activeTab === 'findings' && (
        <div className="space-y-2 flex-1 overflow-y-auto">
          {findings.map((f) => (
            <div
              key={f.id}
              className="p-4 bg-neutral-900/70 border border-neutral-800 rounded-xl flex items-start justify-between gap-4 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      f.severity === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-400'
                        : f.severity === 'HIGH'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    {f.severity}
                  </span>
                  <span className="font-mono text-neutral-400 text-[11px]">{f.scanner}</span>
                  <span className="text-neutral-600">·</span>
                  <span className="font-mono text-neutral-500">{f.cwe}</span>
                </div>
                <h4 className="text-xs font-bold text-white">{f.title}</h4>
                <p className="text-[11px] text-neutral-300 font-mono bg-neutral-950 p-1.5 rounded border border-neutral-850">
                  {f.fileOrUrl}
                </p>
                <p className="text-neutral-400 text-[11px]">{f.description}</p>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className="text-[10px] font-mono uppercase text-neutral-500">
                  Статус: <strong className={f.status === 'open' ? 'text-rose-400' : 'text-emerald-400'}>{f.status}</strong>
                </span>
                {f.status === 'open' && (
                  <button
                    onClick={() => onRemediateFinding(f.id)}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-medium"
                  >
                    Применить Auto-Fix
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content: Scanners Status */}
      {activeTab === 'scanners' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
          <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-2 text-xs">
            <span className="font-mono text-[10px] uppercase text-cyan-400 font-bold">SAST Сканнер</span>
            <h4 className="text-xs font-bold text-white">GitHub CodeQL v3</h4>
            <p className="text-neutral-400 text-[11px]">
              Семантический анализ TypeScript и Python. Сканирует каждый PR и ветку main.
            </p>
            <div className="text-[10px] font-mono text-emerald-400">Правило: security-extended</div>
          </div>

          <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-2 text-xs">
            <span className="font-mono text-[10px] uppercase text-purple-400 font-bold">SCA Зависимости</span>
            <h4 className="text-xs font-bold text-white">Snyk Open Source</h4>
            <p className="text-neutral-400 text-[11px]">
              Проверка уязвимостей в pnpm-lockfile и транзитивных npm пакетах.
            </p>
            <div className="text-[10px] font-mono text-neutral-300">Порог: --severity-threshold=high</div>
          </div>

          <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-2 text-xs">
            <span className="font-mono text-[10px] uppercase text-amber-400 font-bold">Контейнеры & IaC</span>
            <h4 className="text-xs font-bold text-white">Aqua Trivy v0.36</h4>
            <p className="text-neutral-400 text-[11px]">
              Сканирование базовых Docker образов (Node 20, Postgres 16) на CVE уязвимости.
            </p>
            <div className="text-[10px] font-mono text-emerald-400">SARIF отчет выгружен</div>
          </div>

          <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-2 text-xs">
            <span className="font-mono text-[10px] uppercase text-rose-400 font-bold">WAF & L7 Defense</span>
            <h4 className="text-xs font-bold text-white">CrowdSec AppSec</h4>
            <p className="text-neutral-400 text-[11px]">
              Интеграция с Traefik middleware. Блокирует SQLi, XSS и сканеры окружения (.env).
            </p>
            <div className="text-[10px] font-mono text-cyan-400">Модуль AppSec LIVE</div>
          </div>
        </div>
      )}
    </div>
  );
};
