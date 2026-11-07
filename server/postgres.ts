import pg from 'pg';

const { Pool } = pg;

export interface PostgresConfig {
  connectionString: string;
  maxConnections?: number;
}

export function createPostgresPool(config: PostgresConfig) {
  if (!config.connectionString?.trim()) {
    throw new Error('PostgreSQL: connectionString obrigatoria.');
  }

  return new Pool({
    connectionString: config.connectionString,
    max: config.maxConnections ?? 10,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
  });
}

export async function checkPostgresConnection(
  pool: pg.Pool
): Promise<boolean> {
  const result = await pool.query('SELECT 1 AS connected');
  return result.rows[0]?.connected === 1;
}

export async function withPostgresTransaction<T>(
  pool: pg.Pool,
  operation: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await operation(client);

    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // Preservar o erro original da operacao.
    }
    throw error;
  } finally {
    client.release();
  }
}
