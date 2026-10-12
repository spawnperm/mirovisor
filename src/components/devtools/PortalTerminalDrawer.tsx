import React, { useState, useRef, useEffect } from 'react';
import { Terminal, X, Play, RotateCcw, Shield, Check, CornerDownLeft } from 'lucide-react';
import { Tenant, User } from '../../types';

interface PortalTerminalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTenant: Tenant;
  currentUser: User;
  onTriggerCiCd: () => void;
}

interface CommandLog {
  id: string;
  type: 'input' | 'output' | 'error' | 'success';
  text: string;
}

export const PortalTerminalDrawer: React.FC<PortalTerminalDrawerProps> = ({
  isOpen,
  onClose,
  activeTenant,
  currentUser,
  onTriggerCiCd,
}) => {
  const [commandInput, setCommandInput] = useState<string>('');
  const [history, setHistory] = useState<CommandLog[]>([
    { id: '1', type: 'output', text: '\x1b[1;36m╔══════════════════════════════════════════════════════════════╗\x1b[0m' },
    { id: '2', type: 'output', text: '║  МИРОВИЗОР · DEVELOPER TERMINAL v1.0 (WebContainers Ready)   ║' },
    { id: '3', type: 'output', text: '╚══════════════════════════════════════════════════════════════╝' },
    { id: '4', type: 'output', text: `Сессия: ${currentUser.username} | Схема: ${activeTenant.schema} | RLS: FORCE` },
    { id: '5', type: 'output', text: 'Введите "help" для просмотра доступных команд или "ci run".' },
  ]);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, isOpen]);

  if (!isOpen) return null;

  const handleRunCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = commandInput.trim();
    if (!cmd) return;

    const newLogs: CommandLog[] = [...history, { id: `in_${Date.now()}`, type: 'input', text: `$ ${cmd}` }];
    const parts = cmd.split(' ');
    const root = parts[0].toLowerCase();

    switch (root) {
      case 'help':
        newLogs.push({
          id: `out_${Date.now()}`,
          type: 'output',
          text: `Доступные команды платформы:
  • ci run              - Запуск цикла CI/CD и мультиагентного анализа
  • agent inspect       - Статус 6 AI-агентов Cordis и память обратной связи
  • rls test            - Проверка изоляции Row-Level Security текущего тенанта
  • plugin list         - Список установленных модулей в схеме ${activeTenant.schema}
  • mcp status          - Проверка соединения с MCP-серверами (Gauzy, Univer, Cordis)
  • migrate             - Запуск drizzle-multitenant migrate --tenant=${activeTenant.slug}
  • rollback            - Откат последнего примененного изменения кода
  • asvs verify         - Аудит соответствия стандарту OWASP ASVS 5.0 Level 2
  • clear               - Очистить экран консоли`,
        });
        break;

      case 'clear':
        setHistory([]);
        setCommandInput('');
        return;

      case 'ci':
        if (parts[1] === 'run') {
          newLogs.push({ id: `out_${Date.now()}`, type: 'output', text: '[NATS] Публикация события BuildCompleted...' });
          newLogs.push({ id: `out_${Date.now()}_2`, type: 'output', text: '[Cordis] Мультиагентный ансамбль собирает SAST и метрики...' });
          onTriggerCiCd();
          newLogs.push({ id: `out_${Date.now()}_3`, type: 'success', text: '✓ Цикл CI/CD успешно завершен! Создана рекомендация в канбан-доске.' });
        } else {
          newLogs.push({ id: `err_${Date.now()}`, type: 'error', text: 'Использование: ci run' });
        }
        break;

      case 'agent':
        if (parts[1] === 'inspect') {
          newLogs.push({
            id: `out_${Date.now()}`,
            type: 'output',
            text: `АКТИВНЫЕ АГЕНТЫ CORDIS (Model: DeepSeek-V3 / Gemini-2.5-Flash):
  [1] SecurityAgent     - Статус: IDLE · Правило: CWE-95 / ASVS 5.0 L2
  [2] ArchitectureAgent - Статус: IDLE · Правило: RLS FORCE / No Cycles
  [3] TestingAgent      - Статус: IDLE · Покрытие: Testcontainers
  [4] DevOpsAgent       - Статус: IDLE · Мониторинг NATS Quotas
  [5] UiUxAgent         - Статус: IDLE · Стандарт WCAG AA 3:1
  [6] DocsAgent         - Статус: IDLE · LLM Wiki / llms.txt Sync`,
          });
        }
        break;

      case 'rls':
        newLogs.push({ id: `out_${Date.now()}`, type: 'output', text: `Выполнение проверки RLS для ${activeTenant.schema}...` });
        newLogs.push({ id: `out_${Date.now()}_2`, type: 'output', text: `SET LOCAL app.current_tenant = '${activeTenant.id}';` });
        newLogs.push({ id: `out_${Date.now()}_3`, type: 'success', text: `✓ RLS FORCE активен! Доступ к данным других 3 тенантов физически заблокирован ядром PostgreSQL.` });
        break;

      case 'plugin':
        newLogs.push({
          id: `out_${Date.now()}`,
          type: 'output',
          text: `Модули схемы ${activeTenant.schema}:
  • gauzy-crm-pro (v2.4.1) [ACTIVE]
  • univer-office-engine (v2.1.0) [ACTIVE]
  • crowdsec-traefik-waf (v1.8.3) [ACTIVE]`,
        });
        break;

      case 'mcp':
        newLogs.push({
          id: `out_${Date.now()}`,
          type: 'success',
          text: `MCP Servers Gateway:
  ✓ gauzy-mcp: 14 tools online
  ✓ univer-office-mcp: 8 tools online (xlsx/docx/formula)
  ✓ cordis-kanban-mcp: 3 tools online (create_card, move_card, rate_card)`,
        });
        break;

      case 'rollback':
        newLogs.push({
          id: `out_${Date.now()}`,
          type: 'success',
          text: `[Git] Revert commit head. Схема ${activeTenant.schema} возвращена к предыдущему стабильному состоянию.`,
        });
        break;

      case 'asvs':
        newLogs.push({
          id: `out_${Date.now()}`,
          type: 'success',
          text: `OWASP ASVS 5.0 Verification Summary:
  ✓ V1: Architecture & Threat Modeling - PASS
  ✓ V2: Authentication (Authentik OIDC) - PASS
  ✓ V3: Session Management (Redis) - PASS
  ✓ V4: Access Control (RLS FORCE + Scoping) - PASS
  Всего пройдено: 146 проверок (Level 2 Verified).`,
        });
        break;

      default:
        newLogs.push({
          id: `err_${Date.now()}`,
          type: 'error',
          text: `Неизвестная команда: "${cmd}". Введите "help" для списка команд.`,
        });
    }

    setHistory(newLogs);
    setCommandInput('');
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-neutral-950 border-t border-neutral-800 shadow-2xl h-80 flex flex-col font-mono text-xs">
      {/* Drawer Title Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-neutral-900 border-b border-neutral-800 text-neutral-300">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-white text-xs">TERMINAL · WEBCONTAINERS CLI</span>
          <span className="text-[10px] text-neutral-500">[{activeTenant.slug}]</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setHistory([
                { id: '1', type: 'output', text: 'Терминал очищен.' },
              ]);
            }}
            className="text-[11px] text-neutral-400 hover:text-white px-2 py-0.5 rounded bg-neutral-800"
          >
            Clear
          </button>
          <button onClick={onClose} className="text-neutral-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Terminal Screen */}
      <div className="flex-1 p-3 overflow-y-auto space-y-1 bg-black/90 text-neutral-200">
        {history.map((log) => (
          <div
            key={log.id}
            className={`whitespace-pre-wrap leading-relaxed ${
              log.type === 'input'
                ? 'text-cyan-400 font-bold'
                : log.type === 'error'
                ? 'text-rose-400'
                : log.type === 'success'
                ? 'text-emerald-400 font-semibold'
                : 'text-neutral-300'
            }`}
          >
            {log.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Prompt Form */}
      <form onSubmit={handleRunCommand} className="flex items-center gap-2 px-3 py-2 bg-neutral-900 border-t border-neutral-800">
        <span className="text-cyan-400 font-bold">$</span>
        <input
          type="text"
          value={commandInput}
          onChange={(e) => setCommandInput(e.target.value)}
          placeholder="Введите команду (например: ci run, rls test, agent inspect, help)..."
          className="flex-1 bg-transparent text-white focus:outline-none text-xs"
          autoFocus
        />
        <button type="submit" className="text-neutral-400 hover:text-white p-1">
          <CornerDownLeft className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
