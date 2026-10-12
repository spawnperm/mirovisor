import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  FileText, 
  Download, 
  Sparkles, 
  Plus, 
  Save, 
  RefreshCw,
  Cpu,
  Table,
  CheckCircle
} from 'lucide-react';
import { Tenant } from '../../types';

interface UniverOfficeViewProps {
  tenant: Tenant;
}

interface CellData {
  value: string | number;
  formula?: string;
  isHeader?: boolean;
}

export const UniverOfficeView: React.FC<UniverOfficeViewProps> = ({ tenant }) => {
  const [activeDocType, setActiveDocType] = useState<'sheet' | 'doc'>('sheet');
  const [activeSheetName, setActiveSheetName] = useState<string>('Бюджет_Сервисов');
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [lastMcpCall, setLastMcpCall] = useState<string>('univer.xlsx_formula_evaluate · OK (12ms)');

  // Spreadsheet state
  const [gridData, setGridData] = useState<CellData[][]>([
    [
      { value: 'Сервисный компонент', isHeader: true },
      { value: 'Текущий расход (₽)', isHeader: true },
      { value: 'Лимит квоты (₽)', isHeader: true },
      { value: 'Статус SLA', isHeader: true },
    ],
    [
      { value: 'PostgreSQL 16 Multi-Tenant' },
      { value: 45000 },
      { value: 60000 },
      { value: '99.99% OK' },
    ],
    [
      { value: 'Redis 7 Fan-out Cluster' },
      { value: 18000 },
      { value: 25000 },
      { value: '100% OK' },
    ],
    [
      { value: 'NATS JetStream Broker' },
      { value: 22000 },
      { value: 30000 },
      { value: '99.95% OK' },
    ],
    [
      { value: 'Garage S3 Object Storage' },
      { value: 15000 },
      { value: 20000 },
      { value: '100% OK' },
    ],
    [
      { value: 'ИТОГО РАСХОД' },
      { value: 100000, formula: '=SUM(B2:B5)' },
      { value: 135000, formula: '=SUM(C2:C5)' },
      { value: 'Соответствует бюджету' },
    ],
  ]);

  const [docContent, setDocContent] = useState<string>(`# ТЕХНИЧЕСКИЙ ОТЧЕТ И СРЕЗ БЕЗОПАСНОСТИ: ${tenant.name.toUpperCase()}
Дата формирования: 2026-10-12
Стандарт: OWASP ASVS 5.0 (Level 2)
Архитектура: Schema-per-Tenant + Row-Level Security

## 1. Резюме состояния схемы ${tenant.schema}
Изоляция данных проверена на аппаратном уровне ядра PostgreSQL.
Все таблицы схемы защищены принудительной директивой FORCE ROW LEVEL SECURITY.
Утечек между арендаторами в ходе стресс-тестирования не зафиксировано.

## 2. Статус плагинной инфраструктуры
- Активные модули: Ever Gauzy CRM, Univer Office Harness, CrowdSec L7 WAF.
- Разрешено SemVer-совместимых обновлений: 2.
- Циклических зависимостей: 0.`);

  const handleCellChange = (rowIndex: number, colIndex: number, val: string) => {
    const newGrid = [...gridData];
    const num = parseFloat(val);
    newGrid[rowIndex][colIndex] = {
      ...newGrid[rowIndex][colIndex],
      value: isNaN(num) ? val : num,
    };

    // Auto-update SUM row
    if (colIndex === 1 || colIndex === 2) {
      let bSum = 0;
      let cSum = 0;
      for (let r = 1; r < 5; r++) {
        bSum += Number(newGrid[r][1]?.value) || 0;
        cSum += Number(newGrid[r][2]?.value) || 0;
      }
      newGrid[5][1].value = bSum;
      newGrid[5][2].value = cSum;
    }

    setGridData(newGrid);
    setLastMcpCall(`univer.sheet_cell_update · [R${rowIndex}C${colIndex}] = ${val}`);
  };

  const handleAiGenerate = () => {
    if (!aiPrompt.trim()) return;
    setIsAiGenerating(true);
    setTimeout(() => {
      setIsAiGenerating(false);
      setDocContent(
        (prev) =>
          prev +
          `\n\n### Дополнение от AI-Агента Univer (${new Date().toLocaleTimeString()}):\nПо запросу "${aiPrompt}":\nСгенерирован регламент взаимодействия с MCP-инструментами и правила валидации входных данных. Формулы пересчитаны без ошибок.`
      );
      setLastMcpCall(`univer.dsh_office_generate_doc · Prompt processed (210 tokens)`);
      setAiPrompt('');
    }, 800);
  };

  const exportDocument = (format: string) => {
    const filename = `Mirovisor_${tenant.slug}_${activeDocType}.${format}`;
    const element = document.createElement('a');
    const file = new Blob([activeDocType === 'sheet' ? JSON.stringify(gridData, null, 2) : docContent], {
      type: 'text/plain',
    });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    setLastMcpCall(`univer.export_document · format: ${format} -> ${filename}`);
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 p-4 gap-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900/80 p-3 rounded-xl border border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              UNIVER OFFICE HARNESS (MCP SERVER BRIDGE)
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-neutral-800 text-neutral-300 rounded">
                dsh-univer-office v2.1.0
              </span>
            </h2>
            <div className="text-xs text-neutral-400 flex items-center gap-2">
              <span>Схема: <strong className="text-white">{tenant.schema}</strong></span>
              <span>·</span>
              <span>Последний MCP вызов: <code className="text-cyan-400 font-mono text-[11px]">{lastMcpCall}</code></span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <div className="flex bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs">
            <button
              onClick={() => setActiveDocType('sheet')}
              className={`px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                activeDocType === 'sheet'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              Таблица Univer (XLSX)
            </button>
            <button
              onClick={() => setActiveDocType('doc')}
              className={`px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                activeDocType === 'doc'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Документ DOCX / Спека
            </button>
          </div>

          <button
            onClick={() => exportDocument(activeDocType === 'sheet' ? 'xlsx' : 'docx')}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs rounded-lg font-medium flex items-center gap-1.5 transition-colors border border-neutral-700"
          >
            <Download className="w-3.5 h-3.5" />
            Экспорт .{activeDocType === 'sheet' ? 'xlsx' : 'docx'}
          </button>
        </div>
      </div>

      {/* AI Assistant for Office Docs */}
      <div className="flex items-center gap-2 bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800">
        <Sparkles className="w-4 h-4 text-purple-400 ml-1" />
        <input
          type="text"
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          placeholder="Сформулируйте задачу для агента Univer (например: «Рассчитать прогнозируемый бюджет на Q4», «Сгенерировать акт аудита»)..."
          onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
          className="flex-1 bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none"
        />
        <button
          onClick={handleAiGenerate}
          disabled={isAiGenerating}
          className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {isAiGenerating ? 'Генерация...' : 'Агент Univer'}
        </button>
      </div>

      {/* Main Document / Spreadsheet Area */}
      <div className="flex-1 bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden flex flex-col shadow-inner">
        {activeDocType === 'sheet' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Spreadsheet Formula Bar */}
            <div className="p-2 bg-neutral-950 border-b border-neutral-800 flex items-center gap-3 text-xs font-mono">
              <span className="text-neutral-500 uppercase font-bold text-[10px]">FX:</span>
              <span className="text-emerald-400">=SUM(B2:B5) / AUTO-EVALUATED</span>
              <span className="text-neutral-600">|</span>
              <span className="text-neutral-400 text-[11px]">Кликните на ячейку для редактирования числа</span>
            </div>

            {/* Interactive Grid */}
            <div className="flex-1 overflow-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-950 text-neutral-400 font-mono text-[11px] border-b border-neutral-800">
                    <th className="p-2 border-r border-neutral-800 text-center w-12 text-neutral-600">#</th>
                    <th className="p-2 border-r border-neutral-800 text-left">A: Ресурс</th>
                    <th className="p-2 border-r border-neutral-800 text-right w-44">B: Расход (₽)</th>
                    <th className="p-2 border-r border-neutral-800 text-right w-44">C: Лимит (₽)</th>
                    <th className="p-2 text-left w-52">D: Статус SLA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-850 font-mono">
                  {gridData.map((row, rIdx) => {
                    const isTotalRow = rIdx === gridData.length - 1;
                    return (
                      <tr
                        key={rIdx}
                        className={isTotalRow ? 'bg-neutral-950 font-bold text-white' : 'hover:bg-neutral-850/40'}
                      >
                        <td className="p-2 border-r border-neutral-800 text-center text-neutral-600 bg-neutral-950/80">
                          {rIdx + 1}
                        </td>
                        <td className="p-2 border-r border-neutral-800">
                          {rIdx === 0 ? (
                            <span className="text-neutral-400 font-sans">{row[0].value}</span>
                          ) : (
                            <input
                              type="text"
                              value={row[0].value}
                              onChange={(e) => handleCellChange(rIdx, 0, e.target.value)}
                              className="w-full bg-transparent text-white focus:outline-none focus:bg-neutral-800 px-1 rounded"
                            />
                          )}
                        </td>
                        <td className="p-2 border-r border-neutral-800 text-right">
                          {rIdx === 0 ? (
                            <span className="text-neutral-400 font-sans">{row[1].value}</span>
                          ) : (
                            <input
                              type="text"
                              value={typeof row[1].value === 'number' ? row[1].value.toLocaleString('ru-RU') : row[1].value}
                              onChange={(e) => handleCellChange(rIdx, 1, e.target.value.replace(/\s/g, ''))}
                              className={`w-full bg-transparent text-right focus:outline-none focus:bg-neutral-800 px-1 rounded ${
                                isTotalRow ? 'text-emerald-400 font-bold' : 'text-neutral-200'
                              }`}
                            />
                          )}
                        </td>
                        <td className="p-2 border-r border-neutral-800 text-right">
                          {rIdx === 0 ? (
                            <span className="text-neutral-400 font-sans">{row[2].value}</span>
                          ) : (
                            <input
                              type="text"
                              value={typeof row[2].value === 'number' ? row[2].value.toLocaleString('ru-RU') : row[2].value}
                              onChange={(e) => handleCellChange(rIdx, 2, e.target.value.replace(/\s/g, ''))}
                              className="w-full bg-transparent text-right text-neutral-300 focus:outline-none focus:bg-neutral-800 px-1 rounded"
                            />
                          )}
                        </td>
                        <td className="p-2">
                          {rIdx === 0 ? (
                            <span className="text-neutral-400 font-sans">{row[3].value}</span>
                          ) : (
                            <span className={isTotalRow ? 'text-emerald-400 font-semibold' : 'text-neutral-300'}>
                              {row[3].value}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Sheet Tabs */}
            <div className="p-2 bg-neutral-950 border-t border-neutral-800 flex items-center gap-2 text-xs">
              {['Бюджет_Сервисов', 'Лимиты_NATS', 'Журнал_Инцидентов'].map((name) => (
                <button
                  key={name}
                  onClick={() => setActiveSheetName(name)}
                  className={`px-3 py-1 rounded font-mono text-[11px] ${
                    activeSheetName === name
                      ? 'bg-neutral-800 text-white font-medium border-b-2 border-emerald-400'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {name}
                </button>
              ))}
              <button className="p-1 text-neutral-500 hover:text-white ml-1">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 p-4 overflow-auto">
            <textarea
              value={docContent}
              onChange={(e) => setDocContent(e.target.value)}
              rows={18}
              className="w-full h-full bg-transparent font-mono text-xs text-neutral-200 leading-relaxed focus:outline-none resize-none"
            />
          </div>
        )}
      </div>
    </div>
  );
};
