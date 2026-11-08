import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(
  'src/components/AiAssistantWorkspace.tsx',
  'utf8'
);

test('B3: importa interpretador financeiro', () => {
  assert.match(source, /parseFinancialCommand/);
});

test('B3: importa componente de previa', () => {
  assert.match(source, /AiFinancialPreview/);
});

test('B3: mantem estado financeiro pendente', () => {
  assert.match(source, /pendingFinancialDraft/);
});

test('B3: interpreta comando antes da chamada HTTP', () => {
  const parser = source.indexOf(
    'const financialDraft = parseFinancialCommand(text)'
  );

  const request = source.indexOf(
    'authenticatedFetch("/api/ai/chat"'
  );

  assert.ok(parser >= 0);
  assert.ok(request > parser);
});

test('B3: permite cancelar a previa', () => {
  assert.match(
    source,
    /onCancel=\{\(\) => \{[\s\S]*?setPendingFinancialDraft\(null\)/
  );
});

test('B3: nao adiciona chamada de gravacao financeira', () => {
  assert.doesNotMatch(
    source,
    /authenticatedFetch\(["']\/api\/financial["']/
  );
  assert.doesNotMatch(
    source,
    /fetch\(["']\/api\/financial["']/
  );
});