import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createConfirmedAiFinancialTransaction,
  FinancialOperationConflict,
} from '../server/aiFinancialPersistence.js';

type Data = {
  financialTransactions: any[];
  auditLogs: any[];
};

function createStore() {
  let data: Data = {
    financialTransactions: [],
    auditLogs: [],
  };

  let failSave = false;

  return {
    get: (_key: 'financialTransactions') =>
      data.financialTransactions,

    mutate: (fn: (draft: Data) => void) => {
      const draft = structuredClone(data);
      fn(draft);

      if (failSave) {
        throw new Error('Falha simulada na persistência');
      }

      data = draft;
    },

    snapshot: () => structuredClone(data),

    setFailSave: (value: boolean) => {
      failSave = value;
    },
  };
}

const input = {
  type: 'expense',
  description: 'Material de escritório',
  amount: 150.5,
  date: '2026-11-08',
  operationKey: 'financial_operation_123456',
};

function execute(store: ReturnType<typeof createStore>, raw = input) {
  return createConfirmedAiFinancialTransaction(
    store,
    raw,
    'tenant-a',
    'user-1',
    'owner'
  );
}

test('B4.2: cria lançamento e auditoria', () => {
  const store = createStore();
  const result = execute(store);

  assert.equal(result.created, true);
  assert.equal(store.snapshot().financialTransactions.length, 1);
  assert.equal(store.snapshot().auditLogs.length, 1);
});

test('B4.2: repetição não duplica lançamento', () => {
  const store = createStore();

  execute(store);
  const second = execute(store);

  assert.equal(second.created, false);
  assert.equal(store.snapshot().financialTransactions.length, 1);
  assert.equal(store.snapshot().auditLogs.length, 1);
});

test('B4.2: mesma chave com valores diferentes gera conflito', () => {
  const store = createStore();

  execute(store);

  assert.throws(
    () => execute(store, { ...input, amount: 200 }),
    FinancialOperationConflict
  );
});

test('B4.2: rollback não mantém dados parciais', () => {
  const store = createStore();

  store.setFailSave(true);

  assert.throws(() => execute(store));

  assert.equal(store.snapshot().financialTransactions.length, 0);
  assert.equal(store.snapshot().auditLogs.length, 0);
});

test('B4.2: exige contexto autenticado', () => {
  const store = createStore();

  assert.throws(() =>
    createConfirmedAiFinancialTransaction(
      store,
      input,
      '',
      '',
      ''
    )
  );
});

test('B4.2: empresas diferentes não compartilham chave', () => {
  const store = createStore();

  execute(store);

  const other = createConfirmedAiFinancialTransaction(
    store,
    input,
    'tenant-b',
    'user-2',
    'owner'
  );

  assert.equal(other.created, true);
  assert.equal(store.snapshot().financialTransactions.length, 2);
});

test('B4.2: auditoria identifica o usuário', () => {
  const store = createStore();

  execute(store);

  const audit = store.snapshot().auditLogs[0];

  assert.equal(audit.userId, 'user-1');
  assert.equal(audit.userRole, 'owner');
  assert.equal(audit.tenantId, 'tenant-a');
});

test('B4.2: entrada inválida não altera o banco', () => {
  const store = createStore();

  assert.throws(() =>
    execute(store, { ...input, amount: -100 })
  );

  assert.equal(store.snapshot().financialTransactions.length, 0);
  assert.equal(store.snapshot().auditLogs.length, 0);
});