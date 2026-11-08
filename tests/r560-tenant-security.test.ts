import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const temporary = fs.mkdtempSync(
  path.join(os.tmpdir(), 'dorange-r560-security-')
);

const fixture = 'tests/fixtures/database.synthetic.json';

fs.copyFileSync(
  fixture,
  path.join(temporary, 'database.json')
);

process.env.DATA_DIR = temporary;
process.env.NODE_ENV = 'test';
process.env.GEMINI_API_KEY = '';

let server: any;
let base: string;
let db: any;
let auth: any;

const tokens: Record<string, string> = {};

async function request(
  tenantId: string,
  body: Record<string, unknown>,
  token?: string
) {
  const response = await fetch(
    `${base}/api/tenants/${tenantId}`,
    {
      method: 'PATCH',
      signal: AbortSignal.timeout(10000),
      headers: {
        'Content-Type': 'application/json',
        ...(token
          ? { Authorization: `Bearer ${token}` }
          : {})
      },
      body: JSON.stringify(body)
    }
  );

  const data = await response.json();

  return {
    status: response.status,
    data
  };
}

before(async () => {
  ({ db } = await import('../server/db.js'));
  auth = await import('../server/auth.js');

  const { app } = await import('../server.js');

  for (const id of [
    'user-owner-1',
    'user-owner-2',
    'user-professional-1',
    'user-admin'
  ]) {
    const user = db.get('users').find(
      (item: any) => item.id === id
    );

    assert.ok(user, `Usuário sintético ausente: ${id}`);

    tokens[id] = auth.createSession(user);
  }

  server = app.listen(0, '127.0.0.1');

  await new Promise<void>(resolve =>
    server.once('listening', resolve)
  );

  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) {
    await new Promise<void>(resolve =>
      server.close(() => resolve())
    );
  }

  fs.rmSync(temporary, {
    recursive: true,
    force: true
  });
});

test('R5.6.0: PATCH sem autenticacao retorna 401', async () => {
  const result = await request(
    'tenant-1',
    { tradeName: 'Nao autorizado' }
  );

  assert.equal(result.status, 401);
});

test('R5.6.0: Owner atualiza a propria empresa', async () => {
  const result = await request(
    'tenant-1',
    { tradeName: 'Empresa autorizada R560' },
    tokens['user-owner-1']
  );

  assert.equal(result.status, 200, JSON.stringify(result.data));

  const tenant = db.get('tenants').find(
    (item: any) => item.id === 'tenant-1'
  );

  assert.equal(tenant.tradeName, 'Empresa autorizada R560');
});

test('R5.6.0: Owner nao altera outra empresa', async () => {
  const beforeTenant = structuredClone(
    db.get('tenants').find((item: any) => item.id === 'tenant-2')
  );

  const result = await request(
    'tenant-2',
    { tradeName: 'Alteracao proibida' },
    tokens['user-owner-1']
  );

  assert.equal(result.status, 403);

  const afterTenant = db.get('tenants').find(
    (item: any) => item.id === 'tenant-2'
  );

  assert.deepEqual(afterTenant, beforeTenant);
});

test('R5.6.0: Professional nao altera empresa', async () => {
  const result = await request(
    'tenant-1',
    { tradeName: 'Alteracao profissional' },
    tokens['user-professional-1']
  );

  assert.equal(result.status, 403);
});

test('R5.6.0: Owner nao altera plano', async () => {
  const result = await request(
    'tenant-1',
    { planId: 'studio' },
    tokens['user-owner-1']
  );

  assert.equal(result.status, 403);

  const tenant = db.get('tenants').find(
    (item: any) => item.id === 'tenant-1'
  );

  assert.equal(tenant.planId, 'pro');
});

test('R5.6.0: Owner nao suspende empresa', async () => {
  const result = await request(
    'tenant-1',
    { status: 'suspended' },
    tokens['user-owner-1']
  );

  assert.equal(result.status, 403);

  const tenant = db.get('tenants').find(
    (item: any) => item.id === 'tenant-1'
  );

  assert.equal(tenant.status, 'active');
});

test('R5.6.0: Super Admin altera plano valido', async () => {
  const result = await request(
    'tenant-2',
    { planId: 'studio' },
    tokens['user-admin']
  );

  assert.equal(result.status, 200, JSON.stringify(result.data));

  const tenant = db.get('tenants').find(
    (item: any) => item.id === 'tenant-2'
  );

  assert.equal(tenant.planId, 'studio');
});

test('R5.6.0: Super Admin rejeita plano invalido', async () => {
  const result = await request(
    'tenant-2',
    { planId: 'enterprise-inexistente' },
    tokens['user-admin']
  );

  assert.equal(result.status, 400);

  const tenant = db.get('tenants').find(
    (item: any) => item.id === 'tenant-2'
  );

  assert.equal(tenant.planId, 'studio');
});

test('R5.6.0: Super Admin altera status valido', async () => {
  const result = await request(
    'tenant-2',
    { status: 'trial' },
    tokens['user-admin']
  );

  assert.equal(result.status, 200, JSON.stringify(result.data));

  const tenant = db.get('tenants').find(
    (item: any) => item.id === 'tenant-2'
  );

  assert.equal(tenant.status, 'trial');
});

test('R5.6.0: Super Admin rejeita status invalido', async () => {
  const result = await request(
    'tenant-2',
    { status: 'status-inexistente' },
    tokens['user-admin']
  );

  assert.equal(result.status, 400);

  const tenant = db.get('tenants').find(
    (item: any) => item.id === 'tenant-2'
  );

  assert.equal(tenant.status, 'trial');
});

test('R5.6.0: campos administrativos nao sao persistidos', async () => {
  const beforeTenant = structuredClone(
    db.get('tenants').find((item: any) => item.id === 'tenant-1')
  );

  const result = await request(
    'tenant-1',
    {
      tradeName: 'Marca segura R560',
      id: 'tenant-falsificado',
      ownerId: 'usuario-falsificado',
      passwordHash: 'hash-falsificado',
      role: 'superadmin'
    },
    tokens['user-owner-1']
  );

  assert.equal(result.status, 200, JSON.stringify(result.data));

  const tenant = db.get('tenants').find(
    (item: any) => item.id === 'tenant-1'
  );

  assert.equal(tenant.id, beforeTenant.id);
  assert.equal(tenant.tradeName, 'Marca segura R560');
  assert.equal(tenant.ownerId, beforeTenant.ownerId);
  assert.equal(tenant.passwordHash, beforeTenant.passwordHash);
  assert.equal(tenant.role, beforeTenant.role);
});

test('R5.6.0: alteracao sem campos permitidos retorna 400', async () => {
  const result = await request(
    'tenant-1',
    { campoInexistente: 'valor' },
    tokens['user-owner-1']
  );

  assert.equal(result.status, 400);
});

test('R5.6.0: PATCH vazio retorna 400', async () => {
  const beforeTenant = structuredClone(
    db.get('tenants').find((item: any) => item.id === 'tenant-1')
  );

  const result = await request(
    'tenant-1',
    {},
    tokens['user-owner-1']
  );

  assert.equal(result.status, 400);

  const afterTenant = db.get('tenants').find(
    (item: any) => item.id === 'tenant-1'
  );

  assert.deepEqual(afterTenant, beforeTenant);
});

test('R5.6.0: auditoria identifica responsavel pela alteracao', async () => {
  const result = await request(
    'tenant-1',
    { description: 'Auditoria R560 Lote 4H' },
    tokens['user-owner-1']
  );

  assert.equal(result.status, 200, JSON.stringify(result.data));

  const entry = db.get('auditLogs').find(
    (item: any) =>
      item.action === 'UPDATE_TENANT' &&
      item.tenantId === 'tenant-1' &&
      item.userId === 'user-owner-1'
  );

  assert.ok(entry, 'Registro de auditoria não encontrado');
  assert.equal(entry.userRole, 'owner');
  assert.match(entry.details, /user-owner-1/);
});