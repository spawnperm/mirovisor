import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Info, 
  XCircle, 
  X, 
  Bell,
  ArrowRight
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { ToastNotification, ToastType } from '../../types';

interface ToastItemProps {
  toast: ToastNotification;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(100);

  const duration = toast.durationMs || 5000;

  useEffect(() => {
    if (isHovered) return;

    const interval = 50;
    const decrement = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          onDismiss(toast.id);
          return 0;
        }
        return prev - decrement;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [duration, isHovered, onDismiss, toast.id]);

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'security':
        return <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400 shrink-0" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-cyan-400 shrink-0" />;
    }
  };

  const getBorderColor = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/40 bg-neutral-900/95 shadow-emerald-950/40';
      case 'security':
        return 'border-rose-500/50 bg-neutral-900/95 shadow-rose-950/40';
      case 'warning':
        return 'border-amber-500/40 bg-neutral-900/95 shadow-amber-950/40';
      case 'error':
        return 'border-red-500/40 bg-neutral-900/95 shadow-red-950/40';
      case 'info':
      default:
        return 'border-cyan-500/40 bg-neutral-900/95 shadow-cyan-950/40';
    }
  };

  const getProgressBarColor = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-400';
      case 'security':
        return 'bg-rose-400';
      case 'warning':
        return 'bg-amber-400';
      case 'error':
        return 'bg-red-400';
      case 'info':
      default:
        return 'bg-cyan-400';
    }
  };

  return (
    <div
      role="alert"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative w-84 rounded-xl border p-3 shadow-xl backdrop-blur-md overflow-hidden transition-all duration-200 animate-in slide-in-from-right-5 fade-in ${getBorderColor(
        toast.type
      )}`}
    >
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5">{getToastIcon(toast.type)}</div>

        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-bold text-white truncate tracking-wide font-sans">
              {toast.title}
            </h4>
            <span className="text-[10px] font-mono text-neutral-400 shrink-0">
              {toast.timestamp}
            </span>
          </div>

          <p className="text-[11px] text-neutral-300 mt-0.5 leading-snug line-clamp-3">
            {toast.message}
          </p>

          {toast.actionLabel && (
            <button
              onClick={() => {
                toast.actionCallback?.();
                onDismiss(toast.id);
              }}
              className="mt-2 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              <span>{toast.actionLabel}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        <button
          onClick={() => onDismiss(toast.id)}
          aria-label="Закрыть уведомление"
          className="absolute top-2 right-2 text-neutral-400 hover:text-white p-1 rounded transition-colors focus-visible:ring-1 focus-visible:ring-cyan-400 focus:outline-none"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Auto-dismiss countdown bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-800">
        <div
          className={`h-full transition-all ease-linear ${getProgressBarColor(toast.type)}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const toasts = useAppStore((state) => state.toasts);
  const dismissToast = useAppStore((state) => state.dismissToast);
  const clearToasts = useAppStore((state) => state.clearToasts);

  if (toasts.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Системные уведомления"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-auto max-w-sm"
    >
      {toasts.length > 2 && (
        <div className="flex justify-end pr-1">
          <button
            onClick={clearToasts}
            className="text-[10px] font-mono text-neutral-400 hover:text-white px-2 py-0.5 rounded bg-neutral-900/80 border border-neutral-800 shadow-xs"
          >
            Очистить все ({toasts.length})
          </button>
        </div>
      )}

      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>
  );
};
