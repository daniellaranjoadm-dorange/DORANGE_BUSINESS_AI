import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Bell, 
  HelpCircle, 
  User, 
  Settings, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle,
  Menu,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { DOrangeBrand } from './DOrangeBrand';

interface SalonHeaderProps {
  onOpenMobileMenu?: () => void;
  onOpenDemoSwitcher: () => void;
}

export const SalonHeader: React.FC<SalonHeaderProps> = ({
  onOpenMobileMenu,
  onOpenDemoSwitcher,
}) => {
  const { 
    currentTenant, 
    activeTab, 
    currentUser, 
    setCurrentViewMode, 
    setPublicBookingSlug,
    setActiveTab,
    appointments,
    inventory
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const pendingAppointments = appointments.filter(
    (a) => a.date === todayStr && a.status === 'pending'
  );
  const lowStock = inventory.filter((i) => i.quantity <= i.minQuantity);
  const notificationCount = pendingAppointments.length + (lowStock.length > 0 ? 1 : 0);

  const tabTitles: Record<string, string> = {
    dashboard: 'Visão Geral Operacional',
    calendar: 'Agenda de Atendimentos',
    catalog: 'Catálogo de Serviços',
    customers: 'Gestão de Clientes & CRM',
    financial: 'Fluxo Financeiro & Comissões',
    inventory: 'Estoque de Materiais & Insumos',
    marketing: 'Central de Marketing AI',
    packages: 'Pacotes & Assinaturas',
    portfolio: 'Portfólio & Galeria de Trabalhos',
    whatsapp: 'Central de WhatsApp',
    'ai-assistant': 'Assistente Inteligente D’OR@NGE',
    settings: 'Personalização da Marca & Horários',
    'super-admin': 'Console Administrativo SaaS D’OR@NGE',
  };

  const handleOpenClientPortal = () => {
    if (currentTenant) {
      setPublicBookingSlug(currentTenant.slug);
      setCurrentViewMode('public_booking');
    }
  };

  const isSuperAdmin = activeTab === 'super-admin';

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#E6E8EC] h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
      
      {/* Lado Esquerdo: Marca do Estabelecimento (ou D'OR@NGE corporativo no Super Admin) */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Botão de Menu para Mobile */}
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-[#667085] hover:text-[#17191F] rounded-xl hover:bg-stone-100 transition"
          aria-label="Abrir menu de navegação"
        >
          <Menu className="w-5 h-5" />
        </button>

        {isSuperAdmin ? (
          <div className="flex items-center gap-3">
            <DOrangeBrand size="md" showSubtitle={false} />
            <span className="hidden sm:inline-block text-xs font-semibold text-[#667085] border-l border-stone-200 pl-3">
              Console Global Multi-Tenant
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3 min-w-0">
            {/* Logo do Salão */}
            {currentTenant?.logoUrl ? (
              <img
                src={currentTenant.logoUrl}
                alt={currentTenant.tradeName}
                className="w-9 h-9 rounded-xl object-cover border border-stone-200 shrink-0"
              />
            ) : (
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center font-display font-bold text-sm text-white shrink-0 shadow-2xs"
                style={{ backgroundColor: currentTenant?.primaryColor || '#17191F' }}
              >
                {currentTenant?.tradeName.slice(0, 2).toUpperCase()}
              </div>
            )}

            <div className="truncate">
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-sm sm:text-base text-[#17191F] tracking-tight truncate leading-tight">
                  {currentTenant?.tradeName}
                </h1>
                <span className="hidden sm:inline-flex text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-[#667085] px-2 py-0.5 rounded-md shrink-0">
                  {currentTenant?.city}
                </span>
              </div>
              <p className="text-[11px] text-[#667085] truncate font-medium">
                {tabTitles[activeTab] || 'Painel da Profissional'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Lado Direito: Ações, Notificações, Ajuda, Perfil e Atalho do Portal */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        
        {/* PWA Install */}
        <PWAInstallButton />

        {/* Botão Ver Portal da Cliente */}
        {!isSuperAdmin && (
          <button
            onClick={handleOpenClientPortal}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-2xs transition"
            title="Visualizar a página pública que suas clientes acessam"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
            <span>Portal da Cliente</span>
          </button>
        )}

        {/* Notificações com Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-[#667085] hover:text-[#17191F] hover:bg-stone-100 rounded-xl transition"
            title="Notificações e Avisos"
          >
            <Bell className="w-4 h-4" />
            {notificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-stone-200 p-4 z-50 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100 mb-3">
                <span className="font-bold text-xs text-stone-900">Notificações Operacionais</span>
                <span className="text-[10px] text-stone-700">{notificationCount} pendentes</span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto text-xs">
                {pendingAppointments.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                    <span className="font-bold block">
                      {pendingAppointments.length} agendamento(s) para hoje
                    </span>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Confirme com as clientes para garantir a ocupação do horário.
                    </p>
                  </div>
                )}

                {lowStock.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900">
                    <span className="font-bold block">Alerta de Estoque Baixo</span>
                    <p className="text-[11px] text-rose-800 mt-0.5">
                      {lowStock.length} produto(s) abaixo da quantidade mínima.
                    </p>
                  </div>
                )}

                {notificationCount === 0 && (
                  <p className="text-center py-4 text-stone-700 text-xs">
                    Tudo em dia! Sem alertas operacionais pendentes.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Ajuda / Suporte */}
        <button
          onClick={() => setShowHelpModal(true)}
          className="p-2 text-[#667085] hover:text-[#17191F] hover:bg-stone-100 rounded-xl transition"
          title="Ajuda e Orientações D'OR@NGE"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Configurações */}
        <button
          onClick={() => setActiveTab('settings')}
          className={`p-2 rounded-xl transition ${
            activeTab === 'settings'
              ? 'bg-stone-100 text-[#17191F]'
              : 'text-[#667085] hover:text-[#17191F] hover:bg-stone-100'
          }`}
          title="Configurações do Estúdio"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Perfil do Usuário */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 pl-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 transition"
          >
            <div className="text-left hidden md:block">
              <span className="font-bold text-xs text-[#17191F] block leading-tight">
                {currentUser?.name.split(' ')[0] || 'Responsável'}
              </span>
              <span className="text-[10px] text-[#667085] block capitalize">
                {currentUser?.role === 'owner' ? 'Proprietária' : currentUser?.role}
              </span>
            </div>
            <div className="w-7 h-7 rounded-lg bg-stone-100 text-[#17191F] flex items-center justify-center font-bold text-xs">
              {currentUser?.name.slice(0, 1) || 'J'}
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 z-50 animate-fade-in text-xs">
              <div className="px-3.5 py-2 border-b border-stone-100">
                <span className="font-bold text-stone-900 block">{currentUser?.name}</span>
                <span className="text-[11px] text-stone-700 block truncate">{currentUser?.email}</span>
              </div>

              <button
                onClick={() => {
                  setActiveTab('settings');
                  setShowUserMenu(false);
                }}
                className="w-full px-3.5 py-2 text-left text-stone-700 hover:bg-stone-50 flex items-center gap-2"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Configurações da Conta</span>
              </button>

              <button
                onClick={() => {
                  onOpenDemoSwitcher();
                  setShowUserMenu(false);
                }}
                className="w-full px-3.5 py-2 text-left text-amber-700 hover:bg-amber-50 flex items-center gap-2 font-semibold"
              >
                <span>🛠️</span>
                <span>Simulador Demo / Alternar Salão</span>
              </button>

              <div className="border-t border-stone-100 mt-1 pt-1 px-3.5 py-1.5 text-[10px] text-stone-700">
                Plano: <strong className="text-stone-800 uppercase">{currentTenant?.planId}</strong> · D'OR@NGE v3.0
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Modal de Ajuda Rápida */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-display font-bold text-base text-stone-900">
                Central de Ajuda da Profissional
              </h3>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-stone-600 leading-relaxed">
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                <strong className="text-stone-900 block mb-0.5">Como receber agendamentos?</strong>
                Compartilhe o link do <strong>Portal da Cliente</strong> no seu Instagram e WhatsApp. Suas clientes agendam diretamente sem precisar de aplicativo.
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                <strong className="text-stone-900 block mb-0.5">Como personalizar cores e logo?</strong>
                Acesse a aba <strong>Marca & Horários</strong> na barra lateral para carregar sua logomarca e capa personalizadas.
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                <strong className="text-stone-900 block mb-0.5">Assistente Inteligente:</strong>
                Use a aba <strong>Assistente IA</strong> para criar promoções, calcular comissões e gerar textos para redes sociais.
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 rounded-xl bg-stone-900 text-white font-bold text-xs hover:bg-stone-800 transition"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
