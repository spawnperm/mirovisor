import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Sparkles,
  Zap,
  Copy,
  Check,
  RotateCcw,
  Search,
  Filter,
  User,
  Bot,
  Terminal,
  Code,
  Shield,
  Layers,
  ChevronDown,
  ChevronUp,
  Download,
  Activity,
  ArrowDown
} from 'lucide-react';
import { ConversationTurn } from './VoiceControlModal';

interface VoiceInteractionLogProps {
  turns: ConversationTurn[];
  isSpeaking?: boolean;
  onReplayCommand?: (commandText: string) => void;
  onInterrupt?: () => void;
  className?: string;
}

export const VoiceInteractionLog: React.FC<VoiceInteractionLogProps> = ({
  turns,
  isSpeaking = false,
  onReplayCommand,
  onInterrupt,
  className = '',
}) => {
  const [filterRole, setFilterRole] = useState<'all' | 'user' | 'agent' | 'interrupted'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedTurns, setExpandedTurns] = useState<Record<string, boolean>>({});
  const [copiedTurnId, setCopiedTurnId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new turns arrive if autoScroll is enabled
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [turns, autoScroll, isSpeaking]);

  const toggleExpand = (id: string) => {
    setExpandedTurns((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopyTurn = (turn: ConversationTurn) => {
    const textToCopy = `[${turn.timestamp}] ${turn.role.toUpperCase()}: ${turn.text}${
      turn.actionResult ? `\nResult: ${turn.actionResult}` : ''
    }${turn.interrupted ? ' (INTERRUPTED via Barge-in)' : ''}`;
    
    navigator.clipboard.writeText(textToCopy);
    setCopiedTurnId(turn.id);
    setTimeout(() => setCopiedTurnId(null), 2000);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(turns, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `voice_dialogue_log_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopyAll = () => {
    const fullTranscript = turns
      .map(
        (t) =>
          `[${t.timestamp}] ${t.role === 'user' ? 'USER' : 'AI'}: ${t.text}${
            t.interrupted ? ' [BARGE-IN INTERRUPTED]' : ''
          }${t.actionResult ? ` -> ${t.actionResult}` : ''}`
      )
      .join('\n');
    navigator.clipboard.writeText(fullTranscript);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // Filter turns
  const filteredTurns = turns.filter((turn) => {
    if (filterRole === 'user' && turn.role !== 'user') return false;
    if (filterRole === 'agent' && turn.role !== 'agent') return false;
    if (filterRole === 'interrupted' && !turn.interrupted) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = turn.text.toLowerCase().includes(q);
      const matchResult = turn.actionResult?.toLowerCase().includes(q) ?? false;
      const matchEntity = turn.affectedEntity?.toLowerCase().includes(q) ?? false;
      const matchIntent = turn.intent?.toLowerCase().includes(q) ?? false;
      return matchText || matchResult || matchEntity || matchIntent;
    }

    return true;
  });

  const userTurnsCount = turns.filter((t) => t.role === 'user').length;
  const agentTurnsCount = turns.filter((t) => t.role === 'agent').length;
  const interruptedCount = turns.filter((t) => t.interrupted).length;

  return (
    <div className={`flex flex-col rounded-2xl bg-neutral-950/60 border border-neutral-800/80 overflow-hidden ${className}`}>
      {/* Top Header / Stats Toolbar */}
      <div className="p-3 bg-neutral-900/80 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-800 text-cyan-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-100 font-mono tracking-wide">
                ЖУРНАЛ ДИАЛОГА (Voice Interaction Log)
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-neutral-800 text-neutral-300 border border-neutral-700">
                {turns.length} реплик
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-neutral-400 font-mono mt-0.5">
              <span>Команд: <strong className="text-cyan-300">{userTurnsCount}</strong></span>
              <span>•</span>
              <span>Ответов: <strong className="text-purple-300">{agentTurnsCount}</strong></span>
              {interruptedCount > 0 && (
                <>
                  <span>•</span>
                  <span className="text-amber-400 flex items-center gap-0.5 font-bold">
                    <Zap className="w-3 h-3 fill-amber-400" />
                    Перебиваний: {interruptedCount}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons: Filter, Copy, Export */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopyAll}
            disabled={turns.length === 0}
            className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 text-[11px] font-mono flex items-center gap-1 transition-colors disabled:opacity-40"
            title="Скопировать весь текст диалога в буфер обмена"
          >
            {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedAll ? 'Скопировано!' : 'Копировать всё'}</span>
          </button>

          <button
            onClick={handleExportJson}
            disabled={turns.length === 0}
            className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 text-[11px] font-mono flex items-center gap-1 transition-colors disabled:opacity-40"
            title="Экспорт массива памяти диалога в JSON"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="px-3 py-2 bg-neutral-900/40 border-b border-neutral-800/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFilterRole('all')}
            className={`px-2 py-0.5 rounded-md text-[10px] font-mono transition-colors ${
              filterRole === 'all'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            Все ({turns.length})
          </button>
          <button
            onClick={() => setFilterRole('user')}
            className={`px-2 py-0.5 rounded-md text-[10px] font-mono transition-colors ${
              filterRole === 'user'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            Команды ({userTurnsCount})
          </button>
          <button
            onClick={() => setFilterRole('agent')}
            className={`px-2 py-0.5 rounded-md text-[10px] font-mono transition-colors ${
              filterRole === 'agent'
                ? 'bg-purple-950 text-purple-300 border border-purple-700'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            Ответы AI ({agentTurnsCount})
          </button>
          {interruptedCount > 0 && (
            <button
              onClick={() => setFilterRole('interrupted')}
              className={`px-2 py-0.5 rounded-md text-[10px] font-mono transition-colors flex items-center gap-1 ${
                filterRole === 'interrupted'
                  ? 'bg-amber-950 text-amber-300 border border-amber-600'
                  : 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-950/40'
              }`}
            >
              <Zap className="w-2.5 h-2.5" />
              Barge-in ({interruptedCount})
            </button>
          )}
        </div>

        <div className="relative flex items-center">
          <Search className="w-3 h-3 absolute left-2 text-neutral-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по журналу..."
            className="pl-6 pr-2 py-1 bg-neutral-900 border border-neutral-700/80 rounded-lg text-[11px] text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-cyan-500 w-36 sm:w-44 transition-all font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-1.5 text-neutral-500 hover:text-neutral-300 text-xs"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Main Conversation Log Container */}
      <div
        ref={logContainerRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
          setAutoScroll(isAtBottom);
        }}
        className="p-3 overflow-y-auto max-h-64 min-h-[160px] space-y-2.5 font-sans text-xs custom-scrollbar bg-neutral-950/20"
      >
        {filteredTurns.length === 0 ? (
          <div className="py-8 text-center text-neutral-500 text-xs flex flex-col items-center justify-center gap-1.5">
            <MessageSquare className="w-6 h-6 text-neutral-700" />
            {turns.length === 0 ? (
              <>
                <span className="font-mono text-neutral-400">История диалога пока пуста</span>
                <span className="text-[11px] text-neutral-600">
                  Произнесите голосовую команду, нажмите пробел или выберите карточку быстрого действия
                </span>
              </>
            ) : (
              <>
                <span className="font-mono text-neutral-400">Нет реплик, соответствующих фильтру</span>
                <button
                  onClick={() => {
                    setFilterRole('all');
                    setSearchQuery('');
                  }}
                  className="text-[11px] text-cyan-400 hover:underline mt-1 font-mono"
                >
                  Сбросить фильтры
                </button>
              </>
            )}
          </div>
        ) : (
          filteredTurns.map((turn, index) => {
            const isUser = turn.role === 'user';
            const isInterrupted = turn.interrupted;
            const isExpanded = !!expandedTurns[turn.id];

            return (
              <div
                key={turn.id}
                className={`group p-3 rounded-xl border transition-all duration-150 ${
                  isUser
                    ? 'bg-neutral-900/90 border-cyan-900/50 hover:border-cyan-700/60 ml-4 sm:ml-8 text-neutral-100 shadow-xs'
                    : 'bg-neutral-900/70 border-neutral-800 hover:border-neutral-700 mr-4 sm:mr-8 text-neutral-200 shadow-sm'
                } ${
                  isInterrupted
                    ? 'border-amber-600/80 bg-amber-950/25 ring-1 ring-amber-500/30'
                    : ''
                }`}
              >
                {/* Turn Header: Role Avatar + Name + Timestamp + Barge-In Badge + Quick Actions */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-white ${
                        isUser
                          ? 'bg-gradient-to-tr from-cyan-600 to-blue-500'
                          : 'bg-gradient-to-tr from-purple-600 to-indigo-500'
                      }`}
                    >
                      {isUser ? <User className="w-3 h-3" /> : <Sparkles className="w-3 h-3 text-purple-200" />}
                    </div>

                    <span className="font-mono font-semibold text-[11px] flex items-center gap-1.5">
                      {isUser ? (
                        <span className="text-cyan-300">Суперадмин (Голос)</span>
                      ) : (
                        <span className="text-purple-300">Агент портала (Mirovisor)</span>
                      )}
                    </span>

                    {/* Turn index pill */}
                    <span className="text-[10px] text-neutral-600 font-mono">
                      #{index + 1}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Interruption Badge */}
                    {isInterrupted && (
                      <span className="text-amber-400 px-1.5 py-0.5 rounded bg-amber-950 border border-amber-600/80 text-[10px] font-mono flex items-center gap-1 shadow-xs animate-pulse">
                        <Zap className="w-2.5 h-2.5 fill-amber-400" />
                        <span>Barge-in (Прервано)</span>
                      </span>
                    )}

                    <span className="text-[10px] text-neutral-500 font-mono">
                      {turn.timestamp}
                    </span>

                    {/* Quick action: Replay user command */}
                    {isUser && onReplayCommand && (
                      <button
                        onClick={() => onReplayCommand(turn.text)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-neutral-800 text-neutral-400 hover:text-cyan-300 rounded transition-all"
                        title="Повторить эту команду"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    )}

                    {/* Copy turn text */}
                    <button
                      onClick={() => handleCopyTurn(turn)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded transition-all"
                      title="Копировать реплику"
                    >
                      {copiedTurnId === turn.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Turn Text Message */}
                <p className="text-xs leading-relaxed text-neutral-200 pl-7 select-text">
                  {turn.text}
                </p>

                {/* Action Result / Execution Feedback Badge */}
                {turn.actionResult && (
                  <div
                    className={`mt-2 ml-7 p-2 rounded-lg text-[11px] font-mono flex flex-col gap-1 ${
                      isInterrupted
                        ? 'bg-amber-950/60 text-amber-200 border border-amber-800/80'
                        : 'bg-neutral-950/80 text-cyan-300 border border-neutral-800/90'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {isInterrupted ? (
                          <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        ) : (
                          <Terminal className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        )}
                        <span className="font-semibold truncate">
                          {turn.actionResult}
                        </span>
                      </div>

                      {/* Expand details button if intent or metadata present */}
                      {(turn.intent || turn.affectedEntity || turn.metadata) && (
                        <button
                          onClick={() => toggleExpand(turn.id)}
                          className="text-[10px] text-neutral-400 hover:text-neutral-200 flex items-center gap-0.5 shrink-0"
                        >
                          <span>{isExpanded ? 'Скрыть' : 'Детали'}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      )}
                    </div>

                    {/* Target entity pill */}
                    {turn.affectedEntity && !isExpanded && (
                      <div className="flex items-center gap-1 text-[10px] text-neutral-400">
                        <span>Связанный объект:</span>
                        <span className="px-1.5 py-0.2 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 font-mono">
                          {turn.affectedEntity}
                        </span>
                      </div>
                    )}

                    {/* Expanded Technical Details */}
                    {isExpanded && (
                      <div className="mt-1.5 pt-1.5 border-t border-neutral-800/80 text-[10px] space-y-1 font-mono text-neutral-400">
                        {turn.intent && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-neutral-500">Интент:</span>
                            <span className="text-purple-300 font-bold">{turn.intent}</span>
                          </div>
                        )}
                        {turn.affectedEntity && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-neutral-500">Объект:</span>
                            <span className="text-amber-300">{turn.affectedEntity}</span>
                          </div>
                        )}
                        {turn.metadata && Object.keys(turn.metadata).length > 0 && (
                          <div className="bg-neutral-900/90 p-1.5 rounded border border-neutral-800 text-[10px] text-neutral-300 overflow-x-auto">
                            <pre className="text-[9px]">{JSON.stringify(turn.metadata, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Auto-scroll prompt if user scrolled up */}
      {!autoScroll && filteredTurns.length > 0 && (
        <div className="bg-cyan-950/80 border-t border-cyan-800 py-1 px-3 flex items-center justify-between text-[10px] text-cyan-300 font-mono">
          <span>Прокрутка приостановлена</span>
          <button
            onClick={() => {
              setAutoScroll(true);
              if (logContainerRef.current) {
                logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
              }
            }}
            className="flex items-center gap-1 hover:underline text-cyan-200 font-bold"
          >
            <span>Вниз к новым сообщениям</span>
            <ArrowDown className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};
