import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPostgresPool,
  checkPostgresConnection,
  withPostgresTransaction
} from '../server/postgres.js';

test('R5.3.6: rejeita configuracao sem conexao', () => {
  assert.throws(
    () => createPostgresPool({ connectionString: '' }),
    /connectionString obrigatoria/
  );
});

function fakePool(failOn?: string) {
  const commands: string[] = [];
  let released = false;

  const client = {
    async query(sql: string) {
      commands.push(sql);
      if (sql === failOn) {
        throw new Error('Falha simulada');
      }
      return { rows: [{ connected: 1 }] };
    },
    release() {
      released = true;
    }
  };

  const pool = {
    async connect() {
      return client;
    },
    async query(sql: string) {
      return client.query(sql);
    }
  };

  return {
    pool: pool as any,
    commands,
    isReleased: () => released
  };
}

test('R5.3.6: conexao responde SELECT 1', async () => {
  const fake = fakePool();
  const result = await checkPostgresConnection(fake.pool);

  assert.equal(result, true);
  assert.deepEqual(fake.commands, ['SELECT 1 AS connected']);
});

test('R5.3.6: transacao executa COMMIT', async () => {
  const fake = fakePool();

  const result = await withPostgresTransaction(
    fake.pool,
    async client => {
      await client.query('OPERACAO_SINTETICA');
      return 'sucesso';
    }
  );

  assert.equal(result, 'sucesso');
  assert.deepEqual(fake.commands, [
    'BEGIN',
    'OPERACAO_SINTETICA',
    'COMMIT'
  ]);
  assert.equal(fake.isReleased(), true);
});

test('R5.3.6: falha executa ROLLBACK', async () => {
  const fake = fakePool('OPERACAO_SINTETICA');

  await assert.rejects(
    withPostgresTransaction(fake.pool, async client => {
      await client.query('OPERACAO_SINTETICA');
    }),
    /Falha simulada/
  );

  assert.deepEqual(fake.commands, [
    'BEGIN',
    'OPERACAO_SINTETICA',
    'ROLLBACK'
  ]);
  assert.equal(fake.isReleased(), true);
});

test('R5.3.6: erro no rollback preserva erro original', async () => {
  const fake = fakePool('ROLLBACK');

  await assert.rejects(
    withPostgresTransaction(fake.pool, async () => {
      throw new Error('Erro original');
    }),
    /Erro original/
  );

  assert.deepEqual(fake.commands, [
    'BEGIN',
    'ROLLBACK'
  ]);
  assert.equal(fake.isReleased(), true);
});
