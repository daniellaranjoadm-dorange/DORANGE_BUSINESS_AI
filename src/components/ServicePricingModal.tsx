import React, { useState } from "react";
import { X, Calculator } from "lucide-react";
import { calculateServicePrice, PricingInputs } from "../utils/servicePricing";
import { formatCurrencyBRL } from "../utils/validators";
export const MarketBenchmarkModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const [values, setValues] = useState<Record<keyof PricingInputs, string>>({
    materials: "",
    durationMinutes: "",
    overheadPerHour: "",
    laborPerHour: "",
    feesPercent: "",
    commissionPercent: "",
    marginPercent: "",
  });
  if (!isOpen) return null;
  const complete = Object.values(values).every((v) => v.trim() !== "");
  let result: ReturnType<typeof calculateServicePrice> | null = null;
  let error = "";
  if (complete) {
    try {
      result = calculateServicePrice(
        Object.fromEntries(
          Object.entries(values).map(([k, v]) => [k, Number(v)]),
        ) as unknown as PricingInputs,
      );
    } catch (e: any) {
      error = e.message;
    }
  }
  const fields: [keyof PricingInputs, string, string][] = [
    [
      "materials",
      "Materiais por atendimento (R$)",
      "O que será consumido neste serviço",
    ],
    ["durationMinutes", "Tempo total (min)", "Inclua preparo e organização"],
    [
      "overheadPerHour",
      "Estrutura por hora (R$)",
      "Parcela de aluguel, energia e despesas",
    ],
    [
      "laborPerHour",
      "Remuneração por hora (R$)",
      "Quanto vale a hora de trabalho",
    ],
    [
      "feesPercent",
      "Taxas e tributos (%)",
      "Percentual incidente sobre a venda",
    ],
    [
      "commissionPercent",
      "Comissão sobre a venda (%)",
      "Use zero se não houver comissão",
    ],
    ["marginPercent", "Margem desejada (%)", "Após os custos informados"],
  ];
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pricing-title"
      className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-3"
    >
      <div className="max-w-2xl w-full max-h-[90dvh] overflow-y-auto bg-white rounded-3xl p-5 sm:p-7">
        <div className="flex justify-between items-start gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-stone-500">
              Custos antes de descontos
            </p>
            <h2
              id="pricing-title"
              className="text-xl font-semibold mt-1 flex items-center gap-2"
            >
              <Calculator size={21} />
              Simule o preço do seu serviço
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar simulador de preço"
            className="p-2"
          >
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-stone-600 mt-4 mb-5">
          Use seus próprios números para enxergar um preço que cubra materiais,
          tempo e estrutura. Não é pesquisa de mercado nem promessa de lucro. O
          catálogo só muda se você editar e salvar o serviço.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {fields.map(([key, label, hint]) => (
            <label key={key} className="text-sm font-medium">
              {label}
              <input
                aria-label={label}
                type="number"
                min={key === "durationMinutes" ? 5 : 0}
                step={key === "durationMinutes" ? 1 : 0.01}
                value={values[key]}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [key]: e.target.value }))
                }
                className="w-full block rounded-xl border border-stone-300 p-3 mt-1.5"
              />
              <span className="block text-xs font-normal text-stone-500 mt-1">
                {hint}
              </span>
            </label>
          ))}
        </div>
        <div aria-live="polite" className="brand-soft rounded-2xl p-5 mt-6">
          {error ? (
            <p className="text-sm text-rose-800">{error}</p>
          ) : result ? (
            <>
              <p className="text-sm font-semibold">
                Preço calculado com os dados informados
              </p>
              <p className="text-3xl font-display font-semibold my-2">
                {formatCurrencyBRL(result.price)}
              </p>
              <p className="text-xs text-stone-600">
                Custo e remuneração considerados:{" "}
                {formatCurrencyBRL(result.directCost)}. Resultado estimado após
                os custos: {formatCurrencyBRL(result.contribution)} por
                atendimento.
              </p>
            </>
          ) : (
            <p className="text-sm">
              Preencha todos os campos. Se um custo ou taxa não existir, informe
              zero.
            </p>
          )}
        </div>
        <p className="text-xs text-stone-500 mt-3">
          Cálculo local, sem consumir créditos de IA. Evite contar a mesma
          remuneração no valor por hora e na comissão.
        </p>
      </div>
    </div>
  );
};
