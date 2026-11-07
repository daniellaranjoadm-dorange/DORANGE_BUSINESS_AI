import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';

test('R5.3.6: diagnostico SQL e RLS no PGlite', async () => {
  const pg = new PGlite();

  async function step(name: string, sql: string) {
    console.log(`\nETAPA: ${name}`);
    try {
      await pg.exec(sql);
      console.log('RESULTADO: OK');
    } catch (error: any) {
      console.error('RESULTADO: FALHA');
      console.error('CODIGO:', error.code);
      console.error('POSICAO:', error.position);
      console.error('MENSAGEM:', error.message);
      console.error('SQL:', JSON.stringify(sql));
      throw error;
    }
  }

  try {
    await step('Criar tabela', `
      CREATE TABLE services (
        id text PRIMARY KEY,
        tenant_id text NOT NULL,
        name text NOT NULL
      );
    `);

    await step('Comentario SQL', `
      -- Comentario de teste
      SELECT 1;
    `);

    await step('Habilitar RLS', `
      ALTER TABLE services ENABLE ROW LEVEL SECURITY;
    `);

    await step('Forcar RLS', `
      ALTER TABLE services FORCE ROW LEVEL SECURITY;
    `);

    await step('Criar politica', `
      CREATE POLICY tenant_isolation
      ON services
      FOR ALL
      USING (
        tenant_id = current_setting('app.tenant_id', true)
      )
      WITH CHECK (
        tenant_id = current_setting('app.tenant_id', true)
      );
    `);

    const result = await pg.query<{
      policyname: string;
    }>(`
      SELECT policyname
      FROM pg_policies
      WHERE tablename = 'services'
    `);

    assert.equal(result.rows.length, 1);
    assert.equal(result.rows[0].policyname, 'tenant_isolation');

    console.log('\nPOLITICA RLS CRIADA COM SUCESSO');

  } finally {
    await pg.close();
  }
});
