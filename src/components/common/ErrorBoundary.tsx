import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw, Terminal, RefreshCw, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { LogUtility } from '../../services/logUtility';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  expandedDetails: boolean;
  copied: boolean;
}

/**
 * Global ErrorBoundary Component
 * Catches and logs runtime JavaScript errors anywhere in their child component tree,
 * displays a resilient recovery UI, and provides options to recover or reset state.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
    expandedDetails: false,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled runtime error:', error, errorInfo);
    LogUtility.error(
      `React ErrorBoundary: ${error.message || 'Unhandled component render error'}`,
      error,
      { componentStack: errorInfo.componentStack },
      'React-ErrorBoundary'
    );
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      expandedDetails: false,
    });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleFullReset = () => {
    // Clear potentially corrupted transient view states in sessionStorage/localStorage if requested
    try {
      sessionStorage.clear();
    } catch (e) {
      // ignore
    }
    this.handleReset();
    window.location.reload();
  };

  private handleCopyError = () => {
    const text = `Error: ${this.state.error?.message || 'Unknown'}\nStack: ${this.state.error?.stack || ''}\nComponentStack: ${this.state.errorInfo?.componentStack || ''}`;
    navigator.clipboard.writeText(text);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2000);
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen w-full bg-neutral-950 text-neutral-100 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-neutral-900 border border-rose-900/60 rounded-3xl p-6 shadow-2xl relative overflow-hidden space-y-5">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-950/80 border border-rose-700/60 rounded-2xl text-rose-400 shrink-0 shadow-lg">
                <AlertOctagon className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white tracking-wide font-mono">
                    СИСТЕМНЫЙ СБОЙ В ИНТЕРФЕЙСЕ (RUNTIME ERROR)
                  </h2>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Произошла непредвиденная ошибка времени выполнения в одном из компонентов платформы. Глобальный перехватчик ErrorBoundary изолировал сбой, предотвратив падение браузера.
                </p>
              </div>
            </div>

            {/* Error Message Box */}
            <div className="p-3.5 bg-black/80 border border-neutral-800 rounded-xl space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between text-neutral-400 text-[11px]">
                <span className="text-rose-400 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  {this.state.error?.name || 'Error'}:
                </span>
                <button
                  onClick={this.handleCopyError}
                  className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center gap-1 text-[10px] transition-colors"
                  title="Скопировать стек ошибки"
                >
                  {this.state.copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{this.state.copied ? 'Скопировано!' : 'Копировать'}</span>
                </button>
              </div>
              <p className="text-rose-300 font-semibold break-words">
                {this.state.error?.message || 'Неизвестная ошибка рендеринга'}
              </p>
            </div>

            {/* Stack trace toggle */}
            <div className="border border-neutral-850 rounded-xl overflow-hidden bg-neutral-950/60">
              <button
                onClick={() => this.setState({ expandedDetails: !this.state.expandedDetails })}
                className="w-full px-3 py-2 flex items-center justify-between text-xs font-mono text-neutral-400 hover:text-neutral-200 transition-colors"
              >
                <span>Трассировка стека вызовов (Component Stack)</span>
                {this.state.expandedDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {this.state.expandedDetails && (
                <div className="p-3 bg-black border-t border-neutral-850 font-mono text-[10px] text-neutral-400 overflow-x-auto max-h-48 whitespace-pre leading-relaxed">
                  {this.state.errorInfo?.componentStack || this.state.error?.stack || 'Нет дополнительных сведений о стеке.'}
                </div>
              )}
            </div>

            {/* Recovery Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <button
                onClick={this.handleReset}
                className="flex-1 py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Восстановить UI (Перерендерить)</span>
              </button>

              <button
                onClick={this.handleFullReset}
                className="py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white font-mono text-xs rounded-xl border border-neutral-700 transition-all flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Полная перезагрузка</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
