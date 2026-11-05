import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Calendar, 
  LayoutDashboard, 
  Sparkles, 
  Users, 
  DollarSign, 
  Settings, 
  ExternalLink, 
  PlusCircle, 
  ShieldCheck,
  Package,
  Boxes,
  Megaphone,
  Layers,
  Image as ImageIcon,
  MessageCircle,
  ChevronDown,
  UserCheck
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { UserRole } from '../types';

export const TopBar: React.FC = () => {
  const { 
    currentTenant, 
    tenants, 
    activeTab, 
    setActiveTab, 
    switchTenant, 
    setIsOnboardingOpen,
    setCurrentViewMode,
    setPublicBookingSlug,
    currentUser,
    loginAsRole
  } = useApp();

  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenPublicPortal = () => {
    if (currentTenant) {
      setPublicBookingSlug(currentTenant.slug);
      setCurrentViewMode('public_booking');
    }
  };

  const primaryNavItems = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
    { id: 'calendar', label: 'Agenda', icon: Calendar },
    { id: 'catalog', label: 'Catálogo', icon: Package },
    { id: 'customers', label: 'Clientes', icon: Users },
    { id: 'financial', label: 'Financeiro', icon: DollarSign },
    { id: 'ai-assistant', label: 'Assistente IA', icon: Sparkles },
  ];

  const secondaryNavItems = [
    { id: 'inventory', label: 'Estoque de Materiais', icon: Boxes },
    { id: 'marketing', label: 'Central de Marketing AI', icon: Megaphone },
    { id: 'packages', label: 'Pacotes & Assinaturas', icon: Layers },
    { id: 'portfolio', label: 'Portfólio & Galeria', icon: ImageIcon },
    { id: 'whatsapp', label: 'Central WhatsApp', icon: MessageCircle },
    { id: 'settings', label: 'Marca & Horários', icon: Settings },
    { id: 'super-admin', label: 'Admin SaaS White-Label', icon: ShieldCheck },
  ];

  const roleLabels: Record<UserRole, string> = {
    superadmin: 'Super Admin D’OR@NGE',
    owner: 'Proprietário(a)',
    manager: 'Gerente da Unidade',
    professional: 'Profissional',
    customer: 'Cliente Final'
  };

  const isSecondaryActive = secondaryNavItems.some(item => item.id === activeTab);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 via-rose-500 to-amber-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
              D’O
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-stone-900 text-lg tracking-tight leading-none whitespace-nowrap shrink-0">
                D'OR@NGE <span className="text-amber-600 font-semibold text-xs tracking-wider">BUSINESS AI</span>
              </span>
              {currentTenant && (
                <span className="text-xs text-stone-700 font-medium truncate max-w-[170px]">
                  {currentTenant.tradeName}
                </span>
              )}
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold text-stone-600">
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`flex items-center gap-1.5 py-1.5 transition-colors whitespace-nowrap shrink-0 ${
                    isActive 
                      ? 'text-stone-900 font-bold border-b-2 border-amber-600' 
                      : 'text-stone-700 hover:text-stone-900'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-600' : 'text-stone-600'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Menu "Mais Módulos" Dropdown */}
            <div className="relative" ref={moreMenuRef}>
              <button
                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                className={`flex items-center gap-1 py-1.5 transition-colors whitespace-nowrap shrink-0 ${
                  isSecondaryActive 
                    ? 'text-amber-600 font-bold border-b-2 border-amber-600' 
                    : 'text-stone-700 hover:text-stone-900'
                }`}
              >
                <span>Módulos</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {isMoreMenuOpen && (
                <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white shadow-2xl border border-stone-200 py-2 z-50 animate-fade-in">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-stone-700 tracking-wider">
                    Operação Avançada
                  </div>
                  {secondaryNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id as any);
                          setIsMoreMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-left transition ${
                          isActive 
                            ? 'bg-amber-50 text-amber-900 font-semibold' 
                            : 'text-stone-700 hover:bg-stone-100 hover:text-stone-900'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600' : 'text-stone-600'}`} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Zone 3: Controls, Tenant Switcher, Role Tester & PWA */}
          <div className="flex items-center gap-2 shrink-0">
            {/* PWA Install Button */}
            <PWAInstallButton />

            {/* Seletor de Perfis / Roles (Auditoria LGPD & Multi-Role) */}
            <div className="hidden md:flex items-center">
              <select
                aria-label="Alternar papel de usuário para teste"
                value={currentUser?.role || 'owner'}
                onChange={(e) => loginAsRole(e.target.value as UserRole)}
                className="text-[11px] font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg px-2 py-1.5 border border-stone-300 outline-none cursor-pointer"
                title="Alternar Papel de Acesso (RBAC)"
              >
                <option value="owner">Perfil: Proprietária</option>
                <option value="superadmin">Perfil: Super Admin</option>
                <option value="manager">Perfil: Gerente</option>
                <option value="professional">Perfil: Profissional</option>
                <option value="customer">Perfil: Cliente</option>
              </select>
            </div>

            {/* Seletor Multi-tenant */}
            <div className="relative">
              <select
                aria-label="Selecionar Salão ou Profissional"
                value={currentTenant?.id || ''}
                onChange={(e) => switchTenant(e.target.value)}
                className="text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg px-2.5 py-1.5 border border-stone-200 outline-none cursor-pointer pr-6 appearance-none max-w-[130px] sm:max-w-[170px] truncate"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.tradeName}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-stone-500 text-xs">
                ▼
              </div>
            </div>

            {/* Botão Novo Salão / Onboarding */}
            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
              title="Cadastrar nova profissional ou salão"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Novo Salão</span>
            </button>

            {/* Link para o Portal da Cliente da empresa atual */}
            <button
              onClick={handleOpenPublicPortal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-all whitespace-nowrap shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Portal da Cliente</span>
              <span className="sm:hidden">Portal</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
