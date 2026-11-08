import { authenticatedFetch } from "../utils/authenticatedFetch";
import React, { useRef, useState } from "react";
import {
  parseFinancialCommand,
  type FinancialCommandDraft,
} from "../utils/aiFinancialCommands";
import AiFinancialPreview from "./AiFinancialPreview";
import { useApp, AppTab } from "../context/AppContext";
import { Send, ArrowUpRight, LoaderCircle, Sparkles } from "lucide-react";
import { MarketBenchmarkModal } from "./MarketBenchmarkModal";
export function AiAssistantView() {
  const { currentTenant, currentSegment, setActiveTab, syncAiFinancialTransaction } = useApp();
  const [messages, setMessages] = useState<
    {
      role: "user" | "assistant";
      text: string;
      action?: string;
      source?: string;
    }[]
  >([
    {
      role: "assistant",
      text: `Olá! Vamos cuidar dos próximos passos de ${currentTenant?.tradeName || "seu negócio"}? Posso ajudar com agenda, insumos, recebimentos e preços. O modo econômico funciona com regras locais, sem usar IA externa.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [external, setExternal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pricing, setPricing] = useState(false);
  const [pendingFinancialDraft, setPendingFinancialDraft] =
    useState<FinancialCommandDraft | null>(null);
  const [financialKey, setFinancialKey] = useState("");
  const [financialOperationDate, setFinancialOperationDate] = useState("");
  const [financialSaving, setFinancialSaving] = useState(false);
  const [financialError, setFinancialError] = useState("");
  const financialLock = useRef(false);

  const confirmFinancial = async () => {
    if (
      financialLock.current ||
      !pendingFinancialDraft ||
      !financialKey
    ) return;

    if (!currentTenant?.id) {
      setFinancialError("Selecione uma empresa antes de confirmar.");
      return;
    }

    financialLock.current = true;
    setFinancialSaving(true);
    setFinancialError("");

    const draft = pendingFinancialDraft;
    const tenantId = currentTenant.id;
    const key = financialKey;
    const date = financialOperationDate;

    try {
      const response = await authenticatedFetch(
        "/api/ai/financial/confirm",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId,
            type: draft.type,
            description: draft.description,
            amount: draft.amount,
            date: draft.date || date,
            operationKey: key,
          }),
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const fallback: Record<number, string> = {
          400: "Dados financeiros invalidos. Revise o lancamento.",
          401: "Sessao expirada. Entre novamente.",
          403: "Sem permissao para registrar nesta empresa.",
          409: "Conflito: esta chave pertence a outro lancamento.",
        };

        throw new Error(
          fallback[response.status] ||
          result.error ||
          "Nao foi possivel confirmar. Tente novamente."
        );
      }

      if (
        (response.status !== 200 && response.status !== 201) ||
        result.success !== true ||
        !result.transaction ||
        result.transaction.tenantId !== tenantId
      ) {
        throw new Error(
          "Resposta financeira inesperada. Confira o financeiro antes de tentar novamente."
        );
      }

      syncAiFinancialTransaction(result.transaction);
      setPendingFinancialDraft(null);
      setFinancialKey("");
      setFinancialOperationDate("");

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text:
            (result.created
              ? "Lancamento financeiro registrado com sucesso."
              : "Lancamento ja registrado anteriormente.") +
            "\nTipo: " +
            (draft.type === "expense" ? "Despesa" : "Receita") +
            "\nDescricao: " +
            draft.description +
            "\nValor: " +
            new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(draft.amount) +
            "\nSituacao: " +
            result.transaction.status +
            "\nIdentificador: " +
            result.transaction.id,
          source: "local",
        },
      ]);
    } catch (error) {
      setFinancialError(
        error instanceof Error
          ? error.message
          : "Falha de comunicacao. Confira o financeiro antes de tentar novamente."
      );
    } finally {
      financialLock.current = false;
      setFinancialSaving(false);
    }
  };

  const send = async (text = input) => {
    if (busy || financialLock.current || !text.trim()) return;

    const financialDraft = parseFinancialCommand(text);

    if (financialDraft) {
      setInput("");
      setPendingFinancialDraft(financialDraft);
      const operationNow = new Date();
      setFinancialOperationDate([
        operationNow.getFullYear(),
        String(operationNow.getMonth() + 1).padStart(2, "0"),
        String(operationNow.getDate()).padStart(2, "0"),
      ].join("-"));
      setFinancialKey(
        "ai_fin_" + crypto.randomUUID().replace(/-/g, "")
      );
      setFinancialError("");

      setMessages((prev) => [
        ...prev,
        { role: "user", text },
        {
          role: "assistant",
          text:
            "Identifiquei uma solicitação financeira. " +
            "Confira a prévia abaixo. " +
            "Nenhum lançamento será gravado nesta etapa.",
          source: "local",
        },
      ]);

      return;
    }

    setInput("");
    setBusy(true);
    setMessages((prev) => [...prev, { role: "user", text }]);
    try {
      const response = await authenticatedFetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: currentTenant?.id,
          message: text,
          useAI: external,
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw Error(data.error || "Não foi possível responder.");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.content,
          action: data.suggestedAction,
          source: data.source,
        },
      ]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text:
            e.message ||
            "Não foi possível responder. Use os atalhos do painel.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  };
  const open = (action: string) => {
    if (action === "pricing") setPricing(true);
    else if (
      ["calendar", "inventory", "financial", "marketing", "dashboard"].includes(
        action,
      )
    )
      setActiveTab(action as AppTab);
  };
  return (
    <section className="max-w-4xl mx-auto space-y-4">
      <div className="rounded-3xl bg-white border border-stone-200 p-5 sm:p-6">
        <p className="text-xs uppercase tracking-widest text-stone-500">
          {currentSegment.name}
        </p>
        <h1 className="text-2xl font-display font-semibold mt-1 flex items-center gap-2">
          <Sparkles size={22} />
          Assistente do seu negócio
        </h1>
        <p className="text-sm text-stone-600 mt-2">
          Orientação prática, com revisão humana. O chat não cria agendamentos,
          não envia mensagens e não movimenta dinheiro.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {[
          "O que revisar na agenda?",
          "Quais insumos precisam de reposição?",
          "Como calcular meu preço?",
          "Quais recebimentos revisar?",
        ].map((prompt) => (
          <button
            disabled={busy}
            key={prompt}
            onClick={() => send(prompt)}
            className="bg-white border border-stone-200 rounded-full px-3 py-2 text-xs hover:border-stone-500"
          >
            {prompt}
          </button>
        ))}
      </div>
      <div
        role="log"
        aria-label="Conversa com o assistente"
        className="space-y-4 max-h-[55vh] overflow-y-auto p-1"
      >
        {messages.map((message, i) => (
          <article
            key={i}
            className={`rounded-2xl p-4 text-sm leading-relaxed whitespace-pre-wrap max-w-[95%] sm:max-w-[85%] ${message.role === "user" ? "brand-button ml-auto" : "bg-white border border-stone-200"}`}
          >
            <p>{message.text}</p>
            {message.action && (
              <button
                onClick={() => open(message.action!)}
                className="flex items-center gap-1 font-semibold text-xs underline underline-offset-4 mt-3"
              >
                {message.action === "pricing"
                  ? "Abrir simulador de preço"
                  : "Abrir módulo correspondente"}
                <ArrowUpRight size={14} />
              </button>
            )}
            {message.source && (
              <p className="text-[10px] text-stone-500 mt-3">
                {message.source === "local"
                  ? "Modo econômico · sem IA externa"
                  : "Resposta de IA externa · confira as informações"}
              </p>
            )}
          </article>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="bg-white border border-stone-200 rounded-2xl p-4 space-y-3"
      >
        <label className="flex gap-2 items-start text-xs text-stone-600">
          <input
            type="checkbox"
            checked={external}
            onChange={(e) => setExternal(e.target.checked)}
          />
          <span>
            Usar IA externa nesta mensagem. Pode gerar cobrança e enviará o
            texto digitado e um resumo comercial ao provedor configurado. Não
            informe dados pessoais de clientes.
          </span>
        </label>
        <div className="flex gap-2">
          <label className="sr-only" htmlFor="assistant-message">
            Sua mensagem
          </label>
          <textarea
            id="assistant-message"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={4000}
            rows={2}
            placeholder="O que você precisa resolver agora?"
            className="border border-stone-300 rounded-xl p-3 w-full text-sm"
          />
          <button
            aria-label="Enviar mensagem"
            disabled={busy || !input.trim()}
            className="brand-button rounded-xl px-4 disabled:opacity-40"
          >
            {busy ? (
              <LoaderCircle size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
      </form>
      {pendingFinancialDraft && (
        <AiFinancialPreview
          draft={pendingFinancialDraft}
          onConfirm={confirmFinancial}
          saving={financialSaving}
          error={financialError}
          onCancel={() => {
            if (financialLock.current) return;
            setPendingFinancialDraft(null);
            setFinancialKey("");
      setFinancialOperationDate("");
            setFinancialError("");

            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                text: "Operação financeira cancelada. Nenhum dado foi gravado.",
                source: "local",
              },
            ]);
          }}
        />
      )}
      <MarketBenchmarkModal
        isOpen={pricing}
        onClose={() => setPricing(false)}
      />
    </section>
  );
}
