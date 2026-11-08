import React, { useState } from 'react';
import {
  Building2,
  LayoutDashboard,
  ShieldCheck,
  Menu,
  X,
  LogOut,
  LockKeyhole,
  CreditCard,
  Layers3,
  ScrollText,
  Settings2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DOrangeBrand } from './DOrangeBrand';
import { SuperAdminView } from '../views/SuperAdminView';
import { PlatformCompaniesView } from '../views/PlatformCompaniesView';
import { PlatformOperationsView } from '../views/PlatformOperationsView';

export const PlatformAdminShell: React.FC = () => {
  const { currentUser, logout } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminSection, setAdminSection] = useState<'overview' | 'companies' | 'plans' | 'segments' | 'audit' | 'settings' | 'support'>('overview');

  if (currentUser?.role !== 'superadmin') {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <p role="alert">Acesso administrativo não autorizado.</p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F7F9] text-[#17191F] lg:flex">
      <aside
        className={
          'bg-[#17191F] text-white lg:w-72 lg:min-h-screen ' +
          (menuOpen ? 'block' : 'hidden lg:block')
        }
      >
        <div className="p-6 border-b border-white/10">
          <DOrangeBrand variant="dark" size="lg" showSubtitle={false} />
          <p className="text-xs text-[#C5A46D] mt-3 uppercase tracking-widest">
            Administração da Plataforma
          </p>
        </div>

        <nav aria-label="Administração da plataforma" className="p-4 space-y-2">
          {([
            { id: 'overview', label: 'Visão Executiva', icon: LayoutDashboard },
            { id: 'companies', label: 'Empresas', icon: Building2 },
            { id: 'plans', label: 'Planos e Assinaturas', icon: CreditCard },
            { id: 'segments', label: 'Modulos e Segmentos', icon: Layers3 },
            { id: 'audit', label: 'Auditoria', icon: ScrollText },
            { id: 'settings', label: 'Configuracoes', icon: Settings2 },
            { id: 'support', label: 'Suporte', icon: LockKeyhole },
          ] as const).map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setAdminSection(item.id);
                  setMenuOpen(false);
                }}
                aria-current={adminSection === item.id ? 'page' : undefined}
                className={
                  'w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-left transition-colors ' +
                  (adminSection === item.id
                    ? 'bg-[#C5A46D] text-[#17191F] font-semibold'
                    : 'text-white/70 hover:bg-white/10 hover:text-white')
                }
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 lg:mt-8">
          <button
            type="button"
            onClick={() => void logout()}
            className="flex items-center gap-2 text-sm text-white/80 hover:text-white px-4 py-3"
          >
            <LogOut size={18} />
            Encerrar sessão
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="bg-white border-b border-[#E6E8EC] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="lg:hidden p-2 rounded-lg border"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div>
              <p className="font-bold text-sm">D’OR@NGE ADMIN</p>
              <p className="text-xs text-[#667085]">
                Console central da plataforma SaaS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold">
            <ShieldCheck size={17} className="text-[#B58A4B]" />
            <span>Superadmin</span>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-[1500px] mx-auto">
          {adminSection === 'overview' && <SuperAdminView />}

          {adminSection === 'companies' && <PlatformCompaniesView />}

          {(['plans', 'segments', 'audit', 'settings'] as const).map(section =>
            adminSection === section ? (
              <PlatformOperationsView key={section} section={section} />
            ) : null
          )}

          {adminSection === 'support' && (
            <section className="bg-white border rounded-2xl p-8 space-y-4">
              <div className="flex items-center gap-3">
                <LockKeyhole size={24} className="text-[#B58A4B]" />
                <h1 className="text-xl font-bold">Central de Suporte</h1>
              </div>
              <p className="text-sm text-[#667085]">
                Área reservada ao atendimento das empresas cadastradas.
              </p>
              <div role="status" className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
                O acesso assistido às empresas permanece bloqueado.
                A ativação dependerá de autorização no servidor,
                justificativa e registro de auditoria.
              </div>
              <p className="text-sm text-[#667085]">
                Nenhuma sessão de suporte foi iniciada.
              </p>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};