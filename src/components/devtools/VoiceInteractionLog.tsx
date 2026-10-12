import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Sparkles,
  Zap,
  Copy,
  Check,
  RotateCcw,
  Search,
  User,
  Bot,
  Terminal,
  ChevronDown,
  ChevronUp,
  Download,
  ArrowDown,
  Clock,
  Trash2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ConversationTurn } from './VoiceControlModal';

export interface VoiceInteractionLogProps {
  turns: ConversationTurn[];
  isSpeaking?: boolean;
  onReplayCommand?: (commandText: string) => void;
  onInterrupt?: () => void;
  onClearLog?: () => void;
  className?: string;
}

/**
 * VoiceInteractionLog component
 * Renders the persistent conversation memory array as a scrollable chat history
 * with timestamps, role-based visual differentiation, and barge-in markers.
 */
export const VoiceInteractionLog: React.FC<VoiceInteractionLogProps> = ({
  turns,
  isSpeaking = false,
  onReplayCommand,
  onInterrupt,
  onClearLog,
  className = '',
}) => {
  const [filterRole, setFilterRole] = useState<'all' | 'user' | 'agent' | 'interrupted'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedTurns, setExpandedTurns] = useState<Record<string, boolean>>({});
  const [copiedTurnId, setCopiedTurnId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat history when new turns arrive or when speaking status updates
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
      turn.actionResult ? `\nРезультат: ${turn.actionResult}` : ''
    }${turn.interrupted ? ' (ПРЕРВАНО через Barge-in)' : ''}`;

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
          `[${t.timestamp}] ${t.role === 'user' ? 'ПОЛЬЗОВАТЕЛЬ' : 'AI АССИСТЕНТ'}: ${t.text}${
            t.interrupted ? ' [ПРЕРВАНО / BARGE-IN]' : ''
          }${t.actionResult ? ` -> ${t.actionResult}` : ''}`
      )
      .join('\n\n');
    navigator.clipboard.writeText(fullTranscript);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // Filter turns according to selected tab and search query
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

  const lastAgentTurn = [...turns].reverse().find((t) => t.role === 'agent');
  const [copiedLastAgent, setCopiedLastAgent] = useState<boolean>(false);

  const handleCopyLastAgentResponse = () => {
    if (!lastAgentTurn) return;
    const textToCopy = lastAgentTurn.text;
    navigator.clipboard.writeText(textToCopy);
    setCopiedLastAgent(true);
    setTimeout(() => setCopiedLastAgent(false), 2000);
  };

  return (
    <div className={`flex flex-col rounded-2xl bg-neutral-950/70 border border-neutral-800 shadow-xl overflow-hidden ${className}`}>
      {/* Top Header / Stats & Memory Toolbar */}
      <div className="p-3 bg-neutral-900/90 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-800/80 text-cyan-400 shrink-0 shadow-inner">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-neutral-100 font-mono tracking-wide">
                ЖУРНАЛ ДИАЛОГА (VoiceInteractionLog)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-950/70 text-cyan-300 border border-cyan-800">
                {turns.length} {turns.length === 1 ? 'реплика' : turns.length < 5 ? 'реплики' : 'реплик'}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" />
                localStorage активен
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-neutral-400 font-mono mt-0.5 flex-wrap">
              <span>Команд пользователя: <strong className="text-cyan-300">{userTurnsCount}</strong></span>
              <span>•</span>
              <span>Ответов ассистента: <strong className="text-purple-300">{agentTurnsCount}</strong></span>
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

        {/* Action Buttons: Copy Last AI Response, Filter, Copy All, Export, Clear */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* 1-Click Copy Last Agent Response Button */}
          <button
            onClick={handleCopyLastAgentResponse}
            disabled={!lastAgentTurn}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
              copiedLastAgent
                ? 'bg-emerald-950 border border-emerald-500 text-emerald-300'
                : lastAgentTurn
                ? 'bg-purple-950/80 hover:bg-purple-900 border border-purple-700/80 text-purple-200 hover:text-white'
                : 'bg-neutral-800/50 border border-neutral-800 text-neutral-500 opacity-40 cursor-not-allowed'
            }`}
            title={
              lastAgentTurn
                ? `Скопировать в буфер последний ответ AI агента:\n"${lastAgentTurn.text.slice(0, 80)}..."`
                : 'Ответов агента пока нет'
            }
          >
            {copiedLastAgent ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            )}
            <span>{copiedLastAgent ? 'Ответ скопирован!' : 'Копировать ответ AI'}</span>
          </button>

          <button
            onClick={handleCopyAll}
            disabled={turns.length === 0}
            className="px-2.5 py-1 rounded-lg bg-neutral-800/90 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700/80 text-[11px] font-mono flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
            title="Скопировать весь текст диалога в буфер обмена"
          >
            {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-neutral-400" />}
            <span>{copiedAll ? 'Скопировано!' : 'Копировать всё'}</span>
          </button>

          <button
            onClick={handleExportJson}
            disabled={turns.length === 0}
            className="px-2.5 py-1 rounded-lg bg-neutral-800/90 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700/80 text-[11px] font-mono flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
            title="Экспорт массива памяти диалога в JSON"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>JSON</span>
          </button>

          {onClearLog && (
            <button
              onClick={onClearLog}
              disabled={turns.length === 0}
              className="p-1 rounded-lg bg-neutral-800/90 hover:bg-rose-950/60 hover:text-rose-400 text-neutral-400 border border-neutral-700/80 text-[11px] font-mono transition-colors disabled:opacity-40 cursor-pointer"
              title="Очистить историю диалога"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="px-3 py-2 bg-neutral-900/60 border-b border-neutral-800/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilterRole('all')}
            className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono transition-colors ${
              filterRole === 'all'
                ? 'bg-neutral-800 text-white font-semibold border border-neutral-600'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
          >
            Все ({turns.length})
          </button>
          <button
            onClick={() => setFilterRole('user')}
            className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono transition-colors flex items-center gap-1 ${
              filterRole === 'user'
                ? 'bg-cyan-950 text-cyan-300 font-semibold border border-cyan-700'
                : 'text-neutral-400 hover:text-cyan-300 hover:bg-neutral-800/60'
            }`}
          >
            <User className="w-3 h-3 text-cyan-400" />
            Команды ({userTurnsCount})
          </button>
          <button
            onClick={() => setFilterRole('agent')}
            className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono transition-colors flex items-center gap-1 ${
              filterRole === 'agent'
                ? 'bg-purple-950 text-purple-300 font-semibold border border-purple-700'
                : 'text-neutral-400 hover:text-purple-300 hover:bg-neutral-800/60'
            }`}
          >
            <Bot className="w-3 h-3 text-purple-400" />
            Ответы AI ({agentTurnsCount})
          </button>
          {interruptedCount > 0 && (
            <button
              onClick={() => setFilterRole('interrupted')}
              className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono transition-colors flex items-center gap-1 ${
                filterRole === 'interrupted'
                  ? 'bg-amber-950 text-amber-300 font-semibold border border-amber-600'
                  : 'text-amber-400/90 hover:text-amber-300 hover:bg-amber-950/40'
              }`}
            >
              <Zap className="w-2.5 h-2.5 fill-amber-400" />
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
            placeholder="Поиск по истории..."
            className="pl-6 pr-6 py-1 bg-neutral-900 border border-neutral-700/80 rounded-lg text-[11px] text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-cyan-500 w-36 sm:w-48 transition-all font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-1.5 text-neutral-500 hover:text-neutral-300 text-xs px-1"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Main Conversation Log Container: Scrollable Chat History */}
      <div
        ref={logContainerRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
          setAutoScroll(isAtBottom);
        }}
        className="p-3.5 overflow-y-auto max-h-72 min-h-[180px] space-y-3 font-sans text-xs custom-scrollbar bg-neutral-950/30"
      >
        {filteredTurns.length === 0 ? (
          <div className="py-10 text-center text-neutral-500 text-xs flex flex-col items-center justify-center gap-2">
            <MessageSquare className="w-7 h-7 text-neutral-700" />
            {turns.length === 0 ? (
              <>
                <span className="font-mono text-neutral-300 font-medium">История голосового диалога пока пуста</span>
                <span className="text-[11px] text-neutral-500 max-w-sm">
                  Произнесите команду вслух, воспользуйтесь быстрыми сценариями ниже или наберите запрос вручную.
                </span>
              </>
            ) : (
              <>
                <span className="font-mono text-neutral-400">Нет записей, соответствующих заданным критериям</span>
                <button
                  onClick={() => {
                    setFilterRole('all');
                    setSearchQuery('');
                  }}
                  className="text-[11px] text-cyan-400 hover:underline mt-1 font-mono"
                >
                  Сбросить фильтры поиска
                </button>
              </>
            )}
          </div>
        ) : (
          filteredTurns.map((turn, index) => {
            const isUser = turn.role === 'user';
            const isAgent = turn.role === 'agent';
            const isInterrupted = !!turn.interrupted;
            const isExpanded = !!expandedTurns[turn.id];

            return (
              <div
                key={turn.id}
                className={`group rounded-2xl border transition-all duration-150 p-3 shadow-md ${
                  isUser
                    ? 'ml-4 sm:ml-12 bg-gradient-to-br from-cyan-950/30 via-neutral-900/90 to-neutral-900/90 border-cyan-800/50 hover:border-cyan-600/70 text-neutral-100'
                    : isAgent
                    ? 'mr-4 sm:mr-12 bg-gradient-to-br from-purple-950/20 via-neutral-900/90 to-neutral-900/90 border-neutral-800 hover:border-purple-800/60 text-neutral-200'
                    : 'mx-4 bg-neutral-900/80 border-neutral-800 text-neutral-300'
                } ${
                  isInterrupted
                    ? 'ring-1 ring-amber-500/50 border-amber-600/80 bg-gradient-to-br from-amber-950/30 via-neutral-900/90 to-neutral-900/90'
                    : ''
                }`}
              >
                {/* Header of turn: Avatar + Role Badge + Timestamp + Barge-In Indicator + Actions */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {/* Visual Role Icon */}
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${
                        isUser
                          ? 'bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-cyan-900/40 ring-1 ring-cyan-400/40'
                          : isAgent
                          ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-purple-100 shadow-purple-900/40 ring-1 ring-purple-400/40'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {isUser ? (
                        <User className="w-3.5 h-3.5" />
                      ) : isAgent ? (
                        <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                      ) : (
                        <Bot className="w-3.5 h-3.5" />
                      )}
                    </div>

                    {/* Role Title Badge */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono font-bold text-[11px] tracking-wide">
                        {isUser ? (
                          <span className="text-cyan-300 flex items-center gap-1">
                            Вы (Голос / Команда)
                          </span>
                        ) : isAgent ? (
                          <span className="text-purple-300 flex items-center gap-1">
                            Gemini AI Agent (Mirovisor)
                          </span>
                        ) : (
                          <span className="text-neutral-400">Системное уведомление</span>
                        )}
                      </span>

                      {/* Turn Sequence Index */}
                      <span className="text-[10px] text-neutral-500 font-mono">
                        #{index + 1}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Interruption Badge if Barge-in triggered */}
                    {isInterrupted && (
                      <span className="text-amber-300 px-2 py-0.5 rounded-full bg-amber-950/90 border border-amber-500/80 text-[10px] font-mono flex items-center gap-1 shadow-xs animate-pulse">
                        <Zap className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="font-bold">Barge-in (Прервано)</span>
                      </span>
                    )}

                    {/* Timestamp Display */}
                    <span className="text-[10px] text-neutral-400 font-mono flex items-center gap-1 bg-neutral-950/60 px-1.5 py-0.5 rounded border border-neutral-800">
                      <Clock className="w-2.5 h-2.5 text-neutral-500" />
                      {turn.timestamp}
                    </span>

                    {/* Quick Replay Button for user commands */}
                    {isUser && onReplayCommand && (
                      <button
                        onClick={() => onReplayCommand(turn.text)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-neutral-800 text-neutral-400 hover:text-cyan-300 rounded transition-all cursor-pointer"
                        title="Повторить эту голосовую команду"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Copy turn to clipboard */}
                    <button
                      onClick={() => handleCopyTurn(turn)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded transition-all cursor-pointer"
                      title="Копировать реплику"
                    >
                      {copiedTurnId === turn.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Message Body */}
                <div className="pl-8 select-text">
                  <p className={`text-xs leading-relaxed ${isUser ? 'text-cyan-50 font-medium' : 'text-neutral-200'}`}>
                    {turn.text}
                  </p>
                </div>

                {/* Action Result / Execution Outcome Tag */}
                {turn.actionResult && (
                  <div
                    className={`mt-2.5 ml-8 p-2 rounded-xl text-[11px] font-mono flex flex-col gap-1 transition-all ${
                      isInterrupted
                        ? 'bg-amber-950/50 text-amber-200 border border-amber-800/80'
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

                      {/* Expand technical details button */}
                      {(turn.intent || turn.affectedEntity || turn.metadata) && (
                        <button
                          onClick={() => toggleExpand(turn.id)}
                          className="text-[10px] text-neutral-400 hover:text-neutral-200 flex items-center gap-0.5 shrink-0 hover:underline cursor-pointer"
                        >
                          <span>{isExpanded ? 'Скрыть' : 'Детали'}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      )}
                    </div>

                    {/* Associated Target Entity pill */}
                    {turn.affectedEntity && !isExpanded && (
                      <div className="flex items-center gap-1 text-[10px] text-neutral-400 mt-0.5">
                        <span>Связанный узел:</span>
                        <span className="px-1.5 py-0.2 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 font-mono">
                          {turn.affectedEntity}
                        </span>
                      </div>
                    )}

                    {/* Detailed Technical Metadata on Expand */}
                    {isExpanded && (
                      <div className="mt-2 pt-2 border-t border-neutral-800/80 text-[10px] space-y-1.5 font-mono text-neutral-400">
                        {turn.intent && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-neutral-500">Интент (Intent):</span>
                            <span className="text-purple-300 font-bold bg-purple-950/50 px-1.5 py-0.2 rounded border border-purple-800/50">
                              {turn.intent}
                            </span>
                          </div>
                        )}
                        {turn.affectedEntity && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-neutral-500">Целевой объект (Entity):</span>
                            <span className="text-amber-300 font-bold bg-amber-950/50 px-1.5 py-0.2 rounded border border-amber-800/50">
                              {turn.affectedEntity}
                            </span>
                          </div>
                        )}
                        {turn.metadata && Object.keys(turn.metadata).length > 0 && (
                          <div className="bg-neutral-900/90 p-2 rounded-lg border border-neutral-800 text-[10px] text-neutral-300 overflow-x-auto">
                            <div className="text-[9px] text-neutral-500 mb-1">Метаданные действия:</div>
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

      {/* Auto-scroll alert bar if user scrolled up */}
      {!autoScroll && filteredTurns.length > 0 && (
        <div className="bg-cyan-950/90 border-t border-cyan-800 py-1.5 px-3.5 flex items-center justify-between text-[11px] text-cyan-300 font-mono">
          <span className="flex items-center gap-1 text-[10px]">
            <AlertCircle className="w-3 h-3 text-cyan-400" />
            Прокрутка приостановлена (вы просматриваете историю)
          </span>
          <button
            onClick={() => {
              setAutoScroll(true);
              if (logContainerRef.current) {
                logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
              }
            }}
            className="flex items-center gap-1 hover:underline text-cyan-100 font-bold bg-cyan-900/80 px-2 py-0.5 rounded border border-cyan-700 cursor-pointer"
          >
            <span>Вниз к новым сообщениям</span>
            <ArrowDown className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};
