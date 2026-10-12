import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  History,
  Activity,
  ArrowRight,
  Database,
  Sliders
} from 'lucide-react';
import { Tenant } from '../../types';
import { VoiceMacro } from '../../types/macros';
import { AiAgentService } from '../../services/aiAgentService';
import { VoiceInteractionLog } from './VoiceInteractionLog';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export { VoiceInteractionLog };

export interface VoiceActionResult {
  intent: string;
  responseSpeech: string;
  details?: string;
  affectedEntity?: string;
  metadata?: Record<string, any>;
}

export interface ConversationTurn {
  id: string;
  role: 'user' | 'agent' | 'system';
  text: string;
  timestamp: string;
  actionResult?: string;
  interrupted?: boolean;
  intent?: string;
  affectedEntity?: string;
  metadata?: Record<string, any>;
  sentiment?: 'positive' | 'negative' | 'neutral' | 'urgent';
  sentimentScore?: number;
  sentimentReason?: string;
}

interface VoiceControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTenant: Tenant;
  onExecuteVoiceCommand: (
    commandText: string,
    conversationMemory: ConversationTurn[]
  ) => VoiceActionResult | void;
  conversationMemory?: ConversationTurn[];
  onUpdateConversationMemory?: React.Dispatch<React.SetStateAction<ConversationTurn[]>> | ((updater: ConversationTurn[] | ((prev: ConversationTurn[]) => ConversationTurn[])) => void);
  onClearMemory?: () => void;
  macros?: VoiceMacro[];
  onOpenMacroRegistry?: () => void;
}

export const VoiceControlModal: React.FC<VoiceControlModalProps> = ({
  isOpen,
  onClose,
  activeTenant,
  onExecuteVoiceCommand,
  conversationMemory: externalConversationMemory,
  onUpdateConversationMemory,
  onClearMemory,
  macros,
  onOpenMacroRegistry,
}) => {
  const { containerRef } = useFocusTrap({ isOpen, onClose });
  const [isListening, setIsListening] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [spokenText, setSpokenText] = useState<string>('');
  const [customInput, setCustomInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [agentSpeechProgress, setAgentSpeechProgress] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>(
    'Слушаю вас (Gemini Live Full-Duplex поток активен)...'
  );
  
  // Conversation Memory Array state with support for persistent memory passed from App (localStorage)
  const [localMemory, setLocalMemory] = useState<ConversationTurn[]>(() => {
    return externalConversationMemory || AiAgentService.getInstance().getVoiceConversationHistory();
  });

  const conversationMemory = externalConversationMemory !== undefined ? externalConversationMemory : localMemory;

  const updateMemory = useCallback((updater: ConversationTurn[] | ((prev: ConversationTurn[]) => ConversationTurn[])) => {
    if (onUpdateConversationMemory) {
      onUpdateConversationMemory(updater as any);
    } else {
      setLocalMemory(updater);
    }
  }, [onUpdateConversationMemory]);

  const speechTimerRef = useRef<number | null>(null);
  const progressTimerRef = useRef<number | null>(null);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const recognitionRef = useRef<any>(null);
  const isSpeakingRef = useRef<boolean>(false);

  // Keep ref synchronized with state for event listeners
  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  // =========================================================================
  // BARGE-IN INTERRUPTION MECHANISM
  // =========================================================================
  const stopAgentSpeaking = useCallback((wasInterruptedByUser: boolean = false) => {
    // 1. Clear speech synthesis timers
    if (speechTimerRef.current) {
      window.clearTimeout(speechTimerRef.current);
      speechTimerRef.current = null;
    }
    if (progressTimerRef.current) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }

    // 2. Abort browser audio speech synthesis immediately
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // ignore
      }
    }

    // 3. Reset speaking state
    setIsSpeaking(false);
    isSpeakingRef.current = false;
    setAgentSpeechProgress(0);

    // 4. If user initiated barge-in, mark last agent turn as interrupted
    if (wasInterruptedByUser) {
      AiAgentService.getInstance().markLastAgentTurnInterrupted('⚡ Прервано суперадмином на полуслове (Barge-in)!');
      updateMemory((prev) => {
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
      setStatusMessage('⚡ Голос агента прерван (Barge-in сработал)! Слушаю вашу новую команду...');
    }
  }, [updateMemory]);

  // Explicit user interruption action
  const handleInterrupt = useCallback(() => {
    stopAgentSpeaking(true);
    setIsListening(true);
  }, [stopAgentSpeaking]);

  // =========================================================================
  // SPEECH SYNTHESIS (AUDIO PLAYBACK WITH BARGE-IN AWARENESS)
  // =========================================================================
  const startAgentSpeaking = useCallback((agentReplyText: string, onDone?: () => void) => {
    stopAgentSpeaking(false);
    setIsSpeaking(true);
    isSpeakingRef.current = true;
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
          isSpeakingRef.current = false;
          setAgentSpeechProgress(100);
          if (progressTimerRef.current) clearInterval(progressTimerRef.current);
          if (onDone) onDone();
        };
        utterance.onerror = () => {
          setIsSpeaking(false);
          isSpeakingRef.current = false;
          if (progressTimerRef.current) clearInterval(progressTimerRef.current);
        };
        speechSynthRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('SpeechSynthesis error:', err);
      }
    }

    // Audio progress bar simulation
    const durationMs = Math.min(Math.max(agentReplyText.length * 60, 2500), 7500);
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
      isSpeakingRef.current = false;
      setAgentSpeechProgress(100);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      if (onDone) onDone();
    }, durationMs);
  }, [soundEnabled, stopAgentSpeaking]);

  // =========================================================================
  // EXECUTE COMMAND DISPATCH WITH FULL CONVERSATION MEMORY ARRAY
  // =========================================================================
  const handleProcessVoiceInput = useCallback((rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed) return;

    // BARGE-IN: If agent is speaking, user just interrupted the agent!
    if (isSpeakingRef.current) {
      stopAgentSpeaking(true);
    }

    setSpokenText(trimmed);
    setIsProcessing(true);
    setStatusMessage(`Анализ тональности и интента: "${trimmed}" через Cordis AI...`);

    // 1. Analyze sentiment of user voice input using the AI service
    AiAgentService.getInstance().analyzeSentiment(trimmed).then((sentimentRes) => {
      // Record user turn into persistent memory array with AI sentiment analysis
      const userTurn: ConversationTurn = {
        id: `vt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        role: 'user',
        text: trimmed,
        sentiment: sentimentRes.sentiment,
        sentimentScore: sentimentRes.score,
        sentimentReason: sentimentRes.explanation || sentimentRes.label,
      };

      // Get snapshot of conversation memory with this new user turn
      const memoryWithUser = [...conversationMemory, userTurn];
      updateMemory(memoryWithUser);
      AiAgentService.getInstance().syncVoiceConversationHistory(memoryWithUser);

      setTimeout(() => {
        // 2. Execute command in App with full conversationMemory array passed!
        const result = onExecuteVoiceCommand(trimmed, memoryWithUser);
        setIsProcessing(false);

        const agentReply = result && result.responseSpeech
          ? result.responseSpeech
          : `Команда «${trimmed}» успешно выполнена в контексте тенанта «${activeTenant.name}».`;

        const actionNote = result && result.details ? result.details : 'Исполнено в системе';

        // 3. Record agent reply into persistent memory array
        const agentTurn: ConversationTurn = {
          id: `vt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          role: 'agent',
          text: agentReply,
          actionResult: actionNote,
          intent: result ? result.intent : 'general',
          affectedEntity: result ? result.affectedEntity : undefined,
          sentiment: sentimentRes.sentiment === 'negative' || sentimentRes.sentiment === 'urgent' ? 'neutral' : 'positive',
        };

        const finalMemory = [...memoryWithUser, agentTurn];
        updateMemory(finalMemory);
        AiAgentService.getInstance().syncVoiceConversationHistory(finalMemory);
        setStatusMessage(`Агент отвечает: воспроизведение голоса... (Вы можете перебить!)`);

        // 4. Play audio with barge-in capability
        startAgentSpeaking(agentReply, () => {
          setStatusMessage('Команда завершена. Готов к следующей голосовой инструкции...');
        });
      }, 450);
    });
  }, [activeTenant.name, conversationMemory, onExecuteVoiceCommand, startAgentSpeaking, stopAgentSpeaking, updateMemory]);

  // =========================================================================
  // SPEECH RECOGNITION (WEB SPEECH API) FOR HANDS-FREE BARGE-IN
  // =========================================================================
  useEffect(() => {
    if (!isOpen) return;

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionAPI) {
      setSpeechRecognitionSupported(true);
      try {
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'ru-RU';

        // When audio input starts while agent is speaking: TRIGGER BARGE-IN IMMEDIATELY!
        recognition.onspeechstart = () => {
          if (isSpeakingRef.current) {
            stopAgentSpeaking(true);
          }
        };

        recognition.onresult = (event: any) => {
          // If agent is speaking and speech is detected, barge-in!
          if (isSpeakingRef.current) {
            stopAgentSpeaking(true);
          }

          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          if (finalTranscript.trim()) {
            handleProcessVoiceInput(finalTranscript);
          } else if (interimTranscript.trim()) {
            setStatusMessage(`Слышу вас: "${interimTranscript}"...`);
          }
        };

        recognition.onerror = (err: any) => {
          if (err.error !== 'no-speech') {
            console.warn('SpeechRecognition error:', err.error);
          }
        };

        if (isListening) {
          try {
            recognition.start();
          } catch (e) {
            // Already started
          }
        }

        recognitionRef.current = recognition;
      } catch (err) {
        console.warn('SpeechRecognition initialization error:', err);
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
        recognitionRef.current = null;
      }
    };
  }, [isOpen, isListening, handleProcessVoiceInput, stopAgentSpeaking]);

  // Keyboard shortcut listener: Space to interrupt when speaking, Esc to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in the text input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.code === 'Space' && isSpeakingRef.current) {
        e.preventDefault();
        handleInterrupt();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleInterrupt, onClose]);

  // Sync memory on modal open
  useEffect(() => {
    if (isOpen) {
      if (externalConversationMemory) {
        AiAgentService.getInstance().syncVoiceConversationHistory(externalConversationMemory);
      } else {
        setLocalMemory(AiAgentService.getInstance().getVoiceConversationHistory());
      }
      setIsListening(true);
      setStatusMessage('Говорите голосовую команду или вопрос по коду...');
    } else {
      stopAgentSpeaking(false);
    }
    return () => {
      stopAgentSpeaking(false);
    };
  }, [isOpen, stopAgentSpeaking, externalConversationMemory]);

  const handleClearHistory = () => {
    stopAgentSpeaking(false);
    AiAgentService.getInstance().clearVoiceConversationHistory();
    if (onClearMemory) {
      onClearMemory();
    } else {
      updateMemory([]);
    }
    setStatusMessage('Память сессии голосового диалога очищена.');
  };

  // Inspect last affected entity from conversation memory
  const lastEntityTurn = conversationMemory
    .slice()
    .reverse()
    .find((t) => t.role === 'agent' && t.affectedEntity);

  const lastUserTurn = conversationMemory
    .slice()
    .reverse()
    .find((t) => t.role === 'user');

  // Interactive Programming Scenarios (including context referencing intents and macros)
  const programmingVoiceCommands = [
    {
      category: 'Голосовые макросы',
      cmd: 'Deploy Nightly',
      icon: Zap,
      color: 'text-amber-400',
    },
    {
      category: 'Контекст & Память',
      cmd: 'Что мы сделали только что в предыдущей команде?',
      icon: History,
      color: 'text-amber-400',
    },
    {
      category: 'Контекст & Повтор',
      cmd: 'Повторить предыдущую выполненную команду',
      icon: RotateCcw,
      color: 'text-amber-400',
    },
    {
      category: 'Программирование микрофронтендов',
      cmd: 'Создать новый микрофронтенд плагин в Plugin Studio',
      icon: Code,
      color: 'text-cyan-400',
    },
    {
      category: 'CI/CD & Анализ',
      cmd: 'Запустить цикл CI/CD и сгенерировать рекомендацию по оптимизации кода',
      icon: Terminal,
      color: 'text-cyan-400',
    },
    {
      category: 'Аудит безопасности',
      cmd: 'Запустить аудит безопасности и проверить RLS изоляцию',
      icon: Shield,
      color: 'text-emerald-400',
    },
    {
      category: 'Откат изменений',
      cmd: 'Откатить последнее внедренное изменение кода',
      icon: RotateCcw,
      color: 'text-rose-400',
    },
    {
      category: 'Канбан & Задачи',
      cmd: 'Показать канбан доску и статус задач',
      icon: Layers,
      color: 'text-purple-400',
    },
    {
      category: 'Мультитенантность',
      cmd: 'Переключить контекст тенанта на холдинг ACME',
      icon: Database,
      color: 'text-blue-400',
    },
  ];

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Голосовое программирование портала"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div
        ref={containerRef}
        tabIndex={-1}
        className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-2xl flex flex-col shadow-2xl relative overflow-hidden max-h-[92vh] focus:outline-none"
      >
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
                  ГОЛОСОВОЕ ПРОГРАММИРОВАНИЕ ПОРТАЛА
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-300 font-mono flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 text-amber-400" />
                  Barge-in + Память сессии
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 flex items-center gap-1.5 mt-0.5">
                <span>Тенант: <span className="text-cyan-300 font-semibold">{activeTenant.name}</span> ({activeTenant.schema})</span>
                <span>•</span>
                <span className="text-emerald-400 font-mono text-[10px]">
                  Память: {conversationMemory.length} реплик
                </span>
                {lastEntityTurn?.affectedEntity && (
                  <>
                    <span>•</span>
                    <span className="text-neutral-400 text-[10px] truncate max-w-[120px]" title={lastEntityTurn.affectedEntity}>
                      Объект: {lastEntityTurn.affectedEntity}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onOpenMacroRegistry && (
              <button
                onClick={onOpenMacroRegistry}
                className="p-1.5 rounded-lg border border-neutral-800 text-neutral-400 hover:text-amber-300 hover:bg-neutral-800 transition-colors"
                title="Реестр макросов (Macro Registry)"
              >
                <Sliders className="w-4 h-4" />
              </button>
            )}
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
            <span className={`text-[11px] px-3 py-1 rounded-full font-mono flex items-center gap-1.5 transition-all ${
              isSpeaking 
                ? 'bg-amber-950/90 border border-amber-500 text-amber-200 shadow-lg shadow-amber-950/50 animate-pulse' 
                : isProcessing 
                ? 'bg-cyan-950/80 border border-cyan-600/70 text-cyan-200'
                : 'bg-neutral-800 text-neutral-300'
            }`}>
              {isSpeaking ? (
                <>
                  <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>Агент говорит вслух... (Вы можете перебить голосом или кнопкой!)</span>
                </>
              ) : isProcessing ? (
                <>
                  <span className="w-2.5 h-2.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <span>Исполнение команды в ядре портала и обновление памяти...</span>
                </>
              ) : (
                <>
                  <Mic className="w-3 h-3 text-emerald-400" />
                  <span>
                    {speechRecognitionSupported 
                      ? 'Микрофон активен. Говорите свободно или перебивайте в любой момент.' 
                      : 'Выберите готовую голосовую команду или введите запрос'}
                  </span>
                </>
              )}
            </span>
          </div>

          {/* Central Animated Mic Orb with Barge-In Action */}
          <div className="relative my-2 flex items-center justify-center">
            {isSpeaking && (
              <>
                <div className="absolute w-28 h-28 bg-amber-500/25 rounded-full animate-ping" />
                <div className="absolute w-20 h-20 bg-rose-500/30 rounded-full animate-pulse" />
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
              className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 hover:scale-105 ${
                isSpeaking
                  ? 'bg-gradient-to-tr from-rose-600 via-amber-600 to-rose-500 text-white shadow-rose-500/50 ring-4 ring-amber-400/80 animate-pulse'
                  : isListening
                  ? 'bg-gradient-to-tr from-purple-600 to-cyan-500 text-white shadow-cyan-500/30 ring-2 ring-cyan-400/30'
                  : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
              }`}
              title={
                isSpeaking 
                  ? 'Перебить агента прямо сейчас (Barge-in / Пробел)' 
                  : isListening 
                  ? 'Отключить микрофон' 
                  : 'Включить микрофон'
              }
            >
              {isSpeaking ? (
                <Zap className="w-8 h-8 text-amber-200" />
              ) : isListening ? (
                <Mic className="w-8 h-8" />
              ) : (
                <MicOff className="w-8 h-8" />
              )}
            </button>
          </div>

          {/* Barge-in Interruption Action Button (Prominent when agent speaks) */}
          {isSpeaking ? (
            <div className="mt-3 flex items-center gap-2 animate-bounce">
              <button
                onClick={handleInterrupt}
                className="px-5 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white rounded-full text-xs font-bold flex items-center gap-2 shadow-xl shadow-rose-950/60 ring-2 ring-amber-400/50 transition-all active:scale-95"
              >
                <Zap className="w-4 h-4 fill-white" />
                ПЕРЕБИТЬ АГЕНТА (Barge-in)
                <kbd className="ml-1 px-1.5 py-0.5 bg-black/40 text-[10px] font-mono rounded">Пробел</kbd>
              </button>
            </div>
          ) : (
            <p className="text-xs text-neutral-400 mt-2 max-w-md font-sans">{statusMessage}</p>
          )}

          {/* Audio progress bar if speaking */}
          {isSpeaking && (
            <div className="w-full max-w-xs mt-3 bg-neutral-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-amber-400 to-rose-400 h-full transition-all duration-100 ease-out"
                style={{ width: `${agentSpeechProgress}%` }}
              />
            </div>
          )}
        </div>

        {/* Conversation Dialog Area: VoiceInteractionLog */}
        <div className="p-4 bg-neutral-950/40">
          <VoiceInteractionLog
            turns={conversationMemory}
            isSpeaking={isSpeaking}
            onReplayCommand={(cmd) => handleProcessVoiceInput(cmd)}
            onInterrupt={handleInterrupt}
            onClearLog={handleClearHistory}
          />
        </div>

        {/* Quick Voice Programming & Context Chips */}
        <div className="p-4 bg-neutral-950/80 border-t border-neutral-800">
          <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Команды программирования & Контекстная память:
            </span>
            <span className="text-neutral-500 text-[10px]">
              Клик прерывает речь агента при необходимости
            </span>
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
                    <IconComponent className={`w-3.5 h-3.5 ${item.color} shrink-0 group-hover:scale-110 transition-transform`} />
                    <span className="truncate">«{item.cmd}»</span>
                  </div>
                  <Play className="w-3 h-3 text-neutral-600 group-hover:text-cyan-400 shrink-0 ml-1.5 transition-colors" />
                </button>
              );
            })}
          </div>

          {/* Manual Prompt Input for quiet testing or custom queries */}
          <div className="mt-3 flex items-center gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customInput.trim()) {
                  handleProcessVoiceInput(customInput);
                  setCustomInput('');
                }
              }}
              placeholder="Или введите команду вручную (например: «что мы сделали только что?»)..."
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
              className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-neutral-800 disabled:text-neutral-600 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Send className="w-3 h-3" />
              Исполнить
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono mt-3">
            <span>
              Горячая клавиша: <kbd className="px-1.5 py-0.5 bg-neutral-800 text-neutral-300 rounded">Ctrl+V</kbd> (вызов), <kbd className="px-1.5 py-0.5 bg-neutral-800 text-neutral-300 rounded">Пробел</kbd> (barge-in)
            </span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Перебивание (Barge-in) & Контекстная память
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
