export type MacroActionType =
  | 'trigger_build'
  | 'security_audit'
  | 'post_social'
  | 'scaffold_plugin'
  | 'switch_tenant'
  | 'navigate_tab'
  | 'rollback_code';

export interface MacroAction {
  id: string;
  type: MacroActionType;
  title: string;
  description: string;
  target?: string;
}

export interface VoiceMacro {
  id: string;
  keyword: string; // e.g. "Deploy Nightly"
  name: string;
  description: string;
  actions: MacroAction[];
  isPredefined?: boolean;
  createdAt?: string;
  lastRunAt?: string;
  executionCount?: number;
  icon?: string;
  color?: string;
}
