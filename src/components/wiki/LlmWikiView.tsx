import React, { useState } from 'react';
import { BookOpen, FileCode, Download, Search, Tag, ExternalLink, Sparkles, Compass } from 'lucide-react';
import { INITIAL_WIKI_DOCS } from '../../data/mockData';

export const LlmWikiView: React.FC = () => {
  const [docs, setDocs] = useState(INITIAL_WIKI_DOCS);
  const [selectedDocSlug, setSelectedDocSlug] = useState<string>(INITIAL_WIKI_DOCS[0].slug);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedStatus, setCopiedStatus] = useState<boolean>(false);

  const selectedDoc = docs.find((d) => d.slug === selectedDocSlug) || docs[0];

  const filteredDocs = docs.filter(
    (d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      d.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDownloadLlmsTxt = (full: boolean) => {
    let content = '';
    if (full) {
      content = docs.map((d) => `# ${d.title}\n\n${d.content}\n\n---\n`).join('\n');
    } else {
      content = `# Mirovisor Documentation Index for AI Agents (llms.txt)\n\n> Базовая спецификация портала Мировизор для Cordis и LangGraph агентов.\n\n` +
        docs.map((d) => `- [${d.title}](https://docs.mirovisor.local/wiki/${d.slug}): ${d.summary}`).join('\n');
    }

    const filename = full ? 'llms-full.txt' : 'llms.txt';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setCopiedStatus(true);
    setTimeout(() => setCopiedStatus(false), 3000);
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 p-4 gap-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900/80 p-3 rounded-xl border border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              LLM WIKI & БАЗА ЗНАНИЙ АРХИТЕКТУРЫ
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-neutral-800 text-neutral-300 rounded">
                Docusaurus Multi-Instance + llms.txt
              </span>
            </h2>
            <div className="text-xs text-neutral-400">
              Формат: Плотные страницы с одним концептом и [[wikilinks]] для AI-агентов
            </div>
          </div>
        </div>

        {/* Export buttons */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => handleDownloadLlmsTxt(false)}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg font-mono flex items-center gap-1.5 border border-neutral-700"
          >
            <Download className="w-3.5 h-3.5" /> Скачать llms.txt
          </button>
          <button
            onClick={() => handleDownloadLlmsTxt(true)}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-mono flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> Экспорт llms-full.txt
          </button>
        </div>
      </div>

      {/* Main Two-Column Wiki Reader */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 overflow-hidden">
        {/* Left: Documents Directory */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-3 flex flex-col gap-2 overflow-hidden">
          <div className="relative mb-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-500" />
            <input
              type="text"
              placeholder="Поиск по вики-статьям и ADR..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {filteredDocs.map((doc) => {
              const isSelected = doc.slug === selectedDocSlug;
              return (
                <button
                  key={doc.slug}
                  onClick={() => setSelectedDocSlug(doc.slug)}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all text-xs ${
                    isSelected
                      ? 'bg-neutral-800 border-purple-500/50 text-white font-medium shadow-sm'
                      : 'bg-neutral-950/70 border-neutral-850 text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-neutral-500 mb-1">
                    <span className="font-mono uppercase text-purple-400 font-bold">{doc.type}</span>
                    <span className="font-mono">{doc.slug}</span>
                  </div>
                  <div className="font-semibold text-neutral-200 line-clamp-1 mb-1">{doc.title}</div>
                  <div className="text-[11px] text-neutral-500 line-clamp-2">{doc.summary}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Markdown Document View */}
        <div className="md:col-span-2 bg-neutral-900/40 border border-neutral-800 rounded-xl p-5 overflow-y-auto flex flex-col">
          {/* Document Header */}
          <div className="pb-4 mb-4 border-b border-neutral-800">
            <div className="flex items-center gap-2 mb-1.5 text-xs">
              <span className="font-mono uppercase px-2 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300 font-bold">
                {selectedDoc.type}
              </span>
              <span className="text-neutral-500">·</span>
              <span className="font-mono text-neutral-400 text-[11px]">docs/wiki/{selectedDoc.slug}.md</span>
            </div>

            <h1 className="text-lg font-bold text-white mb-2">{selectedDoc.title}</h1>

            <div className="flex flex-wrap gap-1.5">
              {selectedDoc.tags.map((t) => (
                <span
                  key={t}
                  className="text-[11px] font-mono text-neutral-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800"
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>

          {/* Rendered Text with Wikilink styling */}
          <div className="prose prose-invert prose-xs max-w-none space-y-4 text-xs text-neutral-300 leading-relaxed font-sans whitespace-pre-wrap">
            {selectedDoc.content}
          </div>
        </div>
      </div>
    </div>
  );
};
