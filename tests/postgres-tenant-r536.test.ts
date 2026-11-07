import test from 'node:test';
import assert from 'node:assert/strict';
import {
  requireTenantId,
  selectTenantRows
} from '../server/postgres-tenant.js';

test('R5.3.6: tenant vazio e rejeitado', () => {
  assert.throws(() => requireTenantId(''), /obrigatorio/);
});

test('R5.3.6: tenant muito longo e rejeitado', () => {
  assert.throws(() => requireTenantId('x'.repeat(65)), /limite/);
});

test('R5.3.6: consulta usa tenant parametrizado', async () => {
  let sql = '';
  let params: unknown[] = [];

  const client = {
    async query(query: string, values: unknown[]) {
      sql = query;
      params = values;
      return { rows: [{ id: 'servico-1' }] };
    }
  };

  const rows = await selectTenantRows(
    client as any,
    'empresa-a',
    'services'
  );

  assert.match(sql, /WHERE tenant_id = \$1/);
  assert.deepEqual(params, ['empresa-a', 100]);
  assert.equal(rows.length, 1);
});

test('R5.3.6: limite invalido e rejeitado', async () => {
  await assert.rejects(
    selectTenantRows({} as any, 'empresa-a', 'services', 999),
    /Limite invalido/
  );
});
