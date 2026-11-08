import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  "src/components/AiAssistantWorkspace.tsx",
  "utf8"
);

test("B4.6.3: data financeira possui estado proprio", () => {
  assert.match(source, /financialOperationDate/);
});

test("B4.6.3: data definida na criacao da previa", () => {
  assert.match(source, /setFinancialOperationDate\(\[/);
});

test("B4.6.3: confirmacao reutiliza data fixa", () => {
  assert.match(source, /const date = financialOperationDate;/);
});

test("B4.6.3: payload preserva data da operacao", () => {
  assert.match(source, /date: draft\.date \|\| date/);
});

test("B4.6.3: cancelamento limpa a data", () => {
  assert.match(source, /setFinancialOperationDate\(""\)/);
});