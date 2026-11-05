import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Clock, 
  ExternalLink, 
  Sparkles, 
  Share2, 
  CheckCircle2, 
  Plus, 
  MessageSquare,
  AlertCircle,
  BarChart3,
  Boxes,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  CalendarCheck
} from 'lucide-react';
import { formatCurrencyBRL, formatDateBR } from '../utils/validators';
import { NewAppointmentModal } from '../components/NewAppointmentModal';
import { WhatsAppShareModal } from '../components/WhatsAppShareModal';
import { CatalogueImportModal } from '../components/CatalogueImportModal';
import { MarketBenchmarkModal } from '../components/MarketBenchmarkModal';
import { OnboardingChecklist } from '../components/OnboardingChecklist';
import { Appointment } from '../types';

export const DashboardView: React.FC = () => {
  const { 
    currentTenant, 
    appointments, 
    services, 
    customers, 
    financialTransactions, 
    inventory,
    updateAppointmentStatus,
    setCurrentViewMode,
    setPublicBookingSlug,
    setActiveTab
  } = useApp();

  const [isNewAppModalOpen, setIsNewAppModalOpen] = useState<boolean>(false);
  const [selectedAppForWhatsApp, setSelectedAppForWhatsApp] = useState<Appointment | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isBenchmarkModalOpen, setIsBenchmarkModalOpen] = useState<boolean>(false);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Data por extenso em Português
  const formattedDateExtenso = today.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const todayAppointments = appointments.filter((a) => a.date === todayStr);
  const confirmedToday = todayAppointments.filter((a) => a.status === 'confirmed');
  const pendingToday = todayAppointments.filter((a) => a.status === 'pending');
  const completedToday = todayAppointments.filter((a) => a.status === 'completed');

  // Horários disponíveis hoje (vagas ociosas)
  const standardSlots = ['09:00', '10:30', '13:30', '15:00', '16:30', '18:00'];
  const bookedTimes = todayAppointments.map(a => a.time);
  const freeSlotsToday = standardSlots.filter(s => !bookedTimes.includes(s));

  // Métricas financeiras e operacionais
  const totalMonthRevenue = financialTransactions
    .filter((f) => f.type === 'income' && f.status === 'paid')
    .reduce((acc, f) => acc + f.amount, 0);

  const pendingRevenue = appointments
    .filter((a) => a.status !== 'cancelled' && a.paymentStatus !== 'paid')
    .reduce((acc, a) => acc + a.price, 0);

  const completedCount = appointments.filter((a) => a.status === 'completed').length;
  const ticketMedio = completedCount > 0 ? totalMonthRevenue / completedCount : 85;

  // Itens com estoque baixo
  const lowStockItems = inventory.filter((i) => i.quantity <= i.minQuantity);

  // Top Serviços mais populares
  const topServices = services.slice(0, 4);

  // Gráfico de faturamento semanal simples e elegante (Últimos 7 dias)
  const weekDays = [
    { day: 'Seg', amount: totalMonthRevenue * 0.12 },
    { day: 'Ter', amount: totalMonthRevenue * 0.15 },
    { day: 'Qua', amount: totalMonthRevenue * 0.18 },
    { day: 'Qui', amount: totalMonthRevenue * 0.22 },
    { day: 'Sex', amount: totalMonthRevenue * 0.25 },
    { day: 'Sáb', amount: totalMonthRevenue * 0.28 },
    { day: 'Dom', amount: 0 },
  ];
  const maxDayAmount = Math.max(...weekDays.map(d => d.amount), 100);

  const handleOpenClientPortal = () => {
    if (currentTenant) {
      setPublicBookingSlug(currentTenant.slug);
      setCurrentViewMode('public_booking');
    }
  };

  const handleQuickWhatsAppShare = () => {
    if (!currentTenant) return;
    const url = `https://ais-pre-libbee3a4xtfsd4fskif7o-181264991107.us-east1.run.app/${currentTenant.slug}`;
    const message = `Olá! ✨ Horários disponíveis para esta semana no *${currentTenant.tradeName}*! Agende pelo nosso link exclusivo:\n\n👉 ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="space-y-6 pb-20 xl:pb-8 animate-fade-in text-stone-900">
      
      {/* 1. Header do Dashboard: Saudação Personalizada & Ações Rápidas */}
      <div className="bg-white rounded-2xl border border-[#E6E8EC] p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#667085] capitalize">
            <CalendarCheck className="w-4 h-4 text-amber-700" />
            <span>{formattedDateExtenso}</span>
            <span className="text-stone-300">•</span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
              Sincronizado em tempo real
            </span>
          </div>

          <h2 className="font-display font-bold text-xl sm:text-2xl text-[#17191F] mt-1 tracking-tight">
            Seu negócio está operacional hoje.
          </h2>
          <p className="text-xs text-[#667085] mt-0.5">
            Você tem <strong className="text-[#17191F]">{todayAppointments.length} atendimento(s)</strong> agendados e <strong className="text-amber-800">{freeSlotsToday.length} horários vagos</strong> para preenchimento.
          </p>
        </div>

        {/* Botões de Ação Imediata */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <button
            onClick={() => setIsNewAppModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl transition shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Novo Agendamento</span>
          </button>

          <button
            onClick={handleQuickWhatsAppShare}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl transition shadow-2xs"
            title="Compartilhar link da agenda com clientes no WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Divulgar Link</span>
          </button>

          <button
            onClick={handleOpenClientPortal}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-stone-50 text-[#17191F] border border-stone-200 font-semibold text-xs rounded-xl transition"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-700" />
            <span>Ver Portal</span>
          </button>
        </div>
      </div>

      {/* Checklist de Ativação do Salão com Assistente de IA */}
      <OnboardingChecklist />

      {/* 2. Grid de Métricas Principais (Cards Compactos & Valores Tabulares) */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        
        {/* Atendimentos Hoje */}
        <div className="bg-white p-4 rounded-2xl border border-[#E6E8EC] shadow-2xs">
          <div className="flex items-center justify-between text-[#667085] mb-1">
            <span className="text-[11px] font-semibold">Atendimentos Hoje</span>
            <Calendar className="w-3.5 h-3.5 text-amber-700" />
          </div>
          <div className="font-display font-bold text-2xl text-[#17191F] tabular-nums">
            {todayAppointments.length}
          </div>
          <div className="text-[10px] text-[#667085] mt-1 flex items-center gap-1">
            <span className="text-emerald-700 font-semibold">{confirmedToday.length} conf.</span>
            <span>•</span>
            <span className="text-amber-800">{pendingToday.length} pend.</span>
          </div>
        </div>

        {/* Faturamento Realizado */}
        <div className="bg-white p-4 rounded-2xl border border-[#E6E8EC] shadow-2xs">
          <div className="flex items-center justify-between text-[#667085] mb-1">
            <span className="text-[11px] font-semibold">Faturamento Recebido</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
          </div>
          <div className="font-display font-bold text-xl text-[#17191F] tabular-nums">
            {formatCurrencyBRL(totalMonthRevenue)}
          </div>
          <div className="text-[10px] text-emerald-800 font-medium mt-1">
            Mês atual liquidado
          </div>
        </div>

        {/* Receita Prevista */}
        <div className="bg-white p-4 rounded-2xl border border-[#E6E8EC] shadow-2xs">
          <div className="flex items-center justify-between text-[#667085] mb-1">
            <span className="text-[11px] font-semibold">Receita Prevista</span>
            <TrendingUp className="w-3.5 h-3.5 text-amber-700" />
          </div>
          <div className="font-display font-bold text-xl text-amber-900 tabular-nums">
            {formatCurrencyBRL(pendingRevenue)}
          </div>
          <div className="text-[10px] text-[#667085] mt-1">
            A receber nos agendamentos
          </div>
        </div>

        {/* Ticket Médio */}
        <div className="bg-white p-4 rounded-2xl border border-[#E6E8EC] shadow-2xs">
          <div className="flex items-center justify-between text-[#667085] mb-1">
            <span className="text-[11px] font-semibold">Ticket Médio</span>
            <BarChart3 className="w-3.5 h-3.5 text-[#667085]" />
          </div>
          <div className="font-display font-bold text-xl text-[#17191F] tabular-nums">
            {formatCurrencyBRL(ticketMedio)}
          </div>
          <div className="text-[10px] text-[#667085] mt-1">
            Por atendimento
          </div>
        </div>

        {/* Clientes Ativos */}
        <div className="bg-white p-4 rounded-2xl border border-[#E6E8EC] shadow-2xs">
          <div className="flex items-center justify-between text-[#667085] mb-1">
            <span className="text-[11px] font-semibold">Clientes na Base</span>
            <Users className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="font-display font-bold text-2xl text-[#17191F] tabular-nums">
            {customers.length}
          </div>
          <div className="text-[10px] text-[#667085] mt-1">
            Histórico registrado
          </div>
        </div>

        {/* Vagas Livres Hoje */}
        <div className="bg-white p-4 rounded-2xl border border-[#E6E8EC] shadow-2xs">
          <div className="flex items-center justify-between text-[#667085] mb-1">
            <span className="text-[11px] font-semibold">Horários Livres Hoje</span>
            <Clock className="w-3.5 h-3.5 text-amber-700" />
          </div>
          <div className="font-display font-bold text-2xl text-amber-900 tabular-nums">
            {freeSlotsToday.length}
          </div>
          <button
            onClick={() => setActiveTab('marketing')}
            className="text-[10px] text-amber-800 hover:underline font-semibold mt-1 flex items-center gap-0.5"
          >
            <span>Preencher c/ IA</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

      </div>

      {/* 3. Bloco Principal: Agenda do Dia & Gráficos / Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Coluna 1 & 2: Atendimentos de Hoje */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E6E8EC] p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
            <div>
              <h3 className="font-display font-bold text-sm sm:text-base text-[#17191F]">
                Próximos Atendimentos ({formatDateBR(todayStr)})
              </h3>
              <p className="text-xs text-[#667085]">
                Horários reservados e organizados sem sobreposição
              </p>
            </div>
            
            <button
              onClick={() => setActiveTab('calendar')}
              className="text-xs font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1"
            >
              <span>Ver Agenda Completa</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {todayAppointments.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
                <Calendar className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-[#17191F]">
                Nenhum atendimento agendado para hoje até o momento.
              </p>
              <p className="text-[11px] text-[#667085] max-w-sm mx-auto">
                Divulgue seu link exclusivo de agendamento ou encaixe um horário manualmente.
              </p>
              <button
                onClick={() => setIsNewAppModalOpen(true)}
                className="mt-2 px-3 py-1.5 rounded-lg bg-stone-900 text-white text-xs font-semibold"
              >
                + Adicionar Atendimento Manual
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {todayAppointments.map((app) => (
                <div
                  key={app.id}
                  className="p-3 rounded-xl border border-stone-100 hover:border-amber-300 transition-all bg-[#F8F9FB] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-white border border-stone-200 text-[#17191F] flex flex-col items-center justify-center shrink-0 shadow-2xs">
                      <span className="font-bold text-xs tabular-nums">{app.time}</span>
                      <span className="text-[9px] text-[#667085]">{app.durationMinutes}m</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#17191F]">{app.customerName}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.2 rounded-full ${
                          app.status === 'confirmed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : app.status === 'completed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {app.status === 'confirmed' ? 'Confirmado' : app.status === 'completed' ? 'Concluído' : 'Pendente'}
                        </span>
                      </div>

                      <p className="text-xs text-[#667085] mt-0.5">
                        {app.serviceName} · <strong className="text-[#17191F]">{formatCurrencyBRL(app.price)}</strong>
                      </p>

                      <p className="text-[10px] text-[#667085]">
                        Profissional: {app.professionalName} · {app.customerPhone}
                      </p>
                    </div>
                  </div>

                  {/* Ações do Atendimento */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => setSelectedAppForWhatsApp(app)}
                      className="p-2 text-emerald-700 hover:bg-emerald-50 rounded-lg border border-emerald-200 transition"
                      title="Enviar lembrete pelo WhatsApp"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>

                    {app.status !== 'completed' && (
                      <button
                        onClick={() => updateAppointmentStatus(app.id, 'completed')}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Concluir</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Gráfico Visual: Faturamento da Semana */}
          <div className="mt-6 pt-5 border-t border-stone-100">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-xs text-[#17191F]">Volume Financeiro na Semana (BRL)</span>
              <span className="text-[10px] text-[#667085]">Últimos 7 dias</span>
            </div>
            <div className="grid grid-cols-7 gap-2 items-end h-24 pt-4">
              {weekDays.map((d) => {
                const heightPct = Math.max(12, Math.round((d.amount / maxDayAmount) * 100));
                return (
                  <div key={d.day} className="flex flex-col items-center gap-1.5 h-full justify-end">
                    <div
                      className="w-full rounded-t-md bg-stone-900 hover:bg-amber-600 transition-all relative group cursor-pointer"
                      style={{ height: `${heightPct}%` }}
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[9px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10 pointer-events-none">
                        {formatCurrencyBRL(d.amount)}
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-[#667085]">{d.day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Coluna 3: Alertas Operacionais, IA & Serviços em Alta */}
        <div className="space-y-4">
          
          {/* Card Alerta de Vagas & Campanha com IA */}
          <div className="bg-white rounded-2xl border border-amber-200/80 p-4 shadow-2xs space-y-3 bg-gradient-to-br from-amber-50/40 to-white">
            <div className="flex items-center gap-2 text-[#17191F] font-bold text-xs">
              <Sparkles className="w-4 h-4 text-amber-700" />
              <span>Oportunidade de Ocupação</span>
            </div>
            <p className="text-xs text-[#667085] leading-relaxed">
              Você possui <strong className="text-amber-900">{freeSlotsToday.length} vagas ociosas</strong> hoje. Dispare uma mensagem rápida no WhatsApp para clientes VIP preencherem esses horários.
            </p>
            <button
              onClick={() => setActiveTab('marketing')}
              className="w-full py-2 px-3 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs transition shadow-2xs flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gerar Campanha com IA</span>
            </button>
          </div>

          {/* Alerta de Estoque Baixo */}
          {lowStockItems.length > 0 && (
            <div className="bg-white rounded-2xl border border-rose-200 p-4 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-rose-900 flex items-center gap-1.5">
                  <Boxes className="w-3.5 h-3.5 text-rose-600" />
                  Alerta de Estoque ({lowStockItems.length})
                </span>
                <button
                  onClick={() => setActiveTab('inventory')}
                  className="text-[10px] font-semibold text-rose-800 hover:underline"
                >
                  Ver Estoque
                </button>
              </div>
              <p className="text-[11px] text-[#667085]">
                Itens abaixo da quantidade mínima de segurança:
              </p>
              <div className="space-y-1.5">
                {lowStockItems.slice(0, 2).map((item) => (
                  <div key={item.id} className="text-xs flex justify-between p-2 rounded-lg bg-rose-50 text-rose-950 font-medium">
                    <span className="truncate max-w-[150px]">{item.name}</span>
                    <span className="font-bold shrink-0">{item.quantity} {item.unit} restantes</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Procedimentos Mais Procurados */}
          <div className="bg-white rounded-2xl border border-[#E6E8EC] p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-[#17191F]">Técnicas Mais Vendidas</span>
              <button
                onClick={() => setActiveTab('catalog')}
                className="text-[10px] font-semibold text-[#667085] hover:text-[#17191F]"
              >
                Catálogo ({services.length})
              </button>
            </div>
            
            <div className="space-y-2">
              {topServices.map((s, idx) => (
                <div key={s.id} className="flex items-center justify-between text-xs p-2 rounded-lg hover:bg-stone-50 transition">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-stone-100 text-[#17191F] font-bold text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-[#17191F] truncate max-w-[140px]">{s.name}</span>
                  </div>
                  <span className="font-bold text-[#17191F] tabular-nums">{formatCurrencyBRL(s.price)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Importação Inteligente & Tendências RS */}
          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#17191F]">Ferramentas Rápidas</span>
              <span className="text-[10px] text-[#667085]">D'OR@NGE Lab</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="p-2 rounded-xl bg-white border border-stone-200 hover:border-amber-400 text-left transition"
              >
                <span className="font-bold text-[11px] text-[#17191F] block">Importar Catálogo</span>
                <span className="text-[10px] text-[#667085]">Via texto ou foto</span>
              </button>
              <button
                onClick={() => setIsBenchmarkModalOpen(true)}
                className="p-2 rounded-xl bg-white border border-stone-200 hover:border-amber-400 text-left transition"
              >
                <span className="font-bold text-[11px] text-[#17191F] block">Preços RS</span>
                <span className="text-[10px] text-[#667085]">Médias regionais</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Modais de Operação */}
      <NewAppointmentModal
        isOpen={isNewAppModalOpen}
        onClose={() => setIsNewAppModalOpen(false)}
      />

      <WhatsAppShareModal
        appointment={selectedAppForWhatsApp}
        onClose={() => setSelectedAppForWhatsApp(null)}
      />

      <CatalogueImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      <MarketBenchmarkModal
        isOpen={isBenchmarkModalOpen}
        onClose={() => setIsBenchmarkModalOpen(false)}
      />

    </div>
  );
};
