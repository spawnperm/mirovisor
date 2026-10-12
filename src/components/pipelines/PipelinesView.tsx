import React, { useState } from 'react';
import { 
  GitBranch, 
  GitCommit, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Terminal, 
  ShieldAlert, 
  ShieldCheck, 
  RotateCcw, 
  Radio, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Layers,
  FileCode,
  Key,
  Globe,
  Package,
  BarChart2,
} from 'lucide-react';
import { PipelineBuild, PipelineStep, SecurityFinding, Tenant, KanbanCard } from '../../types';
import { AiAgentService } from '../../services/aiAgentService';
import { BuildPerformanceDashboard } from './BuildPerformanceDashboard';

interface PipelinesViewProps {
  builds: PipelineBuild[];
  activeTenant: Tenant;
  onTriggerBuild: (branch: string) => void;
  onRemediateFinding: (finding: SecurityFinding) => void;
  onPushToKanban: (finding: SecurityFinding) => void;
}

export const PipelinesView: React.FC<PipelinesViewProps> = ({
  builds,
  activeTenant,
  onTriggerBuild,
  onRemediateFinding,
  onPushToKanban,
}) => {
  const [selectedBuild, setSelectedBuild] = useState<PipelineBuild>(builds[0] || null);
  const [selectedStep, setSelectedStep] = useState<PipelineStep>(builds[0]?.steps[1] || null);
  const [securityFilter, setSecurityFilter] = useState<'all' | 'sast' | 'dast' | 'sca' | 'secret'>('all');
  const [selectedFinding, setSelectedFinding] = useState<SecurityFinding | null>(null);
  const [isTriggering, setIsTriggering] = useState<boolean>(false);
  const [targetBranch, setTargetBranch] = useState<string>('main');
  const [natsNotification, setNatsNotification] = useState<string | null>(null);
  const [activeViewMode, setActiveViewMode] = useState<'feed' | 'performance'>('feed');

  const handleRunBuild = () => {
    setIsTriggering(true);
    setNatsNotification(`[NATS JetStream] Публикация события ci.build.trigger для ветки ${targetBranch}...`);
    setTimeout(() => {
      onTriggerBuild(targetBranch);
      setIsTriggering(false);
      setNatsNotification(`[NATS JetStream] Событие BuildCompleted успешно обработано Cordis агентами.`);
      setTimeout(() => setNatsNotification(null), 5000);
    }, 1500);
  };

  const filteredFindings = (selectedBuild?.findings || []).filter((f) => {
    if (securityFilter === 'all') return true;
    if (securityFilter === 'sast') return f.scanner === 'CodeQL';
    if (securityFilter === 'sca') return f.scanner === 'Snyk';
    if (securityFilter === 'dast') return f.scanner === 'OWASP ZAP';
    if (securityFilter === 'secret') return f.scanner === 'Gitleaks';
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-neutral-950 p-4 gap-4 overflow-hidden">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900/80 p-3 rounded-xl border border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              CI/CD PIPELINES & AUTOMATED SECURITY GATES
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-neutral-800 text-neutral-300 rounded">
                NATS JetStream Event Emulation
              </span>
            </h2>
            <div className="text-xs text-neutral-400 flex items-center gap-2">
              <span>Целевой тенант: <strong className="text-white">{activeTenant.name}</strong></span>
              <span>·</span>
              <span>Nx Cloud DTE: <span className="text-emerald-400 font-mono">АКТИВНО (3 агента)</span></span>
            </div>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs">
          <button
            onClick={() => setActiveViewMode('feed')}
            className={`px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              activeViewMode === 'feed' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
            Сборки & Логи
          </button>
          <button
            onClick={() => setActiveViewMode('performance')}
            className={`px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              activeViewMode === 'performance' ? 'bg-cyan-600 text-white shadow-xs' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Build Performance Dashboard
          </button>
        </div>

        {/* NATS JetStream Status Banner */}
        {natsNotification && (
          <div className="text-xs font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1.5 rounded-lg animate-pulse">
            {natsNotification}
          </div>
        )}

        {/* Trigger Pipeline Run */}
        <div className="flex items-center gap-2">
          <select
            value={targetBranch}
            onChange={(e) => setTargetBranch(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none font-mono"
          >
            <option value="main">branch: main (production)</option>
            <option value="develop">branch: develop (staging)</option>
            <option value="feature/sec-asvs">branch: feature/sec-asvs</option>
          </select>

          <button
            onClick={handleRunBuild}
            disabled={isTriggering}
            className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-medium text-xs rounded-lg flex items-center gap-1.5 shadow-md shadow-cyan-900/20 transition-all disabled:opacity-50"
          >
            {isTriggering ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Сборка и сканирование...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                Запустить пайплайн
              </>
            )}
          </button>
        </div>
      </div>

      {activeViewMode === 'performance' ? (
        <BuildPerformanceDashboard builds={builds} activeTenant={activeTenant} />
      ) : (
        /* Main Grid: Left Builds List / Middle Step Details & Logs / Right Security Gate Findings */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 overflow-hidden">
        {/* Left: Builds List (3 cols) */}
        <div className="lg:col-span-3 bg-neutral-900/60 border border-neutral-800 rounded-xl p-3 flex flex-col gap-2 overflow-hidden">
          <span className="text-[10px] font-mono uppercase text-neutral-500 font-bold px-1">
            История сборок и деплоев:
          </span>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {builds.map((b) => {
              const isSelected = selectedBuild?.id === b.id;
              return (
                <button
                  key={b.id}
                  onClick={() => {
                    setSelectedBuild(b);
                    setSelectedStep(b.steps[0]);
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition-all text-xs ${
                    isSelected
                      ? 'bg-neutral-800 border-cyan-500/50 text-white shadow-md'
                      : 'bg-neutral-950/70 border-neutral-850 text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-white flex items-center gap-1">
                      #{b.buildNumber}
                      <span className="text-[10px] font-normal text-neutral-400">({b.environment})</span>
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        b.status === 'success'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : b.status === 'failed'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 animate-pulse'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>

                  <div className="text-[11px] text-neutral-200 line-clamp-1 mb-1 font-medium">
                    {b.commitMessage}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono pt-1 border-t border-neutral-800">
                    <span className="flex items-center gap-1">
                      <GitBranch className="w-3 h-3 text-cyan-400" />
                      {b.branch}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {b.durationSec}s
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Middle: Step Progress & Monospace Logs (5 cols) */}
        <div className="lg:col-span-5 bg-neutral-900/60 border border-neutral-800 rounded-xl p-3 flex flex-col gap-3 overflow-hidden">
          {/* Build Info Header */}
          <div className="pb-2 border-b border-neutral-800 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                Сборка #{selectedBuild?.buildNumber} · {selectedBuild?.commitMessage}
              </h3>
              <span className="text-[10px] font-mono text-neutral-400">
                Commit: {selectedBuild?.commitSha} · Автор: {selectedBuild?.author} · Запущено: {selectedBuild?.startedAt}
              </span>
            </div>
            {selectedBuild?.selfHealSuggested && (
              <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Self-Healing CI
              </span>
            )}
          </div>

          {/* Stepper Progression */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {selectedBuild?.steps.map((step, idx) => {
              const isCurrentStep = selectedStep?.id === step.id;
              return (
                <button
                  key={step.id}
                  onClick={() => setSelectedStep(step)}
                  className={`p-2 rounded-lg border text-left shrink-0 transition-colors flex items-center gap-2 ${
                    isCurrentStep
                      ? 'bg-neutral-800 border-cyan-500 text-white font-medium'
                      : 'bg-neutral-950 border-neutral-850 text-neutral-400 hover:text-white'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      step.status === 'success'
                        ? 'bg-emerald-400'
                        : step.status === 'failed'
                        ? 'bg-rose-500 animate-ping'
                        : 'bg-neutral-600'
                    }`}
                  />
                  <div className="text-[11px] truncate max-w-28">{step.name}</div>
                  <span className="text-[9px] font-mono text-neutral-500">{step.durationSec}s</span>
                </button>
              );
            })}
          </div>

          {/* Monospace Step Logs Terminal */}
          <div className="flex-1 bg-black/90 border border-neutral-850 rounded-xl p-3 font-mono text-[11px] overflow-y-auto flex flex-col shadow-inner">
            <div className="flex items-center justify-between text-[10px] text-neutral-500 pb-2 mb-2 border-b border-neutral-800">
              <span className="text-cyan-400 font-bold">[STEP: {selectedStep?.name.toUpperCase()}]</span>
              <span>Статус: {selectedStep?.status.toUpperCase()}</span>
            </div>
            <div className="space-y-1 text-neutral-300 flex-1">
              {(selectedStep?.logs || []).map((line, lIdx) => (
                <div
                  key={lIdx}
                  className={`leading-relaxed ${
                    line.includes('⚠️') || line.includes('Warning')
                      ? 'text-amber-300 font-bold'
                      : line.includes('Error') || line.includes('failed')
                      ? 'text-rose-400 font-bold'
                      : line.includes('✓') || line.includes('completed')
                      ? 'text-emerald-400'
                      : 'text-neutral-400'
                  }`}
                >
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Automated Security Gate & Remediation Suggestions (4 cols) */}
        <div className="lg:col-span-4 bg-neutral-900/60 border border-neutral-800 rounded-xl p-3 flex flex-col gap-3 overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                AUTOMATED SECURITY GATE
              </h3>
              <span className="text-[10px] text-neutral-400 font-mono">
                SAST · DAST · SCA · Secret · Container
              </span>
            </div>

            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
              {filteredFindings.length} находок
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 text-[10px] font-mono">
            {[
              { id: 'all', label: 'Все' },
              { id: 'sast', label: 'SAST (CodeQL)' },
              { id: 'sca', label: 'SCA (Snyk)' },
              { id: 'secret', label: 'Secret' },
              { id: 'dast', label: 'DAST (ZAP)' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSecurityFilter(f.id as any)}
                className={`px-2 py-1 rounded transition-colors ${
                  securityFilter === f.id
                    ? 'bg-neutral-800 text-white font-bold'
                    : 'text-neutral-500 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Findings List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredFindings.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-500 border border-dashed border-neutral-800 rounded-xl">
                Уязвимостей по данному фильтру не обнаружено.
              </div>
            ) : (
              filteredFindings.map((finding) => (
                <div
                  key={finding.id}
                  onClick={() => setSelectedFinding(finding)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    selectedFinding?.id === finding.id
                      ? 'bg-neutral-800 border-rose-500 shadow-md'
                      : 'bg-neutral-950/80 border-neutral-850 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span
                      className={`font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                        finding.severity === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-400'
                          : finding.severity === 'HIGH'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      {finding.severity}
                    </span>
                    <span className="font-mono text-neutral-500">{finding.scanner}</span>
                  </div>

                  <h4 className="font-semibold text-white line-clamp-1 mb-1">{finding.title}</h4>
                  <div className="text-[10px] font-mono text-neutral-500 truncate mb-2">
                    {finding.fileOrUrl}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-850 text-[11px]">
                    <span className="text-neutral-400 font-mono">{finding.cwe.split(' ')[0]}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPushToKanban(finding);
                        }}
                        className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-cyan-300 rounded text-[10px] font-medium"
                      >
                        В Канбан
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemediateFinding(finding);
                        }}
                        className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-medium"
                      >
                        Auto-Fix
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Remediation Inspector Drawer */}
          {selectedFinding && (
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-cyan-400 uppercase font-bold">
                  Рекомендованный шаг исправления:
                </span>
                <button
                  onClick={() => setSelectedFinding(null)}
                  className="text-neutral-500 hover:text-white text-[11px]"
                >
                  ✕
                </button>
              </div>

              <p className="text-[11px] text-neutral-300">
                {selectedFinding.remediationExplanation || selectedFinding.description}
              </p>

              {selectedFinding.remediationSnippet && (
                <pre className="p-2 bg-black border border-neutral-800 rounded text-[10px] font-mono text-emerald-300 overflow-x-auto">
                  {selectedFinding.remediationSnippet}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
};
