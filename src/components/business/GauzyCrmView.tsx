import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  DollarSign, 
  Plus, 
  Briefcase, 
  TrendingUp, 
  FileSpreadsheet, 
  Check, 
  Filter,
  ArrowRight
} from 'lucide-react';
import { CrmContact, CrmDeal, Tenant } from '../../types';

interface GauzyCrmViewProps {
  tenant: Tenant;
  contacts: CrmContact[];
  deals: CrmDeal[];
  onAddContact: (contact: CrmContact) => void;
  onAddDeal: (deal: CrmDeal) => void;
}

export const GauzyCrmView: React.FC<GauzyCrmViewProps> = ({
  tenant,
  contacts,
  deals,
  onAddContact,
  onAddDeal,
}) => {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'contacts'>('pipeline');
  const [showAddDealModal, setShowAddDealModal] = useState<boolean>(false);
  const [newDealTitle, setNewDealTitle] = useState<string>('');
  const [newDealCompany, setNewDealCompany] = useState<string>('');
  const [newDealAmount, setNewDealAmount] = useState<string>('500000');
  const [newDealStage, setNewDealStage] = useState<CrmDeal['stage']>('discovery');

  // Filter deals and contacts by active tenant schema
  const tenantContacts = contacts.filter((c) => c.tenantId === tenant.id);
  const tenantDeals = deals.filter((d) => d.tenantId === tenant.id);

  const totalPipelineRub = tenantDeals.reduce((acc, curr) => acc + curr.amountRub, 0);
  const wonDealsRub = tenantDeals
    .filter((d) => d.stage === 'closed_won')
    .reduce((acc, curr) => acc + curr.amountRub, 0);

  const stages: { id: CrmDeal['stage']; label: string; color: string }[] = [
    { id: 'discovery', label: '1. Первичный контакт', color: 'border-blue-500/40 text-blue-400' },
    { id: 'proposal', label: '2. Коммерческое предложение', color: 'border-purple-500/40 text-purple-400' },
    { id: 'negotiation', label: '3. Переговоры / Согласование', color: 'border-amber-500/40 text-amber-400' },
    { id: 'closed_won', label: '4. Успешно закрыто (Won)', color: 'border-emerald-500/40 text-emerald-400' },
    { id: 'closed_lost', label: '5. Отклонено (Lost)', color: 'border-neutral-700 text-neutral-400' },
  ];

  const handleCreateDeal = () => {
    if (!newDealTitle.trim() || !newDealCompany.trim()) return;
    const deal: CrmDeal = {
      id: `dl_${Date.now()}`,
      title: newDealTitle.trim(),
      company: newDealCompany.trim(),
      amountRub: parseInt(newDealAmount, 10) || 100000,
      stage: newDealStage,
      assignedTo: 'usr_superadmin',
      updatedAt: new Date().toISOString().split('T')[0],
      tenantId: tenant.id,
    };
    onAddDeal(deal);
    setShowAddDealModal(false);
    setNewDealTitle('');
    setNewDealCompany('');
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 p-4 gap-4">
      {/* Header with Gauzy ERP branding & RLS notice */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900/80 p-3 rounded-xl border border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              EVER GAUZY · БИЗНЕС-МОДУЛЬ ERP & CRM
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-neutral-800 text-neutral-300 rounded">
                Schema: {tenant.schema}
              </span>
            </h2>
            <div className="text-xs text-neutral-400 flex items-center gap-2">
              <span>RLS Context: <code className="text-emerald-400 font-mono">SET LOCAL app.current_tenant = '{tenant.id}'</code></span>
            </div>
          </div>
        </div>

        {/* Top KPIs */}
        <div className="flex items-center gap-4 text-xs">
          <div className="bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800">
            <span className="text-neutral-500 text-[11px] block">Общий пайплайн</span>
            <span className="font-mono font-bold text-white">
              {(totalPipelineRub / 1000000).toFixed(2)} млн ₽
            </span>
          </div>
          <div className="bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800">
            <span className="text-neutral-500 text-[11px] block">Закрыто (Won)</span>
            <span className="font-mono font-bold text-emerald-400">
              {(wonDealsRub / 1000000).toFixed(2)} млн ₽
            </span>
          </div>
          <button
            onClick={() => setShowAddDealModal(true)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium flex items-center gap-1.5 shadow-sm transition-colors text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Новая сделка
          </button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'pipeline'
              ? 'bg-neutral-800 text-white'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Воронка сделок (Kanban Deals)
        </button>
        <button
          onClick={() => setActiveTab('contacts')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'contacts'
              ? 'bg-neutral-800 text-white'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          База контактов ({tenantContacts.length})
        </button>
      </div>

      {/* Tab: Deals Pipeline */}
      {activeTab === 'pipeline' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 flex-1 overflow-x-auto min-h-[420px]">
          {stages.map((stage) => {
            const stageDeals = tenantDeals.filter((d) => d.stage === stage.id);
            const stageSum = stageDeals.reduce((acc, c) => acc + c.amountRub, 0);

            return (
              <div
                key={stage.id}
                className="flex flex-col bg-neutral-900/40 rounded-xl border border-neutral-800/80 p-3 min-w-[220px]"
              >
                <div className="pb-2 mb-2 border-b border-neutral-800">
                  <h4 className={`text-xs font-bold ${stage.color}`}>{stage.label}</h4>
                  <div className="flex justify-between items-center text-[10px] text-neutral-500 mt-1">
                    <span>{stageDeals.length} сделок</span>
                    <span className="font-mono text-neutral-300">{(stageSum / 1000).toLocaleString('ru-RU')} тыс. ₽</span>
                  </div>
                </div>

                <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                  {stageDeals.length === 0 ? (
                    <div className="h-20 flex items-center justify-center text-[11px] text-neutral-600 border border-dashed border-neutral-800/60 rounded-lg">
                      Нет сделок на этом этапе
                    </div>
                  ) : (
                    stageDeals.map((deal) => (
                      <div
                        key={deal.id}
                        className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg shadow-sm hover:border-neutral-700 transition-colors"
                      >
                        <h5 className="text-xs font-semibold text-neutral-100 line-clamp-2 mb-1">
                          {deal.title}
                        </h5>
                        <div className="text-[11px] text-neutral-400 mb-2">{deal.company}</div>
                        <div className="flex items-center justify-between pt-2 border-t border-neutral-850 text-xs font-mono">
                          <span className="text-emerald-400 font-bold">
                            {deal.amountRub.toLocaleString('ru-RU')} ₽
                          </span>
                          <span className="text-[10px] text-neutral-500">{deal.updatedAt}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab: Contacts List */}
      {activeTab === 'contacts' && (
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl overflow-hidden flex-1 flex flex-col">
          <div className="p-3 border-b border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
            <span>Изолированные контакты схемы <strong>{tenant.schema}</strong></span>
            <span>Всего: {tenantContacts.length} записей</span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-neutral-950 text-neutral-500 font-mono text-[11px] uppercase border-b border-neutral-800">
                <tr>
                  <th className="p-3">Имя контакта</th>
                  <th className="p-3">Организация</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Телефон</th>
                  <th className="p-3">Стадия воронки</th>
                  <th className="p-3 text-right">Потенциал (₽)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-850">
                {tenantContacts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-neutral-500">
                      В данном тенанте ещё нет контактов. Переключитесь на Acme Enterprise для просмотра демонстрационной базы.
                    </td>
                  </tr>
                ) : (
                  tenantContacts.map((c) => (
                    <tr key={c.id} className="hover:bg-neutral-850/50 transition-colors">
                      <td className="p-3 font-semibold text-white">{c.name}</td>
                      <td className="p-3 text-neutral-300">{c.company}</td>
                      <td className="p-3 font-mono text-cyan-400">{c.email}</td>
                      <td className="p-3 font-mono text-neutral-400">{c.phone}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-800 text-neutral-200">
                          {c.stage}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-400">
                        {c.valueRub.toLocaleString('ru-RU')} ₽
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE DEAL MODAL */}
      {showAddDealModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-3">Создать сделку в схеме {tenant.schema}</h3>
            
            <div className="space-y-3 text-xs mb-4">
              <div>
                <label className="text-neutral-400 block mb-1">Название проекта / сделки</label>
                <input
                  type="text"
                  value={newDealTitle}
                  onChange={(e) => setNewDealTitle(e.target.value)}
                  placeholder="Например: Внедрение RLS шлюза"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Компания контрагента</label>
                <input
                  type="text"
                  value={newDealCompany}
                  onChange={(e) => setNewDealCompany(e.target.value)}
                  placeholder="Например: ООО СеверТелеком"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Бюджет сделки (₽)</label>
                <input
                  type="number"
                  value={newDealAmount}
                  onChange={(e) => setNewDealAmount(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Начальный этап</label>
                <select
                  value={newDealStage}
                  onChange={(e) => setNewDealStage(e.target.value as CrmDeal['stage'])}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="discovery">1. Первичный контакт</option>
                  <option value="proposal">2. Коммерческое предложение</option>
                  <option value="negotiation">3. Переговоры</option>
                  <option value="closed_won">4. Закрыто успешно</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setShowAddDealModal(false)}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg"
              >
                Отмена
              </button>
              <button
                onClick={handleCreateDeal}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg"
              >
                Сохранить сделку
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
