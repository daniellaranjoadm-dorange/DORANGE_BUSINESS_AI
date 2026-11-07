import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';

test('R5.3.6: isolamento real entre duas empresas', async () => {
  const pg = new PGlite();

  try {
    await pg.exec(`
      CREATE TABLE services (
        id text PRIMARY KEY,
        tenant_id text NOT NULL,
        name text NOT NULL
      );

      INSERT INTO services VALUES
        ('a1', 'empresa-a', 'Servico A'),
        ('b1', 'empresa-b', 'Servico B');

      CREATE ROLE dorange_app NOLOGIN;

      GRANT USAGE ON SCHEMA public TO dorange_app;
      GRANT SELECT, INSERT, UPDATE, DELETE
        ON services TO dorange_app;
    `);

    await pg.exec(
      'ALTER TABLE services ENABLE ROW LEVEL SECURITY'
    );

    await pg.exec(
      'ALTER TABLE services FORCE ROW LEVEL SECURITY'
    );

    await pg.exec(`
      CREATE POLICY tenant_isolation ON services
      FOR ALL
      USING (
        tenant_id = current_setting('app.tenant_id', true)
      )
      WITH CHECK (
        tenant_id = current_setting('app.tenant_id', true)
      )
    `);

    await pg.exec('SET ROLE dorange_app');

    // Sem tenant: nenhum registro visivel.
    const empty = await pg.query(
      'SELECT id FROM services'
    );

    assert.equal(empty.rows.length, 0);

    // Empresa A.
    await pg.query(
      "SELECT set_config('app.tenant_id', $1, false)",
      ['empresa-a']
    );

    const a = await pg.query<{ id: string }>(
      'SELECT id FROM services ORDER BY id'
    );

    assert.deepEqual(
      a.rows.map(r => r.id),
      ['a1']
    );

    // Tentativa de leitura cruzada.
    const crossRead = await pg.query(
      "SELECT id FROM services WHERE tenant_id = 'empresa-b'"
    );

    assert.equal(crossRead.rows.length, 0);

    // Tentativa de insercao cruzada.
    await assert.rejects(
      pg.query(
        'INSERT INTO services VALUES ($1, $2, $3)',
        ['b2', 'empresa-b', 'Invasao']
      ),
      /policy|row.level security/i
    );

    // Tentativa de alteracao cruzada.
    const update = await pg.query(
      "UPDATE services SET name = 'Alterado' WHERE id = 'b1'"
    );

    assert.equal(update.affectedRows, 0);

    // Tentativa de exclusao cruzada.
    const deletion = await pg.query(
      "DELETE FROM services WHERE id = 'b1'"
    );

    assert.equal(deletion.affectedRows, 0);

    // Empresa B.
    await pg.query(
      "SELECT set_config('app.tenant_id', $1, false)",
      ['empresa-b']
    );

    const b = await pg.query<{ id: string }>(
      'SELECT id FROM services ORDER BY id'
    );

    assert.deepEqual(
      b.rows.map(r => r.id),
      ['b1']
    );

    await pg.exec('RESET ROLE');

  } finally {
    await pg.close();
  }
});
