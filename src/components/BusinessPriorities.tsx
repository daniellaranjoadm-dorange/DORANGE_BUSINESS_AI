import React from "react";
import {
  CalendarCheck,
  Wallet,
  PackageCheck,
  History,
  ArrowUpRight,
} from "lucide-react";
import { businessInsights } from "../utils/businessInsights";
import { formatCurrencyBRL } from "../utils/validators";
export function BusinessPriorities({
  insights,
  onConfirm,
  onCalendar,
  onFinancial,
  onInventory,
}: {
  insights: ReturnType<typeof businessInsights>;
  onConfirm: () => void;
  onCalendar: () => void;
  onFinancial: () => void;
  onInventory: () => void;
}) {
  const cards = [
    {
      title: "Confirmar próximos horários",
      value: insights.confirmations.length,
      description: "Pendentes de hoje e amanhã",
      button: "Preparar confirmação",
      icon: CalendarCheck,
      action: onConfirm,
      empty: "Sem confirmações pendentes",
      count: insights.confirmations.length,
    },
    {
      title: "Recebimentos para revisar",
      value: formatCurrencyBRL(insights.receivableAmount),
      description: `${insights.receivables.length} lançamento(s) pendente(s), vencidos ou para hoje`,
      button: "Abrir financeiro",
      icon: Wallet,
      action: onFinancial,
      empty: "Sem recebimentos pendentes até hoje",
      count: insights.receivables.length,
    },
    {
      title: "Atendimentos sem desfecho",
      value: insights.unresolved.length,
      description: "Datas anteriores ainda pendentes ou confirmadas",
      button: "Revisar na agenda",
      icon: History,
      action: onCalendar,
      empty: "Histórico de atendimentos em dia",
      count: insights.unresolved.length,
    },
    {
      title: "Reposição de insumos",
      value: insights.lowStock.length,
      description: "Itens no mínimo ou abaixo dele",
      button: "Conferir estoque",
      icon: PackageCheck,
      action: onInventory,
      empty: "Nenhum item no limite de reposição",
      count: insights.lowStock.length,
    },
  ];
  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[.2em] text-stone-500 font-semibold">
            Menos procura. Mais ação.
          </p>
          <h3 className="text-lg font-display font-semibold mt-1">
            O que merece sua atenção
          </h3>
        </div>
        <span className="text-xs text-stone-500">
          Sugestões a partir dos seus registros
        </span>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`rounded-2xl p-3 sm:p-4 border flex flex-col ${card.count ? "border-stone-200 bg-[#faf9f6]" : "border-stone-100 bg-white"}`}
          >
            <card.icon size={18} className="text-stone-600 mb-3" />
            <p className="text-xs text-stone-600 font-medium">{card.title}</p>
            <p className="text-xl sm:text-2xl font-display font-semibold mt-1 tabular-nums">
              {card.value}
            </p>
            <p className="text-xs text-stone-500 mt-2 mb-4 leading-relaxed">
              {card.count ? card.description : card.empty}
            </p>
            <button
              onClick={card.action}
              className="mt-auto flex gap-1 items-center text-xs font-semibold text-stone-800 underline underline-offset-4"
            >
              {card.count ? card.button : "Conferir"}
              <ArrowUpRight size={13} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
