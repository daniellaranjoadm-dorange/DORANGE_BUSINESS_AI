import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  CreditCard, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Users, 
  Sparkles, 
  Tag, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { formatCurrencyBRL, formatDateBR } from '../utils/validators';

export const PackagesView: React.FC = () => {
  const { currentTenant, packagePlans, customerPackages, services, createPackagePlan, showNotification } = useApp();

  const [isAddPlanModalOpen, setIsAddPlanModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [serviceId, setServiceId] = useState(services[0]?.id || '');
  const [totalSessions, setTotalSessions] = useState('4');
  const [priceTotal, setPriceTotal] = useState('160.00');
  const [validityDays, setValidityDays] = useState('35');
  const [description, setDescription] = useState('');

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const svc = services.find((s) => s.id === serviceId) || services[0];
    if (!name || !svc) return;

    await createPackagePlan({
      name,
      serviceId: svc.id,
      serviceName: svc.name,
      totalSessions: Number(totalSessions),
      priceTotal: Number(priceTotal),
      validityDays: Number(validityDays),
      description,
    });

    setIsAddPlanModalOpen(false);
    setName('');
    setDescription('');
  };

  return (
    <div className="space-y-6 pb-20 xl:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-stone-900 text-xl sm:text-2xl flex items-center gap-2">
            Pacotes & Assinaturas de Clientes
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
              Fase 9
            </span>
          </h1>
          <p className="text-xs text-stone-700">
            Venda combos pré-pagos, passaportes mensais e planos de manutenção recorrente para fidelizar suas clientes
          </p>
        </div>

        <button
          onClick={() => setIsAddPlanModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Criar Novo Pacote
        </button>
      </div>

      {/* Planos de Pacotes Disponíveis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {packagePlans.map((plan) => (
          <div
            key={plan.id}
            className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between hover:border-amber-300 transition-all space-y-3"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                  {plan.totalSessions} Sessões
                </span>
                <span className="text-xs font-bold text-stone-900 tabular-nums">
                  {formatCurrencyBRL(plan.priceTotal)}
                </span>
              </div>

              <h3 className="font-display font-bold text-stone-900 text-sm leading-tight">
                {plan.name}
              </h3>

              <p className="text-xs text-stone-600">
                {plan.description || `Pacote com ${plan.totalSessions} atendimentos de ${plan.serviceName}.`}
              </p>

              <div className="pt-2 text-[11px] text-stone-700 space-y-1">
                <p>• Serviço: <strong>{plan.serviceName}</strong></p>
                <p>• Validade: <strong>{plan.validityDays} dias</strong> a partir da compra</p>
                <p>• Média por sessão: <strong>{formatCurrencyBRL(plan.priceTotal / plan.totalSessions)}</strong></p>
              </div>
            </div>

            <button
              onClick={() => {
                showNotification(`Link de venda gerado para o pacote "${plan.name}"!`, 'success');
              }}
              className="w-full py-2 text-xs font-bold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
            >
              Vender Pacote para Cliente
            </button>
          </div>
        ))}
      </div>

      {/* Clientes com Pacotes e Saldos Ativos */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
          <div>
            <h3 className="font-display font-bold text-stone-900 text-sm">
              Saldos de Pacotes Ativos das Clientes
            </h3>
            <p className="text-xs text-stone-700">
              Acompanhamento de sessões contratadas, utilizadas e data de expiração
            </p>
          </div>
          <span className="text-xs font-semibold text-stone-700">
            {customerPackages.length} assinaturas ativas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/70 text-stone-700 font-semibold">
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Pacote Contratado</th>
                <th className="py-3 px-4 text-center">Progresso de Sessões</th>
                <th className="py-3 px-4 text-center">Saldo Restante</th>
                <th className="py-3 px-4">Data de Compra</th>
                <th className="py-3 px-4">Validade</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {customerPackages.map((cp) => {
                const remaining = cp.totalSessions - cp.usedSessions;
                return (
                  <tr key={cp.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-stone-900">
                      {cp.customerName}
                    </td>
                    <td className="py-3 px-4 text-stone-800 font-medium">
                      {cp.packageName}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-24 bg-stone-100 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-amber-600 h-full"
                            style={{ width: `${(cp.usedSessions / cp.totalSessions) * 100}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono text-stone-700">
                          {cp.usedSessions}/{cp.totalSessions}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-amber-900 tabular-nums">
                      {remaining} {remaining === 1 ? 'sessão' : 'sessões'}
                    </td>
                    <td className="py-3 px-4 text-stone-700 font-mono">
                      {formatDateBR(cp.purchaseDate)}
                    </td>
                    <td className="py-3 px-4 text-stone-700 font-mono">
                      {formatDateBR(cp.expirationDate)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                        {cp.status === 'active' ? 'Ativo' : 'Concluído'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Criar Novo Pacote */}
      {isAddPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-md p-6 space-y-4">
            <h3 className="font-display font-bold text-stone-900 text-base">
              Criar Novo Pacote para Clientes
            </h3>
            <form onSubmit={handleCreatePlan} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Nome do Pacote *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pacote de 4 atendimentos"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Serviço Vinculado</label>
                <select
                  aria-label="Serviço Vinculado"
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({formatCurrencyBRL(s.price)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Sessões</label>
                  <input
                    type="number"
                    required
                    value={totalSessions}
                    onChange={(e) => setTotalSessions(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Preço Total (R$)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={priceTotal}
                    onChange={(e) => setPriceTotal(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Validade (dias)</label>
                  <input
                    type="number"
                    required
                    value={validityDays}
                    onChange={(e) => setValidityDays(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Descrição</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Vantagens do pacote, regras de cancelamento..."
                  className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddPlanModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-xs"
                >
                  Salvar Pacote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
