import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAiFinancialInput } from '../server/aiFinancialValidation.js';

const valid = {
  type: 'expense',
  description: 'Material de escritório',
  amount: 150.5,
  date: '2026-11-08',
  operationKey: 'financial_operation_123456',
};

test('B4: aceita lançamento válido', () => {
  assert.equal(validateAiFinancialInput(valid).amount, 150.5);
});

test('B4: rejeita valor negativo', () => {
  assert.throws(() =>
    validateAiFinancialInput({ ...valid, amount: -10 })
  );
});

test('B4: rejeita valor não numérico', () => {
  assert.throws(() =>
    validateAiFinancialInput({ ...valid, amount: '150' })
  );
});

test('B4: rejeita tipo desconhecido', () => {
  assert.throws(() =>
    validateAiFinancialInput({ ...valid, type: 'transfer' })
  );
});

test('B4: rejeita data inexistente', () => {
  assert.throws(() =>
    validateAiFinancialInput({ ...valid, date: '2026-02-30' })
  );
});

test('B4: exige identificador da operação', () => {
  assert.throws(() =>
    validateAiFinancialInput({ ...valid, operationKey: '' })
  );
});

test('B4: rejeita descrição vazia', () => {
  assert.throws(() =>
    validateAiFinancialInput({ ...valid, description: ' ' })
  );
});

test('B4: rejeita valor acima do limite', () => {
  assert.throws(() =>
    validateAiFinancialInput({ ...valid, amount: 1000001 })
  );
});