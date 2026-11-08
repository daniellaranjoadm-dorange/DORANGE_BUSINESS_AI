import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Building2, 
  DollarSign, 
  Users, 
  Sparkles, 
  Layers, 
  Activity, 
  CheckCircle2, 
  AlertCircle,
  Lock,
  MapPin,
  RefreshCw,
  Server,
  Database,
  Cpu
} from 'lucide-react';
import { formatCurrencyBRL, formatDateBR } from '../utils/validators';
import { DOrangeBrand } from '../design-system/DOrangeBrand';

export const SuperAdminView: React.FC = () => {
  const { tenants, appointments, updateTenant, auditLogs, subscriptionPlans } = useApp();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/metrics');
      const data = await res.json();
      setMetrics(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (tenantId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    await updateTenant(tenantId, { status: nextStatus as any });
    await fetchMetrics();
  };

  return (
    <div className="space-y-6 pb-20 xl:pb-8 animate-fade-in text-[#17191F]">
      
      {/* 1. Header Corporativo D'OR@NGE (Ambiente A) */}
      <div className="bg-[#17191F] text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5 border border-stone-800">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-[#C5A46D]/40 flex items-center justify-center shrink-0">
            <span className="text-[#C5A46D] font-bold text-xl">⚡</span>
          </div>

          <div>
            <div className="flex items-center gap-3">
              <DOrangeBrand variant="dark" size="lg" showSubtitle={false} />
              <span className="text-[10px] font-bold uppercase tracking-widest bg-[#C5A46D] text-[#17191F] px-2.5 py-0.5 rounded-full">
                Super Admin
              </span>
            </div>
            <p className="text-xs text-[#667085] mt-1 max-w-xl">
              Console global de monitoramento SaaS: Receita Recorrente Mensal (MRR), instâncias multi-tenant, consumo de IA e auditoria LGPD.
            </p>
          </div>
        </div>

        <button
          onClick={fetchMetrics}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-white/10 hover:bg-white/15 rounded-xl transition-all self-start md:self-auto border border-white/10"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#C5A46D] ${loading ? 'animate-spin' : ''}`} />
          <span>Atualizar Métricas</span>
        </button>
      </div>

      {/* 2. KPI Cards SaaS Globais (Tabular Figures) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Salões Ativos */}
        <div className="bg-white p-5 rounded-2xl border border-[#E6E8EC] shadow-2xs">
          <div className="flex items-center justify-between text-[#667085] mb-2">
            <span className="text-xs font-semibold">Empresas na Plataforma</span>
            <Building2 className="w-4 h-4 text-[#C5A46D]" />
          </div>
          <div className="font-display font-bold text-3xl text-[#17191F] tabular-nums">
            {metrics?.totalTenants ?? tenants.length}
          </div>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">
            {metrics?.activeTenants ?? tenants.filter(t => t.status === 'active').length} empresas ativas
          </p>
        </div>

        {/* MRR Recorrente */}
        <div className="bg-white p-5 rounded-2xl border border-[#E6E8EC] shadow-2xs">
          <div className="flex items-center justify-between text-[#667085] mb-2">
            <span className="text-xs font-semibold">MRR contratual estimado</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-display font-bold text-3xl text-emerald-800 tabular-nums">
            {typeof metrics?.monthlyRecurringRevenueBRL === 'number' ? formatCurrencyBRL(metrics.monthlyRecurringRevenueBRL) : 'Não disponível'}
          </div>
          <p className="text-[11px] text-[#667085] mt-1">
            Projecao mensal dos planos de empresas ativas; nao representa pagamentos recebidos
          </p>
        </div>

        {/* Agendamentos na Rede */}
        <div className="bg-white p-5 rounded-2xl border border-[#E6E8EC] shadow-2xs">
          <div className="flex items-center justify-between text-[#667085] mb-2">
            <span className="text-xs font-semibold">Agendamentos no Ecossistema</span>
            <Activity className="w-4 h-4 text-stone-700" />
          </div>
          <div className="font-display font-bold text-3xl text-[#17191F] tabular-nums">
            {metrics?.totalAppointments ?? appointments.length}
          </div>
          <p className="text-[11px] text-[#667085] mt-1">
            Validados sem conflito de agenda
          </p>
        </div>

        {/* Consultas Gemini IA */}
        <div className="bg-white p-5 rounded-2xl border border-[#E6E8EC] shadow-2xs">
          <div className="flex items-center justify-between text-[#667085] mb-2">
            <span className="text-xs font-semibold">Consumo Gemini AI</span>
            <Sparkles className="w-4 h-4 text-[#C5A46D]" />
          </div>
          <div className="font-display font-bold text-3xl text-[#17191F] tabular-nums">
            {typeof metrics?.totalAiQueriesCount === "number" ? metrics.totalAiQueriesCount : "Não disponível"}
          </div>
          <p className="text-[11px] text-[#667085] mt-1">
            Consumo real ainda não consolidado pela API
          </p>
        </div>

      </div>

      {/* 3. Grade de Planos SaaS & Níveis */}
      <div className="bg-white rounded-3xl border border-[#E6E8EC] p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-sm text-[#17191F]">
              Planos & Modelos de Licenciamento White-Label
            </h3>
            <p className="text-xs text-[#667085]">
              Distribuição de recursos por nível de contratação
            </p>
          </div>
          <span className="text-xs text-[#667085]">Planos conforme cadastro da plataforma</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {subscriptionPlans.map((plan) => (
            <div
              key={plan.id}
              className={`p-4 rounded-2xl border space-y-3 ${
                plan.id === 'pro'
                  ? 'border-[#C5A46D] bg-[#C5A46D]/5'
                  : 'border-[#E6E8EC] bg-[#F8F9FB]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-xs uppercase text-[#17191F]">
                  Plano {plan.name}
                </span>
                <span className="text-xs font-bold text-[#17191F]">
                  {formatCurrencyBRL(plan.priceMonthly)}/mês
                </span>
              </div>

              <div className="text-xs text-[#667085] space-y-1">
                <p>
                  {plan.maxProfessionals} profissional(is)
                </p>
                <p>
                  {plan.appointmentsLimit >= 9999
                    ? 'Agendamentos ilimitados'
                    : `Até ${plan.appointmentsLimit} agendamentos/mês`}
                </p>
                <p>{plan.aiCreditsLimit} créditos de IA/mês</p>
              </div>

              <ul className="text-[11px] text-stone-700 space-y-1 pt-1">
                {plan.features.slice(0, 4).map((feature, index) => (
                  <li key={`${plan.id}-${index}`}>
                    • {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Tabela de Instâncias de Salões (Isolamento Multi-tenant Real) */}
      <div className="bg-white rounded-3xl border border-[#E6E8EC] shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E6E8EC] flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#F8F9FB]">
          <div>
            <h3 className="font-display font-bold text-sm text-[#17191F]">
              Instâncias & Salões Registrados
            </h3>
            <p className="text-[11px] text-[#667085]">
              Isolamento estrito de dados por Tenant ID conforme diretrizes da LGPD
            </p>
          </div>
          <span className="text-xs font-semibold text-stone-700 bg-white border border-stone-200 px-3 py-1 rounded-xl">
            Total: {tenants.length} instâncias
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E6E8EC] bg-white text-[#667085] font-semibold">
                <th className="py-3.5 px-6">Nome Comercial</th>
                <th className="py-3.5 px-6">Responsável</th>
                <th className="py-3.5 px-6">CNPJ / CPF</th>
                <th className="py-3.5 px-6">Cidade / UF</th>
                <th className="py-3.5 px-6">Plano</th>
                <th className="py-3.5 px-6">Slug Exclusivo</th>
                <th className="py-3.5 px-6 text-center">Status</th>
                <th className="py-3.5 px-6 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E8EC]">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-stone-50 transition-colors">
                  <td className="py-3.5 px-6 font-bold text-[#17191F]">
                    {t.tradeName}
                  </td>
                  <td className="py-3.5 px-6 text-stone-700 font-medium">
                    {t.name}
                  </td>
                  <td className="py-3.5 px-6 font-mono text-stone-600">
                    {t.document}
                  </td>
                  <td className="py-3.5 px-6 text-stone-700">
                    {t.city} - {t.state}
                  </td>
                  <td className="py-3.5 px-6 uppercase font-bold text-amber-800 text-[10px]">
                    {t.planId}
                  </td>
                  <td className="py-3.5 px-6 font-mono text-[11px] text-stone-500">
                    /{t.slug}
                  </td>
                  <td className="py-3.5 px-6 text-center">
                    <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                      t.status === 'active' 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : t.status === 'trial'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}>
                      {t.status === 'active' ? 'Ativo' : t.status === 'trial' ? 'Período Teste' : 'Suspenso'}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <button
                      onClick={() => handleToggleStatus(t.id, t.status)}
                      className="text-[11px] font-semibold text-stone-700 hover:text-stone-900 underline"
                    >
                      {t.status === 'active' ? 'Suspender' : 'Reativar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
