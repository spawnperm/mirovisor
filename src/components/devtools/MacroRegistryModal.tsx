import React, { useState } from 'react';
import {
  Zap,
  Play,
  Plus,
  Trash2,
  Check,
  CheckCircle2,
  Terminal,
  Shield,
  Layers,
  MessageSquare,
  Search,
  X,
  Code,
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';
import { VoiceMacro, MacroAction, MacroActionType } from '../../types/macros';

export interface MacroRegistryModalProps {
  isOpen: boolean;
  onClose: () => void;
  macros: VoiceMacro[];
  onSaveMacro: (macro: VoiceMacro) => void;
  onDeleteMacro: (macroId: string) => void;
  onExecuteMacro: (macro: VoiceMacro) => void;
}

const AVAILABLE_ACTION_TEMPLATES: Array<{
  type: MacroActionType;
  title: string;
  description: string;
  icon: any;
  defaultTarget?: string;
}> = [
  {
    type: 'trigger_build',
    title: 'Запустить CI/CD сборку ветки main',
    description: 'Инициирует пайплайн сборки с проверками SAST, SCA и Testcontainers',
    icon: Terminal,
    defaultTarget: 'main',
  },
  {
    type: 'security_audit',
    title: 'Запустить аудит безопасности и RLS',
    description: 'Аудит кодовой базы CodeQL, валидация изоляции схем и OWASP ASVS 5.0 L2',
    icon: Shield,
  },
  {
    type: 'post_social',
    title: 'Опубликовать сводку в Community Feed',
    description: 'Публикует отчет о статусе релиза/аудита в ленту сообщества портала',
    icon: MessageSquare,
  },
  {
    type: 'navigate_tab',
    title: 'Перейти на вкладку Pipelines',
    description: 'Автоматически переключает пользователя на экран мониторинга',
    icon: Layers,
    defaultTarget: 'pipelines',
  },
  {
    type: 'scaffold_plugin',
    title: 'Создать микрофронтенд-плагин',
    description: 'Генерирует Backstage SDK плагин и активирует его в схеме тенанта',
    icon: Code,
  },
  {
    type: 'rollback_code',
    title: 'Откатить последнее изменение кода',
    description: 'Безопасный откат последнего внедренного коммита в ветке main',
    icon: Zap,
  },
];

export const MacroRegistryModal: React.FC<MacroRegistryModalProps> = ({
  isOpen,
  onClose,
  macros,
  onSaveMacro,
  onDeleteMacro,
  onExecuteMacro,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [newKeyword, setNewKeyword] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [selectedActions, setSelectedActions] = useState<MacroActionType[]>([
    'trigger_build',
    'security_audit',
    'post_social',
  ]);
  const [executedMacroId, setExecutedMacroId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredMacros = macros.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.keyword.toLowerCase().includes(q) ||
      m.name.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q)
    );
  });

  const handleToggleAction = (type: MacroActionType) => {
    if (selectedActions.includes(type)) {
      if (selectedActions.length > 1) {
        setSelectedActions(selectedActions.filter((t) => t !== type));
      }
    } else {
      setSelectedActions([...selectedActions, type]);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim() || !newName.trim()) return;

    const actionsToAttach: MacroAction[] = selectedActions.map((type, idx) => {
      const template = AVAILABLE_ACTION_TEMPLATES.find((tpl) => tpl.type === type)!;
      return {
        id: `act_${Date.now()}_${idx}`,
        type,
        title: template.title,
        description: template.description,
        target: template.defaultTarget,
      };
    });

    const newMacro: VoiceMacro = {
      id: `macro_custom_${Date.now()}`,
      keyword: newKeyword.trim(),
      name: newName.trim(),
      description: newDescription.trim() || `Голосовой макрос последовательности из ${actionsToAttach.length} действий`,
      actions: actionsToAttach,
      isPredefined: false,
      createdAt: new Date().toISOString(),
      executionCount: 0,
      color: 'from-cyan-500 to-indigo-500',
    };

    onSaveMacro(newMacro);
    setIsCreating(false);
    setNewKeyword('');
    setNewName('');
    setNewDescription('');
    setSelectedActions(['trigger_build', 'security_audit', 'post_social']);
  };

  const handleTriggerRun = (macro: VoiceMacro) => {
    setExecutedMacroId(macro.id);
    onExecuteMacro(macro);
    setTimeout(() => {
      setExecutedMacroId(null);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-3xl flex flex-col shadow-2xl overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="p-4 px-6 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-950/70 border border-amber-600/50 flex items-center justify-center text-amber-400 shadow-inner">
              <Zap className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white font-mono tracking-wide">
                  РЕЕСТР ГОЛОСОВЫХ МАКРОСОВ (Macro Registry)
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-700 text-amber-300 font-mono">
                  {macros.length} макросов
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Запуск цепочки действий одной голосовой фразой (например: <code className="text-cyan-300">«Deploy Nightly»</code>)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar: Search & Add Button */}
        <div className="p-3.5 bg-neutral-950/40 border-b border-neutral-800/80 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по ключевому слову или названию..."
              className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500/70 rounded-xl pl-8 pr-3 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-500 outline-none transition-colors font-mono"
            />
          </div>

          <button
            onClick={() => setIsCreating(!isCreating)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white text-xs font-mono font-medium flex items-center gap-1.5 shadow-md shadow-amber-950/40 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isCreating ? 'Отменить создание' : 'Создать макрос'}</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="p-5 overflow-y-auto space-y-4 custom-scrollbar flex-1">
          {/* New Macro Creation Form */}
          {isCreating && (
            <form
              onSubmit={handleCreateSubmit}
              className="p-4 rounded-2xl bg-neutral-950/90 border border-amber-600/40 shadow-xl space-y-3.5 animate-in fade-in-50 duration-150"
            >
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <span className="text-xs font-bold text-amber-300 font-mono flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Конструктор нового голосового макроса:
                </span>
                <span className="text-[10px] text-neutral-500 font-mono">
                  Сохраняется в localStorage
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-neutral-300 mb-1">
                    Ключевое слово для голоса (Trigger Keyword): <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="Например: Deploy Nightly или Полный деплой"
                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500 rounded-xl px-3 py-1.5 text-xs text-neutral-100 placeholder:text-neutral-500 outline-none font-mono"
                  />
                  <span className="text-[10px] text-neutral-500 mt-0.5 block">
                    Фраза, которую вы произнесете в голосовой ассистент
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-neutral-300 mb-1">
                    Название макроса: <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Например: Ночной деплой с аудитом и постом в ленту"
                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500 rounded-xl px-3 py-1.5 text-xs text-neutral-100 placeholder:text-neutral-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-neutral-300 mb-1">
                  Описание:
                </label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Краткое назначение цепочки шагов..."
                  className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500 rounded-xl px-3 py-1.5 text-xs text-neutral-100 placeholder:text-neutral-500 outline-none"
                />
              </div>

              {/* Action Selection Sequence */}
              <div>
                <label className="block text-[11px] font-mono text-neutral-300 mb-1.5">
                  Последовательность действий (выберите шаги цепочки):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {AVAILABLE_ACTION_TEMPLATES.map((actionTpl) => {
                    const isSelected = selectedActions.includes(actionTpl.type);
                    const IconComponent = actionTpl.icon;
                    return (
                      <div
                        key={actionTpl.type}
                        onClick={() => handleToggleAction(actionTpl.type)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                          isSelected
                            ? 'bg-amber-950/40 border-amber-500/70 text-amber-200 ring-1 ring-amber-500/30'
                            : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-amber-500 text-black' : 'border border-neutral-600'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-neutral-200 flex items-center gap-1.5 truncate">
                            <IconComponent className="w-3 h-3 text-cyan-400 shrink-0" />
                            <span className="truncate">{actionTpl.title}</span>
                          </div>
                          <div className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5">
                            {actionTpl.description}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-mono transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={!newKeyword.trim() || !newName.trim()}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 disabled:opacity-50 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Сохранить макрос
                </button>
              </div>
            </form>
          )}

          {/* List of Registered Macros */}
          <div className="space-y-3">
            {filteredMacros.map((macro) => {
              const isJustRun = executedMacroId === macro.id;

              return (
                <div
                  key={macro.id}
                  className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 hover:border-neutral-700 transition-all space-y-3 group"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-amber-400 shrink-0 mt-0.5 shadow-sm">
                        <Zap className="w-4 h-4 fill-amber-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-neutral-100 font-mono">
                            {macro.name}
                          </h4>
                          <span className="px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-600/60 shadow-xs flex items-center gap-1">
                            Ключевое слово: «{macro.keyword}»
                          </span>
                          {macro.isPredefined && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-neutral-800 text-neutral-400 border border-neutral-700">
                              Встроенный
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-neutral-400 mt-1 max-w-xl">
                          {macro.description}
                        </p>
                      </div>
                    </div>

                    {/* Actions: Run macro now / Delete custom */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTriggerRun(macro)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                          isJustRun
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white active:scale-95'
                        }`}
                        title={`Запустить цепочку: ${macro.keyword}`}
                      >
                        {isJustRun ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Исполнено!</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 fill-white" />
                            <span>Запустить макрос</span>
                          </>
                        )}
                      </button>

                      {!macro.isPredefined && (
                        <button
                          onClick={() => onDeleteMacro(macro.id)}
                          className="p-1.5 rounded-xl bg-neutral-900 hover:bg-rose-950/60 hover:text-rose-400 text-neutral-400 border border-neutral-800 text-xs transition-colors cursor-pointer"
                          title="Удалить макрос"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Actions Sequence Stepper */}
                  <div className="pt-2 border-t border-neutral-850">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block mb-2">
                      Цепочка действий ({macro.actions.length} шага):
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {macro.actions.map((act, actIdx) => (
                        <React.Fragment key={act.id}>
                          <div className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center gap-1.5 text-[11px] font-mono text-neutral-300">
                            <span className="text-[9px] text-amber-400 font-bold">
                              #{actIdx + 1}
                            </span>
                            <span>{act.title}</span>
                          </div>
                          {actIdx < macro.actions.length - 1 && (
                            <ArrowRight className="w-3 h-3 text-neutral-600 shrink-0" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 px-6 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
          <span className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-neutral-400" />
            Произнесите ключевое слово вслух в голосовой пульт (Ctrl+V) или нажмите «Запустить макрос».
          </span>
          <span className="text-cyan-400">Синхронизировано с ядром Mirovisor</span>
        </div>
      </div>
    </div>
  );
};
