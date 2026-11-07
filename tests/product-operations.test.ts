import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseCatalogueText,
  parseBRL,
  parseDuration,
  isImportItemValid,
} from "../src/utils/catalogueImport.js";
import {
  businessInsights,
  localDateKey,
} from "../src/utils/businessInsights.js";
import { getBrandTheme } from "../src/utils/brandTheme.js";
import {
  INVENTORY_SUGGESTIONS,
  missingInventorySuggestions,
} from "../src/data/inventorySuggestions.js";
import { BUSINESS_SEGMENTS } from "../src/data/businessSegments.js";
import { calculateServicePrice } from "../src/utils/servicePricing.js";
test("importação local preserva centavos, milhares e durações em horas", () => {
  assert.equal(parseBRL("R$ 1.234,56"), 1234.56);
  assert.equal(parseBRL("80,50"), 80.5);
  assert.equal(parseBRL("80.50"), 80.5);
  assert.equal(parseBRL("-20"), null);
  assert.equal(parseDuration("2h30"), 150);
  assert.equal(parseDuration("1,5 horas"), 90);
  assert.equal(parseDuration("2 horas 30 min"), 150);
  assert.equal(parseDuration("2 min"), null);
  const rows = parseCatalogueText(
    "Alongamento R$ 220,00 (2h30)\nConsulta sem valor",
  );
  assert.equal(rows[0].price, 220);
  assert.equal(rows[0].durationMinutes, 150);
  assert.equal(rows[0].name, "Alongamento");
  assert.equal(rows[1].price, null);
  assert.equal(rows[1].durationMinutes, null);
  assert.equal(isImportItemValid(rows[1]), false);
});
test("CSV local trata aspas, campos ausentes, duplicados e preço zero sem inferir custo", () => {
  const rows = parseCatalogueText(
    'Nome;Categoria;Preço;Duração;Descrição\n"Corte; especial";Cabelo;0;30;"Descrição; detalhada"\nManutenção;Unhas;;60;\nmanutencao;Unhas;80;60;',
    [{ name: "MANUTENÇÃO" }],
  );
  assert.equal(rows[0].name, "Corte; especial");
  assert.equal(rows[0].price, 0);
  assert.equal(rows[0].description, "Descrição; detalhada");
  assert.equal(isImportItemValid(rows[0]), true);
  assert.equal(rows[1].price, null);
  assert.equal(rows[1].isDuplicate, true);
  assert.equal(rows[2].isDuplicate, true);
  assert.equal("costBRL" in rows[0], false);
  assert.equal(isImportItemValid(null as any), false);
  assert.equal(isImportItemValid({ ...rows[0], price: NaN }), false);
});
test("catálogo limita o tamanho antes de processar listas", () => {
  assert.throws(() => parseCatalogueText("x".repeat(50001)));
  assert.throws(() =>
    parseCatalogueText(Array(102).fill("Corte R$ 10 (30 min)").join("\n")),
  );
});
test("todos os nichos têm insumos próprios e sugestões não repetem itens cadastrados", () => {
  for (const id of Object.keys(
    BUSINESS_SEGMENTS,
  ) as (keyof typeof BUSINESS_SEGMENTS)[]) {
    assert.ok(INVENTORY_SUGGESTIONS[id].length >= 3);
    assert.equal(
      missingInventorySuggestions(id, INVENTORY_SUGGESTIONS[id]).length,
      0,
    );
  }
  assert.ok(
    !missingInventorySuggestions("nails", [
      { name: " gel   CONSTRUTOR " },
    ]).some((s) => s.name === "Gel construtor"),
  );
  assert.ok(
    !missingInventorySuggestions("nails", [
      { name: "Gel construtor marca X 24g", category: "Géis" },
    ]).some((s) => s.name === "Gel construtor"),
  );
  assert.ok(
    INVENTORY_SUGGESTIONS.photography.every((s) => !s.name.includes("Gel")),
  );
});
test("cores da empresa mantêm contraste e rejeitam estilos inválidos", () => {
  assert.equal(getBrandTheme("#FFFFFF")["--brand-ink"], "#000000");
  assert.equal(getBrandTheme("#000000")["--brand-ink"], "#ffffff");
  assert.equal(
    getBrandTheme("url(javascript:x)")["--brand-primary"],
    "#17191F",
  );
});
test("simulador de preço cobre custo, tempo e taxas sem prometer margem com campos inválidos", () => {
  const input = {
    materials: 10,
    durationMinutes: 60,
    overheadPerHour: 10,
    laborPerHour: 20,
    feesPercent: 10,
    commissionPercent: 10,
    marginPercent: 20,
  };
  const result = calculateServicePrice(input);
  assert.equal(result.price, 66.67);
  assert.equal(result.directCost, 40);
  assert.ok(result.contribution >= result.price * 0.2);
  assert.throws(() => calculateServicePrice({ ...input, marginPercent: 80 }));
  assert.throws(() => calculateServicePrice({ ...input, materials: NaN }));
  assert.throws(() => calculateServicePrice({ ...input, durationMinutes: 0 }));
});
test("indicadores usam mês e empresa corretos, com sinais sem contagem duplicada", () => {
  const appointment = (id: string, extra: any = {}) => ({
    id,
    tenantId: "a",
    date: "2026-11-07",
    time: "10:00",
    status: "pending",
    price: 100,
    ...extra,
  });
  const tx = (id: string, extra: any = {}) => ({
    id,
    tenantId: "a",
    date: "2026-11-07",
    type: "income",
    status: "paid",
    amount: 100,
    ...extra,
  });
  const apps = [
    appointment("future", { paymentStatus: "deposit_paid", depositAmount: 30 }),
    appointment("paid", { paymentStatus: "paid" }),
    appointment("old", { date: "2026-10-30" }),
    appointment("completed", { status: "completed", price: 200 }),
    appointment("other", { tenantId: "b", price: 999 }),
    appointment("cancelled", { status: "cancelled" }),
  ];
  const transactions = [
    tx("income", { amount: 30, appointmentId: "future" }),
    tx("previous", { date: "2026-10-30", amount: 900 }),
    tx("expense", { type: "expense", amount: 10 }),
    tx("commission", { type: "commission", amount: 5 }),
    tx("pendingExpense", { type: "expense", status: "pending", amount: 200 }),
    tx("other", { tenantId: "b", amount: 999 }),
    tx("receivable", {
      status: "pending",
      date: "2026-10-31",
      dueDate: "2026-11-06",
      amount: 20,
    }),
  ];
  const value = businessInsights(
    "a",
    apps as any,
    transactions as any,
    [],
    new Date(2026, 10, 7, 11),
  );
  assert.equal(value.revenue, 30);
  assert.equal(value.expenses, 15);
  assert.equal(value.net, 15);
  assert.equal(value.futureUnpaid, 70);
  assert.equal(value.averageTicket, 200);
  assert.equal(value.unresolved.length, 1);
  assert.equal(value.receivableAmount, 20);
  assert.equal(value.todayAppointments.length, 3);
  assert.equal(value.cancelled, 1);
  assert.equal(localDateKey(new Date(2026, 10, 7, 23, 59)), "2026-11-07");
});
