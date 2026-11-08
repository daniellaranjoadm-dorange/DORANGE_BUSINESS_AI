import React, { useMemo, useState } from 'react';
import { Building2, Search, Filter, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const PlatformCompaniesView: React.FC = () => {
  const { tenants } = useApp();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [plan, setPlan] = useState('all');

  const plans = [
    { id: 'free', label: 'Free' },
    { id: 'start', label: 'Start' },
    { id: 'pro', label: 'Pro' },
    { id: 'studio', label: 'Studio' },
  ];

  const getPlanLabel = (id: string) =>
    plans.find(p => p.id === id)?.label || id || 'Não informado';

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('pt-BR');

    return tenants.filter(t => {
      const searchable = [
        t.tradeName,
        t.slug,
        t.businessSegment,
        t.city,
        t.state,
      ].filter(Boolean).join(' ').toLocaleLowerCase('pt-BR');

      return (
        (!q || searchable.includes(q)) &&
        (status === 'all' || t.status === status) &&
        (plan === 'all' || t.planId === plan)
      );
    });
  }, [tenants, search, status, plan]);

  const active = tenants.filter(t => t.status === 'active').length;
  const suspended = tenants.filter(t => t.status === 'suspended').length;

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest font-semibold text-[#B58A4B]">
            D’OR@NGE / Administração
          </p>
          <h1 className="text-3xl font-bold mt-1">
            Gestão de Empresas
          </h1>
          <p className="text-sm text-[#667085] mt-2">
            Consulte empresas, segmentos, planos e situações cadastrais.
          </p>
        </div>
        <span className="text-xs bg-white border rounded-full px-4 py-2">
          Consulta administrativa
        </span>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Empresas cadastradas', value: tenants.length },
          { label: 'Empresas ativas', value: active },
          { label: 'Empresas suspensas', value: suspended },
        ].map(item => (
          <div
            key={item.label}
            className="bg-white border border-[#E6E8EC] rounded-2xl p-5"
          >
            <p className="text-xs text-[#667085]">{item.label}</p>
            <p className="text-3xl font-bold mt-2">{item.value}</p>
          </div>
        ))}
      </div>

      <section className="bg-white border border-[#E6E8EC] rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-[#E6E8EC] space-y-3">
          <div className="flex items-center gap-2">
            <Building2 size={18} className="text-[#B58A4B]" />
            <h2 className="font-bold">Empresas da Plataforma</h2>
          </div>

          <div className="flex flex-col lg:flex-row gap-3">
            <label className="flex-1 flex items-center gap-2 border rounded-xl px-3">
              <Search size={17} className="text-[#667085]" />
              <input
                aria-label="Pesquisar empresas"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Pesquisar empresa, cidade ou segmento..."
                className="w-full py-3 outline-none text-sm"
              />
            </label>

            <label className="flex items-center gap-2 border rounded-xl px-3">
              <Filter size={17} className="text-[#667085]" />
              <select
                aria-label="Filtrar por situação"
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="py-3 outline-none bg-white text-sm"
              >
                <option value="all">Todas as situações</option>
                <option value="active">Ativas</option>
                <option value="suspended">Suspensas</option>
              </select>
            </label>

            <label className="flex items-center gap-2 border rounded-xl px-3">
              <select
                aria-label="Filtrar por plano"
                value={plan}
                onChange={e => setPlan(e.target.value)}
                className="py-3 outline-none bg-white text-sm"
              >
                <option value="all">Todos os planos</option>
                {plans.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F8F9FB] text-[#667085]">
              <tr>
                <th className="px-5 py-4">Empresa</th>
                <th className="px-5 py-4">Segmento</th>
                <th className="px-5 py-4">Cidade / UF</th>
                <th className="px-5 py-4">Plano</th>
                <th className="px-5 py-4">Situação</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#E6E8EC]">
              {filtered.map(t => (
                <tr key={t.id} className="hover:bg-[#FAFAFA]">
                  <td className="px-5 py-4">
                    <p className="font-semibold">{t.tradeName}</p>
                    <p className="text-xs text-[#667085]">{t.slug}</p>
                  </td>

                  <td className="px-5 py-4">
                    {t.businessSegment || 'Não informado'}
                  </td>

                  <td className="px-5 py-4">
                    {[t.city, t.state].filter(Boolean).join(' / ') || 'Não informado'}
                  </td>

                  <td className="px-5 py-4">
                    <span className="bg-[#F4E8D4] text-[#8C642E] rounded-full px-3 py-1 text-xs font-semibold">
                      {getPlanLabel(t.planId)}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span className={
                      'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ' +
                      (t.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-800')
                    }>
                      {t.status === 'active' && <CheckCircle2 size={13} />}
                      {t.status === 'active'
                        ? 'Ativa'
                        : t.status === 'suspended'
                          ? 'Suspensa'
                          : t.status}
                    </span>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-[#667085]">
                    Nenhuma empresa encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="px-5 py-4 border-t text-xs text-[#667085]">
          Exibindo {filtered.length} de {tenants.length} empresas.
        </footer>
      </section>
    </div>
  );
};