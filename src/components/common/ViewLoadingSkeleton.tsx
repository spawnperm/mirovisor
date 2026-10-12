import React from 'react';
import { Cpu, Loader2 } from 'lucide-react';

interface ViewLoadingSkeletonProps {
  label?: string;
}

export const ViewLoadingSkeleton: React.FC<ViewLoadingSkeletonProps> = ({
  label = 'Загрузка модуля...',
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col h-full w-full bg-neutral-950 p-6 items-center justify-center overflow-hidden animate-in fade-in duration-150"
    >
      <div className="flex flex-col items-center gap-4 max-w-sm text-center">
        {/* Glowing pulse ring */}
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600/30 to-indigo-600/30 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-950/50 animate-pulse">
            <Cpu className="w-7 h-7 text-cyan-400 animate-spin" style={{ animationDuration: '4s' }} />
          </div>
          <div className="absolute -inset-1 rounded-2xl bg-cyan-500/10 blur-sm -z-10" />
        </div>

        {/* Text and status */}
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide flex items-center justify-center gap-2 font-mono">
            <span>{label}</span>
          </h3>
          <p className="text-[11px] text-neutral-400 mt-1 font-mono">
            Асинхронная инициализация микрофронтенда через React.lazy()
          </p>
        </div>

        {/* Skeleton Shimmer Grid */}
        <div className="w-64 space-y-2 pt-2">
          <div className="h-2.5 bg-neutral-900 rounded-full overflow-hidden relative">
            <div className="h-full bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent w-full animate-shimmer" />
          </div>
          <div className="h-2 bg-neutral-900/60 rounded-full w-3/4 mx-auto" />
        </div>
      </div>
    </div>
  );
};
