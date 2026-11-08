import assert from 'node:assert/strict';
import test from 'node:test';
import {
  groupIntelligenceRows,
  applyIntelligenceChartMode,
} from '../src/utils/intelligenceChartData';

test('B6.2.3: agrupa valores diarios preservando centavos', () => {
  const result = groupIntelligenceRows([
    { date: '2026-11-01', income: 10.10, expense: 2.20, commission: 0.30 },
    { date: '2026-11-01', income: 20.20, expense: 3.30, commission: 0.40 },
  ], 7);

  assert.equal(result.length, 1);
  assert.equal(result[0].income, 30.30);
  assert.equal(result[0].totalExpense, 6.20);
});

test('B6.2.3: agrupa semanas iniciadas na segunda-feira', () => {
  const result = groupIntelligenceRows([
    { date: '2026-11-01', income: 10, expense: 0, commission: 0 },
    { date: '2026-11-02', income: 20, expense: 0, commission: 0 },
  ], 90);

  assert.equal(result.length, 2);
});

test('B6.2.3: separa meses diferentes', () => {
  const result = groupIntelligenceRows([
    { date: '2026-10-31', income: 10, expense: 0, commission: 0 },
    { date: '2026-11-01', income: 20, expense: 0, commission: 0 },
  ], 365);

  assert.equal(result.length, 2);
});

test('B6.2.3: acumulado preserva totais progressivos', () => {
  const grouped = groupIntelligenceRows([
    { date: '2026-11-01', income: 100, expense: 20, commission: 5 },
    { date: '2026-11-02', income: 50, expense: 10, commission: 2 },
  ], 7);

  const result = applyIntelligenceChartMode(grouped, 'accumulated');

  assert.equal(result[0].income, 100);
  assert.equal(result[1].income, 150);
  assert.equal(result[1].totalExpense, 37);
});

test('B6.2.3: movimentacao nao altera valores originais', () => {
  const grouped = groupIntelligenceRows([
    { date: '2026-11-01', income: 100, expense: 20, commission: 5 },
  ], 7);

  const result = applyIntelligenceChartMode(grouped, 'daily');

  assert.equal(result[0].income, 100);
  assert.equal(result[0].totalExpense, 25);
  assert.notEqual(result[0], grouped[0]);
});