import React, { useRef } from 'react';
import {
  Eye,
  Sliders,
  Type,
  Activity,
  Sparkles,
  X,
  Check,
  RotateCcw,
  Volume2,
  Keyboard,
} from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useAppStore } from '../../store/useAppStore';

interface AccessibilitySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccessibilitySettingsModal: React.FC<AccessibilitySettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const modalRef = useRef<HTMLDivElement | null>(null);

  const {
    highContrast,
    setHighContrast,
    fontSizePreference,
    setFontSizePreference,
    reducedMotion,
    setReducedMotion,
    enhancedFocusRings,
    setEnhancedFocusRings,
    announceToScreenReader,
  } = useAppStore();

  const { containerRef } = useFocusTrap({
    isOpen,
    onClose,
    initialFocusRef: modalRef,
  });

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="a11y-modal-title"
      aria-describedby="a11y-modal-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        ref={containerRef}
        tabIndex={-1}
        className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col focus:outline-none"
      >
        {/* Modal Header */}
        <div className="p-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h2 id="a11y-modal-title" className="text-sm font-bold text-white">
                Настройки доступности (WCAG 2.1 AA)
              </h2>
              <p id="a11y-modal-desc" className="text-[11px] text-neutral-400">
                Персонализация интерфейса для удобства чтения, навигации и управления
              </p>
            </div>
          </div>
          <button
            ref={modalRef as unknown as React.RefObject<HTMLButtonElement>}
            type="button"
            onClick={onClose}
            aria-label="Закрыть настройки доступности"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 focus-visible:ring-2 focus-visible:ring-cyan-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto max-h-[70vh]">
          {/* High Contrast Mode */}
          <div className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800/80 hover:border-neutral-700 transition-colors">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-semibold text-white">Режим повышенной контрастности (OLED)</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Максимальный контраст текста и границ (&gt;7:1), удаление приглушенных градиентов для слабовидящих пользователей.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={highContrast}
              onClick={() => {
                const next = !highContrast;
                setHighContrast(next);
                announceToScreenReader(next ? 'Режим высокой контрастности включен' : 'Режим высокой контрастности выключен');
              }}
              className={`shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                highContrast ? 'bg-cyan-500' : 'bg-neutral-800'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  highContrast ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Font Scaling */}
          <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800/80 space-y-2.5">
            <div className="flex items-center gap-2">
              <Type className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-semibold text-white">Размер шрифта интерфейса</span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Масштабирование текста для удобного восприятия без нарушения сетки.
            </p>
            <div className="grid grid-cols-3 gap-2 pt-1" role="radiogroup" aria-label="Размер шрифта">
              {[
                { id: 'normal', label: 'Стандарт (100%)', size: '100%' },
                { id: 'large', label: 'Увеличенный (115%)', size: '115%' },
                { id: 'xlarge', label: 'Крупный (130%)', size: '130%' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="radio"
                  aria-checked={fontSizePreference === f.id}
                  onClick={() => {
                    setFontSizePreference(f.id as 'normal' | 'large' | 'xlarge');
                    announceToScreenReader(`Размер шрифта установлен: ${f.label}`);
                  }}
                  className={`p-2 rounded-lg border text-center transition-all ${
                    fontSizePreference === f.id
                      ? 'bg-cyan-950/40 border-cyan-500/80 text-cyan-300 font-bold shadow-xs'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <div className="font-mono text-[11px]">{f.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Reduced Motion */}
          <div className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800/80 hover:border-neutral-700 transition-colors">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-semibold text-white">Уменьшение движения (Reduced Motion)</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Отключение сложных анимаций и пульсаций D3/Recharts для предотвращения вестибулярного дискомфорта.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={reducedMotion}
              onClick={() => {
                const next = !reducedMotion;
                setReducedMotion(next);
                announceToScreenReader(next ? 'Анимации отключены' : 'Анимации включены');
              }}
              className={`shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                reducedMotion ? 'bg-cyan-500' : 'bg-neutral-800'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  reducedMotion ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Enhanced Focus Rings */}
          <div className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800/80 hover:border-neutral-700 transition-colors">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Keyboard className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold text-white">Усиленные рамки клавиатурного фокуса</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Яркая контрастная рамка (3px) вокруг активного элемента при навигации клавишей Tab.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enhancedFocusRings}
              onClick={() => {
                const next = !enhancedFocusRings;
                setEnhancedFocusRings(next);
                announceToScreenReader(next ? 'Усиленные индикаторы фокуса включены' : 'Усиленные индикаторы фокуса выключены');
              }}
              className={`shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                enhancedFocusRings ? 'bg-cyan-500' : 'bg-neutral-800'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  enhancedFocusRings ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Quick Keyboard Shortcuts Reference */}
          <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-neutral-300">
              <Keyboard className="w-3.5 h-3.5 text-neutral-400" />
              <span>Быстрые клавиши платформы:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-neutral-400">
              <div className="flex items-center justify-between bg-neutral-900 px-2.5 py-1.5 rounded border border-neutral-850">
                <span>Кросс-поиск:</span>
                <kbd className="px-1.5 py-0.5 bg-neutral-800 text-neutral-200 rounded">⌘K / Ctrl+K</kbd>
              </div>
              <div className="flex items-center justify-between bg-neutral-900 px-2.5 py-1.5 rounded border border-neutral-850">
                <span>Голосовой помощник:</span>
                <kbd className="px-1.5 py-0.5 bg-neutral-800 text-neutral-200 rounded">Ctrl+V</kbd>
              </div>
              <div className="flex items-center justify-between bg-neutral-900 px-2.5 py-1.5 rounded border border-neutral-850">
                <span>Закрыть окно:</span>
                <kbd className="px-1.5 py-0.5 bg-neutral-800 text-neutral-200 rounded">ESC</kbd>
              </div>
              <div className="flex items-center justify-between bg-neutral-900 px-2.5 py-1.5 rounded border border-neutral-850">
                <span>Переход по фокусу:</span>
                <kbd className="px-1.5 py-0.5 bg-neutral-800 text-neutral-200 rounded">Tab / Shift+Tab</kbd>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setHighContrast(false);
              setFontSizePreference('normal');
              setReducedMotion(false);
              setEnhancedFocusRings(true);
              announceToScreenReader('Настройки сброшены к стандартным значениям');
            }}
            className="flex items-center gap-1.5 text-[11px] text-neutral-400 hover:text-neutral-200 px-2 py-1 rounded transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Сбросить по умолчанию</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-cyan-950/40 transition-colors"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
};
