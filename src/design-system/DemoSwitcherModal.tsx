import React from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { X, Building2, UserCheck, ShieldAlert, Check, PlusCircle } from 'lucide-react';

interface DemoSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoSwitcherModal: React.FC<DemoSwitcherModalProps> = ({ isOpen, onClose }) => {
  const { 
    tenants, 
    currentTenant, 
    switchTenant, 
    currentUser, 
    loginAsRole, 
    setIsOnboardingOpen 
  } = useApp();

  if (!isOpen) return null;

  const roles: { id: UserRole; title: string; desc: string; icon: string }[] = [
    { id: 'owner', title: 'Proprietária do Salão', desc: 'Acesso completo ao estúdio, finanças e configurações', icon: '👑' },
    { id: 'superadmin', title: 'Super Admin D’OR@NGE', desc: 'Visão corporativa global de todos os salões e MRR', icon: '⚡' },
    { id: 'manager', title: 'Gerente da Unidade', desc: 'Operação da agenda, estoque e equipe', icon: '💼' },
    { id: 'professional', title: 'Nail Designer', desc: 'Visualização da própria agenda e comissões', icon: '💅' },
    { id: 'customer', title: 'Cliente Final', desc: 'Histórico pessoal e pontos de fidelidade', icon: '🌸' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-stone-900 text-white flex items-center justify-center text-xs font-bold">
              🛠️
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 font-display">
                Minha conta e estabelecimentos
              </h3>
              <p className="text-[11px] text-stone-700">
                Acesse os estabelecimentos autorizados para sua conta
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          
          {/* Seção 1: Salão / Tenant Ativo */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-600" />
                Salão Selecionado (Multi-tenant)
              </span>
              <button
                onClick={() => {
                  onClose();
                  setIsOnboardingOpen(true);
                }}
                className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
              >
                <PlusCircle className="w-3 h-3" />
                Cadastrar Novo Salão
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {tenants.map((t) => {
                const isSelected = currentTenant?.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      switchTenant(t.id);
                    }}
                    className={`w-full p-3 rounded-2xl border text-left transition flex items-center justify-between ${
                      isSelected
                        ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                        : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-900'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs flex items-center gap-2">
                        <span>{t.tradeName}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'
                        }`}>
                          /{t.slug}
                        </span>
                      </div>
                      <p className={`text-[11px] mt-0.5 ${isSelected ? 'text-stone-300' : 'text-stone-700'}`}>
                        {t.city} - {t.state} · {t.name}
                      </p>
                    </div>

                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seção 2: Papel de Usuário / RBAC */}
          <div>
            <span className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <UserCheck className="w-3.5 h-3.5 text-stone-700" />
              Simular Papel de Acesso (RBAC)
            </span>

            <div className="grid grid-cols-1 gap-2">
              {roles.filter(role=>role.id===currentUser?.role).map((r) => {
                const isCurrent = currentUser?.role === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => {
                      loginAsRole(r.id);
                    }}
                    className={`p-3 rounded-2xl border text-left transition flex items-center justify-between ${
                      isCurrent
                        ? 'border-amber-600 bg-amber-50/50 text-stone-900 ring-1 ring-amber-600'
                        : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{r.icon}</span>
                      <div>
                        <div className="font-bold text-xs">{r.title}</div>
                        <p className="text-[11px] text-stone-700">{r.desc}</p>
                      </div>
                    </div>

                    {isCurrent && (
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                        Ativo
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-stone-100 rounded-xl text-[11px] text-stone-700 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-stone-700 shrink-0 mt-0.5" />
            <span>
              Este seletor é exclusivo para testes de demonstração. Em produção com autenticação real, os salões e permissões são validados de forma isolada por token e sessão criptografada.
            </span>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition shadow-xs"
          >
            Concluir
          </button>
        </div>

      </div>
    </div>
  );
};
