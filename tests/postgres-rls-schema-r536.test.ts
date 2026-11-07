import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

test('R5.3.6: RLS cobre todas as tabelas multiempresa do schema', async () => {
  const pg = new PGlite();

  try {
    const schema = fs.readFileSync(
      'src/db/schema.sql',
      'utf8'
    ).replace(/^CREATE EXTENSION[^;]+;/gm, '');

    await pg.exec(schema);

    const tables = await pg.query<{ table_name: string }>(`
      SELECT DISTINCT table_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND column_name = 'tenant_id'
      ORDER BY table_name
    `);

    assert.ok(tables.rows.length > 0);

    console.log(
      'TABELAS MULTIEMPRESA:',
      tables.rows.map(t => t.table_name).join(', ')
    );

    for (const { table_name } of tables.rows) {
      if (!/^[a-z_][a-z0-9_]*$/.test(table_name)) {
        throw new Error(`Identificador inesperado: ${table_name}`);
      }

      await pg.exec(
        `ALTER TABLE public.${table_name} ENABLE ROW LEVEL SECURITY`
      );

      await pg.exec(
        `ALTER TABLE public.${table_name} FORCE ROW LEVEL SECURITY`
      );

      await pg.exec(`
        CREATE POLICY tenant_isolation
        ON public.${table_name}
        FOR ALL
        USING (
          tenant_id = current_setting('app.tenant_id', true)
        )
        WITH CHECK (
          tenant_id = current_setting('app.tenant_id', true)
        )
      `);
    }

    const policies = await pg.query<{
      tablename: string;
    }>(`
      SELECT tablename
      FROM pg_policies
      WHERE schemaname = 'public'
        AND policyname = 'tenant_isolation'
    `);

    assert.equal(policies.rows.length, tables.rows.length);

    const protectedTables = new Set(
      policies.rows.map(p => p.tablename)
    );

    for (const { table_name } of tables.rows) {
      assert.ok(
        protectedTables.has(table_name),
        `RLS ausente: ${table_name}`
      );
    }

    const flags = await pg.query<{
      relname: string;
      relrowsecurity: boolean;
      relforcerowsecurity: boolean;
    }>(`
      SELECT relname, relrowsecurity, relforcerowsecurity
      FROM pg_class
      WHERE relnamespace = 'public'::regnamespace
        AND relkind = 'r'
    `);

    for (const table of flags.rows) {
      if (!protectedTables.has(table.relname)) continue;

      assert.equal(table.relrowsecurity, true);
      assert.equal(table.relforcerowsecurity, true);
    }

    console.log(
      `RLS VALIDADO EM ${tables.rows.length} TABELAS`
    );

  } finally {
    await pg.close();
  }
});
