import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Sparkles, Volume2, CheckCircle2, CornerDownLeft, Play } from 'lucide-react';
import { Tenant } from '../../types';

interface VoiceControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTenant: Tenant;
  onExecuteVoiceCommand: (commandText: string) => void;
}

export const VoiceControlModal: React.FC<VoiceControlModalProps> = ({
  isOpen,
  onClose,
  activeTenant,
  onExecuteVoiceCommand,
}) => {
  const [isListening, setIsListening] = useState<boolean>(true);
  const [spokenText, setSpokenText] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('Слушаю команду (Gemini Live WebSocket подключен)...');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setIsListening(true);
      setStatusMessage('Говорите команду (Gemini Live Audio stream active)...');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const quickCommands = [
    'Запустить аудит безопасности и собрать телеметрию',
    'Проверить RLS изоляцию в текущем тенанте',
    'Создать рекомендацию по оптимизации NATS квот',
    'Откатить последнее внедренное изменение',
    'Сгенерировать квартальный отчет Univer Office',
  ];

  const handleSimulateVoice = (cmd: string) => {
    setSpokenText(cmd);
    setIsProcessing(true);
    setStatusMessage(`Распознано: "${cmd}"... Вызов Gemini Live Function...`);

    setTimeout(() => {
      setIsProcessing(false);
      onExecuteVoiceCommand(cmd);
      setStatusMessage(`Команда успешно исполнена через FunctionCall!`);
      setTimeout(() => {
        onClose();
      }, 1200);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-lg p-6 flex flex-col items-center text-center shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white text-sm"
        >
          ✕
        </button>

        {/* Pulse Orb */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute w-28 h-28 bg-purple-500/20 rounded-full animate-ping" />
          <div className="absolute w-20 h-20 bg-cyan-500/30 rounded-full animate-pulse" />
          <button
            onClick={() => setIsListening(!isListening)}
            className="relative z-10 w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 to-cyan-500 text-white flex items-center justify-center shadow-xl shadow-cyan-500/30 hover:scale-105 transition-transform"
          >
            {isListening ? <Mic className="w-8 h-8" /> : <MicOff className="w-8 h-8" />}
          </button>
        </div>

        <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          GEMINI LIVE ГОЛОСОВОЙ КОНТРОЛЛЕР
        </h3>
        <p className="text-xs text-neutral-400 mb-4 max-w-xs">{statusMessage}</p>

        {/* Spoken transcript box */}
        <div className="w-full bg-neutral-950 p-3 rounded-xl border border-neutral-800 text-xs text-left mb-4 min-h-12 flex items-center justify-between">
          <span className="text-neutral-300 font-mono">
            {spokenText || 'Произнесите или выберите команду ниже...'}
          </span>
          {isProcessing && (
            <span className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        {/* Quick Voice Suggestion Chips */}
        <div className="w-full text-left mb-2">
          <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider block mb-2">
            Быстрые голосовые интенты:
          </span>
          <div className="space-y-1.5">
            {quickCommands.map((cmd) => (
              <button
                key={cmd}
                onClick={() => handleSimulateVoice(cmd)}
                className="w-full p-2 bg-neutral-950/70 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-xs text-neutral-300 text-left flex items-center justify-between group transition-colors"
              >
                <span>«{cmd}»</span>
                <Play className="w-3 h-3 text-neutral-600 group-hover:text-cyan-400 transition-colors" />
              </button>
            ))}
          </div>
        </div>

        <div className="text-[11px] text-neutral-500 font-mono mt-3">
          Горячая клавиша: <kbd className="px-1.5 py-0.5 bg-neutral-800 text-neutral-300 rounded">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-neutral-800 text-neutral-300 rounded">V</kbd>
        </div>
      </div>
    </div>
  );
};
