import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Play,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
  Shield,
  Layers,
  FlaskConical,
  Terminal,
  Palette,
  FileText,
  Star,
  RotateCcw,
  GitPullRequest,
  CheckSquare,
  MessageSquare,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Plus,
  LayoutGrid,
  Rows3,
  Users2,
  FolderOpen,
  FolderClosed,
  X,
  Grid2x2,
  CalendarClock,
  Bot,
  ShieldAlert
} from 'lucide-react';
import { KanbanCard, CardColumn, CardType, CardPriority } from '../../types';
import { AiAgentService } from '../../services/aiAgentService';
import { CollaborativeCardEditor } from './CollaborativeCardEditor';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface KanbanBoardProps {
  cards: KanbanCard[];
  onUpdateCard: (card: KanbanCard) => void;
  onMoveCard: (cardId: string, targetCol: CardColumn, feedbackReason?: string) => boolean;
  onAddCard: (card: KanbanCard) => void;
  onRollbackCard: (cardId: string, reason: string) => void;
  onRateCard: (cardId: string, rating: number, feedback: string) => void;
}

const WIP_LIMIT_IN_PROGRESS = 3;

export type SwimlaneMode = 'none' | 'priority' | 'team';
export type BoardViewMode = 'kanban' | 'eisenhower';

interface SwimlaneDef {
  id: string;
  title: string;
  badge: string;
  color: string;
  icon: React.ReactNode;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  cards,
  onUpdateCard,
  onMoveCard,
  onAddCard,
  onRollbackCard,
  onRateCard,
}) => {
  const [boardViewMode, setBoardViewMode] = useState<BoardViewMode>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('mirovisor_kanban_view_layout');
        if (saved === 'eisenhower' || saved === 'kanban') return saved;
      } catch {}
    }
    return 'kanban';
  });

  const handleSetBoardViewMode = (mode: BoardViewMode) => {
    setBoardViewMode(mode);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('mirovisor_kanban_view_layout', mode);
      } catch {}
    }
  };

  const [swimlaneMode, setSwimlaneMode] = useState<SwimlaneMode>('none');
  const [collapsedSwimlanes, setCollapsedSwimlanes] = useState<Set<string>>(new Set());

  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null);
  const [rejectModalCard, setRejectModalCard] = useState<{ card: KanbanCard; targetCol: CardColumn } | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('Несогласен с приоритетом');
  const [customRejectReason, setCustomRejectReason] = useState<string>('');
  const [isSimulatingCiCd, setIsSimulatingCiCd] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [ratingModalCard, setRatingModalCard] = useState<KanbanCard | null>(null);
  const [starRating, setStarRating] = useState<number>(5);
  const [ratingFeedback, setRatingFeedback] = useState<string>('');

  // WCAG 2.1 AA focus traps for interactive modals
  const { containerRef: detailModalRef } = useFocusTrap({
    isOpen: !!selectedCard,
    onClose: () => setSelectedCard(null),
  });

  const { containerRef: rejectModalRef } = useFocusTrap({
    isOpen: !!rejectModalCard,
    onClose: () => setRejectModalCard(null),
  });

  const { containerRef: ratingModalRef } = useFocusTrap({
    isOpen: !!ratingModalCard,
    onClose: () => setRatingModalCard(null),
  });

  const inProgressCount = cards.filter((c) => c.column === 'in_progress').length;

  const toggleSwimlaneCollapse = (swimlaneId: string) => {
    setCollapsedSwimlanes((prev) => {
      const next = new Set(prev);
      if (next.has(swimlaneId)) {
        next.delete(swimlaneId);
      } else {
        next.add(swimlaneId);
      }
      return next;
    });
  };

  const collapseAllSwimlanes = () => {
    if (swimlaneMode === 'priority') {
      setCollapsedSwimlanes(new Set(['critical', 'high', 'medium', 'low']));
    } else if (swimlaneMode === 'team') {
      setCollapsedSwimlanes(new Set(['security', 'architecture', 'testing', 'devops', 'ux', 'docs']));
    }
  };

  const expandAllSwimlanes = () => {
    setCollapsedSwimlanes(new Set());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (
    e: React.DragEvent,
    targetCol: CardColumn,
    targetSwimlaneId?: string
  ) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData('text/plain');
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;

    if (targetCol === 'deferred') {
      setRejectModalCard({ card, targetCol });
      return;
    }

    if (targetCol === 'in_progress' && card.column !== 'in_progress' && inProgressCount >= WIP_LIMIT_IN_PROGRESS) {
      alert(
        `Внимание! Превышен WIP-лимит: в колонке «В работу» не может быть более ${WIP_LIMIT_IN_PROGRESS} задач одновременно! Сначала завершите текущие задачи.`
      );
      return;
    }

    // Auto-update card priority or team type if dropped into a swimlane
    if (targetSwimlaneId) {
      if (swimlaneMode === 'priority' && card.priority !== targetSwimlaneId) {
        onUpdateCard({
          ...card,
          priority: targetSwimlaneId as CardPriority,
          column: targetCol,
        });
        return;
      } else if (swimlaneMode === 'team' && card.type !== targetSwimlaneId) {
        onUpdateCard({
          ...card,
          type: targetSwimlaneId as CardType,
          column: targetCol,
        });
        return;
      }
    }

    onMoveCard(cardId, targetCol);
  };

  const handleDropEisenhower = (e: React.DragEvent, quadrant: string) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData('text/plain');
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;

    if (quadrant === 'q1') {
      onUpdateCard({ ...card, priority: 'critical' });
    } else if (quadrant === 'q2') {
      onUpdateCard({
        ...card,
        priority: 'high',
        column: card.column === 'in_progress' ? 'ideas' : card.column,
      });
    } else if (quadrant === 'q3') {
      onUpdateCard({ ...card, priority: 'medium' });
    } else if (quadrant === 'q4') {
      onUpdateCard({ ...card, priority: 'low' });
    }
  };

  const confirmRejection = () => {
    if (!rejectModalCard) return;
    const finalReason = customRejectReason.trim() ? customRejectReason : rejectReason;
    AiAgentService.getInstance().recordFeedback(
      rejectModalCard.card.createdBy,
      `Суперадмин отклонил задачу [${rejectModalCard.card.title}]: причина: "${finalReason}"`
    );
    onMoveCard(rejectModalCard.card.id, rejectModalCard.targetCol, finalReason);
    setRejectModalCard(null);
    setCustomRejectReason('');
  };

  const triggerCiCdAnalysis = async (agentType: CardType = 'security') => {
    setIsSimulatingCiCd(true);
    try {
      const newCard = await AiAgentService.getInstance().analyzeTelemetry(
        agentType,
        'CI/CD Pipeline #1043 build and security scan completed. Raw output: found potential risk and optimization candidates.'
      );
      onAddCard(newCard);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulatingCiCd(false);
    }
  };

  const handleAddComment = () => {
    if (!selectedCard || !newCommentText.trim()) return;
    const updated = {
      ...selectedCard,
      comments: [
        ...selectedCard.comments,
        {
          id: `cmt_${Date.now()}`,
          author: 'Алексей Смирнов (SuperAdmin)',
          avatar: '👨‍💻',
          text: newCommentText.trim(),
          timestamp: 'Только что',
        },
      ],
    };
    onUpdateCard(updated);
    setSelectedCard(updated);
    setNewCommentText('');
  };

  const getTypeIcon = (type: CardType) => {
    switch (type) {
      case 'security':
        return <Shield className="w-3.5 h-3.5 text-rose-400" />;
      case 'architecture':
        return <Layers className="w-3.5 h-3.5 text-indigo-400" />;
      case 'testing':
        return <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />;
      case 'devops':
        return <Terminal className="w-3.5 h-3.5 text-amber-400" />;
      case 'ux':
        return <Palette className="w-3.5 h-3.5 text-sky-400" />;
      case 'docs':
        return <FileText className="w-3.5 h-3.5 text-purple-400" />;
    }
  };

  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      const matchesType = filterType === 'all' || card.type === filterType;
      const matchesPriority = filterPriority === 'all' || card.priority === filterPriority;
      return matchesType && matchesPriority;
    });
  }, [cards, filterType, filterPriority]);

  const columns: { id: CardColumn; title: string; hint: string; color: string }[] = [
    { id: 'ideas', title: 'Идеи (Агенты)', hint: 'Предложения от Cordis LLM', color: 'border-purple-500/30' },
    { id: 'in_progress', title: 'В работу', hint: `WIP лимит: ${WIP_LIMIT_IN_PROGRESS}`, color: 'border-cyan-500/30' },
    { id: 'collected', title: 'Собрано / Реализовано', hint: 'PR создан или смержен', color: 'border-emerald-500/30' },
    { id: 'deferred', title: 'Отложено', hint: 'Обратная связь зафиксирована', color: 'border-neutral-700' },
  ];

  // Swimlanes definitions
  const prioritySwimlanes: SwimlaneDef[] = [
    {
      id: 'critical',
      title: 'Критический приоритет (Critical / Blocker)',
      badge: 'P0 · Critical',
      color: 'border-rose-500/40 text-rose-400 bg-rose-950/20',
      icon: <Shield className="w-4 h-4 text-rose-400" />,
    },
    {
      id: 'high',
      title: 'Высокий приоритет (High)',
      badge: 'P1 · High',
      color: 'border-amber-500/40 text-amber-400 bg-amber-950/20',
      icon: <AlertCircle className="w-4 h-4 text-amber-400" />,
    },
    {
      id: 'medium',
      title: 'Средний приоритет (Medium)',
      badge: 'P2 · Medium',
      color: 'border-cyan-500/40 text-cyan-400 bg-cyan-950/20',
      icon: <Layers className="w-4 h-4 text-cyan-400" />,
    },
    {
      id: 'low',
      title: 'Низкий приоритет (Low)',
      badge: 'P3 · Low',
      color: 'border-neutral-700 text-neutral-400 bg-neutral-900/40',
      icon: <Clock className="w-4 h-4 text-neutral-400" />,
    },
  ];

  const teamSwimlanes: SwimlaneDef[] = [
    {
      id: 'security',
      title: 'AppSec & Security Gate (Безопасность / SAST)',
      badge: 'AppSec Team',
      color: 'border-rose-500/40 text-rose-400 bg-rose-950/20',
      icon: <Shield className="w-4 h-4 text-rose-400" />,
    },
    {
      id: 'architecture',
      title: 'Комитет Архитектуры & Ядро (RLS / Schema-per-Tenant)',
      badge: 'Platform Core',
      color: 'border-indigo-500/40 text-indigo-400 bg-indigo-950/20',
      icon: <Layers className="w-4 h-4 text-indigo-400" />,
    },
    {
      id: 'testing',
      title: 'Тестирование & Надежность (Testcontainers / QA)',
      badge: 'QA Automation',
      color: 'border-emerald-500/40 text-emerald-400 bg-emerald-950/20',
      icon: <FlaskConical className="w-4 h-4 text-emerald-400" />,
    },
    {
      id: 'devops',
      title: 'DevOps & CI/CD (Инфраструктура & NATS JetStream)',
      badge: 'SRE / DevOps',
      color: 'border-amber-500/40 text-amber-400 bg-amber-950/20',
      icon: <Terminal className="w-4 h-4 text-amber-400" />,
    },
    {
      id: 'ux',
      title: 'UI/UX & Продуктовый Дизайн (WCAG 2.1 AA / UX)',
      badge: 'Design System',
      color: 'border-sky-500/40 text-sky-400 bg-sky-950/20',
      icon: <Palette className="w-4 h-4 text-sky-400" />,
    },
    {
      id: 'docs',
      title: 'Техническая Документация & ADR (LLM Wiki)',
      badge: 'Compliance & Docs',
      color: 'border-purple-500/40 text-purple-400 bg-purple-950/20',
      icon: <FileText className="w-4 h-4 text-purple-400" />,
    },
  ];

  const activeSwimlanes = swimlaneMode === 'priority' ? prioritySwimlanes : swimlaneMode === 'team' ? teamSwimlanes : [];

  // Helper to render a card element
  const renderCardItem = (card: KanbanCard) => {
    const doneChecks = card.checklist.filter((i) => i.done).length;
    const totalChecks = card.checklist.length;

    return (
      <div
        key={card.id}
        draggable
        onDragStart={(e) => e.dataTransfer.setData('text/plain', card.id)}
        onClick={() => setSelectedCard(card)}
        className={`p-3 rounded-lg border transition-all cursor-pointer hover:border-neutral-600 bg-neutral-950/90 shadow-md ${
          card.priority === 'critical'
            ? 'border-l-4 border-l-rose-500'
            : card.priority === 'high'
            ? 'border-l-4 border-l-amber-500'
            : 'border-l-4 border-l-cyan-500'
        }`}
      >
        {/* Kicker / Type & Priority */}
        <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-1.5">
          <span className="flex items-center gap-1 font-mono uppercase">
            {getTypeIcon(card.type)}
            {card.type}
          </span>
          <span className="font-mono text-neutral-400 font-semibold">{card.createdBy.split(' ')[0]}</span>
        </div>

        {/* Title */}
        <h4 className="text-xs font-semibold text-neutral-100 line-clamp-2 mb-1.5 leading-snug">
          {card.title}
        </h4>

        {/* Source indicator */}
        <div className="text-[10px] text-neutral-400 font-mono truncate mb-2">
          {card.source}
        </div>

        {/* Subtasks progress */}
        {totalChecks > 0 && (
          <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-2 bg-neutral-900/60 px-2 py-1 rounded">
            <span className="flex items-center gap-1">
              <CheckSquare className="w-3 h-3 text-cyan-400" />
              Чек-лист
            </span>
            <span className="font-mono">
              {doneChecks}/{totalChecks}
            </span>
          </div>
        )}

        {/* Bottom Meta & Rating */}
        <div className="flex items-center justify-between pt-1.5 border-t border-neutral-800/80 text-[10px] text-neutral-400">
          {card.comments.length > 0 ? (
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {card.comments.length}
            </span>
          ) : (
            <span />
          )}

          {card.rolledBack && (
            <span className="font-mono text-rose-400 font-bold flex items-center gap-1">
              <RotateCcw className="w-2.5 h-2.5" />
              Откачено
            </span>
          )}

          {card.userRating && (
            <span className="flex items-center gap-0.5 text-amber-400 font-mono">
              <Star className="w-2.5 h-2.5 fill-current" />
              {card.userRating}/5
            </span>
          )}

          {card.column === 'ideas' && (
            <span className="text-cyan-400 flex items-center gap-0.5 hover:underline">
              Решение <ChevronRight className="w-3 h-3" />
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 p-4 gap-4 overflow-hidden">
      {/* Top Header & CI/CD trigger */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900/80 p-3 rounded-xl border border-neutral-800 shrink-0 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            КАНБАН-ДОСКА ЭВОЛЮЦИИ «ИДЕИ → РАБОТА»
            <span className="text-xs font-normal text-neutral-400">
              (Цикл «Наблюдай → Предлагай → Решай → Внедряй»)
            </span>
          </h2>
          <div className="text-xs text-neutral-400 flex items-center gap-2 mt-0.5">
            <span>
              WIP в работе:{' '}
              <strong className={inProgressCount >= WIP_LIMIT_IN_PROGRESS ? 'text-amber-400 font-mono font-bold' : 'text-cyan-400 font-mono font-bold'}>
                {inProgressCount} / {WIP_LIMIT_IN_PROGRESS}
              </strong>
            </span>
            <span>·</span>
            <span>MCP-сервер: <span className="text-emerald-400 font-mono">ONLINE</span></span>
            <span>·</span>
            <span>Обучение агентов: <span className="text-purple-400 font-mono">АКТИВНО</span></span>
          </div>
        </div>

        {/* Action button to trigger automated CI/CD multi-agent cycle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs">
            <span className="text-[11px] text-neutral-400 px-2">Запустить агента:</span>
            {(['security', 'architecture', 'testing', 'devops'] as CardType[]).map((t) => (
              <button
                key={t}
                onClick={() => triggerCiCdAnalysis(t)}
                disabled={isSimulatingCiCd}
                className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 rounded text-[11px] capitalize flex items-center gap-1 transition-colors"
              >
                {getTypeIcon(t)}
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={() => triggerCiCdAnalysis('security')}
            disabled={isSimulatingCiCd}
            className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-medium text-xs rounded-lg flex items-center gap-1.5 shadow-md shadow-purple-900/30 transition-all disabled:opacity-50"
          >
            {isSimulatingCiCd ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Сбор телеметрии...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                Запустить CI/CD цикл
              </>
            )}
          </button>
        </div>
      </div>

      {/* Primary View Layout & Mode Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900/50 p-2.5 rounded-xl border border-neutral-800 shrink-0 text-xs">
        {/* Left: View Mode (Kanban vs Eisenhower) and Swimlanes */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Layout Mode Toggle */}
          <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
            <button
              onClick={() => handleSetBoardViewMode('kanban')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
                boardViewMode === 'kanban'
                  ? 'bg-neutral-800 text-white font-bold shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
              Колонки Канбан
            </button>

            <button
              onClick={() => handleSetBoardViewMode('eisenhower')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
                boardViewMode === 'eisenhower'
                  ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Grid2x2 className="w-3.5 h-3.5 text-amber-300" />
              Матрица Эйзенхауэра 2×2
            </button>
          </div>

          {/* Swimlanes Mode (Only shown when boardViewMode === 'kanban') */}
          {boardViewMode === 'kanban' && (
            <div className="flex items-center gap-2 pl-2 border-l border-neutral-800">
              <span className="font-semibold text-neutral-400 text-[11px] uppercase tracking-wider flex items-center gap-1">
                <Rows3 className="w-3.5 h-3.5 text-cyan-400" />
                Свимлейны:
              </span>
              <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
                <button
                  onClick={() => setSwimlaneMode('none')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
                    swimlaneMode === 'none'
                      ? 'bg-neutral-800 text-white font-bold shadow-xs'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  Без свимлейнов
                </button>

                <button
                  onClick={() => setSwimlaneMode('priority')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
                    swimlaneMode === 'priority'
                      ? 'bg-cyan-600 text-white font-bold shadow-xs'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-amber-300" />
                  По приоритетам
                </button>

                <button
                  onClick={() => setSwimlaneMode('team')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
                    swimlaneMode === 'team'
                      ? 'bg-purple-600 text-white font-bold shadow-xs'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Users2 className="w-3.5 h-3.5 text-purple-200" />
                  По командам
                </button>
              </div>

              {swimlaneMode !== 'none' && (
                <div className="flex items-center gap-1 ml-1 text-[11px] font-mono text-neutral-400">
                  <button
                    onClick={expandAllSwimlanes}
                    className="px-2 py-1 rounded bg-neutral-950 hover:bg-neutral-800 text-neutral-300 border border-neutral-800"
                    title="Развернуть все свимлейны"
                  >
                    Развернуть
                  </button>
                  <button
                    onClick={collapseAllSwimlanes}
                    className="px-2 py-1 rounded bg-neutral-950 hover:bg-neutral-800 text-neutral-300 border border-neutral-800"
                    title="Свернуть все свимлейны"
                  >
                    Свернуть
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-neutral-400 text-[11px] uppercase">Тип:</span>
            {['all', 'security', 'architecture', 'testing', 'devops', 'ux', 'docs'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                  filterType === type ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {type === 'all' ? 'Все' : type}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 border-l border-neutral-800 pl-3">
            <span className="text-[11px] text-neutral-400 font-semibold uppercase">Приоритет:</span>
            {['all', 'critical', 'high', 'medium', 'low'].map((p) => (
              <button
                key={p}
                onClick={() => setFilterPriority(p)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                  filterPriority === p ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400 hover:text-neutral-300'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Board Area */}
      <div className="flex-1 overflow-y-auto pr-1">
        {boardViewMode === 'eisenhower' ? (
          /* PERSISTENT EISENHOWER MATRIX (2x2 Grid) */
          <div className="h-full flex flex-col gap-3 min-h-[580px]">
            {/* Matrix Subtitle */}
            <div className="flex items-center justify-between text-xs text-neutral-400 px-1 font-mono">
              <span className="flex items-center gap-2 text-neutral-300 font-semibold">
                <Grid2x2 className="w-4 h-4 text-amber-400" />
                МАТРИЦА ЭЙЗЕНХАУЭРА (ВАЖНОСТЬ × СРОЧНОСТЬ)
              </span>
              <span>Перетаскивайте карточки между квадрантами для авто-калибровки приоритета</span>
            </div>

            {/* 2x2 Quadrants Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 flex-1 pb-4">
              {[
                {
                  id: 'q1',
                  title: 'Срочно и Важно (Do First)',
                  badge: 'Q1 · P0 Критический',
                  description: 'Блокирующие баги, критические уязвимости, отказы прод-систем',
                  color: 'border-rose-500/50 bg-rose-950/20 text-rose-400',
                  icon: <ShieldAlert className="w-4 h-4 text-rose-400" />,
                  cards: filteredCards.filter((c) => c.priority === 'critical' || (c.priority === 'high' && c.column === 'in_progress')),
                },
                {
                  id: 'q2',
                  title: 'Не срочно, но Важно (Schedule)',
                  badge: 'Q2 · P1 Высокий',
                  description: 'Архитектурные ADR, изоляция мультитенантности RLS, надежность тестов',
                  color: 'border-amber-500/50 bg-amber-950/20 text-amber-400',
                  icon: <CalendarClock className="w-4 h-4 text-amber-400" />,
                  cards: filteredCards.filter((c) => c.priority === 'high' && c.column !== 'in_progress'),
                },
                {
                  id: 'q3',
                  title: 'Срочно, но Не важно (Delegate)',
                  badge: 'Q3 · P2 Средний',
                  description: 'Рутинная телеметрия, авто-исправления Cordis, повторные прогоны',
                  color: 'border-cyan-500/50 bg-cyan-950/20 text-cyan-400',
                  icon: <Bot className="w-4 h-4 text-cyan-400" />,
                  cards: filteredCards.filter((c) => c.priority === 'medium'),
                },
                {
                  id: 'q4',
                  title: 'Не срочно и Не важно (Eliminate / Backlog)',
                  badge: 'Q4 · P3 Бэклог',
                  description: 'Косметические доработки, отложенные идеи, архив предложений',
                  color: 'border-neutral-700 bg-neutral-900/40 text-neutral-400',
                  icon: <Clock className="w-4 h-4 text-neutral-400" />,
                  cards: filteredCards.filter((c) => c.priority === 'low' || c.column === 'deferred'),
                },
              ].map((quad) => (
                <div
                  key={quad.id}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropEisenhower(e, quad.id)}
                  className={`rounded-2xl border ${quad.color} p-3.5 flex flex-col shadow-lg backdrop-blur-xs min-h-[250px]`}
                >
                  <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-neutral-800/80">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {quad.icon}
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white flex items-center gap-2 truncate">
                          {quad.title}
                          <span className="text-[10px] font-mono text-neutral-300 px-1.5 py-0.2 bg-neutral-900 rounded border border-neutral-750">
                            {quad.cards.length}
                          </span>
                        </h4>
                        <span className="text-[10px] text-neutral-400 block truncate">{quad.description}</span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${quad.color} shrink-0`}>
                      {quad.badge}
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                    {quad.cards.length === 0 ? (
                      <div className="h-28 flex items-center justify-center border border-dashed border-neutral-800/80 rounded-xl text-neutral-500 text-xs text-center p-3">
                        Перетащите карточки сюда для изменения приоритета
                      </div>
                    ) : (
                      quad.cards.map(renderCardItem)
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : swimlaneMode === 'none' ? (
          /* STANDARD FLAT KANBAN BOARD */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 h-full min-h-[520px]">
            {columns.map((col) => {
              const colCards = filteredCards.filter((c) => c.column === col.id);
              const isAtWipLimit = col.id === 'in_progress' && colCards.length >= WIP_LIMIT_IN_PROGRESS;

              return (
                <div
                  key={col.id}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, col.id)}
                  className={`flex flex-col bg-neutral-900/50 rounded-xl border ${col.color} p-3 min-w-[280px] shadow-sm`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-neutral-800">
                    <div>
                      <h3 className="text-xs font-bold text-white flex items-center gap-2">
                        {col.title}
                        <span className="text-[10px] font-mono text-neutral-400 px-1.5 py-0.5 bg-neutral-800 rounded">
                          {colCards.length}
                        </span>
                      </h3>
                      <span className="text-[10px] text-neutral-400 block">{col.hint}</span>
                    </div>
                    {isAtWipLimit && (
                      <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                        WIP LIMIT
                      </span>
                    )}
                  </div>

                  {/* Card List */}
                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                    {colCards.length === 0 ? (
                      <div className="h-28 flex items-center justify-center border border-dashed border-neutral-800 rounded-lg text-neutral-400 text-xs text-center p-3">
                        Перетащите карточки сюда
                      </div>
                    ) : (
                      colCards.map(renderCardItem)
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* HORIZONTAL SWIMLANES VIEW */
          <div className="space-y-4 pb-6">
            {activeSwimlanes.map((lane) => {
              const isCollapsed = collapsedSwimlanes.has(lane.id);
              const laneCards = filteredCards.filter((c) =>
                swimlaneMode === 'priority' ? c.priority === lane.id : c.type === lane.id
              );
              const laneInProgress = laneCards.filter((c) => c.column === 'in_progress').length;

              return (
                <div
                  key={lane.id}
                  className={`rounded-xl border transition-all overflow-hidden ${
                    isCollapsed ? 'bg-neutral-900/40 border-neutral-850' : 'bg-neutral-900/60 border-neutral-800 shadow-md'
                  }`}
                >
                  {/* Horizontal Swimlane Header Row */}
                  <div
                    onClick={() => toggleSwimlaneCollapse(lane.id)}
                    className="flex items-center justify-between p-3 bg-neutral-950/80 cursor-pointer hover:bg-neutral-900/90 transition-colors border-b border-neutral-800/80"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="text-neutral-400 hover:text-white p-0.5"
                        aria-label={isCollapsed ? 'Развернуть свимлейн' : 'Свернуть свимлейн'}
                      >
                        {isCollapsed ? (
                          <ChevronRight className="w-4 h-4 text-cyan-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-cyan-400" />
                        )}
                      </button>

                      <div className="flex items-center gap-2">
                        {lane.icon}
                        <h3 className="text-xs font-bold text-white tracking-wide">
                          {lane.title}
                        </h3>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${lane.color}`}>
                          {lane.badge}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span className="text-neutral-400">
                        Всего: <strong className="text-white">{laneCards.length}</strong>
                      </span>
                      <span>·</span>
                      <span className={laneInProgress > 0 ? 'text-cyan-400' : 'text-neutral-400'}>
                        В работе: <strong>{laneInProgress}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Horizontal 4-Column Grid inside Swimlane */}
                  {!isCollapsed && (
                    <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 bg-neutral-950/30">
                      {columns.map((col) => {
                        const cellCards = laneCards.filter((c) => c.column === col.id);
                        const isAtWipLimit = col.id === 'in_progress' && inProgressCount >= WIP_LIMIT_IN_PROGRESS;

                        return (
                          <div
                            key={col.id}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, col.id, lane.id)}
                            className={`flex flex-col bg-neutral-900/40 rounded-lg border ${col.color} p-2.5 min-h-[140px] transition-colors hover:border-neutral-700`}
                          >
                            {/* Column Header inside Swimlane */}
                            <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-neutral-800/80 text-[11px]">
                              <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
                                {col.title}
                                <span className="font-mono text-[10px] text-neutral-400 px-1 py-0.2 bg-neutral-800 rounded">
                                  {cellCards.length}
                                </span>
                              </span>
                              {col.id === 'in_progress' && (
                                <span className="text-[9px] font-mono text-neutral-400">
                                  WIP: {inProgressCount}/{WIP_LIMIT_IN_PROGRESS}
                                </span>
                              )}
                            </div>

                            {/* Cards list in this swimlane cell */}
                            <div className="space-y-2 flex-1">
                              {cellCards.length === 0 ? (
                                <div className="h-16 flex items-center justify-center border border-dashed border-neutral-800/80 rounded text-[11px] text-neutral-400 text-center">
                                  Пусто
                                </div>
                              ) : (
                                cellCards.map(renderCardItem)
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CARD DETAIL MODAL (with Focus Trap & WCAG 2.1 AA) */}
      {selectedCard && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="card-detail-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
        >
          <div
            ref={detailModalRef}
            tabIndex={-1}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl focus:outline-none"
          >
            {/* Modal Header */}
            <div className="p-4 bg-neutral-950 border-b border-neutral-800 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1">
                  <span className="flex items-center gap-1 font-mono uppercase text-cyan-400 font-bold">
                    {getTypeIcon(selectedCard.type)}
                    {selectedCard.type}
                  </span>
                  <span>·</span>
                  <span className="font-mono uppercase text-amber-400 font-bold">
                    Приоритет: {selectedCard.priority}
                  </span>
                  <span>·</span>
                  <span className="font-mono text-neutral-400">Автор: {selectedCard.createdBy}</span>
                </div>
                <h3 id="card-detail-title" className="text-sm font-bold text-white">
                  {selectedCard.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCard(null)}
                aria-label="Закрыть карточку"
                className="text-neutral-400 hover:text-white p-1 rounded-lg focus-visible:ring-2 focus-visible:ring-cyan-400 focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-4 text-xs text-neutral-300 flex-1">
              {/* Real-time Collaborative Editing Layer with Yjs */}
              <CollaborativeCardEditor
                card={selectedCard}
                currentUserName="Алексей Смирнов"
                onCardUpdate={(updated) => {
                  onUpdateCard(updated);
                  setSelectedCard(updated);
                }}
              />

              {selectedCard.sourceSnippet && (
                <div>
                  <h4 className="font-semibold text-neutral-400 mb-1 uppercase tracking-wider text-[11px]">
                    Сниппет телеметрии / Рекомендуемый патч:
                  </h4>
                  <pre className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 font-mono text-[11px] text-cyan-300 overflow-x-auto">
                    {selectedCard.suggestedPatch || selectedCard.sourceSnippet}
                  </pre>
                </div>
              )}

              {/* Contextual Action Bar based on Card Type */}
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
                <h4 className="font-semibold text-neutral-400 uppercase tracking-wider text-[11px]">
                  Контекстные действия суперадминистратора:
                </h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      onMoveCard(selectedCard.id, 'in_progress');
                      setSelectedCard(null);
                    }}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus:outline-none"
                  >
                    Взять в работу (WIP $\le 3$)
                  </button>

                  <button
                    onClick={() => {
                      const updated = {
                        ...selectedCard,
                        column: 'collected' as CardColumn,
                        implementationPr: `PR #${Math.floor(100 + Math.random() * 800)} (AutoRemediated)`,
                      };
                      onUpdateCard(updated);
                      setSelectedCard(updated);
                      setRatingModalCard(updated);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400 focus:outline-none"
                  >
                    <GitPullRequest className="w-3.5 h-3.5" />
                    Создать PR и внедрить
                  </button>

                  <button
                    onClick={() => {
                      setRejectModalCard({ card: selectedCard, targetCol: 'deferred' });
                      setSelectedCard(null);
                    }}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-rose-300 rounded font-medium transition-colors focus-visible:ring-2 focus-visible:ring-rose-400 focus:outline-none"
                  >
                    Отклонить / Отложить
                  </button>

                  {selectedCard.column === 'collected' && !selectedCard.rolledBack && (
                    <button
                      onClick={() => {
                        onRollbackCard(selectedCard.id, 'Низкая оценка качества кода суперадмином');
                        setSelectedCard(null);
                      }}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded font-medium flex items-center gap-1.5 transition-colors ml-auto focus-visible:ring-2 focus-visible:ring-rose-400 focus:outline-none"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Откатить изменения (Rollback)
                    </button>
                  )}
                </div>
              </div>

              {/* Discussion & Comments */}
              <div>
                <h4 className="font-semibold text-neutral-400 mb-2 uppercase tracking-wider text-[11px]">
                  Обсуждение с агентами и командой ({selectedCard.comments.length}):
                </h4>
                <div className="space-y-2 mb-3">
                  {selectedCard.comments.map((cmt) => (
                    <div key={cmt.id} className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-lg">
                      <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
                        <span className="font-semibold text-neutral-200">
                          {cmt.avatar} {cmt.author}
                        </span>
                        <span className="font-mono text-neutral-400">{cmt.timestamp}</span>
                      </div>
                      <p className="text-neutral-300">{cmt.text}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Оставить комментарий или инструкцию агенту..."
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    aria-label="Текст комментария"
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-cyan-500 focus-visible:ring-1 focus-visible:ring-cyan-500"
                  />
                  <button
                    onClick={handleAddComment}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs focus-visible:ring-2 focus-visible:ring-cyan-400 focus:outline-none"
                  >
                    Отправить
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REJECT FEEDBACK MODAL (Trains AI Agent) with Focus Trap */}
      {rejectModalCard && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-feedback-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
        >
          <div
            ref={rejectModalRef}
            tabIndex={-1}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-5 shadow-2xl focus:outline-none"
          >
            <div id="reject-feedback-title" className="flex items-center gap-2 text-rose-400 text-sm font-bold mb-2">
              <AlertCircle className="w-5 h-5" />
              Обратная связь для обучения ИИ-агента
            </div>
            <p className="text-xs text-neutral-300 mb-4">
              Агент <strong className="text-purple-300">{rejectModalCard.card.createdBy}</strong> получит эту обратную
              связь для калибровки точности будущих предложений.
            </p>

            <div className="space-y-2 mb-4">
              {[
                'Несогласен с приоритетом',
                'Некорректный анализ / Ложное срабатывание (False Positive)',
                'Архитектурный конфликт с текущим спринтом',
                'Слишком ресурсоёмко для текущей версии',
              ].map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                    rejectReason === reason
                      ? 'bg-neutral-950 border-cyan-500 text-cyan-200'
                      : 'bg-neutral-950/60 border-neutral-800 text-neutral-300 hover:bg-neutral-950'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    checked={rejectReason === reason}
                    onChange={() => setRejectReason(reason)}
                    className="text-cyan-500 focus:ring-0"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <div className="mb-4">
              <input
                type="text"
                placeholder="Или напишите детальный комментарий..."
                value={customRejectReason}
                onChange={(e) => setCustomRejectReason(e.target.value)}
                aria-label="Детальный комментарий к отклонению"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setRejectModalCard(null)}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg focus-visible:ring-2 focus-visible:ring-cyan-400 focus:outline-none"
              >
                Отмена
              </button>
              <button
                onClick={confirmRejection}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-medium rounded-lg focus-visible:ring-2 focus-visible:ring-rose-400 focus:outline-none"
              >
                Зафиксировать и обучить модель
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CODE QUALITY EVALUATION & ROLLBACK MODAL with Focus Trap */}
      {ratingModalCard && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="rating-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
        >
          <div
            ref={ratingModalRef}
            tabIndex={-1}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-5 shadow-2xl focus:outline-none"
          >
            <h3 id="rating-modal-title" className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 fill-current" />
              Оценка качества кода агента
            </h3>
            <p className="text-xs text-neutral-300 mb-4">
              Оцените сформированный патч для карточки «{ratingModalCard.title}». При оценке 1-2 звезды система
              предложит немедленный откат (Rollback).
            </p>

            <div className="flex items-center justify-center gap-2 mb-4 p-3 bg-neutral-950 rounded-lg border border-neutral-800">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setStarRating(star)}
                  aria-label={`${star} звезд`}
                  className="p-1 hover:scale-125 transition-transform focus-visible:ring-2 focus-visible:ring-amber-400 rounded focus:outline-none"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= starRating ? 'text-amber-400 fill-amber-400' : 'text-neutral-700'
                    }`}
                  />
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              placeholder="Комментарий к качеству кода (читаемость, соблюдение архитектурных конвенций)..."
              value={ratingFeedback}
              onChange={(e) => setRatingFeedback(e.target.value)}
              aria-label="Комментарий к качеству кода"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-cyan-500 mb-4"
            />

            {starRating <= 2 && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs mb-4">
                ⚠️ Низкая оценка качества. Рекомендуется активировать процедуру автоматического отката коммита.
              </div>
            )}

            <div className="flex justify-end gap-2 text-xs">
              {starRating <= 2 && (
                <button
                  onClick={() => {
                    onRollbackCard(ratingModalCard.id, ratingFeedback || 'Низкая оценка кода');
                    setRatingModalCard(null);
                  }}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-medium rounded-lg flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-rose-400 focus:outline-none"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Откатить (Rollback)
                </button>
              )}
              <button
                onClick={() => {
                  onRateCard(ratingModalCard.id, starRating, ratingFeedback);
                  setRatingModalCard(null);
                }}
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg focus-visible:ring-2 focus-visible:ring-cyan-400 focus:outline-none"
              >
                Сохранить оценку
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
