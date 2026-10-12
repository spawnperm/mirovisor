/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Memoized selectors and shallow hooks for Zustand AppStore.
 * Prevents unnecessary re-renders when unrelated store data changes.
 */

import { useShallow } from 'zustand/react/shallow';
import { AppState, useAppStore } from './useAppStore';

// Pure selector functions (for unit testing and direct store queries)
export const selectNavigationState = (state: AppState) => ({
  activeTab: state.activeTab,
  setActiveTab: state.setActiveTab,
  isSearchOpen: state.isSearchOpen,
  setSearchOpen: state.setSearchOpen,
  isTerminalOpen: state.isTerminalOpen,
  setTerminalOpen: state.setTerminalOpen,
  isVoiceOpen: state.isVoiceOpen,
  setVoiceOpen: state.setVoiceOpen,
  isMacroRegistryOpen: state.isMacroRegistryOpen,
  setMacroRegistryOpen: state.setMacroRegistryOpen,
  isA11yPanelOpen: state.isA11yPanelOpen,
  setA11yPanelOpen: state.setA11yPanelOpen,
  resetUiState: state.resetUiState,
});

export const selectA11yPreferences = (state: AppState) => ({
  highContrast: state.highContrast,
  fontSizePreference: state.fontSizePreference,
  reducedMotion: state.reducedMotion,
  enhancedFocusRings: state.enhancedFocusRings,
  announcementMessage: state.announcementMessage,
});

export const selectTenantsAndUserState = (state: AppState) => ({
  tenants: state.tenants,
  activeTenant: state.activeTenant,
  currentUser: state.currentUser,
  setActiveTenant: state.setActiveTenant,
  updateTenantConfig: state.updateTenantConfig,
  createTenant: state.createTenant,
});

export const selectKanbanState = (state: AppState) => ({
  cards: state.cards,
  moveCard: state.moveCard,
  updateCard: state.updateCard,
  addCard: state.addCard,
  rateCard: state.rateCard,
  rollbackCard: state.rollbackCard,
});

export const selectPipelinesState = (state: AppState) => ({
  builds: state.builds,
  triggerBuild: state.triggerBuild,
});

export const selectPluginsState = (state: AppState) => ({
  plugins: state.plugins,
  installPlugin: state.installPlugin,
  uninstallPlugin: state.uninstallPlugin,
  addPluginManifest: state.addPluginManifest,
});

export const selectCrmState = (state: AppState) => ({
  crmContacts: state.crmContacts,
  crmDeals: state.crmDeals,
  addCrmContact: state.addCrmContact,
  addCrmDeal: state.addCrmDeal,
});

export const selectLmsState = (state: AppState) => ({
  courses: state.courses,
  completeCourse: state.completeCourse,
});

export const selectSocialState = (state: AppState) => ({
  posts: state.posts,
  addPost: state.addPost,
});

export const selectSecurityState = (state: AppState) => ({
  securityFindings: state.securityFindings,
  pushFindingToKanban: state.pushFindingToKanban,
  remediateFinding: state.remediateFinding,
  addSecurityFinding: state.addSecurityFinding,
});

export const selectDevToolsState = (state: AppState) => ({
  voiceMemory: state.voiceMemory,
  setVoiceMemory: state.setVoiceMemory,
  macros: state.macros,
  setMacros: state.setMacros,
  executeVoiceCommand: state.executeVoiceCommand,
  executeMacro: state.executeMacro,
});

export const selectThemeState = (state: AppState) => ({
  theme: state.theme,
  setTheme: state.setTheme,
  toggleTheme: state.toggleTheme,
});

export const selectClientLogsState = (state: AppState) => ({
  clientLogs: state.clientLogs,
  addClientLog: state.addClientLog,
  clearClientLogs: state.clearClientLogs,
});

export const selectRlsPoliciesState = (state: AppState) => ({
  rlsPolicies: state.rlsPolicies,
  saveRlsPolicy: state.saveRlsPolicy,
  deleteRlsPolicy: state.deleteRlsPolicy,
});

// Domain-specific custom hooks using useShallow to prevent unnecessary component re-renders
export const useNavigationSlice = () => useAppStore(useShallow(selectNavigationState));
export const useA11ySlice = () => useAppStore(useShallow(selectA11yPreferences));
export const useTenantsSlice = () => useAppStore(useShallow(selectTenantsAndUserState));
export const useKanbanSlice = () => useAppStore(useShallow(selectKanbanState));
export const usePipelinesSlice = () => useAppStore(useShallow(selectPipelinesState));
export const usePluginsSlice = () => useAppStore(useShallow(selectPluginsState));
export const useCrmSlice = () => useAppStore(useShallow(selectCrmState));
export const useLmsSlice = () => useAppStore(useShallow(selectLmsState));
export const useSocialSlice = () => useAppStore(useShallow(selectSocialState));
export const useSecuritySlice = () => useAppStore(useShallow(selectSecurityState));
export const useDevToolsSlice = () => useAppStore(useShallow(selectDevToolsState));
export const useThemeSlice = () => useAppStore(useShallow(selectThemeState));
export const useClientLogsSlice = () => useAppStore(useShallow(selectClientLogsState));
export const useRlsPoliciesSlice = () => useAppStore(useShallow(selectRlsPoliciesState));

// Primitive selector: returns a single primitive value without triggering re-renders unless the scalar count changes
export const useMetricsSlice = () => useAppStore((state) => state.metrics);
export const useInProgressCardsCount = () =>
  useAppStore((state) => state.cards.filter((c) => c.column === 'in_progress').length);

