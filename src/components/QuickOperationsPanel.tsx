import React from 'react';
import {
  CalendarDays,
  Wallet,
  Package,
  Bot,
  ArrowUpRight
} from 'lucide-react';

type QuickTab = 'calendar' | 'financial' | 'catalog' | 'ai-assistant';

type Props = {
  onNavigate: (tab: QuickTab) => void;
};

const actions = [
  {
    id: 'calendar',
    title: 'Agenda',
    description: 'Atendimentos e horários',
    icon: CalendarDays
  },
  {
    id: 'financial',
    title: 'Financeiro',
    description: 'Receitas e despesas',
    icon: Wallet
  },
  {
    id: 'catalog',
    title: 'Catálogo',
    description: 'Produtos e serviços',
    icon: Package
  },
  {
    id: 'ai-assistant',
    title: 'Assistente IA',
    description: 'Comandos inteligentes',
    icon: Bot
  }
] as const;

export const QuickOperationsPanel: React.FC<Props> = ({ onNavigate }) => (
  <section
    aria-label="Central de operações"
    className="rounded-2xl border border-[#E6E8EC] bg-white p-5 sm:p-6 shadow-sm"
  >
    <div className="mb-4">
      <h3 className="text-base font-bold text-[#17191F]">
        Central de operações
      </h3>
      <p className="mt-1 text-xs text-[#667085]">
        Acesse rapidamente os principais módulos do negócio.
      </p>
    </div>

    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {actions.map((action) => {
        const Icon = action.icon;

        return (
          <button
            key={action.id}
            type="button"
            onClick={() => onNavigate(action.id)}
            className="group flex min-h-32 flex-col items-start justify-between rounded-xl border border-stone-200 bg-stone-50 p-4 text-left transition hover:border-stone-300 hover:bg-white hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <div className="flex w-full items-center justify-between">
              <Icon className="h-5 w-5 text-stone-700" aria-hidden="true" />
              <ArrowUpRight
                className="h-4 w-4 text-stone-400 transition group-hover:text-stone-800"
                aria-hidden="true"
              />
            </div>

            <div>
              <span className="block text-sm font-bold text-[#17191F]">
                {action.title}
              </span>
              <span className="mt-1 block text-xs text-[#667085]">
                {action.description}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  </section>
);