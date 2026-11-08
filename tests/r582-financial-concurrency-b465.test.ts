import test from "node:test";
import assert from "node:assert/strict";
import {
  FinancialStateGuard,
  mergeFinancialTransaction,
} from "../src/utils/financialStateGuard";

test("B4.6.5: resposta antiga da mesma empresa e rejeitada", () => {
  const guard = new FinancialStateGuard();

  guard.selectTenant("empresa-a");

  const oldRequest = guard.beginRead("empresa-a");
  const newRequest = guard.beginRead("empresa-a");

  assert.equal(guard.acceptRead(oldRequest), false);
  assert.equal(guard.acceptRead(newRequest), true);
});

test("B4.6.5: troca A-B-A invalida consulta original", () => {
  const guard = new FinancialStateGuard();

  guard.selectTenant("empresa-a");
  const request = guard.beginRead("empresa-a");

  guard.selectTenant("empresa-b");
  guard.selectTenant("empresa-a");

  assert.equal(guard.acceptRead(request), false);
});

test("B4.6.5: mutacao invalida leitura anterior", () => {
  const guard = new FinancialStateGuard();

  guard.selectTenant("empresa-a");
  const request = guard.beginRead("empresa-a");

  assert.equal(guard.acceptMutation("empresa-a"), true);
  assert.equal(guard.acceptRead(request), false);
});

test("B4.6.5: empresa diferente nao pode aplicar mutacao", () => {
  const guard = new FinancialStateGuard();

  guard.selectTenant("empresa-b");

  assert.equal(guard.acceptMutation("empresa-a"), false);
});

test("B4.6.5: resposta atual continua valida", () => {
  const guard = new FinancialStateGuard();

  guard.selectTenant("empresa-a");

  const request = guard.beginRead("empresa-a");

  assert.equal(guard.acceptRead(request), true);
});

test("B4.6.5: transacao repetida nao duplica registro", () => {
  const transaction = {
    id: "fin-123",
    tenantId: "empresa-a",
    amount: 150,
  };

  const first = mergeFinancialTransaction([], transaction);
  const second = mergeFinancialTransaction(first, transaction);

  assert.equal(second.length, 1);
  assert.equal(second[0].amount, 150);
});