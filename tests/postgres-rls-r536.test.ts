import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

test('R5.3.6: RLS real impede acesso entre empresas', async () => {
  const pg = new PGlite();

  try {
    await pg.exec(`
      CREATE TABLE tenants (
        id text PRIMARY KEY
      );

      CREATE TABLE services (
        id text PRIMARY KEY,
        tenant_id text NOT NULL REFERENCES tenants(id),
        name text NOT NULL
      );

      INSERT INTO tenants VALUES ('empresa-a'), ('empresa-b');

      INSERT INTO services VALUES
        ('servico-a', 'empresa-a', 'Servico A'),
        ('servico-b', 'empresa-b', 'Servico B');

      CREATE ROLE dorange_app NOLOGIN;
      GRANT USAGE ON SCHEMA public TO dorange_app;
      GRANT SELECT, INSERT, UPDATE, DELETE
        ON services TO dorange_app;
    `);

    const migration = fs.readFileSync(
      'src/db/migrations/001_tenant_rls.sql',
      'utf8'
    );

    const statements = migration
      .split(';')
      .map(statement => statement.trim())
      .filter(Boolean);

    for (const statement of statements) {
      await pg.exec(statement + ';');
    }

    await pg.exec('SET ROLE dorange_app');

    // Sem empresa: nenhum registro deve ser visivel.
    const noTenant = await pg.query(
      'SELECT id FROM services'
    );

    assert.equal(noTenant.rows.length, 0);

    // Empresa A.
    await pg.query(
      "SELECT set_config('app.tenant_id', $1, false)",
      ['empresa-a']
    );

    const a = await pg.query<{ id: string }>(
      'SELECT id FROM services ORDER BY id'
    );

    assert.deepEqual(
      a.rows.map(row => row.id),
      ['servico-a']
    );

    // Insercao cruzada deve falhar.
    await assert.rejects(
      pg.query(
        'INSERT INTO services(id, tenant_id, name) VALUES ($1, $2, $3)',
        ['invasao', 'empresa-b', 'Invasao']
      ),
      /row.level security|policy/i
    );

    // UPDATE cruzado nao pode modificar registros.
    const update = await pg.query(
      "UPDATE services SET name = 'Alterado' WHERE id = 'servico-b'"
    );

    assert.equal(update.affectedRows, 0);

    // DELETE cruzado nao pode remover registros.
    const deletion = await pg.query(
      "DELETE FROM services WHERE id = 'servico-b'"
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
      b.rows.map(row => row.id),
      ['servico-b']
    );

    await pg.exec('RESET ROLE');

  } finally {
    await pg.close();
  }
});

test('R5.3.6: rollback real preserva consistencia', async () => {
  const pg = new PGlite();

  try {
    await pg.exec(`
      CREATE TABLE financial_test (
        id text PRIMARY KEY,
        amount integer NOT NULL
      );
    `);

    await pg.exec('BEGIN');

    try {
      await pg.query(
        'INSERT INTO financial_test VALUES ($1, $2)',
        ['pagamento-1', 100]
      );

      throw new Error('Falha simulada');
    } catch {
      await pg.exec('ROLLBACK');
    }

    const result = await pg.query<{ total: number }>(
      'SELECT COUNT(*)::integer AS total FROM financial_test'
    );

    assert.equal(result.rows[0].total, 0);
  } finally {
    await pg.close();
  }
});
