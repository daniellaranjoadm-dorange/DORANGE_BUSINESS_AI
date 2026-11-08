import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFinancialCommand } from '../src/utils/aiFinancialCommands.js';

test('interpreta despesa em reais', () => {
  assert.deepEqual(
    parseFinancialCommand('Registrar despesa de R$ 150,50 com material'),
    {
      type: 'expense',
      description: 'material',
      amount: 150.5,
      date: null,
      requiresConfirmation: true,
    }
  );
});

test('interpreta receita em reais', () => {
  const result = parseFinancialCommand(
    'Adicionar receita de R$ 1.250,00 referente a serviços'
  );

  assert.equal(result?.type, 'income');
  assert.equal(result?.amount, 1250);
  assert.equal(result?.description, 'serviços');
});

test('rejeita valores negativos e zero', () => {
  assert.equal(
    parseFinancialCommand('Registrar despesa de R$ 0,00 com material'),
    null
  );

  assert.equal(
    parseFinancialCommand('Registrar despesa de R$ -50,00 com material'),
    null
  );
});

test('rejeita valores ambiguos', () => {
  assert.equal(
    parseFinancialCommand('Registrar despesa com material'),
    null
  );
});

test('nao executa lancamentos', () => {
  const result = parseFinancialCommand(
    'Registrar despesa de R$ 80,00 com transporte'
  );

  assert.equal(result?.requiresConfirmation, true);
});