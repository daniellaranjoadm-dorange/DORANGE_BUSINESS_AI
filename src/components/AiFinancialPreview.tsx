import React from "react";
import type { FinancialCommandDraft } from "../utils/aiFinancialCommands";

interface Props {
  draft: FinancialCommandDraft;
  onCancel: () => void;
  onConfirm: () => void;
  saving: boolean;
  error: string;
}

export default function AiFinancialPreview({
  draft,
  onCancel,
  onConfirm,
  saving,
  error,
}: Props) {
  const currency = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <section
      role="region"
      aria-label="Prévia do lançamento financeiro"
      className="rounded-xl border border-amber-500/30 bg-zinc-900 p-5 space-y-4"
    >
      <header>
        <h3 className="text-lg font-semibold text-amber-400">
          Prévia do lançamento
        </h3>
        <p className="text-sm text-zinc-400">
          Confira os dados antes de continuar.
          Nenhum lançamento foi gravado nesta etapa.
        </p>
      </header>

      <dl className="space-y-2">
        <div>
          <dt className="text-xs text-zinc-400">Tipo</dt>
          <dd className="font-medium text-white">
            {draft.type === "expense" ? "Despesa" : "Receita"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-400">Valor</dt>
          <dd className="text-xl font-semibold text-white">
            {currency.format(draft.amount)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-400">Descrição</dt>
          <dd className="text-white">{draft.description}</dd>
        </div>
      </dl>

      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={onConfirm}
          className="rounded-lg bg-amber-500 px-4 py-2 font-semibold text-zinc-950 disabled:opacity-50"
        >
          {saving ? "Registrando..." : "Confirmar lançamento"}
        </button>

        <button
          type="button"
          disabled={saving}
          onClick={onCancel}
          className="rounded-lg border border-zinc-600 px-4 py-2 text-white disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    </section>
  );
}