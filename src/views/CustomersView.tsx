import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Users, 
  Search, 
  MessageSquare, 
  Calendar, 
  Sparkles, 
  Plus, 
  Heart, 
  Clock, 
  UserCheck 
} from 'lucide-react';
import { formatCurrencyBRL, formatDateBR } from '../utils/validators';
import { buildReturnMaintenanceMessage, generateWhatsAppLink } from '../utils/whatsapp';

export const CustomersView: React.FC = () => {
  const { currentTenant, customers, appointments } = useApp();
  const [search, setSearch] = useState<string>('');

  const filteredCustomers = customers.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.notes && c.notes.toLowerCase().includes(q));
  });

  const handleSendMaintenanceWhatsApp = (customer: any) => {
    if (!currentTenant) return;
    const text = buildReturnMaintenanceMessage(customer.name, 'Alongamento / Esmaltação', currentTenant);
    const link = generateWhatsAppLink(customer.phone, text);
    window.open(link, '_blank');
  };

  return (
    <div className="space-y-6 pb-20 xl:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-stone-900 text-xl sm:text-2xl">
            Clientes & Histórico de Visitas
          </h1>
          <p className="text-xs text-stone-700">
            Cadastros e acompanhamento de retorno para novos atendimentos ({currentTenant?.tradeName})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              placeholder="Buscar cliente por nome, telefone ou preferência..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-xl outline-none focus:border-amber-600 transition-all w-64 sm:w-80 shadow-xs"
            />
          </div>
        </div>
      </div>

      {/* Grid de Clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((cust) => {
          // Busca agendamentos deste cliente
          const clientApps = appointments.filter((a) => a.customerId === cust.id || a.customerPhone === cust.phone);

          return (
            <div
              key={cust.id}
              className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:border-amber-200 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                      {cust.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-stone-900 text-sm">
                        {cust.name}
                      </h3>
                      <p className="text-xs text-stone-700 font-mono">
                        {cust.phone}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
                    {cust.appointmentsCount} atendimentos
                  </span>
                </div>

                {/* Preferências / Observações */}
                {cust.notes && (
                  <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-100 text-xs text-stone-700">
                    <span className="font-semibold text-stone-800 text-[11px] block mb-0.5">
                      Ficha da Cliente:
                    </span>
                    {cust.notes}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-stone-100">
                  <div>
                    <span className="text-stone-700 text-[10px] block">Total Investido</span>
                    <span className="font-bold text-stone-900 tabular-nums">
                      {formatCurrencyBRL(cust.totalSpent)}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-700 text-[10px] block">Última Visita</span>
                    <span className="font-medium text-stone-800">
                      {cust.lastVisit ? formatDateBR(cust.lastVisit) : 'Primeira visita'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ação: Convidar para Manutenção */}
              <button
                onClick={() => handleSendMaintenanceWhatsApp(cust)}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all border border-emerald-200/70"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                Lembrar de Manutenção no WhatsApp
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
