import assert from 'node:assert/strict';
import test from 'node:test';

import {
  compareFinancialMetric,
  compareFinancialPeriods,
} from '../src/utils/intelligenceComparison';

test('B6.2.5: crescimento de receita e favoravel', () => {
  const result = compareFinancialMetric(150, 100, 'income');
  assert.equal(result.difference, 50);
  assert.equal(result.percentage, 50);
  assert.equal(result.trend, 'favorable');
});

test('B6.2.5: aumento de despesa e desfavoravel', () => {
  const result = compareFinancialMetric(200, 100, 'expense');
  assert.equal(result.percentage, 100);
  assert.equal(result.trend, 'unfavorable');
});

test('B6.2.5: reducao de comissao e favoravel', () => {
  const result = compareFinancialMetric(50, 100, 'commission');
  assert.equal(result.percentage, -50);
  assert.equal(result.trend, 'favorable');
});

test('B6.2.5: base zero nao produz percentual artificial', () => {
  const result = compareFinancialMetric(100, 0, 'income');
  assert.equal(result.percentage, null);
  assert.equal(result.difference, 100);
});

test('B6.2.5: valores iguais produzem tendencia neutra', () => {
  const result = compareFinancialMetric(100, 100, 'income');
  assert.equal(result.percentage, 0);
  assert.equal(result.trend, 'neutral');
});

test('B6.2.5: resultado negativo pode melhorar', () => {
  const result = compareFinancialMetric(-100, -200, 'net');
  assert.equal(result.difference, 100);
  assert.equal(result.percentage, 50);
  assert.equal(result.trend, 'favorable');
});

test('B6.2.5: preserva precisao financeira', () => {
  const result = compareFinancialMetric(10.30, 10.10, 'income');
  assert.equal(result.difference, 0.20);
});

test('B6.2.5: compara os quatro indicadores', () => {
  const result = compareFinancialPeriods(
    { income: 295, expense: 465.50, commission: 0, net: -170.50 },
    { income: 200, expense: 300, commission: 20, net: -120 }
  );

  assert.equal(result.income.difference, 95);
  assert.equal(result.expense.difference, 165.50);
  assert.equal(result.commission.difference, -20);
  assert.equal(result.net.difference, -50.50);
});