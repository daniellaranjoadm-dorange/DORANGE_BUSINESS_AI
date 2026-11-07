import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { appointmentBalance, recordPayment, completeAttendance, settlePayable, WorkflowError } from '../server/attendance.js';

const fixture = JSON.parse(
  fs.readFileSync('tests/fixtures/database.synthetic.json', 'utf8')
);

function createStore() {
  let data = structuredClone(fixture);

  return {
    get(key: string) {
      return data[key];
    },
    mutate(fn: (data: any) => void) {
      const next = structuredClone(data);
      fn(next);
      data = next;
    }
  };
}

test('R5.3.4: pagamento parcial atualiza saldo', () => {
  const store = createStore();
  const result = recordPayment(
    store as any,
    'appointment-1',
    { amount: 20, paymentMethod: 'pix', operationKey: 'r534-payment-001' },
    'test-user'
  );

  assert.equal(result.paid, 20);
  assert.equal(result.remaining, 30);
  assert.equal(result.appointment.paymentStatus, 'deposit_paid');
});

test('R5.3.4: pagamento repetido não duplica receita', () => {
  const store = createStore();
  const payment = {
    amount: 20,
    paymentMethod: 'pix',
    operationKey: 'r534-payment-002'
  };

  recordPayment(store as any, 'appointment-1', payment, 'test-user');

  const repeated = recordPayment(
    store as any,
    'appointment-1',
    payment,
    'test-user'
  );

  assert.equal(repeated.replayed, true);
  assert.equal(
    store.get('financialTransactions').filter(
      (t: any) => t.type === 'income' && t.status === 'paid'
    ).length,
    1
  );
});

test('R5.3.4: pagamento acima do saldo é rejeitado', () => {
  const store = createStore();

  assert.throws(
    () => recordPayment(
      store as any,
      'appointment-1',
      { amount: 60, paymentMethod: 'pix', operationKey: 'r534-payment-003' },
      'test-user'
    ),
    (error: unknown) => error instanceof WorkflowError && error.status === 409
  );

  assert.equal(store.get('financialTransactions').length, 0);
});

test('R5.3.4: pagamento integral zera saldo', () => {
  const store = createStore();

  recordPayment(
    store as any,
    'appointment-1',
    { amount: 50, paymentMethod: 'cash', operationKey: 'r534-payment-004' },
    'test-user'
  );

  const appointment = store.get('appointments')[0];
  const balance = appointmentBalance(
    appointment,
    store.get('financialTransactions')
  );

  assert.equal(balance.remaining, 0);
  assert.equal(appointment.paymentStatus, 'paid');
});

test('R5.3.4: conclusao registra comissao e consumo', () => {
  const store = createStore();

  const result = completeAttendance(
    store as any,
    'appointment-1',
    {
      operationKey: 'r534-complete-001',
      commissionRate: 20,
      materials: [{ itemId: 'inv-1', quantity: 2 }]
    },
    'test-user'
  );

  assert.equal(result.appointment.status, 'completed');
  const fulfillment = result.appointment.fulfillment;
  assert.ok(fulfillment, 'Conclusao deve registrar fulfillment');
  assert.equal(fulfillment.commissionBRL, 10);
  assert.equal(fulfillment.materialCostBRL, 10);
  assert.equal(store.get('inventory')[0].quantity, 8);

  assert.equal(
    store.get('financialTransactions').filter(
      (t: any) => t.type === 'commission'
    ).length,
    1
  );

  assert.equal(store.get('inventoryMovements').length, 1);
});

test('R5.3.4: conclusao repetida nao duplica operacoes', () => {
  const store = createStore();

  const input = {
    operationKey: 'r534-complete-002',
    commissionRate: 20,
    materials: [{ itemId: 'inv-1', quantity: 2 }]
  };

  completeAttendance(store as any, 'appointment-1', input, 'test-user');

  const repeated = completeAttendance(
    store as any,
    'appointment-1',
    input,
    'test-user'
  );

  assert.equal(repeated.replayed, true);
  assert.equal(store.get('inventory')[0].quantity, 8);
  assert.equal(store.get('inventoryMovements').length, 1);
  assert.equal(
    store.get('financialTransactions').filter(
      (t: any) => t.type === 'commission'
    ).length,
    1
  );
});

test('R5.3.4: estoque insuficiente bloqueia conclusao', () => {
  const store = createStore();

  assert.throws(
    () => completeAttendance(
      store as any,
      'appointment-1',
      {
        operationKey: 'r534-complete-003',
        commissionRate: 20,
        materials: [{ itemId: 'inv-1', quantity: 11 }]
      },
      'test-user'
    ),
    (error: unknown) =>
      error instanceof WorkflowError && error.status === 409
  );

  assert.equal(store.get('inventory')[0].quantity, 10);
  assert.equal(store.get('inventoryMovements').length, 0);
  assert.equal(store.get('financialTransactions').length, 0);
});

test('R5.3.4: insumo de outra empresa e bloqueado', () => {
  const store = createStore();

  store.mutate((data: any) => {
    data.inventory.push({
      ...structuredClone(data.inventory[0]),
      id: 'inv-tenant-2',
      tenantId: 'tenant-2'
    });
  });

  assert.throws(
    () => completeAttendance(
      store as any,
      'appointment-1',
      {
        operationKey: 'r534-complete-004',
        commissionRate: 20,
        materials: [{ itemId: 'inv-tenant-2', quantity: 1 }]
      },
      'test-user'
    ),
    (error: unknown) =>
      error instanceof WorkflowError && error.status === 400
  );

  assert.equal(store.get('inventoryMovements').length, 0);
  assert.equal(store.get('financialTransactions').length, 0);
});


test('R5.3.4: quitacao de comissao registra pagamento', () => {
  const store = createStore();

  completeAttendance(store as any, 'appointment-1', {
    operationKey: 'r534-complete-005',
    commissionRate: 20,
    materials: []
  }, 'test-user');

  const commission = store.get('financialTransactions').find(
    (t: any) => t.type === 'commission'
  );

  const result = settlePayable(
    store as any,
    commission.id,
    'r534-settle-001',
    'pix',
    'test-user'
  );

  assert.equal(result.status, 'paid');
  assert.equal(result.paymentMethod, 'pix');
  assert.equal(result.settlementKey, 'r534-settle-001');
});

test('R5.3.4: quitacao repetida nao duplica lancamento', () => {
  const store = createStore();

  completeAttendance(store as any, 'appointment-1', {
    operationKey: 'r534-complete-006',
    commissionRate: 20,
    materials: []
  }, 'test-user');

  const commission = store.get('financialTransactions').find(
    (t: any) => t.type === 'commission'
  );

  const before = store.get('financialTransactions').length;

  settlePayable(
    store as any, commission.id,
    'r534-settle-002', 'pix', 'test-user'
  );

  settlePayable(
    store as any, commission.id,
    'r534-settle-002', 'pix', 'test-user'
  );

  assert.equal(store.get('financialTransactions').length, before);
});

test('R5.3.4: receita nao pode ser quitada como despesa', () => {
  const store = createStore();

  recordPayment(store as any, 'appointment-1', {
    amount: 20,
    paymentMethod: 'pix',
    operationKey: 'r534-payment-005'
  }, 'test-user');

  const income = store.get('financialTransactions').find(
    (t: any) => t.type === 'income' && t.status === 'paid'
  );

  assert.throws(
    () => settlePayable(
      store as any, income.id,
      'r534-settle-003', 'pix', 'test-user'
    ),
    (error: unknown) =>
      error instanceof WorkflowError && error.status === 409
  );
});


test('R5.3.4: quitacao com referencia diferente deve ser rejeitada', () => {
  const store = createStore();

  completeAttendance(store as any, 'appointment-1', {
    operationKey: 'r534-complete-007',
    commissionRate: 20,
    materials: []
  }, 'test-user');

  const commission = store.get('financialTransactions').find(
    (t: any) => t.type === 'commission'
  );

  settlePayable(
    store as any, commission.id,
    'r534-settle-004', 'pix', 'test-user'
  );

  assert.throws(
    () => settlePayable(
      store as any, commission.id,
      'r534-settle-005', 'cash', 'test-user'
    ),
    (error: unknown) =>
      error instanceof WorkflowError && error.status === 409
  );
});

test('R5.3.4: conclusao com referencia diferente deve ser rejeitada', () => {
  const store = createStore();

  completeAttendance(store as any, 'appointment-1', {
    operationKey: 'r534-complete-008',
    commissionRate: 20,
    materials: []
  }, 'test-user');

  assert.throws(
    () => completeAttendance(
      store as any,
      'appointment-1',
      {
        operationKey: 'r534-complete-009',
        commissionRate: 30,
        materials: []
      },
      'test-user'
    ),
    (error: unknown) =>
      error instanceof WorkflowError && error.status === 409
  );
});
