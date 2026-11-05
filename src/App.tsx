import { LoginView } from './components/LoginView';
import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './design-system/Sidebar';
import { SalonHeader } from './design-system/SalonHeader';
import { DemoSwitcherModal } from './design-system/DemoSwitcherModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { OnboardingModal } from './components/OnboardingModal';
import { DashboardView } from './views/DashboardView';
import { CalendarView } from './views/CalendarView';
import { CatalogView } from './views/CatalogView';
import { CustomersView } from './views/CustomersView';
import { FinancialView } from './views/FinancialView';
import { AiAssistantView } from './views/AiAssistantView';
import { SettingsView } from './views/SettingsView';
import { SuperAdminView } from './views/SuperAdminView';
import { PublicBookingPortal } from './views/PublicBookingPortal';
import { InventoryView } from './views/InventoryView';
import { MarketingAiView } from './views/MarketingAiView';
import { PackagesView } from './views/PackagesView';
import { PortfolioView } from './views/PortfolioView';
import { WhatsAppConfigView } from './views/WhatsAppConfigView';
import { OfflineIndicator } from './components/OfflineIndicator';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { activeTab, currentViewMode, notification, currentUser, isLoading } = useApp();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState<boolean>(false);

  // Se estiver no Portal da Cliente
  if (currentViewMode === 'public_booking') {
    return <PublicBookingPortal />;
  }

  if(isLoading)return <p className="p-8">Carregando…</p>;
  if(!currentUser)return <LoginView/>;
  return (
    <div className="min-h-screen bg-[#F8F9FB] flex text-[#17191F] font-sans selection:bg-rose-200 selection:text-rose-900">
      
      {/* 1. Sidebar Desktop Recolhível */}
      <Sidebar
        collapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onOpenDemoSwitcher={() => setIsDemoModalOpen(true)}
      />

      {/* 2. Área Central de Trabalho */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Cabeçalho Focado no Salão da Manicure */}
        <SalonHeader
          onOpenDemoSwitcher={() => setIsDemoModalOpen(true)}
        />

        {/* Conteúdo Dinâmico da Aba Ativa */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-10 overflow-x-hidden">
          {activeTab === 'dashboard' && <DashboardView />}
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
          {activeTab === 'super-admin' && <SuperAdminView />}
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
