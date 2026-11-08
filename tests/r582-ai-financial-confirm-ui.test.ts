import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const assistant = readFileSync(
  "src/components/AiAssistantWorkspace.tsx",
  "utf8"
);

const preview = readFileSync(
  "src/components/AiFinancialPreview.tsx",
  "utf8"
);

test("B4.5: usa endpoint financeiro autenticado", () => {
  assert.match(assistant, /authenticatedFetch\(\s*"\/api\/ai\/financial\/confirm"/);
});

test("B4.5: exige confirmacao explicita", () => {
  assert.match(preview, /onClick=\{onConfirm\}/);
});

test("B4.5: bloqueia confirmacoes simultaneas", () => {
  assert.match(assistant, /financialLock\.current/);
  assert.match(preview, /disabled=\{saving\}/);
});

test("B4.5: preserva chave de idempotencia", () => {
  assert.match(assistant, /crypto\.randomUUID\(\)/);
  assert.match(assistant, /operationKey: key/);
});

test("B4.5: trata conflito HTTP", () => {
  assert.match(assistant, /409:/);
});

test("B4.5: previa nao grava diretamente", () => {
  assert.doesNotMatch(preview, /\bfetch\s*\(/);
  assert.doesNotMatch(preview, /localStorage\.setItem/);
});