import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  Play, 
  RotateCcw, 
  Terminal, 
  MessageSquare, 
  Radio, 
  Send,
  Zap,
  Code,
  Layers,
  Shield,
  Trash2,
  HelpCircle,
  AudioWaveform
} from 'lucide-react';
import { Tenant } from '../../types';
import { AiAgentService } from '../../services/aiAgentService';

export interface VoiceActionResult {
  intent: string;
  responseSpeech: string;
  details?: string;
  affectedEntity?: string;
}

interface VoiceControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTenant: Tenant;
  onExecuteVoiceCommand: (commandText: string) => VoiceActionResult | void;
}

interface ConversationTurn {
  id: string;
  role: 'user' | 'agent' | 'system';
  text: string;
  timestamp: string;
  actionResult?: string;
  interrupted?: boolean;
}

export const VoiceControlModal: React.FC<VoiceControlModalProps> = ({
  isOpen,
  onClose,
  activeTenant,
  onExecuteVoiceCommand,
}) => {
  const [isListening, setIsListening] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [spokenText, setSpokenText] = useState<string>('');
  const [customInput, setCustomInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [agentSpeechProgress, setAgentSpeechProgress] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string>(
    'Слушаю вас (Gemini Live Full-Duplex поток активен)...'
  );
  
  // Conversation History
  const [history, setHistory] = useState<ConversationTurn[]>(() => {
    return AiAgentService.getInstance().getVoiceConversationHistory();
  });

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const speechTimerRef = useRef<number | null>(null);
  const progressTimerRef = useRef<number | null>(null);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Auto-scroll chat history
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isSpeaking]);

  useEffect(() => {
    if (isOpen) {
      setHistory(AiAgentService.getInstance().getVoiceConversationHistory());
      setIsListening(true);
      setStatusMessage('Говорите голосовую команду или вопрос по коду...');
    } else {
      stopAgentSpeaking(false);
    }
    return () => {
      stopAgentSpeaking(false);
    };
  }, [isOpen]);

  // Stop synthetic or simulated speech immediately on interruption
  const stopAgentSpeaking = (wasInterruptedByUser: boolean = false) => {
    if (speechTimerRef.current) {
      window.clearTimeout(speechTimerRef.current);
      speechTimerRef.current = null;
    }
    if (progressTimerRef.current) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // ignore
      }
    }
    setIsSpeaking(false);
    setAgentSpeechProgress(0);

    if (wasInterruptedByUser) {
      AiAgentService.getInstance().markLastAgentTurnInterrupted();
      setHistory((prev) => {
        const copy = [...prev];
        for (let i = copy.length - 1; i >= 0; i--) {
          if (copy[i].role === 'agent' && !copy[i].interrupted) {
            copy[i] = {
              ...copy[i],
              interrupted: true,
              actionResult: '⚡ Прервано суперадмином на полуслове (Barge-in)!',
            };
            break;
          }
        }
        return copy;
      });
      setStatusMessage('⚡ Голос агента прерван (Barge-in перебивание сработало)! Слушаю новую команду...');
    }
  };

  // User explicitly interrupts the agent
  const handleInterrupt = () => {
    stopAgentSpeaking(true);
    setIsListening(true);
  };

  // Speak agent response with Web Speech API TTS or simulated live audio waveform
  const startAgentSpeaking = (agentReplyText: string, onDone?: () => void) => {
    stopAgentSpeaking(false);
    setIsSpeaking(true);
    setAgentSpeechProgress(5);

    // If browser supports SpeechSynthesis and sound is on
    if (soundEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(agentReplyText);
        utterance.lang = 'ru-RU';
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        utterance.onend = () => {
          setIsSpeaking(false);
          setAgentSpeechProgress(100);
          if (progressTimerRef.current) clearInterval(progressTimerRef.current);
          if (onDone) onDone();
        };
        utterance.onerror = () => {
          setIsSpeaking(false);
          if (progressTimerRef.current) clearInterval(progressTimerRef.current);
        };
        speechSynthRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('SpeechSynthesis error:', err);
      }
    }

    // Visual speech timeline simulation
    const durationMs = Math.min(Math.max(agentReplyText.length * 60, 2500), 7000);
    const interval = 100;
    const step = (100 / (durationMs / interval));
    
    progressTimerRef.current = window.setInterval(() => {
      setAgentSpeechProgress((prev) => {
        if (prev >= 100) {
          if (progressTimerRef.current) clearInterval(progressTimerRef.current);
          return 100;
        }
        return Math.min(prev + step, 100);
      });
    }, interval);

    speechTimerRef.current = window.setTimeout(() => {
      setIsSpeaking(false);
      setAgentSpeechProgress(100);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      if (onDone) onDone();
    }, durationMs);
  };

  // Dispatch a command with full context & conversation memory
  const handleProcessVoiceInput = (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed) return;

    // If agent is speaking, user just interrupted the agent by speaking!
    if (isSpeaking) {
      handleInterrupt();
    }

    setSpokenText(trimmed);
    setIsProcessing(true);
    setStatusMessage(`Распознавание интента: "${trimmed}"... Обработка через Gemini Live Function Calling...`);

    // Record user turn into persistent memory
    const userTurn = AiAgentService.getInstance().addVoiceTurn({
      role: 'user',
      text: trimmed,
    });
    setHistory(AiAgentService.getInstance().getVoiceConversationHistory());

    setTimeout(() => {
      // Execute command in App.tsx
      const result = onExecuteVoiceCommand(trimmed);
      setIsProcessing(false);

      const agentReply = result && result.responseSpeech
        ? result.responseSpeech
        : `Команда «${trimmed}» успешно выполнена в контексте тенанта «${activeTenant.name}».`;

      const actionNote = result && result.details ? result.details : 'Исполнено в системе';

      // Record agent reply into persistent memory
      AiAgentService.getInstance().addVoiceTurn({
        role: 'agent',
        text: agentReply,
        actionResult: actionNote,
      });

      setHistory(AiAgentService.getInstance().getVoiceConversationHistory());
      setStatusMessage(`Агент отвечает: воспроизведение голоса (Live TTS)...`);

      // Play audio & show audio wave with interruption capability
      startAgentSpeaking(agentReply, () => {
        setStatusMessage('Команда завершена. Готов к следующей голосовой инструкции...');
      });
    }, 600);
  };

  const handleClearHistory = () => {
    stopAgentSpeaking(false);
    AiAgentService.getInstance().clearVoiceConversationHistory();
    setHistory([]);
    setStatusMessage('История голосового диалога очищена.');
  };

  // Interactive Programming Scenarios (one-click voice intents)
  const programmingVoiceCommands = [
    {
      category: 'Программирование & CI/CD',
      cmd: 'Запустить цикл CI/CD и сгенерировать рекомендацию по оптимизации кода',
      icon: Terminal,
    },
    {
      category: 'Бэкстейдж & Плагины',
      cmd: 'Создать новый микрофронтенд плагин в Plugin Studio',
      icon: Code,
    },
    {
      category: 'Откат изменений',
      cmd: 'Откатить последнее внедренное изменение кода',
      icon: RotateCcw,
    },
    {
      category: 'Аудит безопасности',
      cmd: 'Запустить аудит безопасности и проверить RLS изоляцию',
      icon: Shield,
    },
    {
      category: 'Канбан & Задачи',
      cmd: 'Показать канбан доску и статус задач',
      icon: Layers,
    },
    {
      category: 'Переключение тенанта',
      cmd: 'Переключить контекст тенанта на холдинг ACME',
      icon: Sparkles,
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-2xl flex flex-col shadow-2xl relative overflow-hidden max-h-[92vh]">
        {/* Top Header */}
        <div className="p-4 px-6 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/70">
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className={`w-3 h-3 rounded-full block ${isSpeaking ? 'bg-amber-400 animate-ping' : isListening ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-600'}`} />
              <span className={`w-2 h-2 rounded-full absolute inset-0.5 ${isSpeaking ? 'bg-amber-400' : isListening ? 'bg-emerald-400' : 'bg-neutral-500'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5 font-mono tracking-wide">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  GEMINI LIVE · ГОЛОСОВОЕ ПРОГРАММИРОВАНИЕ ПОРТАЛА
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-300 font-mono">
                  Full-Duplex + Barge-in
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Активный тенант: <span className="text-cyan-300 font-semibold">{activeTenant.name}</span> ({activeTenant.schema}) · Контекст сохраняется
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-1.5 rounded-lg border text-xs transition-colors ${soundEnabled ? 'border-neutral-700 text-cyan-400 hover:bg-neutral-800' : 'border-neutral-800 text-neutral-500 hover:bg-neutral-800'}`}
              title={soundEnabled ? 'Озвучка (TTS) включена' : 'Озвучка (TTS) выключена'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={handleClearHistory}
              className="p-1.5 rounded-lg border border-neutral-800 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition-colors"
              title="Очистить память диалога"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors ml-1"
              title="Закрыть (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Dynamic Voice Waveform & Orb Section */}
        <div className="p-4 bg-gradient-to-b from-neutral-950/80 to-neutral-900 border-b border-neutral-800 flex flex-col items-center text-center relative">
          {/* Status badge */}
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-[11px] px-2.5 py-1 rounded-full font-mono flex items-center gap-1.5 ${
              isSpeaking 
                ? 'bg-amber-950/80 border border-amber-600/70 text-amber-200' 
                : isProcessing 
                ? 'bg-cyan-950/80 border border-cyan-600/70 text-cyan-200'
                : 'bg-neutral-800 text-neutral-300'
            }`}>
              {isSpeaking ? (
                <>
                  <Radio className="w-3 h-3 text-amber-400 animate-pulse" />
                  Агент говорит вслух... (Вы можете перебить в любой момент!)
                </>
              ) : isProcessing ? (
                <>
                  <span className="w-2.5 h-2.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  Обработка интента и вызов API портала...
                </>
              ) : (
                <>
                  <Mic className="w-3 h-3 text-emerald-400" />
                  Микрофон открыт. Говорите или выберите команду.
                </>
              )}
            </span>
          </div>

          {/* Central Animated Mic Orb */}
          <div className="relative my-2 flex items-center justify-center">
            {isSpeaking && (
              <>
                <div className="absolute w-28 h-28 bg-amber-500/20 rounded-full animate-ping" />
                <div className="absolute w-20 h-20 bg-amber-500/30 rounded-full animate-pulse" />
              </>
            )}
            {isListening && !isSpeaking && (
              <>
                <div className="absolute w-24 h-24 bg-cyan-500/20 rounded-full animate-ping" />
                <div className="absolute w-16 h-16 bg-purple-500/30 rounded-full animate-pulse" />
              </>
            )}

            <button
              onClick={() => {
                if (isSpeaking) {
                  handleInterrupt();
                } else {
                  setIsListening(!isListening);
                }
              }}
              className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all duration-200 hover:scale-105 ${
                isSpeaking
                  ? 'bg-gradient-to-tr from-amber-600 to-rose-600 text-white shadow-amber-500/40 ring-4 ring-amber-400/50'
                  : isListening
                  ? 'bg-gradient-to-tr from-purple-600 to-cyan-500 text-white shadow-cyan-500/30 ring-2 ring-cyan-400/30'
                  : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
              }`}
              title={isSpeaking ? 'Нажмите, чтобы перебить агента (Barge-in)' : isListening ? 'Отключить микрофон' : 'Включить микрофон'}
            >
              {isSpeaking ? (
                <Zap className="w-8 h-8 animate-pulse text-white" />
              ) : isListening ? (
                <Mic className="w-8 h-8" />
              ) : (
                <MicOff className="w-8 h-8" />
              )}
            </button>
          </div>

          {/* Barge-in Interruption Action Button (Always visible when agent is speaking) */}
          {isSpeaking && (
            <button
              onClick={handleInterrupt}
              className="mt-3 px-4 py-1.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white rounded-full text-xs font-semibold flex items-center gap-2 shadow-lg shadow-rose-900/40 transition-transform active:scale-95 animate-bounce"
            >
              <Zap className="w-3.5 h-3.5" />
              ПЕРЕБИТЬ АГЕНТА (Barge-in)
            </button>
          )}

          {/* Audio progress bar if speaking */}
          {isSpeaking && (
            <div className="w-full max-w-xs mt-3 bg-neutral-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-amber-400 h-full transition-all duration-100 ease-out"
                style={{ width: `${agentSpeechProgress}%` }}
              />
            </div>
          )}

          <p className="text-xs text-neutral-400 mt-2 max-w-md font-sans">{statusMessage}</p>
        </div>

        {/* Conversation Dialog Area with Full History / Context */}
        <div className="p-4 overflow-y-auto max-h-56 min-h-[160px] bg-neutral-950/40 space-y-3 font-sans text-xs custom-scrollbar">
          <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 border-b border-neutral-850 pb-1">
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3 text-cyan-400" />
              КОНТЕКСТ ДИАЛОГА ({history.length} реплик в памяти):
            </span>
            <span className="text-neutral-500">Автоматически сохраняется между запросами</span>
          </div>

          {history.length === 0 ? (
            <div className="py-6 text-center text-neutral-500 text-xs">
              История пуста. Начните говорить или выберите команду программирования.
            </div>
          ) : (
            history.map((turn) => (
              <div
                key={turn.id}
                className={`p-3 rounded-2xl border transition-all ${
                  turn.role === 'user'
                    ? 'bg-neutral-800/90 border-cyan-800/60 ml-8 text-neutral-100 shadow-xs'
                    : 'bg-neutral-900/90 border-neutral-800 mr-8 text-neutral-200 shadow-sm'
                } ${turn.interrupted ? 'border-amber-600/70 bg-amber-950/20' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold flex items-center gap-1.5">
                    {turn.role === 'user' ? (
                      <>
                        <span className="text-cyan-400 font-mono">Вы (Суперадмин)</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-purple-300 font-mono">Голосовой агент портала</span>
                      </>
                    )}
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">{turn.timestamp}</span>
                </div>

                <p className="text-xs leading-relaxed">{turn.text}</p>

                {turn.actionResult && (
                  <div className={`mt-2 p-1.5 px-2.5 rounded-lg text-[11px] font-mono flex items-center justify-between ${
                    turn.interrupted
                      ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                      : 'bg-neutral-950/70 text-cyan-300 border border-neutral-800'
                  }`}>
                    <span>{turn.actionResult}</span>
                    {turn.interrupted && <Zap className="w-3 h-3 text-amber-400" />}
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Quick Voice Programming Chips */}
        <div className="p-4 bg-neutral-950/80 border-t border-neutral-800">
          <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Программирование портала голосом (Готовые интенты):</span>
            <span className="text-neutral-500">Нажмите для симуляции речи</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {programmingVoiceCommands.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.cmd}
                  onClick={() => handleProcessVoiceInput(item.cmd)}
                  disabled={isProcessing}
                  className="p-2 bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-cyan-700/60 rounded-xl text-xs text-neutral-300 text-left flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-2 truncate">
                    <IconComponent className="w-3.5 h-3.5 text-cyan-400 shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="truncate">«{item.cmd}»</span>
                  </div>
                  <Play className="w-3 h-3 text-neutral-600 group-hover:text-cyan-400 shrink-0 ml-1.5 transition-colors" />
                </button>
              );
            })}
          </div>

          {/* Manual Prompt Input for quiet environments / testing custom voice queries */}
          <div className="mt-3 flex items-center gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleProcessVoiceInput(customInput);
                  setCustomInput('');
                }
              }}
              placeholder="Или введите голосовой запрос вручную (например: «создай плагин виджета»)..."
              className="flex-1 bg-neutral-900 border border-neutral-800 focus:border-cyan-500/70 rounded-xl px-3.5 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-500 outline-none transition-colors"
            />
            <button
              onClick={() => {
                if (customInput.trim()) {
                  handleProcessVoiceInput(customInput);
                  setCustomInput('');
                }
              }}
              disabled={!customInput.trim() || isProcessing}
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-neutral-800 disabled:text-neutral-600 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Send className="w-3 h-3" />
              Исполнить
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono mt-3">
            <span>
              Горячая клавиша вызова: <kbd className="px-1.5 py-0.5 bg-neutral-800 text-neutral-300 rounded">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-neutral-800 text-neutral-300 rounded">V</kbd>
            </span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Перебивание (Barge-in) и контекст активны
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
