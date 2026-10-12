import React, { useState } from 'react';
import {
  Mic,
  Sparkles,
  Zap,
  Play,
  RotateCcw,
  Terminal,
  User,
  Bot,
  Layers,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Bookmark,
  CheckCircle2,
  Clock,
  Radio,
  Sliders
} from 'lucide-react';
import { ConversationTurn } from './VoiceControlModal';
import { VoiceMacro } from '../../types/macros';
import { Tenant } from '../../types';

export interface ActiveVoiceSessionProps {
  turns: ConversationTurn[];
  activeTenant: Tenant;
  macros: VoiceMacro[];
  onOpenVoice: () => void;
  onOpenMacroRegistry: () => void;
  onExecuteVoiceCommand: (commandText: string) => void;
  onExecuteMacro?: (macro: VoiceMacro) => void;
  className?: string;
}

/**
 * ActiveVoiceSession Component
 * Displays a persistent live AI status indicator, quick macro triggers,
 * and the last three conversational turns as a summary widget on the dashboard.
 */
export const ActiveVoiceSession: React.FC<ActiveVoiceSessionProps> = ({
  turns,
  activeTenant,
  macros,
  onOpenVoice,
  onOpenMacroRegistry,
  onExecuteVoiceCommand,
  onExecuteMacro,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Extract the last three turns for the summary display
  const lastThreeTurns = turns.slice(-3);
  const totalTurnsCount = turns.length;
  const lastTurn = turns.length > 0 ? turns[turns.length - 1] : null;

  return (
    <div
      className={`rounded-2xl border border-neutral-800/90 bg-neutral-900/80 backdrop-blur-md shadow-2xl overflow-hidden transition-all duration-200 ${className}`}
    >
      {/* Live AI Status Bar Header */}
      <div className="p-3.5 bg-gradient-to-r from-neutral-950/90 via-neutral-900/90 to-neutral-950/90 border-b border-neutral-800/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Animated Glowing Live Status Orb */}
          <div className="relative flex items-center justify-center">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-ping absolute opacity-75" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 relative z-10 shadow-lg shadow-emerald-500/50" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-100 font-mono tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                AI АССИСТЕНТ (Gemini Live)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-950/70 text-cyan-300 border border-cyan-800/80">
                Активен
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-neutral-800 text-neutral-400 border border-neutral-700">
                <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                Barge-in Ready
              </span>
            </div>

            <div className="text-[11px] text-neutral-400 flex items-center gap-2 mt-0.5 font-mono">
              <span>
                Контекст: <span className="text-cyan-300 font-semibold">{activeTenant.name}</span>
              </span>
              <span>•</span>
              <span className="text-neutral-500">
                Память: <strong className="text-neutral-300">{totalTurnsCount}</strong> реплик
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls: Open Modal, Macros Registry, Toggle View */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenMacroRegistry}
            className="px-2.5 py-1 rounded-lg bg-neutral-800/90 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 text-[11px] font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Открыть Реестр голосовых макросов"
          >
            <Sliders className="w-3 h-3 text-amber-400" />
            <span className="hidden sm:inline">Макросы</span>
            <span className="px-1 py-0.2 bg-neutral-900 rounded text-[9px] text-amber-300 border border-neutral-750 font-bold">
              {macros.length}
            </span>
          </button>

          <button
            onClick={onOpenVoice}
            className="px-3 py-1 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-[11px] font-mono font-medium flex items-center gap-1.5 shadow-md shadow-cyan-900/30 transition-all cursor-pointer active:scale-95"
            title="Открыть полноэкранный пульт голосового диалога (Ctrl+V)"
          >
            <Mic className="w-3 h-3" />
            <span>Голос</span>
            <kbd className="hidden md:inline-block ml-0.5 px-1 py-0.2 bg-black/30 rounded text-[9px] text-cyan-200">
              Ctrl+V
            </kbd>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white border border-neutral-700 text-xs transition-colors cursor-pointer"
            title={isExpanded ? 'Свернуть виджет' : 'Развернуть виджет'}
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expandable Body: Last 3 Turns + Quick Macros Bar */}
      {isExpanded && (
        <div className="p-3.5 space-y-3">
          {/* Quick Macro Execution Chips Bar */}
          <div className="flex flex-wrap items-center gap-1.5 pb-2.5 border-b border-neutral-800/70">
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider flex items-center gap-1 mr-1">
              <Zap className="w-3 h-3 text-amber-400" />
              Быстрые макросы:
            </span>

            {macros.map((macro) => (
              <button
                key={macro.id}
                onClick={() => {
                  if (onExecuteMacro) {
                    onExecuteMacro(macro);
                  } else {
                    onExecuteVoiceCommand(macro.keyword);
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-neutral-950/70 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/50 text-[11px] font-mono text-neutral-300 hover:text-amber-200 flex items-center gap-1.5 transition-all cursor-pointer group"
                title={`Запустить макрос: «${macro.keyword}» (${macro.actions.length} действий)`}
              >
                <Play className="w-2.5 h-2.5 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="font-semibold">{macro.keyword}</span>
                <span className="text-[9px] text-neutral-500 font-normal">
                  ({macro.actions.length})
                </span>
              </button>
            ))}

            <button
              onClick={onOpenMacroRegistry}
              className="px-2 py-1 rounded-lg text-[10px] font-mono text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer ml-auto"
            >
              + Настроить макросы
            </button>
          </div>

          {/* Section: Last 3 Conversational Turns Summary */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 mb-2">
              <span className="flex items-center gap-1.5 font-semibold text-neutral-300">
                <Clock className="w-3 h-3 text-neutral-500" />
                Последние 3 реплики диалога:
              </span>
              {totalTurnsCount > 3 && (
                <button
                  onClick={onOpenVoice}
                  className="text-[10px] text-cyan-400 hover:underline hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  Смотреть все ({totalTurnsCount}) →
                </button>
              )}
            </div>

            {lastThreeTurns.length === 0 ? (
              <div className="p-4 rounded-xl bg-neutral-950/50 border border-neutral-800/60 text-center">
                <p className="text-xs text-neutral-400 font-mono">
                  История диалога пока пуста. Нажмите <kbd className="px-1 py-0.5 bg-neutral-800 text-neutral-200 rounded">Ctrl+V</kbd> или выберите макрос выше для первого голосового действия.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {lastThreeTurns.map((turn, idx) => {
                  const isUser = turn.role === 'user';
                  const isAgent = turn.role === 'agent';
                  const isInterrupted = !!turn.interrupted;
                  const turnAbsoluteIndex = totalTurnsCount - lastThreeTurns.length + idx + 1;

                  return (
                    <div
                      key={turn.id}
                      className={`p-2.5 rounded-xl border text-xs transition-all ${
                        isUser
                          ? 'bg-neutral-950/70 border-cyan-900/40 hover:border-cyan-700/60'
                          : isAgent
                          ? 'bg-neutral-950/50 border-neutral-800/80 hover:border-purple-800/60'
                          : 'bg-neutral-950/40 border-neutral-800'
                      } ${
                        isInterrupted
                          ? 'border-amber-600/70 bg-amber-950/20 ring-1 ring-amber-500/20'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5">
                          <div
                            className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 text-white ${
                              isUser
                                ? 'bg-gradient-to-tr from-cyan-600 to-blue-600'
                                : 'bg-gradient-to-tr from-purple-600 to-indigo-600'
                            }`}
                          >
                            {isUser ? <User className="w-2.5 h-2.5" /> : <Bot className="w-2.5 h-2.5" />}
                          </div>

                          <span className="font-mono text-[10px] font-bold">
                            {isUser ? (
                              <span className="text-cyan-300">Пользователь</span>
                            ) : (
                              <span className="text-purple-300">Mirovisor AI</span>
                            )}
                          </span>

                          <span className="text-[9px] text-neutral-500 font-mono">
                            #{turnAbsoluteIndex}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isInterrupted && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-950 border border-amber-600/80 text-[9px] text-amber-300 font-mono flex items-center gap-0.5">
                              <Zap className="w-2.5 h-2.5 fill-amber-400" />
                              Barge-in
                            </span>
                          )}

                          <span className="text-[10px] text-neutral-500 font-mono">
                            {turn.timestamp}
                          </span>

                          {isUser && (
                            <button
                              onClick={() => onExecuteVoiceCommand(turn.text)}
                              className="p-0.5 text-neutral-500 hover:text-cyan-300 hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                              title="Повторить команду"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Turn text content */}
                      <p className="text-neutral-200 text-[11px] leading-snug line-clamp-2 pl-5.5 select-text">
                        {turn.text}
                      </p>

                      {/* Action result snippet if present */}
                      {turn.actionResult && (
                        <div className="mt-1.5 ml-5.5 flex items-center gap-1 text-[10px] font-mono text-cyan-400/90 truncate">
                          <Terminal className="w-2.5 h-2.5 shrink-0 text-emerald-400" />
                          <span className="truncate">{turn.actionResult}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
