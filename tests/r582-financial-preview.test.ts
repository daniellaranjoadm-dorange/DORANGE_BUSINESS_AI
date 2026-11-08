import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(
  'src/components/AiFinancialPreview.tsx',
  'utf8'
);

test('R5.8.2 B2: previa apresenta dados financeiros', () => {
  assert.match(source, /draft\.amount/);
  assert.match(source, /draft\.description/);
  assert.match(source, /draft\.type/);
});

test('R5.8.2 B2: possui cancelamento', () => {
  assert.match(source, /onCancel/);
});

test('R5.8.2 B2: nao realiza gravacao financeira', () => {
  assert.doesNotMatch(source, /fetch\s*\(/);
  assert.doesNotMatch(source, /axios/);
  assert.doesNotMatch(source, /localStorage\.setItem/);
});

test('R5.8.2 B2: informa ausencia de gravacao', () => {
  assert.match(source, /Nenhum lançamento foi gravado/);
});