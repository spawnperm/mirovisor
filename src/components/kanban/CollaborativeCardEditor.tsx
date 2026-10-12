import React, { useState, useEffect, useRef } from 'react';
import * as Y from 'yjs';
import { 
  Users, 
  RotateCcw, 
  RotateCw, 
  CheckSquare, 
  Plus, 
  Trash2, 
  Sparkles, 
  Radio, 
  Lock, 
  Zap,
  CheckCircle2,
  GitCommit
} from 'lucide-react';
import { KanbanCard, ChecklistItem } from '../../types';

interface CollaborativeCardEditorProps {
  card: KanbanCard;
  currentUserName: string;
  onCardUpdate: (updatedCard: KanbanCard) => void;
}

interface Peer {
  id: string;
  name: string;
  color: string;
  role: string;
  status: 'active' | 'typing' | 'idle';
}

export const CollaborativeCardEditor: React.FC<CollaborativeCardEditorProps> = ({
  card,
  currentUserName,
  onCardUpdate,
}) => {
  const [description, setDescription] = useState<string>(card.description);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(card.checklist);
  const [newItemText, setNewItemText] = useState<string>('');
  const [peers, setPeers] = useState<Peer[]>([
    { id: '1', name: currentUserName, color: '#38bdf8', role: 'SuperAdmin (Вы)', status: 'active' },
    { id: '2', name: 'Елена Васильева', color: '#c084fc', role: 'Архитектор R&D', status: 'idle' },
    { id: '3', name: 'SecurityAgent Bot', color: '#34d399', role: 'Cordis AI', status: 'active' },
  ]);
  const [crdtStats, setCrdtStats] = useState<{ updatesCount: number; lastSyncTime: string }>({
    updatesCount: 1,
    lastSyncTime: 'Только что',
  });

  // Yjs Document, Text, Array and UndoManager references
  const ydocRef = useRef<Y.Doc | null>(null);
  const yTextRef = useRef<Y.Text | null>(null);
  const yChecklistRef = useRef<Y.Array<ChecklistItem> | null>(null);
  const undoManagerRef = useRef<Y.UndoManager | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Initialize Y.Doc & CRDT structures
  useEffect(() => {
    const doc = new Y.Doc();
    ydocRef.current = doc;

    // Y.Text for collaborative description
    const yText = doc.getText('description');
    yTextRef.current = yText;
    if (yText.length === 0 && card.description) {
      yText.insert(0, card.description);
    }

    // Y.Array for collaborative checklist
    const yChecklist = doc.getArray<ChecklistItem>('checklist');
    yChecklistRef.current = yChecklist;
    if (yChecklist.length === 0 && card.checklist && card.checklist.length > 0) {
      yChecklist.insert(0, card.checklist);
    }

    // Y.UndoManager for multi-user undo/redo
    const undoManager = new Y.UndoManager([yText, yChecklist]);
    undoManagerRef.current = undoManager;

    // Observe changes on Y.Text
    const textObserver = () => {
      const updatedText = yText.toString();
      setDescription(updatedText);
      setCrdtStats((prev) => ({
        updatesCount: prev.updatesCount + 1,
        lastSyncTime: new Date().toLocaleTimeString(),
      }));
    };
    yText.observe(textObserver);

    // Observe changes on Y.Array
    const checklistObserver = () => {
      const updatedList = yChecklist.toArray();
      setChecklist(updatedList);
      setCrdtStats((prev) => ({
        updatesCount: prev.updatesCount + 1,
        lastSyncTime: new Date().toLocaleTimeString(),
      }));
    };
    yChecklist.observe(checklistObserver);

    // Cross-tab real-time sync with BroadcastChannel
    try {
      const channelName = `mirovisor_card_${card.id}`;
      const channel = new BroadcastChannel(channelName);
      broadcastChannelRef.current = channel;

      doc.on('update', (update: Uint8Array, origin: any) => {
        if (origin !== 'remote_broadcast') {
          channel.postMessage(Array.from(update));
        }
      });

      channel.onmessage = (event) => {
        if (event.data && Array.isArray(event.data)) {
          const update = new Uint8Array(event.data);
          Y.applyUpdate(doc, update, 'remote_broadcast');
        }
      };
    } catch (err) {
      console.warn('BroadcastChannel not supported in environment:', err);
    }

    return () => {
      broadcastChannelRef.current?.close();
      doc.destroy();
    };
  }, [card.id]);

  // Handle local user description editing via Y.Text transaction
  const handleDescriptionChange = (newVal: string) => {
    const yText = yTextRef.current;
    const doc = ydocRef.current;
    if (!yText || !doc) return;

    doc.transact(() => {
      yText.delete(0, yText.length);
      yText.insert(0, newVal);
    }, 'local_user');

    const updatedCard = {
      ...card,
      description: newVal,
      checklist,
    };
    onCardUpdate(updatedCard);
  };

  // Add checklist item via Y.Array
  const handleAddChecklistItem = () => {
    if (!newItemText.trim()) return;
    const yChecklist = yChecklistRef.current;
    const doc = ydocRef.current;
    if (!yChecklist || !doc) return;

    const newItem: ChecklistItem = {
      id: `c_${Date.now()}`,
      text: newItemText.trim(),
      done: false,
    };

    doc.transact(() => {
      yChecklist.push([newItem]);
    }, 'local_user');

    setNewItemText('');

    const updatedCard = {
      ...card,
      description,
      checklist: yChecklist.toArray(),
    };
    onCardUpdate(updatedCard);
  };

  // Toggle checklist item via Y.Array
  const handleToggleChecklistItem = (index: number) => {
    const yChecklist = yChecklistRef.current;
    const doc = ydocRef.current;
    if (!yChecklist || !doc) return;

    const currentItem = yChecklist.get(index);
    if (!currentItem) return;

    const updatedItem: ChecklistItem = {
      ...currentItem,
      done: !currentItem.done,
    };

    doc.transact(() => {
      yChecklist.delete(index, 1);
      yChecklist.insert(index, [updatedItem]);
    }, 'local_user');

    const updatedCard = {
      ...card,
      description,
      checklist: yChecklist.toArray(),
    };
    onCardUpdate(updatedCard);
  };

  // Delete checklist item via Y.Array
  const handleDeleteChecklistItem = (index: number) => {
    const yChecklist = yChecklistRef.current;
    const doc = ydocRef.current;
    if (!yChecklist || !doc) return;

    doc.transact(() => {
      yChecklist.delete(index, 1);
    }, 'local_user');

    const updatedCard = {
      ...card,
      description,
      checklist: yChecklist.toArray(),
    };
    onCardUpdate(updatedCard);
  };

  // Simulate remote collaborator concurrently editing via Y.Doc
  const simulateRemoteEdit = (collaboratorName: string) => {
    const doc = ydocRef.current;
    const yText = yTextRef.current;
    const yChecklist = yChecklistRef.current;
    if (!doc || !yText || !yChecklist) return;

    // Set peer to typing
    setPeers((prev) =>
      prev.map((p) => (p.name.includes(collaboratorName.split(' ')[0]) ? { ...p, status: 'typing' } : p))
    );

    setTimeout(() => {
      doc.transact(() => {
        // Append collaborative annotation to description
        const note = `\n\n[Дополнение от ${collaboratorName} (${new Date().toLocaleTimeString()})]: Проведено ревью параметров. Решение проверено на соответствие архитектурным конвенциям.`;
        yText.insert(yText.length, note);

        // Add collaborative subtask
        const newSubtask: ChecklistItem = {
          id: `c_collab_${Date.now()}`,
          text: `Аудит совместимости от ${collaboratorName.split(' ')[0]}`,
          done: true,
        };
        yChecklist.push([newSubtask]);
      }, 'remote_collaborator');

      // Update peer back to active
      setPeers((prev) =>
        prev.map((p) => (p.name.includes(collaboratorName.split(' ')[0]) ? { ...p, status: 'active' } : p))
      );

      const updatedCard = {
        ...card,
        description: yText.toString(),
        checklist: yChecklist.toArray(),
      };
      onCardUpdate(updatedCard);
    }, 600);
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Real-time Presence Bar */}
      <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-cyan-400">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-white flex items-center gap-2 text-xs">
              YJS REAL-TIME COLLABORATIVE LAYER
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded font-semibold">
                CRDT SYNC ONLINE
              </span>
            </div>
            <div className="text-[10px] text-neutral-400 font-mono">
              Транзакций: {crdtStats.updatesCount} · Синхронизировано: {crdtStats.lastSyncTime}
            </div>
          </div>
        </div>

        {/* Active Collaborators Presence Chips */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-neutral-500 font-mono mr-1">В сессии:</span>
          {peers.map((peer) => (
            <div
              key={peer.id}
              className="flex items-center gap-1.5 px-2 py-1 bg-neutral-900 border border-neutral-800 rounded-lg text-[11px]"
              title={`${peer.name} (${peer.role})`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: peer.color }}
              />
              <span className="text-neutral-200 font-medium">{peer.name.split(' ')[0]}</span>
              {peer.status === 'typing' && (
                <span className="text-[9px] text-purple-400 font-mono animate-pulse">печатает...</span>
              )}
            </div>
          ))}

          {/* Quick Undo / Redo */}
          <div className="flex items-center gap-1 ml-2 pl-2 border-l border-neutral-800">
            <button
              onClick={() => undoManagerRef.current?.undo()}
              className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
              title="CRDT Отменить (Undo)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => undoManagerRef.current?.redo()}
              className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
              title="CRDT Повторить (Redo)"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Concurrent Simulation Trigger Pills */}
      <div className="flex items-center justify-between text-[11px] px-1 text-neutral-400">
        <span className="text-[10px] font-mono text-neutral-500 uppercase">
          Симуляция одновременного редактирования коллегами:
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => simulateRemoteEdit('Елена Васильева (BetaLabs)')}
            className="px-2 py-0.5 bg-neutral-900 hover:bg-neutral-850 border border-purple-500/30 text-purple-300 rounded text-[10px] font-mono transition-colors"
          >
            + Елена Васильева (Правка)
          </button>
          <button
            type="button"
            onClick={() => simulateRemoteEdit('SecurityAgent (Cordis)')}
            className="px-2 py-0.5 bg-neutral-900 hover:bg-neutral-850 border border-emerald-500/30 text-emerald-300 rounded text-[10px] font-mono transition-colors"
          >
            + SecurityAgent (Аудит)
          </button>
        </div>
      </div>

      {/* Collaborative Description (Y.Text) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-neutral-400 uppercase tracking-wider text-[11px]">
            Описание задачи (Совместное редактирование в реальном времени):
          </h4>
          <span className="text-[10px] font-mono text-neutral-500">
            Y.Text CRDT · Изменения мгновенно реплицируются
          </span>
        </div>

        <textarea
          value={description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          rows={5}
          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-100 font-sans leading-relaxed focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 shadow-inner"
          placeholder="Введите или дополните описание задачи..."
        />
      </div>

      {/* Collaborative Checklist (Y.Array) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-neutral-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
            Совместный чек-лист реализации ({checklist.filter((i) => i.done).length}/{checklist.length}):
          </h4>
          <span className="text-[10px] font-mono text-neutral-500">Y.Array CRDT</span>
        </div>

        <div className="space-y-1.5">
          {checklist.length === 0 ? (
            <div className="p-3 text-center border border-dashed border-neutral-800 rounded-lg text-neutral-500 text-xs">
              Чек-лист пуст. Добавьте первый пункт ниже.
            </div>
          ) : (
            checklist.map((item, idx) => (
              <div
                key={item.id || idx}
                className="flex items-center justify-between p-2 bg-neutral-950/80 border border-neutral-850 rounded-lg group hover:border-neutral-700 transition-colors"
              >
                <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => handleToggleChecklistItem(idx)}
                    className="rounded border-neutral-700 text-cyan-500 focus:ring-0 cursor-pointer"
                  />
                  <span
                    className={`truncate ${
                      item.done ? 'line-through text-neutral-500 font-normal' : 'text-neutral-200 font-medium'
                    }`}
                  >
                    {item.text}
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => handleDeleteChecklistItem(idx)}
                  className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-rose-400 p-1 transition-opacity"
                  title="Удалить подзадачу"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add new checklist item form */}
        <div className="flex gap-2 pt-1">
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem()}
            placeholder="Добавить новый пункт подзадачи в совместный чек-лист..."
            className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="button"
            onClick={handleAddChecklistItem}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Добавить
          </button>
        </div>
      </div>
    </div>
  );
};
