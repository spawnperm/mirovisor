export type TenantVisibility = 'public' | 'private' | 'hidden';

export interface TenantBranding {
  primaryColor: string;
  accentColor: string;
  customTitle: string;
  customLogoUrl?: string;
  themeStyle: 'cyber-dark' | 'emerald-minimal' | 'slate-enterprise' | 'violet-glow';
}

export interface TenantAutoScalingConfig {
  enabled: boolean;
  minPods: number;
  maxPods: number;
  currentPods: number;
  targetCpuUtilizationPct: number;
  targetRpsThreshold: number;
  scaleUpCooldownSec: number;
  scaleDownCooldownSec: number;
  elasticStorageEnabled: boolean;
  storageUsageThresholdPct: number;
  autoExpandChunkMb: number;
  maxStorageCeilingMb: number;
  alertOnScaleEvent: boolean;
  lastScaleEvent?: {
    timestamp: string;
    action: 'scale_up' | 'scale_down' | 'storage_expanded';
    reason: string;
    previousState: string;
    newState: string;
  };
}

export interface TenantConfiguration {
  features: {
    enableCrm: boolean;
    enableLms: boolean;
    enableUniverOffice: boolean;
    enableWebContainers: boolean;
    enableSelfHealingCi: boolean;
  };
  quotas: {
    maxUsers: number;
    storageQuotaMb: number;
    apiRateLimitRps: number;
  };
  branding: TenantBranding;
  autoScaling?: TenantAutoScalingConfig;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  description: string;
  avatarUrl: string;
  visibility: TenantVisibility;
  ownerId: string;
  ownerName: string;
  memberCount: number;
  schema: string; // e.g. "tenant_acme"
  storageQuotaMb: number;
  storageUsedMb: number;
  createdAt: string;
  tags: string[];
  parentTenantId?: string; // ID родительского тенанта (для иерархии холдинга/суб-тенантов)
  tier?: 'holding' | 'division' | 'project' | 'sandbox';
  config?: TenantConfiguration;
}

export type UserRoleName = 'SuperAdmin' | 'Admin' | 'CRM Manager' | 'Developer' | 'Moderator' | 'Member' | 'Guest';

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  avatarUrl: string;
  bio: string;
  completedCourses: string[];
  tenantRoles: Record<string, UserRoleName>; // tenantId -> roleName
  followingTenants: string[];
  followingUsers: string[];
}

export type CardColumn = 'ideas' | 'in_progress' | 'collected' | 'deferred';
export type CardType = 'security' | 'architecture' | 'testing' | 'devops' | 'ux' | 'docs';
export type CardPriority = 'critical' | 'high' | 'medium' | 'low';

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface CardComment {
  id: string;
  author: string;
  avatar: string;
  text: string;
  timestamp: string;
}

export interface KanbanCard {
  id: string;
  title: string;
  description: string;
  type: CardType;
  priority: CardPriority;
  column: CardColumn;
  source: string; // e.g. "CI/CD Log #849 · SAST Semgrep", "Prometheus p95 alert"
  sourceSnippet?: string;
  attachments: string[];
  checklist: ChecklistItem[];
  createdBy: string; // e.g. "SecurityAgent", "DevOpsAgent"
  assignedTo?: string;
  createdAt: string;
  movedAt?: string;
  comments: CardComment[];
  suggestedPatch?: string;
  // Feedback & Rollback tracking
  rejectionReason?: string;
  userRating?: number; // 1 to 5
  ratingFeedback?: string;
  rolledBack?: boolean;
  rollbackCommitHash?: string;
  implementationPr?: string;
}

export interface PluginDependency {
  pluginId: string;
  minVersion: string;
  optional?: boolean;
}

export interface PluginConflict {
  pluginId: string;
  reason: string;
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
  dependencies: PluginDependency[];
  conflicts: PluginConflict[];
  permissions: string[];
  category: 'crm' | 'security' | 'devtools' | 'office' | 'analytics';
  priceRub: number;
  installedInTenants: string[]; // tenantIds
  status: 'active' | 'updating' | 'disabled';
}

export interface BackstagePluginCode {
  id: string;
  title: string;
  version: string;
  author: string;
  category: PluginManifest['category'];
  description: string;
  extensionPoint: 'ui-dashboard-card' | 'mcp-tool-bridge' | 'event-pipeline' | 'rest-api-route';
  typescriptCode: string;
  permissions: string[];
  lifecycleState: 'discovered' | 'validating' | 'registered' | 'installed' | 'active' | 'rejected';
}

export interface CrmContact {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  stage: 'Lead' | 'Contacted' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';
  valueRub: number;
  tenantId: string;
}

export interface CrmDeal {
  id: string;
  title: string;
  company: string;
  amountRub: number;
  stage: 'discovery' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  assignedTo: string;
  updatedAt: string;
  tenantId: string;
}

export interface CourseLesson {
  id: string;
  title: string;
  durationMinutes: number;
  content: string;
}

export interface LmsCourse {
  id: string;
  title: string;
  description: string;
  badge: string;
  difficulty: 'Junior' | 'Middle' | 'Senior' | 'Lead';
  lessonsCount: number;
  requiredForRoles: string[]; // Role IDs/names that require this course
  lessons: CourseLesson[];
  completedCount: number;
}

export interface SocialPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  tenantId: string;
  tenantName: string;
  content: string;
  tags: string[];
  likes: number;
  commentsCount: number;
  timestamp: string;
}

export type ScannerType = 'CodeQL' | 'Snyk' | 'Trivy' | 'OWASP ZAP' | 'Gitleaks' | 'CrowdSec';

export interface SecurityFinding {
  id: string;
  scanner: ScannerType;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  fileOrUrl: string;
  description: string;
  cwe: string;
  status: 'open' | 'remediated' | 'ignored';
  detectedAt: string;
  remediationSnippet?: string;
  remediationExplanation?: string;
}

export interface PipelineStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  durationSec: number;
  logs: string[];
}

export interface PipelineBuild {
  id: string;
  buildNumber: number;
  branch: string;
  commitSha: string;
  commitMessage: string;
  author: string;
  status: 'running' | 'success' | 'failed' | 'healing';
  startedAt: string;
  durationSec: number;
  environment: 'staging' | 'production';
  steps: PipelineStep[];
  findings: SecurityFinding[];
  natsEventPublished: boolean;
  selfHealSuggested?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  tenantId: string;
  action: string;
  details: string;
  status: 'success' | 'warning' | 'error';
}

export interface SystemMetric {
  tenantId: string;
  rps: number;
  p95LatencyMs: number;
  errorRatePercent: number;
  cpuUsage: number;
  memoryUsageMb: number;
  dbQueriesPerSec: number;
}

export interface ResourceUtilizationPoint {
  timestamp: string; // ISO or HH:mm
  timeLabel: string;
  cpuCoresUsed: number;
  cpuLimitCores: number;
  cpuPercent: number;
  memoryUsedMb: number;
  memoryLimitMb: number;
  storageUsedGb: number;
  storageLimitGb: number;
  activePods: number;
  iops: number;
  bandwidthMbps: number;
}

export interface HistoricalTrendPoint {
  timestamp: string;
  dateLabel: string;
  storageUsedGb: number;
  storageQuotaGb: number;
  apiRps: number;
  storageTrendGb?: number;
  rpsTrend?: number;
  growthRatePct?: number;
}

export type ToastType = 'info' | 'success' | 'warning' | 'error' | 'security';

export interface ToastNotification {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  timestamp: string;
  durationMs?: number;
  actionLabel?: string;
  actionCallback?: () => void;
}

export type EisenhowerQuadrantId = 
  | 'q1_urgent_important' 
  | 'q2_not_urgent_important' 
  | 'q3_urgent_not_important' 
  | 'q4_not_urgent_not_important';

export type TelemetryEventType = 
  | 'navigation_tab' 
  | 'modal_toggle' 
  | 'voice_command' 
  | 'kanban_interaction' 
  | 'build_trigger';

export interface ProductTelemetryEvent {
  id: string;
  timestamp: string;
  type: TelemetryEventType;
  target: string;
  metadata?: Record<string, any>;
  tenantId: string;
  userId: string;
}

export interface ClientLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  service: string;
  message: string;
  stack?: string;
  context?: Record<string, any>;
  orgId: string;
  url?: string;
}

export interface WebVitalsMetrics {
  lcp?: number;
  fid?: number;
  inp?: number;
  cls?: number;
  fcp?: number;
  ttfb?: number;
  lastUpdated: string;
}

export interface RlsPolicy {
  id: string;
  tenantId: string;
  tableName: string;
  policyName: string;
  command: 'ALL' | 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  roles: string;
  usingExpression: string;
  withCheckExpression?: string;
  isPermissive: boolean;
  status: 'active' | 'draft' | 'deprecated';
  createdAt: string;
  description: string;
}


