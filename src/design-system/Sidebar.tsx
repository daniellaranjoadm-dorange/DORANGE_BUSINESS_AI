import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AppTab } from '../context/AppContext';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Image as ImageIcon,
  Package, 
  Layers, 
  DollarSign, 
  Boxes, 
  Megaphone, 
  MessageCircle, 
  Sparkles, 
  Settings, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { DOrangeBrand } from './DOrangeBrand';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenDemoSwitcher: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  onOpenDemoSwitcher,
}) => {
  const { 
    activeTab, 
    setActiveTab, 
    currentTenant, 
    appointments, 
    inventory, 
    setCurrentViewMode,
    setPublicBookingSlug 
  } = useApp();

  // Badges informativos
  const todayStr = new Date().toISOString().split('T')[0];
  const pendingAppointmentsToday = appointments.filter(
    (a) => a.date === todayStr && a.status === 'pending'
  ).length;

  const lowStockCount = inventory.filter(
    (i) => i.quantity <= i.minQuantity
  ).length;

  const navGroups: {
    title: string;
    items: {
      id: AppTab;
      label: string;
      icon: React.ElementType;
      badge?: number | string;
      badgeColor?: string;
    }[];
  }[] = [
    {
      title: 'Operação',
      items: [
        { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
        { 
          id: 'calendar', 
          label: 'Agenda', 
          icon: Calendar,
          badge: pendingAppointmentsToday > 0 ? pendingAppointmentsToday : undefined,
          badgeColor: 'bg-amber-100 text-amber-800'
        },
        { id: 'customers', label: 'Clientes & CRM', icon: Users },
        { id: 'portfolio', label: 'Portfólio', icon: ImageIcon },
      ],
    },
    {
      title: 'Vendas & Catálogo',
      items: [
        { id: 'catalog', label: 'Catálogo de Serviços', icon: Package },
        { id: 'packages', label: 'Pacotes & Assinaturas', icon: Layers },
      ],
    },
    {
      title: 'Gestão',
      items: [
        { id: 'financial', label: 'Financeiro', icon: DollarSign },
        { 
          id: 'inventory', 
          label: 'Estoque', 
          icon: Boxes,
          badge: lowStockCount > 0 ? lowStockCount : undefined,
          badgeColor: 'bg-rose-100 text-rose-800'
        },
      ],
    },
    {
      title: 'Comunicação & IA',
      items: [
        { id: 'marketing', label: 'Marketing AI', icon: Megaphone },
        { id: 'whatsapp', label: 'Central WhatsApp', icon: MessageCircle },
        { id: 'ai-assistant', label: 'Assistente IA', icon: Sparkles },
      ],
    },
    {
      title: 'Sistema',
      items: [
        { id: 'settings', label: 'Marca & Horários', icon: Settings },
        { id: 'super-admin', label: 'Super Admin', icon: ShieldCheck },
      ],
    },
  ];

  const handleOpenClientPortal = () => {
    if (currentTenant) {
      setPublicBookingSlug(currentTenant.slug);
      setCurrentViewMode('public_booking');
    }
  };

  return (
    <aside
      className={`hidden lg:flex flex-col bg-white border-r border-[#E6E8EC] transition-all duration-200 z-30 select-none shrink-0 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Topo da Sidebar: Identidade da Manicure ou D'OR@NGE (se no Super Admin) */}
      <div className="h-16 px-4 border-b border-[#E6E8EC] flex items-center justify-between">
        {!collapsed ? (
          <div className="flex items-center gap-3 overflow-hidden">
            {activeTab === 'super-admin' ? (
              <DOrangeBrand size="sm" showSubtitle={false} />
            ) : (
              <div className="flex items-center gap-2.5 min-w-0">
                {currentTenant?.logoUrl ? (
                  <img
                    src={currentTenant.logoUrl}
                    alt={currentTenant.tradeName}
                    className="w-8 h-8 rounded-lg object-cover border border-stone-200 shrink-0"
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-2xs"
                    style={{ backgroundColor: currentTenant?.primaryColor || '#17191F' }}
                  >
                    {currentTenant?.tradeName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="truncate">
                  <span className="font-display font-bold text-xs text-[#17191F] block truncate leading-tight">
                    {currentTenant?.tradeName}
                  </span>
                  <span className="text-[10px] text-[#667085] truncate block">
                    {currentTenant?.city} · {currentTenant?.state}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mx-auto">
            {currentTenant?.logoUrl ? (
              <img
                src={currentTenant.logoUrl}
                alt={currentTenant.tradeName}
                className="w-8 h-8 rounded-lg object-cover border border-stone-200"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white shadow-2xs"
                style={{ backgroundColor: currentTenant?.primaryColor || '#17191F' }}
                title={currentTenant?.tradeName}
              >
                {currentTenant?.tradeName.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="p-1 rounded-lg text-[#667085] hover:text-[#17191F] hover:bg-stone-100 transition shrink-0"
          title={collapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Lista de Navegação Agrupada */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            {!collapsed && (
              <div className="px-2 text-[10px] uppercase font-bold tracking-wider text-[#667085]/80 mb-1.5">
                {group.title}
              </div>
            )}

            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isSuperAdminTab = item.id === 'super-admin';

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center rounded-xl text-xs font-semibold transition-all group ${
                    collapsed
                      ? 'justify-center p-2.5 my-1'
                      : 'justify-between px-3 py-2'
                  } ${
                    isActive
                      ? isSuperAdminTab
                        ? 'bg-[#17191F] text-white shadow-xs'
                        : 'bg-stone-100 text-[#17191F] font-bold'
                      : isSuperAdminTab
                      ? 'text-[#C5A46D] hover:bg-[#C5A46D]/10 hover:text-[#17191F]'
                      : 'text-[#667085] hover:text-[#17191F] hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive
                          ? isSuperAdminTab
                            ? 'text-[#C5A46D]'
                            : 'text-amber-700'
                          : isSuperAdminTab
                          ? 'text-[#C5A46D]'
                          : 'text-[#667085] group-hover:text-[#17191F]'
                      }`}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {!collapsed && item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full shrink-0 ${
                        item.badgeColor || 'bg-stone-200 text-stone-800'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Ações Inferiores & Rodapé White-Label */}
      <div className="p-3 border-t border-[#E6E8EC] space-y-2 bg-[#F8F9FB]">
        {/* Botão Ver Portal */}
        <button
          onClick={handleOpenClientPortal}
          className={`w-full flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-[#17191F] shadow-2xs transition ${
            collapsed ? 'p-2' : 'px-3 py-2'
          }`}
          title="Abrir página pública de agendamento do estúdio"
        >
          <ExternalLink className="w-3.5 h-3.5 text-amber-700" />
          {!collapsed && <span>Portal da Cliente</span>}
        </button>

        {/* Botão Simulador Demo (Discreto, não intrusivo) */}
        <button
          onClick={onOpenDemoSwitcher}
          className={`w-full flex items-center justify-center gap-1 text-[11px] font-medium text-[#667085] hover:text-[#17191F] transition ${
            collapsed ? 'p-1' : 'px-2 py-1'
          }`}
          title="Alternar salões ou testar papéis RBAC"
        >
          <span>🛠️</span>
          {!collapsed && <span>Alternar Salão / Papel</span>}
        </button>

        {/* Assinatura discreta de tecnologia D'OR@NGE */}
        {!collapsed && (
          <div className="pt-1 text-center">
            <span className="text-[9px] uppercase font-semibold tracking-widest text-[#667085]">
              Tecnologia D'OR@NGE
            </span>
          </div>
        )}
      </div>
    </aside>
  );
};
