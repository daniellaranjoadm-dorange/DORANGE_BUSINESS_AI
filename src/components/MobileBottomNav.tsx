import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard,
  ChartNoAxesCombined,
  Calendar, 
  Users, 
  Megaphone, 
  MoreHorizontal,
  Package, 
  Boxes, 
  Layers, 
  DollarSign, 
  Image as ImageIcon,
  MessageCircle, 
  Sparkles, 
  Settings, 
  ShieldCheck, 
  X,
  ExternalLink
} from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    currentTenant,
    currentUser, 
    setCurrentViewMode, 
    setPublicBookingSlug 
  } = useApp();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // 5 botões principais conforme Seção 6: Início, Agenda, Clientes, Marketing, Mais
  const mainTabs = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
    { id: 'calendar', label: 'Agenda', icon: Calendar },
    { id: 'customers', label: 'Clientes', icon: Users },
    { id: 'marketing', label: 'Marketing', icon: Megaphone },
  ];

  const moreTabs = [
    { id: 'catalog', label: 'Catálogo de Serviços', icon: Package },
    { id: 'financial', label: 'Financeiro & Comissões', icon: DollarSign },
    { id: 'intelligence-bi', label: 'Intelligence BI', icon: ChartNoAxesCombined },
    { id: 'inventory', label: 'Estoque de Insumos', icon: Boxes },
    { id: 'packages', label: 'Pacotes & Assinaturas', icon: Layers },
    { id: 'portfolio', label: 'Portfólio de Trabalhos', icon: ImageIcon },
    { id: 'whatsapp', label: 'Central WhatsApp', icon: MessageCircle },
    { id: 'ai-assistant', label: 'Assistente IA', icon: Sparkles },
    { id: 'settings', label: 'Marca & Horários', icon: Settings },
    { id: 'super-admin', label: 'Super Admin SaaS', icon: ShieldCheck },
  ];

  const handleOpenClientPortal = () => {
    if (currentTenant) {
      setPublicBookingSlug(currentTenant.slug);
      setCurrentViewMode('public_booking');
      setIsDrawerOpen(false);
    }
  };

  return (
    <>
      {/* Menu Gaveta Expandido */}
      {isDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-t-3xl p-5 shadow-2xl border-t border-[#E6E8EC] max-h-[80vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E8EC] mb-4">
              <div>
                <h3 className="font-display font-bold text-[#17191F] text-sm">
                  {currentTenant?.tradeName}
                </h3>
                <p className="text-[11px] text-[#667085]">Todos os Módulos do Sistema</p>
              </div>
              <button 
                aria-label="Fechar menu" onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Atalho Portal da Cliente */}
            <button
              onClick={handleOpenClientPortal}
              className="w-full mb-3 p-3 rounded-2xl bg-stone-900 text-white flex items-center justify-between text-xs font-semibold shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-amber-400" />
                <span>Abrir Portal da Cliente</span>
              </div>
              <span className="text-[10px] text-stone-300">dorange.ai/{currentTenant?.slug}</span>
            </button>

            {/* Grid dos Demais Módulos */}
            <div className="grid grid-cols-2 gap-2">
              {moreTabs.filter(item => item.id !== 'super-admin' || currentUser?.role === 'superadmin').map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as any);
                      setIsDrawerOpen(false);
                    }}
                    className={`flex items-center gap-2.5 p-3 rounded-2xl text-xs font-semibold text-left transition ${
                      isActive 
                        ? 'bg-stone-900 text-white' 
                        : 'bg-[#F8F9FB] hover:bg-stone-100 text-[#17191F] border border-[#E6E8EC]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-[#667085]'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-[#E6E8EC] text-center">
              <span className="text-[10px] text-[#667085]">
                Tecnologia White-Label por D'OR@NGE BUSINESS AI
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Barra de Navegação Inferior (Fixa no Mobile) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E6E8EC] px-2 py-1 safe-bottom shadow-lg">
        <div className="flex items-center justify-around">
          {mainTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition ${
                  isActive 
                    ? 'text-stone-900 font-bold' 
                    : 'text-[#667085] hover:text-[#17191F]'
                }`}
              >
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-amber-700' : 'text-[#667085]'}`} />
                <span className="text-[10px] tracking-tight">{tab.label}</span>
              </button>
            );
          })}

          <button
            aria-expanded={isDrawerOpen} aria-label="Mais módulos" onClick={() => setIsDrawerOpen(true)}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition ${
              isDrawerOpen ? 'text-stone-900 font-bold' : 'text-[#667085] hover:text-[#17191F]'
            }`}
          >
            <MoreHorizontal className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Mais</span>
          </button>
        </div>
      </nav>
    </>
  );
};
