import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { NavTabId } from '../components/layout/Header';
import { TelemetryEventType } from '../types';

/**
 * useProductTelemetry Hook
 * Automatically tracks user interactions across navigation tabs, modals, and voice commands,
 * aggregating telemetry metrics and feeding events into the observability infrastructure.
 */
export function useProductTelemetry() {
  const activeTab = useAppStore((state) => state.activeTab);
  const isSearchOpen = useAppStore((state) => state.isSearchOpen);
  const isTerminalOpen = useAppStore((state) => state.isTerminalOpen);
  const isVoiceOpen = useAppStore((state) => state.isVoiceOpen);
  const isMacroRegistryOpen = useAppStore((state) => state.isMacroRegistryOpen);
  const recordTelemetryEvent = useAppStore((state) => state.recordTelemetryEvent);

  const prevTabRef = useRef<NavTabId>(activeTab);
  const tabStartTimeRef = useRef<number>(Date.now());

  // 1. Track Tab Navigation Interactions
  useEffect(() => {
    const prevTab = prevTabRef.current;
    if (prevTab !== activeTab) {
      const durationSec = Math.round((Date.now() - tabStartTimeRef.current) / 1000);

      recordTelemetryEvent({
        type: 'navigation_tab',
        target: activeTab,
        metadata: {
          previousTab: prevTab,
          dwellTimeSeconds: durationSec,
          screenResolution: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'unknown',
        },
      });

      prevTabRef.current = activeTab;
      tabStartTimeRef.current = Date.now();
    }
  }, [activeTab, recordTelemetryEvent]);

  // 2. Track Modal Toggles
  useEffect(() => {
    if (isSearchOpen) {
      recordTelemetryEvent({
        type: 'modal_toggle',
        target: 'UniversalSearchModal',
        metadata: { action: 'opened', trigger: 'shortcut_or_click' },
      });
    }
  }, [isSearchOpen, recordTelemetryEvent]);

  useEffect(() => {
    if (isTerminalOpen) {
      recordTelemetryEvent({
        type: 'modal_toggle',
        target: 'PortalTerminalDrawer',
        metadata: { action: 'opened' },
      });
    }
  }, [isTerminalOpen, recordTelemetryEvent]);

  useEffect(() => {
    if (isVoiceOpen) {
      recordTelemetryEvent({
        type: 'modal_toggle',
        target: 'VoiceControlModal',
        metadata: { action: 'opened' },
      });
    }
  }, [isVoiceOpen, recordTelemetryEvent]);

  useEffect(() => {
    if (isMacroRegistryOpen) {
      recordTelemetryEvent({
        type: 'modal_toggle',
        target: 'MacroRegistryModal',
        metadata: { action: 'opened' },
      });
    }
  }, [isMacroRegistryOpen, recordTelemetryEvent]);

  // Manual event dispatcher for components
  const trackCustomInteraction = useCallback(
    (type: TelemetryEventType, target: string, metadata?: Record<string, any>) => {
      recordTelemetryEvent({
        type,
        target,
        metadata,
      });
    },
    [recordTelemetryEvent]
  );

  return { trackCustomInteraction };
}
