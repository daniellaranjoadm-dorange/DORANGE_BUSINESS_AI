import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { missingInventorySuggestions } from "../data/inventorySuggestions";
import { PackagePlus, ChevronDown, ChevronUp } from "lucide-react";
export function InventoryStarter() {
  const {
    currentTenant,
    currentSegment,
    inventory,
    createInventoryItem,
    showNotification,
  } = useApp();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [values, setValues] = useState<
    Record<string, { quantity: string; minQuantity: string; unitCost: string }>
  >({});
  if (!currentTenant) return null;
  const suggestions = missingInventorySuggestions(
    currentTenant.businessSegment,
    inventory.filter((i) => i.tenantId === currentTenant.id),
  );
  const field = (
    name: string,
    key: "quantity" | "minQuantity" | "unitCost",
    value: string,
  ) =>
    setValues((prev) => ({
      ...prev,
      [name]: {
        ...(prev[name] || { quantity: "0", minQuantity: "0", unitCost: "0" }),
        [key]: value,
      },
    }));
  const save = async () => {
    setBusy(true);
    let created = 0;
    try {
      const chosen = suggestions.filter((s) => selected.includes(s.name));
      const rows = chosen.map((item) => {
        const v = values[item.name] || {
          quantity: "0",
          minQuantity: "0",
          unitCost: "0",
        };
        return {
          ...item,
          quantity: Number(v.quantity),
          minQuantity: Number(v.minQuantity),
          unitCost: Number(v.unitCost),
        };
      });
      if (
        rows.some((r) =>
          [r.quantity, r.minQuantity, r.unitCost].some(
            (n) => !Number.isFinite(n) || n < 0,
          ),
        )
      )
        throw Error("Informe quantidades e custos maiores ou iguais a zero.");
      for (const row of rows) {
        await createInventoryItem(row);
        created++;
        setSelected((prev) => prev.filter((n) => n !== row.name));
      }
      showNotification(
        `${created} itens adicionados ao estoque. Revise os custos e limites de reposição.`,
        "success",
      );
    } catch (e: any) {
      showNotification(
        `${created ? created + " itens já foram salvos. " : ""}${e.message || "Não foi possível concluir."}`,
        "error",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5 space-y-4">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex gap-3 items-center text-left"
      >
        <span className="brand-soft p-2.5 rounded-xl">
          <PackagePlus size={20} />
        </span>
        <span className="flex-1">
          <span className="block font-semibold text-sm">
            Insumos sugeridos para {currentSegment.name}
          </span>
          <span className="text-xs text-stone-500">
            {suggestions.length
              ? `${suggestions.length} sugestões que ainda não estão no seu estoque`
              : "Seu estoque já contém as sugestões deste nicho"}{" "}
            · sem gastar IA
          </span>
        </span>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {open && (
        <>
          <p className="text-xs text-stone-600">
            Escolha o que você realmente usa. Informe seu estoque, o mínimo para
            reposição e o custo real por unidade. Nenhuma compra ou cadastro
            acontece sem sua confirmação.
          </p>
          <div className="space-y-3">
            {suggestions.map((s) => {
              const v = values[s.name] || {
                quantity: "0",
                minQuantity: "0",
                unitCost: "0",
              };
              return (
                <div
                  key={s.name}
                  className="rounded-xl border border-stone-200 p-3"
                >
                  <label className="flex gap-2 text-sm font-semibold">
                    <input
                      disabled={busy}
                      type="checkbox"
                      checked={selected.includes(s.name)}
                      onChange={() =>
                        setSelected((prev) =>
                          prev.includes(s.name)
                            ? prev.filter((n) => n !== s.name)
                            : [...prev, s.name],
                        )
                      }
                    />
                    {s.name}
                    <span className="text-xs text-stone-500 font-normal">
                      por {s.unit}
                    </span>
                  </label>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {(
                      [
                        ["quantity", "Quantidade"],
                        ["minQuantity", "Mínimo"],
                        ["unitCost", "Custo unitário (R$)"],
                      ] as const
                    ).map(([key, label]) => (
                      <label key={key} className="text-xs text-stone-600">
                        {label}
                        <input
                          disabled={busy}
                          type="number"
                          min="0"
                          step="0.01"
                          value={v[key]}
                          onChange={(e) => field(s.name, key, e.target.value)}
                          className="block mt-1 w-full p-2 rounded-lg border border-stone-300"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          {suggestions.length > 0 && (
            <button
              onClick={save}
              disabled={
                busy || !suggestions.some((s) => selected.includes(s.name))
              }
              className="brand-button disabled:opacity-40 text-sm px-4 py-2.5 rounded-xl font-semibold"
            >
              {busy
                ? "Cadastrando…"
                : `Cadastrar ${suggestions.filter((s) => selected.includes(s.name)).length} itens selecionados`}
            </button>
          )}
        </>
      )}
    </section>
  );
}
