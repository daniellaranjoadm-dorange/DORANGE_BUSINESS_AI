import { LoginView } from './components/LoginView';
import React, { useState, useEffect } from 'react';
import {getBrandTheme} from './utils/brandTheme';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './design-system/Sidebar';
import { PlatformAdminShell } from './design-system/PlatformAdminShell';
import { SalonHeader } from './design-system/SalonHeader';
import { DemoSwitcherModal } from './design-system/DemoSwitcherModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { OnboardingModal } from './components/OnboardingModal';
import { DashboardView } from './views/DashboardView';













import { OfflineIndicator } from './components/OfflineIndicator';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

const CalendarView=React.lazy(()=>import('./views/CalendarView').then(module=>({default:module.CalendarView})));
const CatalogView=React.lazy(()=>import('./views/CatalogView').then(module=>({default:module.CatalogView})));
const CustomersView=React.lazy(()=>import('./views/CustomersView').then(module=>({default:module.CustomersView})));
const IntelligenceBIView=React.lazy(()=>import('./views/IntelligenceBIView').then(module=>({default:module.IntelligenceBIView})));
const FinancialView=React.lazy(()=>import('./views/FinancialView').then(module=>({default:module.FinancialView})));
const AiAssistantView=React.lazy(()=>import('./views/AiAssistantView').then(module=>({default:module.AiAssistantView})));
const SettingsView=React.lazy(()=>import('./views/SettingsView').then(module=>({default:module.SettingsView})));

const PublicBookingPortal=React.lazy(()=>import('./views/PublicBookingPortal').then(module=>({default:module.PublicBookingPortal})));
const InventoryView=React.lazy(()=>import('./views/InventoryView').then(module=>({default:module.InventoryView})));
const MarketingAiView=React.lazy(()=>import('./views/MarketingAiView').then(module=>({default:module.MarketingAiView})));
const PackagesView=React.lazy(()=>import('./views/PackagesView').then(module=>({default:module.PackagesView})));
const PortfolioView=React.lazy(()=>import('./views/PortfolioView').then(module=>({default:module.PortfolioView})));
const WhatsAppConfigView=React.lazy(()=>import('./views/WhatsAppConfigView').then(module=>({default:module.WhatsAppConfigView})));

const MainAppContent: React.FC = () => {
  const { activeTab, currentViewMode, notification, currentUser, currentTenant, isLoading } = useApp();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState<boolean>(false);
  const [isMobileMenuOpen,setIsMobileMenuOpen]=useState(false);
  useEffect(()=>{if(currentViewMode==='saas')document.title=currentTenant?`${currentTenant.tradeName} | Gestão do negócio`:"D'OR@NGE Business AI";},[currentTenant?.tradeName,currentViewMode]);

  // Se estiver no Portal da Cliente
  if (currentViewMode === 'public_booking') {
    return <React.Suspense fallback={<p role="status" className="p-8">Abrindo sua página de agendamento…</p>}><PublicBookingPortal /></React.Suspense>;
  }

  if(isLoading)return <p className="p-8">Carregando…</p>;
  if(!currentUser)return <LoginView/>;
  if(currentUser.role === 'superadmin') return <PlatformAdminShell />;
  return (
    <div style={getBrandTheme(activeTab==='super-admin'?'#17191F':currentTenant?.primaryColor) as React.CSSProperties} className="tenant-workspace min-h-screen bg-[#F8F9FB] flex text-[#17191F] font-sans selection:bg-stone-200 selection:text-stone-900">

      {/* 1. Sidebar Desktop Recolhível */}
      <Sidebar
        mobileOpen={isMobileMenuOpen}
        onCloseMobile={()=>setIsMobileMenuOpen(false)}
        collapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onOpenDemoSwitcher={() => setIsDemoModalOpen(true)}
      />
      {isMobileMenuOpen&&<button aria-label="Fechar menu de navegação" onClick={()=>setIsMobileMenuOpen(false)} className="lg:hidden fixed inset-0 bg-stone-950/50 z-20"/>}

      {/* 2. Área Central de Trabalho */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">

        {/* Cabeçalho Focado no Salão da Manicure */}
        <SalonHeader
          onOpenMobileMenu={()=>setIsMobileMenuOpen(true)}
          onOpenDemoSwitcher={() => setIsDemoModalOpen(true)}
        />

        {/* Conteúdo Dinâmico da Aba Ativa */}
        <main key={currentTenant?.id} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-10 overflow-x-hidden">
          <React.Suspense fallback={<p role="status" className="p-8 text-sm text-stone-500">Abrindo módulo…</p>}>
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'intelligence-bi' && <IntelligenceBIView />}
          {activeTab === 'calendar' && <CalendarView />}
          {activeTab === 'catalog' && <CatalogView />}
          {activeTab === 'customers' && <CustomersView />}
          {activeTab === 'inventory' && <InventoryView />}
          {activeTab === 'marketing' && <MarketingAiView />}
          {activeTab === 'packages' && <PackagesView />}
          {activeTab === 'portfolio' && <PortfolioView />}
          {activeTab === 'financial' && <FinancialView />}
          {activeTab === 'whatsapp' && <WhatsAppConfigView />}
          {activeTab === 'ai-assistant' && <AiAssistantView />}
          {activeTab === 'settings' && <SettingsView />}

          </React.Suspense>
        </main>
      </div>

      {/* 3. Navegação Mobile Inferior */}
      <MobileBottomNav />

      {/* 4. Modais do Sistema */}
      <OnboardingModal />
      <OfflineIndicator />
      <DemoSwitcherModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
      />

      {/* Toast Notificações */}
      {notification && (
        <div className="fixed bottom-16 sm:bottom-6 right-4 sm:right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold text-white animate-fade-in transition-all bg-[#17191F]/95 backdrop-blur-md border border-stone-700">
          {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {notification.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          {notification.type === 'info' && <Info className="w-4 h-4 text-[#C5A46D] shrink-0" />}
          <span>{notification.message}</span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
