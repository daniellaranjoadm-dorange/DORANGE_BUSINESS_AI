import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const context = readFileSync("src/context/AppContext.tsx", "utf8");
const assistant = readFileSync("src/components/AiAssistantWorkspace.tsx", "utf8");

test("B4.6.1: contrato de sincronizacao", () => {
  assert.match(context, /syncAiFinancialTransaction:/);
});

test("B4.6.1: isolamento por empresa", () => {
  assert.match(context, /transaction\.tenantId !== currentTenant\.id/);
});

test("B4.6.1: deduplicacao por ID", () => {
  assert.match(context, /item\.id === transaction\.id/);
});

test("B4.6.1: atualizacao do estado global", () => {
  assert.match(context, /setFinancialTransactions\(\(previous\)/);
});

test("B4.6.1: sincronizacao da resposta HTTP", () => {
  assert.match(
    assistant,
    /syncAiFinancialTransaction\(result\.transaction\)/
  );
});

test("B4.6.1: cancelamento preservado", () => {
  assert.match(
    assistant,
    /onCancel=\{\(\) => \{\s*if \(financialLock\.current\) return;\s*setPendingFinancialDraft\(null\);/
  );
});