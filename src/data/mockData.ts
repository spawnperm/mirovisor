import {
  Tenant,
  User,
  KanbanCard,
  PluginManifest,
  CrmContact,
  CrmDeal,
  LmsCourse,
  SocialPost,
  SecurityFinding,
  AuditLogEntry,
  SystemMetric,
  PipelineBuild,
  BackstagePluginCode,
} from '../types';

export const INITIAL_TENANTS: Tenant[] = [
  {
    id: 'tenant_acme',
    name: 'Acme Enterprise',
    slug: 'acme-corp',
    description: 'Корпоративное пространство холдинга Acme: ERP, финансы и защищённые транзакции.',
    avatarUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=120&auto=format&fit=crop&q=80',
    visibility: 'private',
    ownerId: 'usr_superadmin',
    ownerName: 'Алексей Смирнов',
    memberCount: 142,
    schema: 'tenant_acme',
    storageQuotaMb: 10240,
    storageUsedMb: 4180,
    createdAt: '2026-01-15',
    tags: ['Финансы', 'ERP', 'ASVS Level 2', 'RLS Force'],
    config: {
      features: {
        enableCrm: true,
        enableLms: true,
        enableUniverOffice: true,
        enableWebContainers: true,
        enableSelfHealingCi: true,
      },
      quotas: {
        maxUsers: 250,
        storageQuotaMb: 10240,
        apiRateLimitRps: 500,
      },
      branding: {
        primaryColor: '#0ea5e9', // cyan/sky
        accentColor: '#6366f1',  // indigo
        customTitle: 'Acme Corp Portal',
        themeStyle: 'slate-enterprise',
      },
      autoScaling: {
        enabled: true,
        minPods: 2,
        maxPods: 8,
        currentPods: 3,
        targetCpuUtilizationPct: 70,
        targetRpsThreshold: 450,
        scaleUpCooldownSec: 60,
        scaleDownCooldownSec: 300,
        elasticStorageEnabled: true,
        storageUsageThresholdPct: 80,
        autoExpandChunkMb: 2048,
        maxStorageCeilingMb: 51200,
        alertOnScaleEvent: true,
        lastScaleEvent: {
          timestamp: '2026-10-11 22:45:10',
          action: 'scale_up',
          reason: 'Пиковый наплыв транзакций: RPS превысил порог 450 (зафиксировано 482 RPS)',
          previousState: '2 пода (500m CPU)',
          newState: '3 пода (750m CPU)',
        },
      },
    },
  },
  {
    id: 'tenant_betalabs',
    name: 'Beta Labs R&D',
    slug: 'beta-labs',
    description: 'Исследовательская лаборатория ИИ-агентов, микрофронтендов и открытых плагинов.',
    avatarUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=120&auto=format&fit=crop&q=80',
    visibility: 'public',
    ownerId: 'usr_elena',
    ownerName: 'Елена Васильева',
    memberCount: 89,
    schema: 'tenant_betalabs',
    storageQuotaMb: 5120,
    storageUsedMb: 1840,
    createdAt: '2026-03-02',
    tags: ['R&D', 'DeepSeek Harness', 'WebContainers', 'Open-Source'],
    config: {
      features: {
        enableCrm: true,
        enableLms: false,
        enableUniverOffice: true,
        enableWebContainers: true,
        enableSelfHealingCi: true,
      },
      quotas: {
        maxUsers: 100,
        storageQuotaMb: 5120,
        apiRateLimitRps: 300,
      },
      branding: {
        primaryColor: '#a855f7', // purple
        accentColor: '#ec4899',  // pink
        customTitle: 'Beta Labs Innovation Hub',
        themeStyle: 'violet-glow',
      },
    },
  },
  {
    id: 'tenant_cybershield',
    name: 'CyberShield FinTech',
    slug: 'cybershield',
    description: 'Контур повышенной безопасности: криптографические шлюзы и аудит OWASP ASVS 5.0.',
    avatarUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=120&auto=format&fit=crop&q=80',
    visibility: 'hidden',
    ownerId: 'usr_dmitry',
    ownerName: 'Дмитрий Соколов',
    memberCount: 34,
    schema: 'tenant_cybershield',
    storageQuotaMb: 20480,
    storageUsedMb: 9210,
    createdAt: '2026-02-10',
    tags: ['Fintech', 'ASVS Level 3', 'CrowdSec AppSec', 'WAF L7'],
    config: {
      features: {
        enableCrm: false,
        enableLms: true,
        enableUniverOffice: false,
        enableWebContainers: false,
        enableSelfHealingCi: true,
      },
      quotas: {
        maxUsers: 50,
        storageQuotaMb: 20480,
        apiRateLimitRps: 1000,
      },
      branding: {
        primaryColor: '#f43f5e', // rose
        accentColor: '#f97316',  // orange
        customTitle: 'CyberShield SecOps Platform',
        themeStyle: 'cyber-dark',
      },
    },
  },
  {
    id: 'tenant_techpulse',
    name: 'TechPulse Community',
    slug: 'techpulse',
    description: 'Открытое сообщество архитекторов, разработчиков расширений и студентов LMS.',
    avatarUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=120&auto=format&fit=crop&q=80',
    visibility: 'public',
    ownerId: 'usr_superadmin',
    ownerName: 'Алексей Смирнов',
    memberCount: 320,
    schema: 'tenant_techpulse',
    storageQuotaMb: 8192,
    storageUsedMb: 3400,
    createdAt: '2026-04-01',
    tags: ['Community', 'LMS', 'Marketplace', 'Social Feed'],
    config: {
      features: {
        enableCrm: true,
        enableLms: true,
        enableUniverOffice: true,
        enableWebContainers: true,
        enableSelfHealingCi: false,
      },
      quotas: {
        maxUsers: 500,
        storageQuotaMb: 8192,
        apiRateLimitRps: 400,
      },
      branding: {
        primaryColor: '#10b981', // emerald
        accentColor: '#06b6d4',  // cyan
        customTitle: 'TechPulse Open Portal',
        themeStyle: 'emerald-minimal',
      },
    },
  },
  {
    id: 'tenant_nordic',
    name: 'Nordic Cloud Cluster',
    slug: 'nordic-cloud',
    description: 'Северный дата-центр: распределённые пайплайны и энергоэффективные вычисления.',
    avatarUrl: 'https://images.unsplash.com/photo-1517433456452-f9633a875f6f?w=120&auto=format&fit=crop&q=80',
    visibility: 'public',
    ownerId: 'usr_superadmin',
    ownerName: 'Алексей Смирнов',
    memberCount: 67,
    schema: 'tenant_nordic',
    storageQuotaMb: 16384,
    storageUsedMb: 6120,
    createdAt: '2026-05-10',
    tags: ['Cloud', 'K8s', 'GreenOps', 'ASVS Level 2'],
    config: {
      features: {
        enableCrm: true,
        enableLms: true,
        enableUniverOffice: true,
        enableWebContainers: true,
        enableSelfHealingCi: true,
      },
      quotas: {
        maxUsers: 150,
        storageQuotaMb: 16384,
        apiRateLimitRps: 600,
      },
      branding: {
        primaryColor: '#0284c7',
        accentColor: '#38bdf8',
        customTitle: 'Nordic Cloud Hub',
        themeStyle: 'slate-enterprise',
      },
    },
  },
  {
    id: 'tenant_quantum',
    name: 'Quantum Dynamics AI',
    slug: 'quantum-ai',
    description: 'Квантовое моделирование и высоконагруженные LLM-агенты нового поколения.',
    avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
    visibility: 'private',
    ownerId: 'usr_superadmin',
    ownerName: 'Алексей Смирнов',
    memberCount: 48,
    schema: 'tenant_quantum',
    storageQuotaMb: 32768,
    storageUsedMb: 14200,
    createdAt: '2026-06-01',
    tags: ['Quantum', 'LLM', 'High-Compute', 'Isolation'],
    config: {
      features: {
        enableCrm: false,
        enableLms: false,
        enableUniverOffice: true,
        enableWebContainers: true,
        enableSelfHealingCi: true,
      },
      quotas: {
        maxUsers: 80,
        storageQuotaMb: 32768,
        apiRateLimitRps: 1200,
      },
      branding: {
        primaryColor: '#8b5cf6',
        accentColor: '#d946ef',
        customTitle: 'Quantum Dynamics Core',
        themeStyle: 'violet-glow',
      },
    },
  },
];

export const CURRENT_USER: User = {
  id: 'usr_superadmin',
  username: 'alex.superadmin',
  fullName: 'Алексей Смирнов',
  email: 'spawnperm@gmail.com',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
  bio: 'Главный архитектор платформы Мировизор · SuperAdmin системы · Ответственный за эволюцию ядра и безопасность',
  completedCourses: ['crs_asvs5', 'crs_drizzle_rls'],
  tenantRoles: {
    tenant_acme: 'SuperAdmin',
    tenant_betalabs: 'SuperAdmin',
    tenant_cybershield: 'SuperAdmin',
    tenant_techpulse: 'SuperAdmin',
    tenant_nordic: 'SuperAdmin',
    tenant_quantum: 'SuperAdmin',
  },
  followingTenants: ['tenant_acme', 'tenant_betalabs', 'tenant_techpulse', 'tenant_nordic'],
  followingUsers: ['usr_elena', 'usr_dmitry'],
};

export const INITIAL_SECURITY_FINDINGS: SecurityFinding[] = [
  // 1. SAST (CodeQL / Semgrep)
  {
    id: 'sec_sast_001',
    scanner: 'CodeQL',
    severity: 'CRITICAL',
    title: 'CWE-95: Исполнение недоверенного кода через eval()',
    fileOrUrl: 'services/payment/payment_gateway.py:34',
    description: 'В обработчике входящих вебхуков платёжного шлюза raw_data парсится с помощью eval(), позволяя удалённому злоумышленнику выполнить произвольный код Python.',
    cwe: 'CWE-95 (Code Injection)',
    status: 'open',
    detectedAt: '2026-10-11T19:30:00Z',
    remediationExplanation: 'Заменить встроенный eval() на безопасный парсер ast.literal_eval() или стандартный json.loads().',
    remediationSnippet: `- parsed_json = eval(raw_data['config'])\n+ import ast\n+ parsed_json = ast.literal_eval(raw_data['config'])`,
  },
  {
    id: 'sec_sast_002',
    scanner: 'CodeQL',
    severity: 'HIGH',
    title: 'CWE-89: Потенциальная конкатенация строк в сыром SQL запросе',
    fileOrUrl: 'libs/core/src/tenant/reports.service.ts:58',
    description: 'В модуле отчётности сборка SQL-запроса выполнена через sql.raw() с интерполяцией пользовательских параметров без экранирования идентификаторов схем.',
    cwe: 'CWE-89 (SQL Injection)',
    status: 'open',
    detectedAt: '2026-10-11T20:10:00Z',
    remediationExplanation: 'Использовать шаблонные литералы sql`` с функцией sql.identifier() для безопасной параметризации.',
    remediationSnippet: `- const q = sql.raw('SELECT * FROM ' + table + ' WHERE id = ' + id);\n+ const q = sql\`SELECT * FROM \${sql.identifier(table)} WHERE id = \${id}\`;`,
  },

  // 2. SCA (Snyk Open Source)
  {
    id: 'sec_sca_001',
    scanner: 'Snyk',
    severity: 'HIGH',
    title: 'SNYK-JS-LODASH-567746: Prototype Pollution в транзитивной зависимости',
    fileOrUrl: 'package.json -> transitive lodash@4.17.15',
    description: 'Версии lodash до 4.17.21 подвержены загрязнению прототипов Object.prototype через методы _.set, _.merge и _.defaultsDeep.',
    cwe: 'CWE-1321 (Improperly Controlled Modification of Object Prototype)',
    status: 'open',
    detectedAt: '2026-10-11T18:15:00Z',
    remediationExplanation: 'Обновить версию lodash до ^4.17.21 в pnpm-lockfile через pnpm update lodash.',
    remediationSnippet: `// pnpm.overrides\n"pnpm": {\n  "overrides": {\n    "lodash": ">=4.17.21"\n  }\n}`,
  },
  {
    id: 'sec_sca_002',
    scanner: 'Snyk',
    severity: 'MEDIUM',
    title: 'SNYK-JS-AXIOS-102938: Неконтролируемый редирект в HTTP-клиенте',
    fileOrUrl: 'libs/integrations/src/gauzy/gauzy-client.ts:18',
    description: 'Устаревшая версия Axios следует по неограниченным внешним HTTP-редиректам, что может привести к утечке токенов авторизации.',
    cwe: 'CWE-601 (URL Redirection to Untrusted Site)',
    status: 'open',
    detectedAt: '2026-10-10T15:20:00Z',
    remediationExplanation: 'Установить maxRedirects: 0 или настроить белый список доверенных хостов для Gauzy API.',
    remediationSnippet: `axios.create({\n  maxRedirects: 2,\n  beforeRedirect: (options) => { /* validate host */ }\n});`,
  },

  // 3. DAST (OWASP ZAP Dynamic Scanning)
  {
    id: 'sec_dast_001',
    scanner: 'OWASP ZAP',
    severity: 'HIGH',
    title: 'CWE-352: Отсутствие CSRF токена в эндпоинте смены статуса сделки',
    fileOrUrl: 'POST https://staging.mirovisor.local/api/v1/deals/status',
    description: 'ZAP Baseline обнаружил, что эндпоинт мутации принимает cookie сессии без проверки заголовка X-CSRF-Token или SameSite=Strict.',
    cwe: 'CWE-352 (Cross-Site Request Forgery)',
    status: 'open',
    detectedAt: '2026-10-11T21:40:00Z',
    remediationExplanation: 'Включить защиту csurf middleware в NestJS и установить флаг SameSite=Lax/Strict на cookie Authentik.',
    remediationSnippet: `app.use(cookieParser());\napp.use(csurf({ cookie: { sameSite: 'strict', secure: true } }));`,
  },
  {
    id: 'sec_dast_002',
    scanner: 'OWASP ZAP',
    severity: 'LOW',
    title: 'CWE-693: Отсутствует заголовок Permissions-Policy в Ingress ответе',
    fileOrUrl: 'GET https://staging.mirovisor.local/',
    description: 'Заголовок Permissions-Policy не настроен, что разрешает запуск геолокации и микрофона в сторонних iframe.',
    cwe: 'CWE-693 (Protection Mechanism Failure)',
    status: 'remediated',
    detectedAt: '2026-10-10T08:12:00Z',
    remediationExplanation: 'Добавить директиву в traefik/dynamic/security.yml: permissionsPolicy: "camera=(), microphone=(self)".',
    remediationSnippet: `customResponseHeaders:\n  Permissions-Policy: "camera=(), microphone=(self)"`,
  },

  // 4. Secret Scanning (Gitleaks / Trufflehog)
  {
    id: 'sec_secret_001',
    scanner: 'Gitleaks',
    severity: 'CRITICAL',
    title: 'CWE-798: Обнаружен захардкоженный тестовый токен NATS JetStream в репозитории',
    fileOrUrl: 'test/fixtures/nats-credentials.json:4',
    description: 'Gitleaks обнаружил строку с JWT-подписью nats_token_dev_9941 в тестовом фикстуре, совпадающую с шаблоном приватного ключа.',
    cwe: 'CWE-798 (Use of Hard-coded Credentials)',
    status: 'open',
    detectedAt: '2026-10-11T22:05:00Z',
    remediationExplanation: 'Отозвать данный токен в NATS аккаунте, удалить файл из истории git через git-filter-repo и использовать переменные окружения.',
    remediationSnippet: `git rm --cached test/fixtures/nats-credentials.json\n# Заменить на process.env.TEST_NATS_JWT`,
  },

  // 5. Container & IaC (Aqua Trivy)
  {
    id: 'sec_trivy_001',
    scanner: 'Trivy',
    severity: 'MEDIUM',
    title: 'TRIVY-IAC-0042: Dockerfile запускается от root-пользователя (UID 0)',
    fileOrUrl: 'apps/api/Dockerfile:14',
    description: 'Контейнер запускает процесс NestJS API с правами суперпользователя, нарушая принцип минимальных привилегий контейнеризации.',
    cwe: 'CWE-250 (Execution with Unnecessary Privileges)',
    status: 'open',
    detectedAt: '2026-10-11T17:15:00Z',
    remediationExplanation: 'Добавить директиву USER node перед инструкцией CMD/ENTRYPOINT в Dockerfile.',
    remediationSnippet: `RUN chown -R node:node /app\nUSER node\nCMD ["node", "dist/apps/api/main.js"]`,
  },

  // 6. CrowdSec L7 WAF
  {
    id: 'sec_cs_001',
    scanner: 'CrowdSec',
    severity: 'MEDIUM',
    title: 'L7 Virtual Patch: 142 попытки сканирования эндпоинтов .env заблокированы',
    fileOrUrl: 'Traefik Ingress: /api/v1/.env',
    description: 'Атакующий IP 185.220.101.4 добавлен в бан на 24 часа через CrowdSec LAPI.',
    cwe: 'CWE-200 (Exposure of Sensitive Information)',
    status: 'remediated',
    detectedAt: '2026-10-11T20:00:00Z',
    remediationExplanation: 'Виртуальный патчинг Traefik CrowdSec AppSec успешно перехватывает атаки на фазе L7.',
  },
];

export const INITIAL_BUILDS: PipelineBuild[] = [
  {
    id: 'build_1044',
    buildNumber: 1044,
    branch: 'main',
    commitSha: 'a4b892c',
    commitMessage: 'feat(tenants): enforce RLS FORCE on tenant_acme tables and update schema',
    author: 'Алексей Смирнов',
    status: 'success',
    startedAt: '2026-10-11 23:18:10',
    durationSec: 142,
    environment: 'production',
    natsEventPublished: true,
    findings: INITIAL_SECURITY_FINDINGS.filter((f) => f.status === 'open'),
    steps: [
      {
        id: 'step_1',
        name: 'Checkout & Setup pnpm 9',
        status: 'success',
        durationSec: 8,
        logs: [
          'actions/checkout@v4 depth=0',
          'Setting up Node.js 20.11 via pnpm/action-setup@v4',
          'Cache restored from pnpm-store (84MB)',
        ],
      },
      {
        id: 'step_2',
        name: 'Nx Affected Lint & Build',
        status: 'success',
        durationSec: 34,
        logs: [
          'npx nx-cloud start-ci-run --distribute-on=.nx/workflows/distribution-config.yaml',
          'nx affected --target=lint,build --parallel=3',
          '> libs/core:lint passed',
          '> apps/web:build completed (18MB bundle)',
          '> apps/api:build completed in 14.2s',
        ],
      },
      {
        id: 'step_3',
        name: 'Automated Security Gate (SAST / SCA / Secret)',
        status: 'failed',
        durationSec: 45,
        logs: [
          'Running CodeQL Semantic Analysis (security-extended)...',
          '⚠️ CodeQL Warning: py/code-injection at services/payment/payment_gateway.py:34 (eval detected)',
          'Running Snyk SCA Dependency Audit...',
          '⚠️ Snyk: found 1 High severity vulnerability (lodash@4.17.15)',
          'Running Gitleaks Secret Scanner...',
          '⚠️ Gitleaks: detected exposed NATS token pattern in test/fixtures/nats-credentials.json',
          'Running Aqua Trivy Container Scan...',
          'Aqua Trivy: 0 Critical, 1 Medium (Dockerfile UID 0)',
        ],
      },
      {
        id: 'step_4',
        name: 'Testcontainers Integration Suite',
        status: 'success',
        durationSec: 32,
        logs: [
          'Starting PostgreSQL 16 container (Schema-per-Tenant mode)...',
          'Starting Redis 7 Alpine container...',
          'Starting NATS 2.10 JetStream container...',
          'Running 42 integration test suites (RLS isolation, Fan-out, MCP bridge)...',
          '✓ All tests passed (coverage 84.2%)',
        ],
      },
      {
        id: 'step_5',
        name: 'Self-Healing CI & NATS JetStream Event',
        status: 'success',
        durationSec: 23,
        logs: [
          'Publishing BuildCompleted event to NATS: subject "ci.build.1044.completed"',
          'Cordis Multi-Agent Runtime received event...',
          'SecurityAgent synthesized card #card_sec_001',
          'npx nx-cloud fix-ci: Self-Healing suggestion generated.',
        ],
      },
    ],
  },
  {
    id: 'build_1043',
    buildNumber: 1043,
    branch: 'develop',
    commitSha: '8f921ea',
    commitMessage: 'fix(feed): fan-out on write Redis pipeline batching',
    author: 'Елена Васильева',
    status: 'success',
    startedAt: '2026-10-11 21:05:40',
    durationSec: 118,
    environment: 'staging',
    natsEventPublished: true,
    findings: [],
    steps: [
      { id: 'step_1', name: 'Checkout & Setup', status: 'success', durationSec: 7, logs: ['Checkout completed'] },
      { id: 'step_2', name: 'Nx Build', status: 'success', durationSec: 28, logs: ['All targets cached'] },
      { id: 'step_3', name: 'Security Scans', status: 'success', durationSec: 35, logs: ['No high findings'] },
      { id: 'step_4', name: 'Deploy to Staging', status: 'success', durationSec: 48, logs: ['Deployed to staging.mirovisor.local'] },
    ],
  },
  {
    id: 'build_1042',
    buildNumber: 1042,
    branch: 'feature/mrv-124-plugin-registry',
    commitSha: '5c1902a',
    commitMessage: 'feat(plugin): SemVer validation & DFS cycle detection',
    author: 'Дмитрий Соколов',
    status: 'failed',
    startedAt: '2026-10-11 19:40:12',
    durationSec: 92,
    environment: 'staging',
    natsEventPublished: true,
    selfHealSuggested: 'Исправлена циклическая зависимость между crm/contacts и integrations/gauzy. Рекомендуется применить PR #380.',
    findings: [INITIAL_SECURITY_FINDINGS[0]],
    steps: [
      { id: 'step_1', name: 'Checkout & Setup', status: 'success', durationSec: 6, logs: ['Checkout completed'] },
      { id: 'step_2', name: 'Lint & Typecheck', status: 'failed', durationSec: 18, logs: ['Error: Circular dependency detected in Plugin Registry'] },
      { id: 'step_3', name: 'Self-Healing Analysis', status: 'success', durationSec: 14, logs: ['Generated automated patch'] },
    ],
  },
];

export const INITIAL_BACKSTAGE_PLUGINS: BackstagePluginCode[] = [
  {
    id: 'plugin-k8s-topology',
    title: 'Kubernetes Pod & Node Inspector',
    version: '1.4.0',
    author: 'DevOps Platform Team',
    category: 'devtools',
    description: 'Интеграция с K8s API для отображения статуса подов, распределения ресурсов CPU/RAM по тенантам и алертов HPA.',
    extensionPoint: 'ui-dashboard-card',
    lifecycleState: 'active',
    permissions: ['k8s.pods.read', 'k8s.nodes.read'],
    typescriptCode: `import { createPlugin, createComponentExtension } from '@mirovisor/plugin-sdk';

export const k8sTopologyPlugin = createPlugin({
  id: 'plugin-k8s-topology',
  title: 'K8s Cluster Inspector',
  async onInstall({ tenantId }) {
    console.log(\`[K8s Plugin] Mounted for tenant: \${tenantId}\`);
  },
  async onTeardown({ tenantId }) {
    console.log(\`[K8s Plugin] Cleaned up for tenant: \${tenantId}\`);
  },
});

export const K8sTopologyCard = createComponentExtension({
  name: 'K8sTopologyCard',
  component: () => ({
    render: (context) => ({
      clusterStatus: 'Healthy',
      activePods: 14,
      tenantNamespace: \`ns-\${context.tenantId}\`,
    }),
  }),
});`,
  },
  {
    id: 'plugin-slack-remediation',
    title: 'Slack Security Remediation Alerts',
    version: '2.0.1',
    author: 'CyberShield Security Ops',
    category: 'security',
    description: 'Автоматическая публикация критических SAST находок и алертов WAF в корпоративный канал Slack #sec-alerts.',
    extensionPoint: 'event-pipeline',
    lifecycleState: 'active',
    permissions: ['security.alerts.read', 'external.webhook.post'],
    typescriptCode: `import { createPlugin, createEventHandler } from '@mirovisor/plugin-sdk';

export const slackRemediationPlugin = createPlugin({
  id: 'plugin-slack-remediation',
  title: 'Slack Webhook Gateway',
  async onInstall() {
    console.log('Slack Remediation Webhook registered');
  },
});

export const onSecurityAlert = createEventHandler({
  topic: 'security.finding.detected',
  handler: async (event, { mcp }) => {
    if (event.severity === 'CRITICAL') {
      await mcp.callTool('slack', 'send_message', {
        channel: '#sec-alerts',
        text: \`🚨 КРИТИЧЕСКАЯ УЯЗВИМОСТЬ: \${event.title} в \${event.fileOrUrl}\`,
      });
    }
  },
});`,
  },
  {
    id: 'plugin-bi-exporter',
    title: 'ClickHouse / BI Data Warehouse Stream',
    version: '1.0.0',
    author: 'Acme Analytics Lab',
    category: 'analytics',
    description: 'Репликация обезличенных агрегированных метрик сделок и активности пользователей в аналитический контур.',
    extensionPoint: 'rest-api-route',
    lifecycleState: 'registered',
    permissions: ['analytics.export.read', 'crm.deals.read'],
    typescriptCode: `import { createPlugin, createApiRoute } from '@mirovisor/plugin-sdk';

export const biExporterPlugin = createPlugin({
  id: 'plugin-bi-exporter',
  title: 'BI Analytics Exporter',
});

export const exportDealsRoute = createApiRoute({
  path: '/api/v1/analytics/export',
  method: 'GET',
  handler: async (req, { tenantDb }) => {
    return tenantDb.select().from('crm_deals');
  },
});`,
  },
];

export const INITIAL_KANBAN_CARDS: KanbanCard[] = [
  {
    id: 'card_sec_001',
    title: 'Заменить небезопасный eval() в payment_gateway.py на ast.literal_eval()',
    description: 'В отчёте SAST CodeQL обнаружено использование eval() при разборе обратных вызовов платёжного шлюза, что создаёт критическую уязвимость CWE-95 (Code Injection).',
    type: 'security',
    priority: 'critical',
    column: 'ideas',
    source: 'CI/CD #1044 · CodeQL SAST Analysis',
    sourceSnippet: `def handle_webhook_payload(raw_data):\n    # VULNERABLE: CodeQL Rule py/code-injection\n-   parsed_json = eval(raw_data['config'])\n+   parsed_json = ast.literal_eval(raw_data['config'])`,
    attachments: ['https://cwe.mitre.org/data/definitions/95.html'],
    checklist: [
      { id: 'c1', text: 'Заменить eval() в payment_gateway.py', done: false },
      { id: 'c2', text: 'Добавить unit-тест на передачу вредоносного пейлоада', done: false },
      { id: 'c3', text: 'Запустить повторное сканирование CodeQL', done: false },
    ],
    createdBy: 'SecurityAgent (Cordis)',
    createdAt: '2026-10-11T19:30:00Z',
    comments: [
      {
        id: 'cm1',
        author: 'SecurityAgent',
        avatar: '🛡️',
        text: 'Высокая вероятность эксплуатации через публичный вебхук. Рекомендую принять немедленно.',
        timestamp: '10 минут назад',
      },
    ],
    suggestedPatch: `diff --git a/services/payment/payment_gateway.py b/services/payment/payment_gateway.py
index 4b92c10..819fa2b 100644
--- a/services/payment/payment_gateway.py
+++ b/services/payment/payment_gateway.py
@@ -34,3 +34,4 @@ def handle_webhook_payload(raw_data):
-    return eval(raw_data.get("metadata", "{}"))
+    import ast
+    return ast.literal_eval(raw_data.get("metadata", "{}"))`,
  },
  {
    id: 'card_arch_002',
    title: 'Включить RLS FORCE для схемы tenant_acme в PostgreSQL',
    description: 'Аудит мультитенантности выявил, что таблицы invoices и transactions защищены политикой RLS, но флаг FORCE не был выставлен. Владелец схемы может обойти фильтрацию при прямом подключении.',
    type: 'architecture',
    priority: 'high',
    column: 'ideas',
    source: 'Audit Log · Multi-Tenant Drizzle Inspector',
    sourceSnippet: `ALTER TABLE tenant_acme.invoices FORCE ROW LEVEL SECURITY;\nALTER TABLE tenant_acme.transactions FORCE ROW LEVEL SECURITY;`,
    attachments: ['https://www.postgresql.org/docs/current/ddl-rowsecurity.html'],
    checklist: [
      { id: 'c1', text: 'Сформировать SQL-миграцию FORCE RLS', done: false },
      { id: 'c2', text: 'Проверить поведение при сервисных вызовах', done: false },
    ],
    createdBy: 'ArchitectureAgent (Cordis)',
    createdAt: '2026-10-11T20:15:00Z',
    comments: [],
    suggestedPatch: `ALTER TABLE tenant_acme.invoices FORCE ROW LEVEL SECURITY;`,
  },
  {
    id: 'card_devops_003',
    title: 'Настроить лимит max_bytes=512MB для стрима NATS JetStream TENANT_EVENTS',
    description: 'При интенсивном fan-out постов в открытых тенантах размер журнала JetStream вырос на 45%. Необходимо зафиксировать политику очистки discard: old и жесткий лимит диска.',
    type: 'devops',
    priority: 'medium',
    column: 'in_progress',
    source: 'Prometheus Alert: NATS Storage Warning > 70%',
    sourceSnippet: `const streamConfig = { maxBytes: 512 * 1024 * 1024, discard: 'old', retention: 'limits' };`,
    attachments: [],
    checklist: [
      { id: 'c1', text: 'Обновить libs/social/src/feed/nats-stream.config.ts', done: true },
      { id: 'c2', text: 'Выполнить `nats stream update TENANT_EVENTS` в кластере', done: false },
    ],
    createdBy: 'DevOpsAgent (Cordis)',
    createdAt: '2026-10-11T18:00:00Z',
    assignedTo: 'usr_superadmin',
    comments: [],
    suggestedPatch: `maxBytes: 536870912,\nretention: 'limits'`,
  },
  {
    id: 'card_ux_004',
    title: 'Устранить нарушение WCAG AA контраста в диаграммах топологии',
    description: 'В ночной теме контраст второстепенных связей графа сервисов составляет 2.8:1 вместо положенных 3.0:1 для графических объектов.',
    type: 'ux',
    priority: 'low',
    column: 'in_progress',
    source: 'Playwright Axe-Core automated a11y run',
    sourceSnippet: `expect(results.violations).toEqual([]); // Failed: color-contrast on <svg path>`,
    attachments: [],
    checklist: [
      { id: 'c1', text: 'Повысить яркость линий связей до #64748b', done: true },
      { id: 'c2', text: 'Прогнать Playwright Accessibility test', done: false },
    ],
    createdBy: 'UiUxAgent (Cordis)',
    createdAt: '2026-10-11T17:40:00Z',
    assignedTo: 'usr_superadmin',
    comments: [],
  },
  {
    id: 'card_test_005',
    title: 'Добавить Testcontainers интеграционный тест для fan-out в Redis Pipeline',
    description: 'Покрытие тестами сервиса feed.service.ts составляет 68%. Не протестирована ветка отказа Redis соединения во время массовой рассылки 10 000 подписчиков.',
    type: 'testing',
    priority: 'medium',
    column: 'collected',
    source: 'Codecov Coverage Report: feed.service.ts',
    sourceSnippet: `it('handles redis pipeline failure during fan-out', async () => { ... })`,
    attachments: [],
    checklist: [
      { id: 'c1', text: 'Создать сценарий с эмуляцией сбоя Redis', done: true },
      { id: 'c2', text: 'Убедиться в транзакционном откате NATS события', done: true },
    ],
    createdBy: 'TestingAgent (Cordis)',
    createdAt: '2026-10-10T14:00:00Z',
    comments: [],
    implementationPr: 'PR #382 (Merged)',
    userRating: 5,
    ratingFeedback: 'Отличный тест, полностью воспроизвёл краевой случай.',
  },
  {
    id: 'card_docs_006',
    title: 'Обновить LLM Wiki и экспортировать llms.txt для MCP Univer Bridge',
    description: 'После обновления плагина офисных документов dsh-univer-office 2.1 добавились методы xlsx_formula_evaluate. Агенты не видели новых сигнатур.',
    type: 'docs',
    priority: 'low',
    column: 'collected',
    source: 'Documentation Linter: Missing API endpoints in llms-full.txt',
    attachments: [],
    checklist: [
      { id: 'c1', text: 'Сгенерировать docs/integrations/univer.md', done: true },
      { id: 'c2', text: 'Запустить pnpm run docs:llms', done: true },
    ],
    createdBy: 'DocsAgent (Cordis)',
    createdAt: '2026-10-09T11:20:00Z',
    comments: [],
    implementationPr: 'PR #379 (Merged)',
    userRating: 4,
  },
];

export const INITIAL_PLUGINS: PluginManifest[] = [
  {
    id: 'gauzy-crm-pro',
    name: 'Ever Gauzy CRM & Deals',
    version: '2.4.1',
    description: 'Интеграция ERP/CRM Ever Gauzy: воронка сделок, контакты, учет рабочего времени и расчет зарплат.',
    author: 'Ever Gauzy Core Team',
    license: 'Apache-2.0',
    dependencies: [{ pluginId: 'core-tenant', minVersion: '>=1.0.0' }],
    conflicts: [],
    permissions: ['crm.deals.read', 'crm.deals.create', 'crm.deals.update', 'crm.contacts.read'],
    category: 'crm',
    priceRub: 0,
    installedInTenants: ['tenant_acme', 'tenant_betalabs', 'tenant_techpulse'],
    status: 'active',
  },
  {
    id: 'univer-office-engine',
    name: 'Univer Office Harness (MCP)',
    version: '2.1.0',
    description: 'Серверная генерация таблиц, документов Word и презентаций PowerPoint headless через AI-агентов.',
    author: 'Univer Community & DSH',
    license: 'MIT',
    dependencies: [],
    conflicts: [],
    permissions: ['office.documents.create', 'office.documents.export'],
    category: 'office',
    priceRub: 2900,
    installedInTenants: ['tenant_acme', 'tenant_betalabs'],
    status: 'active',
  },
  {
    id: 'crowdsec-traefik-waf',
    name: 'CrowdSec L7 AppSec WAF',
    version: '1.8.3',
    description: 'Виртуальный патчинг уязвимостей, защита от перебора паролей и блокировка вредоносного трафика на уровне Traefik.',
    author: 'CrowdSec Security Team',
    license: 'MIT',
    dependencies: [],
    conflicts: [],
    permissions: ['security.waf.inspect', 'security.waf.ban'],
    category: 'security',
    priceRub: 4500,
    installedInTenants: ['tenant_acme', 'tenant_cybershield'],
    status: 'active',
  },
  {
    id: 'debtpilot-ai-analyzer',
    name: 'DebtPilot AI: Technical Debt',
    version: '1.2.0',
    description: 'Автоматический аудит архитектурного и технического долга монорепозитория с генерацией карточек в канбан.',
    author: 'Mirovisor AI Labs',
    license: 'Apache-2.0',
    dependencies: [{ pluginId: 'gauzy-crm-pro', minVersion: '>=2.0.0', optional: true }],
    conflicts: [],
    permissions: ['audit.codebase.read', 'kanban.card.create'],
    category: 'devtools',
    priceRub: 0,
    installedInTenants: ['tenant_betalabs', 'tenant_techpulse'],
    status: 'active',
  },
  {
    id: 'voice-gemini-live',
    name: 'Gemini Live Speech DevKit',
    version: '3.0.0',
    description: 'Двунаправленное голосовое управление порталом, выполнение CLI-команд голосом и диктовка задач.',
    author: 'Google AI Studio & Mirovisor',
    license: 'Apache-2.0',
    dependencies: [],
    conflicts: [],
    permissions: ['voice.terminal.execute', 'voice.audio.stream'],
    category: 'devtools',
    priceRub: 1500,
    installedInTenants: ['tenant_betalabs', 'tenant_acme', 'tenant_techpulse'],
    status: 'active',
  },
];

export const INITIAL_CRM_CONTACTS: CrmContact[] = [
  {
    id: 'cnt_1',
    name: 'Михаил Решетников',
    company: 'ООO «СеверТрансЛогистик»',
    email: 'reshetnikov@st-logistics.ru',
    phone: '+7 (495) 890-21-43',
    stage: 'Negotiation',
    valueRub: 1250000,
    tenantId: 'tenant_acme',
  },
  {
    id: 'cnt_2',
    name: 'Анна Кузнецова',
    company: 'ПАО «ФинТех Инновации»',
    email: 'kuznetsova@fintech-inno.io',
    phone: '+7 (812) 334-19-00',
    stage: 'Won',
    valueRub: 3400000,
    tenantId: 'tenant_acme',
  },
  {
    id: 'cnt_3',
    name: 'Сергей Белов',
    company: 'НПК «Квантум Системс»',
    email: 'belov@quantumsys.tech',
    phone: '+7 (342) 205-99-11',
    stage: 'Proposal',
    valueRub: 780000,
    tenantId: 'tenant_betalabs',
  },
  {
    id: 'cnt_4',
    name: 'Ольга Романова',
    company: 'ЗАО «КриптоСфера»',
    email: 'romanova@cryptosfera.net',
    phone: '+7 (495) 777-44-12',
    stage: 'Contacted',
    valueRub: 2100000,
    tenantId: 'tenant_cybershield',
  },
];

export const INITIAL_CRM_DEALS: CrmDeal[] = [
  {
    id: 'dl_1',
    title: 'Внедрение мультитенантной ERP Ever Gauzy на 200 рабочих мест',
    company: 'ПАО «ФинТех Инновации»',
    amountRub: 3400000,
    stage: 'closed_won',
    assignedTo: 'usr_superadmin',
    updatedAt: '2026-10-10',
    tenantId: 'tenant_acme',
  },
  {
    id: 'dl_2',
    title: 'Подключение защищённого контура Traefik + CrowdSec AppSec WAF',
    company: 'ООO «СеверТрансЛогистик»',
    amountRub: 1250000,
    stage: 'negotiation',
    assignedTo: 'usr_superadmin',
    updatedAt: '2026-10-11',
    tenantId: 'tenant_acme',
  },
  {
    id: 'dl_3',
    title: 'Автоматизация офисных отчётов через Univer Office Headless MCP',
    company: 'НПК «Квантум Системс»',
    amountRub: 780000,
    stage: 'proposal',
    assignedTo: 'usr_elena',
    updatedAt: '2026-10-09',
    tenantId: 'tenant_betalabs',
  },
];

export const INITIAL_LMS_COURSES: LmsCourse[] = [
  {
    id: 'crs_asvs5',
    title: 'OWASP ASVS 5.0: Практика безопасности веб-приложений',
    description: 'Полный разбор верификации Level 2: защита от Broken Access Control, аутентификация в Authentik, изоляция тенантов и аудит.',
    badge: '🔒 ASVS Specialist',
    difficulty: 'Senior',
    lessonsCount: 6,
    requiredForRoles: ['SuperAdmin', 'Security Lead'],
    completedCount: 48,
    lessons: [
      { id: 'l1', title: 'Введение в OWASP ASVS 5.0 и трёхуровневая модель', durationMinutes: 20, content: 'Обзор стандартов 2026 года и требования к L2.' },
      { id: 'l2', title: 'Трёхуровневая защита: Scoping, RBAC и PostgreSQL RLS', durationMinutes: 35, content: 'Настройка app.current_tenant и FORCE ROW LEVEL SECURITY.' },
      { id: 'l3', title: 'Интеграция SAST CodeQL и SCA Snyk в Nx CI/CD', durationMinutes: 25, content: 'Настройка гейтов качества перед мержем в main.' },
    ],
  },
  {
    id: 'crs_drizzle_rls',
    title: 'Мультитенантность в Drizzle ORM: Schema-per-Tenant & RLS',
    description: 'Архитектура изоляции баз данных, динамические соединения, параллельные миграции и переключение схем на лету.',
    badge: '🗄️ Database Architect',
    difficulty: 'Middle',
    lessonsCount: 5,
    requiredForRoles: ['SuperAdmin', 'CRM Manager', 'Backend Engineer'],
    completedCount: 62,
    lessons: [
      { id: 'l1', title: 'Schema-per-Tenant против Database-per-Tenant', durationMinutes: 30, content: 'Сравнение подходов WingtipTickets и Ever Gauzy.' },
      { id: 'l2', title: 'Реализация TenantMiddleware и транзакционный SET LOCAL', durationMinutes: 25, content: 'Исключение утечек данных между соединениями пула.' },
    ],
  },
  {
    id: 'crs_cordis_mcp',
    title: 'Cordis & Model Context Protocol: Разработка AI-агентов',
    description: 'Разработка модульных расширений для DeepSeek Harness, регистрация MCP-инструментов и создание замкнутого цикла доработки кода.',
    badge: '🤖 AI Agent Engineer',
    difficulty: 'Senior',
    lessonsCount: 8,
    requiredForRoles: ['SuperAdmin', 'Developer'],
    completedCount: 31,
    lessons: [
      { id: 'l1', title: 'Концепция Cordis: «Всё есть плагин»', durationMinutes: 40, content: 'Жизненный цикл плагинов и обратимые побочные эффекты.' },
      { id: 'l2', title: 'Интеграция MCP сервера канбан-доски с LangGraph агентами', durationMinutes: 45, content: 'Создание карточек и обработка обратной связи.' },
    ],
  },
];

export const INITIAL_SOCIAL_POSTS: SocialPost[] = [
  {
    id: 'post_1',
    authorId: 'usr_superadmin',
    authorName: 'Алексей Смирнов',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
    tenantId: 'tenant_acme',
    tenantName: 'Acme Enterprise',
    content: '🚀 Успешно завершен CI/CD цикл #1044. AI-агенты зафиксировали 1 критическую рекомендацию по безопасности и предложили патч для шлюза оплаты. Доска «Идеи → Работа» обновлена.',
    tags: ['#release', '#security', '#ci_cd'],
    likes: 18,
    commentsCount: 4,
    timestamp: '25 минут назад',
  },
  {
    id: 'post_2',
    authorId: 'usr_elena',
    authorName: 'Елена Васильева',
    authorAvatar: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=120&auto=format&fit=crop&q=80',
    tenantId: 'tenant_betalabs',
    tenantName: 'Beta Labs R&D',
    content: 'Запустили в тестовой среде WebContainer мини-редактор с поддержкой голосового управления через Gemini Live API. Теперь можно диктовать архитектурные задачи прямо в терминале!',
    tags: ['#webcontainers', '#voice', '#gemini'],
    likes: 27,
    commentsCount: 9,
    timestamp: '2 часа назад',
  },
  {
    id: 'post_3',
    authorId: 'usr_dmitry',
    authorName: 'Дмитрий Соколов',
    authorAvatar: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=120&auto=format&fit=crop&q=80',
    tenantId: 'tenant_cybershield',
    tenantName: 'CyberShield FinTech',
    content: 'Внедрили CrowdSec AppSec с виртуальным патчингом на уровне Traefik L7. 100% покрытие OWASP ASVS 5.0 в контуре CyberShield подтверждено автоматическим сканом.',
    tags: ['#crowdsec', '#waf', '#asvs'],
    likes: 35,
    commentsCount: 6,
    timestamp: 'Вчера',
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud_1',
    timestamp: '2026-10-11 23:14:02',
    userId: 'usr_superadmin',
    tenantId: 'tenant_acme',
    action: 'rls.context.set',
    details: 'SET LOCAL app.current_tenant = "tenant_acme"; SET LOCAL app.current_user = "usr_superadmin"',
    status: 'success',
  },
  {
    id: 'aud_2',
    timestamp: '2026-10-11 23:05:40',
    userId: 'SecurityAgent',
    tenantId: 'tenant_acme',
    action: 'kanban.card.created',
    details: 'Создана карточка [card_sec_001]: "Заменить eval() в payment_gateway.py"',
    status: 'success',
  },
  {
    id: 'aud_3',
    timestamp: '2026-10-11 22:45:18',
    userId: 'usr_superadmin',
    tenantId: 'tenant_acme',
    action: 'plugin.installed',
    details: 'Установлен плагин "crowdsec-traefik-waf" v1.8.3 в схему tenant_acme',
    status: 'success',
  },
  {
    id: 'aud_4',
    timestamp: '2026-10-11 21:30:11',
    userId: 'TestingAgent',
    tenantId: 'tenant_betalabs',
    action: 'ci.heal.attempt',
    details: 'Self-Healing CI запустил исправление для теста feed.service.spec.ts',
    status: 'warning',
  },
];

export const INITIAL_METRICS: Record<string, SystemMetric> = {
  tenant_acme: {
    tenantId: 'tenant_acme',
    rps: 342,
    p95LatencyMs: 24,
    errorRatePercent: 0.02,
    cpuUsage: 28,
    memoryUsageMb: 840,
    dbQueriesPerSec: 1250,
  },
  tenant_betalabs: {
    tenantId: 'tenant_betalabs',
    rps: 120,
    p95LatencyMs: 38,
    errorRatePercent: 0.08,
    cpuUsage: 45,
    memoryUsageMb: 1120,
    dbQueriesPerSec: 480,
  },
  tenant_cybershield: {
    tenantId: 'tenant_cybershield',
    rps: 580,
    p95LatencyMs: 14,
    errorRatePercent: 0.001,
    cpuUsage: 34,
    memoryUsageMb: 1450,
    dbQueriesPerSec: 2300,
  },
  tenant_techpulse: {
    tenantId: 'tenant_techpulse',
    rps: 210,
    p95LatencyMs: 42,
    errorRatePercent: 0.05,
    cpuUsage: 22,
    memoryUsageMb: 670,
    dbQueriesPerSec: 890,
  },
};

export const INITIAL_WIKI_DOCS = [
  {
    slug: 'architecture-overview',
    title: 'Архитектура «Идеи → Работа»: как это устроено',
    type: 'concept',
    tags: ['архитектура', 'цикл-разработки', 'ai-agents', 'mcp'],
    summary: 'В основе — цикл «Наблюдай → Предлагай → Решай → Внедряй», запускающийся после каждого CI/CD цикла.',
    content: `# Архитектура «Идеи → Работа»

В основе портала **МИРОВИЗОР** — непрерывный цикл эволюции:
**«Наблюдай → Предлагай → Решай → Внедряй»**.

## 1. Наблюдение и сбор данных
После каждой сборки система собирает сырые данные:
- Логи CI/CD сборки и тестов
- Отчёты о покрытии кода (Codecov/Jest/Vitest)
- Результаты сканирований безопасности (SAST CodeQL, SCA Snyk, DAST ZAP, Trivy, Gitleaks)
- Метрики Prometheus/Grafana (p95 latency, RPS, ошибки)
- Данные о техническом долге из DebtPilot

## 2. Мультиагентный анализ
Данные распределяются по специализированным агентам на базе LangGraph/Cordis:
- **Архитектура**: поиск циклических зависимостей, проверка изоляции схем
- **Безопасность**: проверка по стандарту OWASP ASVS 5.0, выявление инъекций и секретов
- **Тестирование**: поиск непокрытых сценариев, обнаружение флейки-тестов
- **DevOps**: проверка квот NATS JetStream, лимитов памяти K8s
- **UI/UX**: аудит контрастности WCAG AA, адаптивность
- **Документация**: поддержка LLM Wiki, актуализация llms.txt

## 3. Генерация карточек и публикация
Каждое предложение превращается в объект карточки и публикуется в колонку «Идеи» через встроенный MCP-сервер.

## 4. Решение суперадминистратора
Суперадмин перемещает карточки. На доске действует жесткий WIP-лимит (максимум 3 в работе).
При отклонении карточки выбирается причина, которая напрямую обучает модель.
При внедрении оценивается качество кода, и доступен мгновенный откат при низкой оценке.`,
  },
  {
    slug: 'schema-per-tenant',
    title: 'Мультитенантность: Schema-per-Tenant & Row-Level Security',
    type: 'concept',
    tags: ['multitenancy', 'postgresql', 'drizzle', 'rls'],
    summary: 'Полная изоляция данных арендаторов на уровне отдельных схем PostgreSQL и RLS FORCE.',
    content: `# Мультитенантность и изоляция данных

## Стратегия изоляции
В Мировизоре используется подход **Schema-per-Tenant** с дополнительным аппаратным контуром Row-Level Security (по образцу Ever Gauzy и Microsoft WingtipTickets):

\`\`\`sql
-- Включение принудительной изоляции даже для суперпользователя таблицы
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices FORCE ROW LEVEL SECURITY;

CREATE POLICY invoices_tenant_isolation ON invoices
  USING (tenant_id = current_setting('app.current_tenant')::UUID);
\`\`\`

## Core-схема (public):
- \`users\`, \`tenants\`, \`roles\`, \`permissions\`, \`subscriptions\`, \`listings\`, \`courses\`

## Tenant-схемы (\`tenant_{id}\`):
- \`crm_contacts\`, \`crm_deals\`, \`erp_products\`, \`documents\`, \`tasks\`

## Scoping
Идентификатор тенанта извлекается исключительно из защищенной сессии Authentik SSO и никогда не принимается из query-параметров или заголовков клиента.`,
  },
  {
    slug: 'adr-001-mcp-cordis',
    title: 'ADR-001: Выбор Cordis и MCP для расширяемости AI-агентов',
    type: 'adr',
    tags: ['adr', 'mcp', 'cordis', 'plugins'],
    summary: 'Решение использовать Model Context Protocol и модульную систему Cordis для интеграции офисных документов и внешних инструментов.',
    content: `# ADR-001: Model Context Protocol и Cordis Ядро

## Статус
**Принято** (2026-09-18)

## Контекст
Платформе требуется безопасное подключение AI-агентов к ERP Ever Gauzy, офисному движку Univer и канбан-доске без предоставления прямых прав на запись в репозиторий.

## Решение
1. Использовать архитектуру «Всё есть плагин» из экосистемы Cordis.
2. Все внешние системы оборачиваются в MCP-серверы со строгой типизацией параметров (JSON Schema).
3. Агенты запускаются в изолированных средах (WebContainers) с ограниченным набором привилегий.`,
  },
];
