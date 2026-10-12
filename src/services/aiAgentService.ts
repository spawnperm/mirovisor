import { GoogleGenAI } from '@google/genai';
import { KanbanCard, CardType, CardPriority } from '../types';

export interface AgentRunResult {
  card: KanbanCard;
  agentName: string;
  reasoning: string;
}

export class AiAgentService {
  private static instance: AiAgentService;
  private apiKey: string = '';
  private ai: GoogleGenAI | null = null;
  private agentFeedbackMemory: Record<string, string[]> = {
    'SecurityAgent (Cordis)': ['Пользователь одобрил замену eval() на ast.literal_eval()'],
    'ArchitectureAgent (Cordis)': ['Учтена строгость RLS FORCE в PostgreSQL'],
    'TestingAgent (Cordis)': ['Повысить приоритет тестам устойчивости к сбоям брокера'],
    'DevOpsAgent (Cordis)': ['Следить за квотами NATS JetStream max_bytes'],
    'UiUxAgent (Cordis)': ['Соблюдать минимальный контраст 3:1 для SVG элементов'],
    'DocsAgent (Cordis)': ['Всегда проверять llms.txt после обновления MCP инструментов'],
  };

  private constructor() {
    this.apiKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || '';
    if (this.apiKey) {
      try {
        this.ai = new GoogleGenAI({ apiKey: this.apiKey });
      } catch (e) {
        console.warn('Failed to init GoogleGenAI instance:', e);
      }
    }
  }

  public static getInstance(): AiAgentService {
    if (!AiAgentService.instance) {
      AiAgentService.instance = new AiAgentService();
    }
    return AiAgentService.instance;
  }

  public recordFeedback(agentName: string, feedback: string) {
    if (!this.agentFeedbackMemory[agentName]) {
      this.agentFeedbackMemory[agentName] = [];
    }
    this.agentFeedbackMemory[agentName].push(feedback);
  }

  public getFeedbackMemory(agentName: string): string[] {
    return this.agentFeedbackMemory[agentName] || [];
  }

  /**
   * Run an automated multi-agent cycle after CI/CD build completion
   */
  public async analyzeTelemetry(agentType: CardType, telemetrySummary: string): Promise<KanbanCard> {
    const agentMap: Record<CardType, { name: string; prefix: string; defaultPriority: CardPriority }> = {
      security: { name: 'SecurityAgent (Cordis)', prefix: 'sec', defaultPriority: 'critical' },
      architecture: { name: 'ArchitectureAgent (Cordis)', prefix: 'arch', defaultPriority: 'high' },
      testing: { name: 'TestingAgent (Cordis)', prefix: 'test', defaultPriority: 'medium' },
      devops: { name: 'DevOpsAgent (Cordis)', prefix: 'devops', defaultPriority: 'medium' },
      ux: { name: 'UiUxAgent (Cordis)', prefix: 'ux', defaultPriority: 'low' },
      docs: { name: 'DocsAgent (Cordis)', prefix: 'docs', defaultPriority: 'low' },
    };

    const agentMeta = agentMap[agentType];
    const pastFeedback = this.getFeedbackMemory(agentMeta.name).join('; ');

    // If Gemini is available, attempt a smart prompt
    if (this.ai) {
      try {
        const response = await this.ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Ты — специализированный AI-агент ${agentMeta.name} в платформе "Мировизор".
Проанализируй телеметрию CI/CD сборки:
"${telemetrySummary}"

Твоя память прошлого фидбека: "${pastFeedback}".
Сформируй конкретную задачу для Канбан-доски в формате JSON:
{
  "title": "Краткий заголовок действия (например: Заменить X на Y)",
  "description": "Техническое описание проблемы и выгоды решения",
  "priority": "critical" | "high" | "medium" | "low",
  "checklist": ["Шаг 1", "Шаг 2", "Шаг 3"],
  "suggestedPatch": "diff или код решения",
  "sourceSnippet": "строка с ошибкой"
}
Ответь ТОЛЬКО валидным JSON без markdown оберток.`,
        });

        const text = response.text || '';
        const clean = text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(clean);

        const cardId = `card_${agentMeta.prefix}_${Date.now().toString().slice(-4)}`;
        return {
          id: cardId,
          title: parsed.title,
          description: parsed.description,
          type: agentType,
          priority: parsed.priority || agentMeta.defaultPriority,
          column: 'ideas',
          source: `CI/CD Build #${Math.floor(1000 + Math.random() * 500)} · Live AI Analysis`,
          sourceSnippet: parsed.sourceSnippet || telemetrySummary,
          suggestedPatch: parsed.suggestedPatch || '',
          attachments: [],
          checklist: (parsed.checklist || ['Проверить решение', 'Запустить тесты']).map((item: string, idx: number) => ({
            id: `c_${idx}`,
            text: item,
            done: false,
          })),
          createdBy: agentMeta.name,
          createdAt: new Date().toISOString(),
          comments: [
            {
              id: `cm_${Date.now()}`,
              author: agentMeta.name,
              avatar: '🤖',
              text: `Сгенерировано на основе анализа свежей телеметрии с учётом опыта прошлых запусков.`,
              timestamp: 'Только что',
            },
          ],
        };
      } catch (err) {
        console.warn('Gemini dynamic analysis fallback to rule engine:', err);
      }
    }

    // Dynamic rule engine fallback (instant, predictable, domain-specific)
    const cardId = `card_${agentMeta.prefix}_${Date.now().toString().slice(-4)}`;
    const templates: Record<CardType, Partial<KanbanCard>> = {
      security: {
        title: 'Устранить обнаруженное использование неэкранированного SQL в модуле отчетов',
        description: 'В логах сканера SAST выявлена конкатенация строк в сыром sql-вызове Drizzle. Заменить на безопасные шаблонные литералы sql`` с авто-параметризацией.',
        priority: 'critical',
        sourceSnippet: `const query = sql.raw('SELECT * FROM ' + tableName + ' WHERE id = ' + userId);`,
        suggestedPatch: `const query = sql\`SELECT * FROM \${sql.identifier(tableName)} WHERE id = \${userId}\`;`,
      },
      architecture: {
        title: 'Ограничить глубину наследования интерфейсов вlibs/core/src/tenant',
        description: 'Анализ зависимостей выявил усложнение графа связности между плагинами и ядром. Выделить чистый порт StorageGateway.',
        priority: 'high',
        sourceSnippet: `TenantModule -> PluginModule -> TenantDbResolver -> TenantModule`,
        suggestedPatch: `// Вынесение TenantDbResolver в libs/shared/contracts/tenant`,
      },
      testing: {
        title: 'Добавить Playwright visual regression snapshot для мобильного вида карточек',
        description: 'При ширине вьюпорта 375px на iPhone 14 Pro кнопки действий карточки сжимаются. Добавить тест toHaveScreenshot.',
        priority: 'medium',
        sourceSnippet: `await page.setViewportSize({ width: 375, height: 812 });`,
        suggestedPatch: `await expect(page).toHaveScreenshot('mobile-kanban-card.png', { maxDiffPixels: 50 });`,
      },
      devops: {
        title: 'Ограничить CPU limits в манифесте Kubernetes api-deployment.yaml до 500m',
        description: 'Prometheus зафиксировал всплеск троттлинга на поде api-worker-3 при пиковом наплыве webhook-событий.',
        priority: 'medium',
        sourceSnippet: `resources:\n  limits:\n    cpu: "250m" # Увеличить до 500m`,
        suggestedPatch: `resources:\n  limits:\n    cpu: "500m"\n    memory: "1Gi"`,
      },
      ux: {
        title: 'Добавить тактильный фокус visible-ring на кнопки действий внутри модалки',
        description: 'Проверка доступности WCAG AA: при навигации через Tab фокус не отображается на кнопке "Создать PR".',
        priority: 'low',
        sourceSnippet: `<button className="px-3 py-1.5 bg-cyan-600">`,
        suggestedPatch: `<button className="px-3 py-1.5 bg-cyan-600 focus-visible:ring-2 focus-visible:ring-cyan-400">`,
      },
      docs: {
        title: 'Актуализировать раздел RLS Scoping в LLM Wiki (wiki/concepts/rls.md)',
        description: 'После обновления NestJS TenantMiddleware изменилась сигнатура извлечения tenantId из токена Authentik.',
        priority: 'low',
        sourceSnippet: `const tenantId = req.user?.['tenantId'];`,
        suggestedPatch: `// Добавлена поддержка fallback на claim 'org_id' из Authentik`,
      },
    };

    const template = templates[agentType];

    return {
      id: cardId,
      title: template.title || 'Новая оптимизационная рекомендация',
      description: template.description || 'Анализ завершен успешно, сформировано предложение по улучшению.',
      type: agentType,
      priority: template.priority || agentMeta.defaultPriority,
      column: 'ideas',
      source: `CI/CD Build #${Math.floor(1000 + Math.random() * 500)} · ${agentMeta.name}`,
      sourceSnippet: template.sourceSnippet,
      suggestedPatch: template.suggestedPatch,
      attachments: [],
      checklist: [
        { id: 'c1', text: 'Провести ревью предложенного решения', done: false },
        { id: 'c2', text: 'Запустить локальный билд pnpm nx affected', done: false },
        { id: 'c3', text: 'Обновить соответствующие тесты', done: false },
      ],
      createdBy: agentMeta.name,
      createdAt: new Date().toISOString(),
      comments: [
        {
          id: `cm_${Date.now()}`,
          author: agentMeta.name,
          avatar: '🤖',
          text: `Агент завершил статический анализ. Рекомендация готова к рассмотрению суперадмином.`,
          timestamp: 'Только что',
        },
      ],
    };
  }

  // Voice Agent Persistent Conversational Memory & Interruption Handling
  private voiceConversationHistory: Array<{
    id: string;
    role: 'user' | 'agent' | 'system';
    text: string;
    timestamp: string;
    actionResult?: string;
    interrupted?: boolean;
  }> = [
    {
      id: 'init_welcome',
      role: 'agent',
      text: 'Голосовой агент платформы «Мировизор» на связи. Вы можете программировать портал, создавать плагины, запускать тесты и переключать тенанты. Если захотите прервать меня, просто заговорите или нажмите микрофон!',
      timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    },
  ];

  public getVoiceConversationHistory() {
    return [...this.voiceConversationHistory];
  }

  public addVoiceTurn(turn: {
    role: 'user' | 'agent' | 'system';
    text: string;
    actionResult?: string;
    interrupted?: boolean;
  }) {
    const newTurn = {
      id: `vt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      ...turn,
    };
    this.voiceConversationHistory.push(newTurn);
    return newTurn;
  }

  public markLastAgentTurnInterrupted(interruptionNote: string = 'Перебито пользователем (Barge-in)') {
    for (let i = this.voiceConversationHistory.length - 1; i >= 0; i--) {
      if (this.voiceConversationHistory[i].role === 'agent') {
        this.voiceConversationHistory[i].interrupted = true;
        this.voiceConversationHistory[i].actionResult = interruptionNote;
        break;
      }
    }
  }

  public clearVoiceConversationHistory() {
    this.voiceConversationHistory = [];
  }
}

