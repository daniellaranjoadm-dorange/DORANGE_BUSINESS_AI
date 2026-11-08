import React, { useMemo, useState } from 'react';
import {
  CreditCard, Layers3, ShieldCheck, Settings2,
  Search, Building2, LockKeyhole
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BUSINESS_SEGMENTS } from '../data/businessSegments';

type Section = 'plans' | 'segments' | 'audit' | 'settings';

const money = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);

const panel = 'rounded-2xl border border-[#E6E8EC] bg-white p-5';

export const PlatformOperationsView: React.FC<{
  section: Section;
}> = ({ section }) => {
  const {
    tenants,
    subscriptionPlans,
    auditLogs
  } = useApp();

  const [query, setQuery] = useState('');

  const titles = {
    plans: 'Planos e Assinaturas',
    segments: 'Módulos e Segmentos',
    audit: 'Auditoria da Plataforma',
    settings: 'Configurações Administrativas'
  };

  const descriptions = {
    plans: 'Planos cadastrados e distribuição das empresas.',
    segments: 'Segmentos disponíveis e utilização na plataforma.',
    audit: 'Registros disponíveis para acompanhamento administrativo.',
    settings: 'Identidade, arquitetura e parâmetros operacionais.'
  };

  const segments = useMemo(
    () => Object.values(BUSINESS_SEGMENTS),
    []
  );

  const filteredSegments = segments.filter(segment =>
    [segment.name, segment.id, segment.description]
      .join(' ')
      .toLocaleLowerCase('pt-BR')
      .includes(query.toLocaleLowerCase('pt-BR'))
  );

  const filteredAudit = auditLogs.filter(entry =>
    JSON.stringify(entry)
      .toLocaleLowerCase('pt-BR')
      .includes(query.toLocaleLowerCase('pt-BR'))
  );

  return (
    <div className="space-y-6 text-[#17191F]">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#A47C43]">
          D'OR@NGE / Administração SaaS
        </p>
        <h1 className="text-3xl font-bold">{titles[section]}</h1>
        <p className="text-sm text-[#667085]">
          {descriptions[section]}
        </p>
      </header>

      {section === 'plans' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {subscriptionPlans.map(plan => {
              const count = tenants.filter(
                t => t.planId === plan.id
              ).length;

              return (
                <article key={plan.id} className={panel}>
                  <div className="flex items-center justify-between">
                    <CreditCard size={20} className="text-[#A47C43]" />
                    <span className="text-xs text-[#667085]">
                      {count} empresa(s)
                    </span>
                  </div>

                  <h2 className="mt-4 text-lg font-bold">
                    {plan.name}
                  </h2>

                  <p className="mt-2 text-2xl font-bold">
                    {money(plan.priceMonthly)}
                    <span className="text-xs font-normal text-[#667085]">
                      /mês
                    </span>
                  </p>

                  <div className="mt-4 space-y-2 text-xs text-[#667085]">
                    <p>Profissionais: {plan.maxProfessionals}</p>
                    <p>Limite de agendamentos: {plan.appointmentsLimit}</p>
                    <p>Créditos de IA: {plan.aiCreditsLimit}</p>
                  </div>

                  <ul className="mt-4 space-y-2 border-t pt-4 text-xs">
                    {plan.features.map((feature, index) => (
                      <li key={index}>• {feature}</li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>

          <div className={panel}>
            <h2 className="font-bold">Distribuição de assinaturas</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-[#667085]">
                    <th className="py-3">Plano</th>
                    <th>Empresas</th>
                    <th>Mensalidade cadastrada</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptionPlans.map(plan => (
                    <tr key={plan.id} className="border-b last:border-0">
                      <td className="py-3 font-semibold">{plan.name}</td>
                      <td>{tenants.filter(t => t.planId === plan.id).length}</td>
                      <td>{money(plan.priceMonthly)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs text-[#667085]">
              Valores de catálogo. Não representam pagamentos confirmados.
            </p>
          </div>
        </>
      )}

      {section === 'segments' && (
        <>
          <div className={panel}>
            <label className="flex items-center gap-3 border rounded-xl px-4">
              <Search size={18} className="text-[#667085]" />
              <input
                aria-label="Pesquisar segmentos"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Pesquisar segmento..."
                className="w-full py-3 outline-none"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredSegments.map(segment => (
              <article key={segment.id} className={panel}>
                <div className="flex items-center justify-between">
                  <Layers3 className="text-[#A47C43]" size={21} />
                  <span className="text-xs text-[#667085]">
                    {tenants.filter(t =>
                      t.businessSegment === segment.id
                    ).length} empresa(s)
                  </span>
                </div>
                <h2 className="mt-4 font-bold">{segment.name}</h2>
                <p className="mt-2 text-sm text-[#667085]">
                  {segment.description}
                </p>
                <p className="mt-3 text-xs font-mono text-[#A47C43]">
                  {segment.id}
                </p>
              </article>
            ))}
          </div>
        </>
      )}

      {section === 'audit' && (
        <div className={panel}>
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="text-[#A47C43]" />
            <div>
              <h2 className="font-bold">Eventos de Auditoria</h2>
              <p className="text-xs text-[#667085]">
                {auditLogs.length} registro(s) disponíveis
              </p>
            </div>
          </div>

          <label className="flex items-center gap-3 border rounded-xl px-4">
            <Search size={18} className="text-[#667085]" />
            <input
              aria-label="Pesquisar auditoria"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Pesquisar eventos..."
              className="w-full py-3 outline-none"
            />
          </label>

          <div className="mt-5 space-y-3">
            {filteredAudit.slice(0, 100).map(entry => (
              <article
                key={entry.id}
                className="rounded-xl border p-4 text-sm"
              >
                <p className="font-semibold">{entry.action}</p>
                <p className="mt-1 text-xs text-[#667085]">
                  {entry.timestamp}
                </p>
                <p className="mt-1 text-xs text-[#667085]">
                  Tenant: {entry.tenantId}
                </p>
              </article>
            ))}
            {filteredAudit.length === 0 && (
              <p className="text-sm text-[#667085]">
                Nenhum evento encontrado.
              </p>
            )}
          </div>

          <p className="mt-4 text-xs text-[#667085]">
            Exibindo até 100 eventos. A consulta não concede
            acesso assistido às empresas.
          </p>
        </div>
      )}

      {section === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className={panel}>
            <Settings2 className="text-[#A47C43]" />
            <h2 className="mt-4 font-bold">Identidade Corporativa</h2>
            <p className="mt-2 text-sm text-[#667085]">
              Marca D'OR@NGE Business AI.
              Identidade grafite, dourado e branco.
            </p>
            <div className="mt-4 flex gap-3">
              {['#17191F', '#C5A46D', '#FFFFFF'].map(color => (
                <div
                  key={color}
                  className="w-12 h-12 rounded-xl border"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          <div className={panel}>
            <Building2 className="text-[#A47C43]" />
            <h2 className="mt-4 font-bold">Ambiente SaaS</h2>
            <p className="mt-2 text-sm">
              Empresas cadastradas: {tenants.length}
            </p>
            <p className="mt-2 text-sm">
              Planos cadastrados: {subscriptionPlans.length}
            </p>
            <p className="mt-2 text-sm">
              Segmentos disponíveis: {segments.length}
            </p>
          </div>

          <div className={panel}>
            <LockKeyhole className="text-[#A47C43]" />
            <h2 className="mt-4 font-bold">Segurança</h2>
            <p className="mt-2 text-sm text-[#667085]">
              Alterações de permissões, acesso assistido e
              configuração de faturamento não estão habilitadas
              nesta tela.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};