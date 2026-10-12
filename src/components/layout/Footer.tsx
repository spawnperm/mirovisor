import React from 'react';
import { Terminal, Mic, ShieldCheck, Activity, Database, CheckCircle2, Lock } from 'lucide-react';
import { Tenant } from '../../types';

interface FooterProps {
  activeTenant: Tenant;
  onOpenTerminal: () => void;
  onOpenVoice: () => void;
  cardsInProgressCount: number;
}

export const Footer: React.FC<FooterProps> = ({
  activeTenant,
  onOpenTerminal,
  onOpenVoice,
  cardsInProgressCount,
}) => {
  return (
    <footer className="bg-neutral-950 border-t border-neutral-850 px-4 py-1.5 flex flex-wrap items-center justify-between gap-3 text-[11px] text-neutral-400 font-mono z-30">
      {/* Left controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenTerminal}
          className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors"
        >
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span>[Терминал xterm]</span>
        </button>

        <button
          onClick={onOpenVoice}
          className="flex items-center gap-1.5 hover:text-purple-400 transition-colors"
        >
          <Mic className="w-3.5 h-3.5 text-purple-400" />
          <span>[Голос Ctrl+V]</span>
        </button>

        <span className="text-neutral-700">|</span>

        <span className="flex items-center gap-1.5 text-emerald-400">
          <Lock className="w-3 h-3" />
          <span>RLS FORCE: {activeTenant.schema}</span>
        </span>
      </div>

      {/* Right Telemetry indicators */}
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1 text-cyan-300">
          <ShieldCheck className="w-3.5 h-3.5" />
          ASVS 5.0 L2: 94%
        </span>

        <span className="text-neutral-700">|</span>

        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          NATS JetStream: OK
        </span>

        <span className="text-neutral-700">|</span>

        <span className="flex items-center gap-1">
          WIP: <strong className="text-white">{cardsInProgressCount}/3</strong>
        </span>

        <span className="text-neutral-700">|</span>

        <span className="text-neutral-500">
          МИРОВИЗОР · 2026-10-12
        </span>
      </div>
    </footer>
  );
};
