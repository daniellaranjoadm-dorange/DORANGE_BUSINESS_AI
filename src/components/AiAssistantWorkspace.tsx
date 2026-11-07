import React, { useState } from "react";
import { useApp, AppTab } from "../context/AppContext";
import { Send, ArrowUpRight, LoaderCircle, Sparkles } from "lucide-react";
import { MarketBenchmarkModal } from "./MarketBenchmarkModal";
export function AiAssistantView() {
  const { currentTenant, currentSegment, setActiveTab } = useApp();
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
  const send = async (text = input) => {
    if (busy || !text.trim()) return;
    setInput("");
    setBusy(true);
    setMessages((prev) => [...prev, { role: "user", text }]);
    try {
      const response = await fetch("/api/ai/chat", {
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
      <MarketBenchmarkModal
        isOpen={pricing}
        onClose={() => setPricing(false)}
      />
    </section>
  );
}
