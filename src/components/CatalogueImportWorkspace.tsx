import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { X, FileText, Check, LoaderCircle, ArrowLeft } from "lucide-react";
import {
  parseCatalogueText,
  isImportItemValid,
  ImportItem,
} from "../utils/catalogueImport";
export const CatalogueImportModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const {
    currentTenant,
    currentSegment,
    services,
    refreshData,
    showNotification,
  } = useApp();
  const [text, setText] = useState("");
  const [items, setItems] = useState<ImportItem[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [useAI, setUseAI] = useState(false);
  if (!isOpen) return null;
  const update = (index: number, key: keyof ImportItem, value: any) =>
    setItems((previous) =>
      previous.map((item, i) =>
        i === index ? { ...item, [key]: value } : item,
      ),
    );
  const analyze = async () => {
    setBusy(true);
    setError("");
    try {
      let parsed: ImportItem[];
      if (useAI) {
        const response = await fetch("/api/ai/parse-catalogue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId: currentTenant?.id,
            rawText: text,
            useAI: true,
          }),
        });
        const data = await response.json();
        if (!response.ok)
          throw Error(data.error || "Não foi possível analisar com IA.");
        parsed = data.services;
      } else parsed = parseCatalogueText(text, services);
      if (!parsed.length)
        throw Error(
          "Nenhum serviço encontrado. Use o exemplo e revise o formato.",
        );
      setItems(parsed);
      setSelected(
        parsed.flatMap((item, i) =>
          !item.isDuplicate && isImportItemValid(item) ? [i] : [],
        ),
      );
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const save = async () => {
    setBusy(true);
    setError("");
    try {
      const chosen = selected.map((i) => items[i]);
      if (!chosen.length || chosen.some((i) => !isImportItemValid(i)))
        throw Error("Revise nome, preço e duração dos itens selecionados.");
      const response = await fetch("/api/catalogue/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: currentTenant?.id, items: chosen }),
      });
      const data = await response.json();
      if (!response.ok)
        throw Error(data.error || "A importação não foi concluída.");
      // Commit succeeded. Disable all imported rows before refresh so retry cannot duplicate them.
      setItems((prev) =>
        prev.map((item, i) =>
          selected.includes(i) ? { ...item, isDuplicate: true } : item,
        ),
      );
      setSelected([]);
      showNotification(
        `${data.imported} serviços importados. Defina profissionais e custos no catálogo.`,
        "success",
      );
      try {
        await refreshData();
        onClose();
        setItems([]);
        setText("");
      } catch {
        setError(
          "Itens gravados. Atualize a página para carregar o catálogo; não importe novamente.",
        );
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const sample = () => {
    const s = currentSegment.suggestedServices[0];
    setText(
      `Nome;Categoria;Preço;Duração;Descrição\n${s.name};${s.category};${s.suggestedPriceBRL.toFixed(2).replace(".", ",")};${s.defaultDurationMinutes};Revise preço e escopo`,
    );
  };
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-title"
      className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-3"
    >
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90dvh] flex flex-col overflow-hidden shadow-2xl">
        <header className="p-5 border-b border-stone-100 flex justify-between gap-4">
          <div>
            <p className="text-xs text-stone-500 mb-1">
              CATÁLOGO · {currentSegment.name}
            </p>
            <h2 id="import-title" className="text-xl font-bold">
              Importe uma vez. Revise com clareza.
            </h2>
            <p className="text-sm text-stone-600 mt-1">
              Texto e CSV, com prévia antes de gravar.
            </p>
          </div>
          <button
            disabled={busy}
            onClick={onClose}
            aria-label="Fechar importação"
            className="self-start rounded-lg p-2"
          >
            <X size={20} />
          </button>
        </header>
        <div className="p-5 overflow-y-auto space-y-4">
          {error && (
            <p
              role="alert"
              className="text-sm bg-rose-50 text-rose-800 rounded-xl p-3"
            >
              {error}
            </p>
          )}
          {!items.length ? (
            <>
              <div className="rounded-xl bg-emerald-50 text-emerald-900 p-3 text-sm flex gap-2">
                <FileText size={19} className="shrink-0" />A análise padrão
                funciona neste navegador, sem consumir créditos de IA. Valores
                ausentes ficam para você preencher.
              </div>
              <button
                onClick={sample}
                className="text-sm font-semibold underline underline-offset-4"
              >
                Usar exemplo do meu nicho
              </button>
              <label
                className="block text-sm font-semibold"
                htmlFor="catalogue-text"
              >
                Cole sua lista ou CSV separado por ponto e vírgula
              </label>
              <textarea
                id="catalogue-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
                maxLength={50000}
                className="w-full rounded-xl border border-stone-300 p-3 text-sm font-mono"
                placeholder="Serviço R$ 80,00 (45 min)"
              />
              <label className="flex items-start gap-2 text-sm text-stone-600">
                <input
                  type="checkbox"
                  checked={useAI}
                  onChange={(e) => setUseAI(e.target.checked)}
                  className="mt-1"
                />
                <span>
                  Usar IA externa nesta análise. Opcional: envia o texto ao
                  provedor configurado e pode gerar cobrança. Não inclua dados
                  de clientes.
                </span>
              </label>
            </>
          ) : (
            <>
              <button
                disabled={busy}
                onClick={() => {
                  setItems([]);
                  setSelected([]);
                  setError("");
                }}
                className="flex gap-1 items-center text-sm"
              >
                <ArrowLeft size={16} />
                Voltar ao texto
              </button>
              <p className="text-sm text-stone-600">
                {items.length} itens encontrados. Preencha os campos ausentes.
                Duplicados não serão importados.
              </p>
              {items.map((item, i) => (
                <div
                  key={i}
                  className={`rounded-2xl border p-3 space-y-3 ${item.isDuplicate ? "bg-stone-50 opacity-65" : "border-stone-200"}`}
                >
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <input
                      type="checkbox"
                      disabled={item.isDuplicate || busy}
                      checked={selected.includes(i)}
                      onChange={() =>
                        setSelected((prev) =>
                          prev.includes(i)
                            ? prev.filter((n) => n !== i)
                            : [...prev, i],
                        )
                      }
                    />
                    {item.name}
                    {item.isDuplicate && (
                      <span className="text-xs text-amber-800">
                        Já existe ou repetido na lista
                      </span>
                    )}
                  </label>
                  {!item.isDuplicate && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <label className="text-xs">
                        Nome
                        <input
                          aria-label={`Nome do item ${i + 1}`}
                          value={item.name}
                          maxLength={200}
                          onChange={(e) => update(i, "name", e.target.value)}
                          className="mt-1 border rounded-lg p-2 w-full"
                        />
                      </label>
                      <label className="text-xs">
                        Preço (R$)
                        <input
                          aria-label={`Preço do item ${i + 1}`}
                          type="number"
                          min="0"
                          max="1000000"
                          step="0.01"
                          value={item.price ?? ""}
                          onChange={(e) =>
                            update(
                              i,
                              "price",
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                            )
                          }
                          className="mt-1 border rounded-lg p-2 w-full"
                        />
                      </label>
                      <label className="text-xs">
                        Duração (min)
                        <input
                          aria-label={`Duração do item ${i + 1}`}
                          type="number"
                          min="5"
                          max="720"
                          step="1"
                          value={item.durationMinutes ?? ""}
                          onChange={(e) =>
                            update(
                              i,
                              "durationMinutes",
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                            )
                          }
                          className="mt-1 border rounded-lg p-2 w-full"
                        />
                      </label>
                    </div>
                  )}
                  {!isImportItemValid(item) && !item.isDuplicate && (
                    <p className="text-xs text-amber-800">
                      Revisão necessária: informe preço e duração de 5 a 720
                      minutos.
                    </p>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
        <footer className="p-5 border-t border-stone-100 flex justify-end">
          <button
            disabled={
              busy ||
              (!items.length
                ? !text.trim()
                : !selected.length ||
                  selected.some((i) => !isImportItemValid(items[i])))
            }
            onClick={items.length ? save : analyze}
            className="brand-button disabled:opacity-40 px-5 py-3 rounded-xl text-sm font-semibold flex gap-2 items-center"
          >
            {busy ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : (
              <Check size={17} />
            )}{" "}
            {busy
              ? "Processando…"
              : items.length
                ? `Importar ${selected.length} serviços`
                : useAI
                  ? "Analisar com IA externa"
                  : "Analisar sem gastar IA"}
          </button>
        </footer>
      </div>
    </div>
  );
};
