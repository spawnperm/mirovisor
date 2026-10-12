import React from 'react';
import { Terminal, Mic, Zap, Cpu, ShieldCheck, Activity, Radio, Play } from 'lucide-react';
import { ActiveVoiceSession } from './ActiveVoiceSession';
import { useAppStore } from '../../store/useAppStore';

export const DevToolsSessionView: React.FC = () => {
  const activeTenant = useAppStore((state) => state.activeTenant);
  const voiceMemory = useAppStore((state) => state.voiceMemory);
  const macros = useAppStore((state) => state.macros);
  const setVoiceOpen = useAppStore((state) => state.setVoiceOpen);
  const setMacroRegistryOpen = useAppStore((state) => state.setMacroRegistryOpen);
  const setTerminalOpen = useAppStore((state) => state.setTerminalOpen);
  const executeVoiceCommand = useAppStore((state) => state.executeVoiceCommand);
  const executeMacro = useAppStore((state) => state.executeMacro);
  const triggerBuild = useAppStore((state) => state.triggerBuild);

  return (
    <div className="flex flex-col h-full bg-neutral-950 p-4 gap-4 overflow-y-auto">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900/80 p-3 rounded-xl border border-neutral-800 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-wide">
              ИНЖЕНЕРНЫЙ ЦЕНТР DEVTOOLS & ГОЛОСОВОГО ПРОГРАММИРОВАНИЯ
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              WebContainers + Speech Synthesis
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Оперативное управление голосовыми макросами, WebContainers CLI и сессией диалоговой памяти тенанта {activeTenant.name}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTerminalOpen(true)}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border border-neutral-700"
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            Открыть CLI Терминал
          </button>
          <button
            onClick={() => setVoiceOpen(true)}
            className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-md shadow-cyan-950/40 transition-all"
          >
            <Mic className="w-3.5 h-3.5" />
            Голосовой пульт (Barge-in)
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Active Voice Session Widget */}
        <div className="lg:col-span-2 space-y-4">
          <ActiveVoiceSession
            turns={voiceMemory}
            activeTenant={activeTenant}
            macros={macros}
            onOpenVoice={() => setVoiceOpen(true)}
            onOpenMacroRegistry={() => setMacroRegistryOpen(true)}
            onExecuteVoiceCommand={(cmd) => executeVoiceCommand(cmd)}
            onExecuteMacro={executeMacro}
          />

          {/* Quick Macro Execution Grid */}
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                Быстрый запуск цепочек макросов
              </h3>
              <button
                onClick={() => setMacroRegistryOpen(true)}
                className="text-[11px] text-cyan-400 hover:underline font-mono"
              >
                Редактировать в реестре →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {macros.map((m) => (
                <div
                  key={m.id}
                  className="p-3 bg-neutral-950/80 border border-neutral-800 rounded-xl hover:border-neutral-700 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-white truncate">{m.name}</span>
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-800/40">
                        «{m.keyword}»
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-400 truncate mt-0.5">{m.description}</p>
                  </div>
                  <button
                    onClick={() => executeMacro(m)}
                    className="p-1.5 bg-neutral-800 hover:bg-cyan-600 text-neutral-300 hover:text-white rounded-lg transition-colors shrink-0"
                    title={`Запустить макрос «${m.keyword}»`}
                  >
                    <Play className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Runtime Status & Diagnostics */}
        <div className="space-y-4">
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-cyan-400" />
              Статус WebContainers Runtime
            </h3>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between p-2 bg-neutral-950 rounded-lg border border-neutral-800/80">
                <span className="text-neutral-400">Node.js Container:</span>
                <span className="text-emerald-400 font-bold">ONLINE (v22.14)</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-neutral-950 rounded-lg border border-neutral-800/80">
                <span className="text-neutral-400">PFS Isolation:</span>
                <span className="text-cyan-400 font-bold">Schema: {activeTenant.schema}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-neutral-950 rounded-lg border border-neutral-800/80">
                <span className="text-neutral-400">NATS JetStream:</span>
                <span className="text-emerald-400 font-bold">ACK Sequence #4920</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-neutral-950 rounded-lg border border-neutral-800/80">
                <span className="text-neutral-400">WebRTC Presence:</span>
                <span className="text-purple-400 font-bold">Active CRDT Peering</span>
              </div>
            </div>

            <button
              onClick={() => triggerBuild('main')}
              className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors border border-neutral-700"
            >
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              Инициировать сборку CI/CD
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevToolsSessionView;
