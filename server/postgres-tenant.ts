import type { Pool, PoolClient, QueryResultRow } from 'pg';
import { withPostgresTransaction } from './postgres.js';

export function requireTenantId(tenantId: string): string {
  if (typeof tenantId !== 'string' || !tenantId.trim()) {
    throw new Error('tenantId obrigatorio.');
  }

  if (tenantId.length > 64) {
    throw new Error('tenantId excede limite.');
  }

  return tenantId;
}

export async function withTenantTransaction<T>(
  pool: Pool,
  tenantId: string,
  operation: (client: PoolClient) => Promise<T>
): Promise<T> {
  const id = requireTenantId(tenantId);

  return withPostgresTransaction(pool, async client => {
    await client.query(
      "SELECT set_config('app.tenant_id', $1, true)",
      [id]
    );

    return operation(client);
  });
}

export async function selectTenantRows<T extends QueryResultRow>(
  client: PoolClient,
  tenantId: string,
  table: 'services' | 'customers' | 'appointments',
  limit = 100
): Promise<T[]> {
  const id = requireTenantId(tenantId);

  if (!Number.isInteger(limit) || limit < 1 || limit > 500) {
    throw new Error('Limite invalido.');
  }

  const allowed = new Set([
    'services',
    'customers',
    'appointments'
  ]);

  if (!allowed.has(table)) {
    throw new Error('Tabela nao autorizada.');
  }

  const result = await client.query<T>(
    `SELECT * FROM ${table} WHERE tenant_id = $1 LIMIT $2`,
    [id, limit]
  );

  return result.rows;
}
