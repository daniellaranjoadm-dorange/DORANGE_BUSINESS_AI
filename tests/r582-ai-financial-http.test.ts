import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

test('B4.4: contrato financeiro HTTP com banco isolado', async () => {
  const previousDataDir = process.env.DATA_DIR;
  const previousNodeEnv = process.env.NODE_ENV;
  const previousAllowEmpty = process.env.ALLOW_EMPTY_DB;

  const dir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'dorange-b44-financial-')
  );

  fs.copyFileSync(
    'tests/fixtures/database.synthetic.json',
    path.join(dir, 'database.json')
  );

  process.env.DATA_DIR = dir;
  process.env.NODE_ENV = 'test';
  process.env.ALLOW_EMPTY_DB = 'false';

  let server: import('node:http').Server | undefined;

  try {
    const { db } = await import('../server/db.js');
    const { hashPassword } = await import('../server/passwords.js');

    const password = 'B44-Temporary-Regression-2026!';
    const hash = await hashPassword(password);

    db.mutate(data => {
      for (const user of data.users) {
        if (
          user.id === 'user-owner-1' ||
          user.id === 'user-owner-2' ||
          user.id === 'user-professional-1' ||
          user.id === 'user-admin'
        ) {
          user.passwordHash = hash;
        }
      }
    });

    const { app } = await import('../server.js');

    server = app.listen(0, '127.0.0.1');

    await new Promise<void>((resolve, reject) => {
      server!.once('listening', resolve);
      server!.once('error', reject);
    });

    const address = server.address();
    assert.ok(address && typeof address !== 'string');

    const base = `http://127.0.0.1:${address.port}`;
    const endpoint = `${base}/api/ai/financial/confirm`;

    async function login(email: string): Promise<string> {
      const response = await fetch(`${base}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      assert.equal(response.status, 200, `Login: ${email}`);

      const result = await response.json() as { token: string };
      assert.ok(result.token);
      return result.token;
    }

    async function post(
      payload: Record<string, unknown>,
      token?: string
    ) {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      const body = await response.json();

      return { status: response.status, body };
    }

    function financialCount(tenantId: string): number {
      return db.get('financialTransactions')
        .filter(item => item.tenantId === tenantId).length;
    }

    const owner1 = await login('owner1@example.invalid');
    const owner2 = await login('owner2@example.invalid');
    const professional = await login(
      'professional1@example.invalid'
    );
    const admin = await login('admin@example.invalid');

    const payload = {
      type: 'expense',
      description: 'Teste HTTP B4.4',
      amount: 35.5,
      date: '2026-11-08',
      operationKey: 'b44_http_operation_0001'
    };

    console.log('B4.4: autenticacao');

    const unauthenticated = await post(payload);
    assert.equal(unauthenticated.status, 401);

    console.log('B4.4: permissao profissional');

    const forbidden = await post(payload, professional);
    assert.equal(forbidden.status, 403);

    console.log('B4.4: isolamento entre empresas');

    const beforeTenant1 = financialCount('tenant-1');
    const beforeTenant2 = financialCount('tenant-2');

    const crossTenant = await post(
      { ...payload, tenantId: 'tenant-2' },
      owner1
    );

    assert.equal(crossTenant.status, 403);
    assert.equal(financialCount('tenant-1'), beforeTenant1);
    assert.equal(financialCount('tenant-2'), beforeTenant2);

    console.log('B4.4: criacao autorizada');

    const created = await post(payload, owner1);

    assert.equal(
      created.status,
      201,
      `Criacao: ${JSON.stringify(created.body)}`
    );
    assert.equal(created.body.created, true);
    assert.equal(created.body.transaction.tenantId, 'tenant-1');
    assert.equal(created.body.transaction.status, 'pending');
    assert.equal(financialCount('tenant-1'), beforeTenant1 + 1);
    assert.equal(financialCount('tenant-2'), beforeTenant2);

    console.log('B4.4: idempotencia');

    const repeated = await post(payload, owner1);

    assert.equal(repeated.status, 200);
    assert.equal(repeated.body.created, false);
    assert.equal(
      repeated.body.transaction.id,
      created.body.transaction.id
    );
    assert.equal(financialCount('tenant-1'), beforeTenant1 + 1);

    console.log('B4.4: conflito de operacao');

    const conflict = await post(
      { ...payload, amount: 99.99 },
      owner1
    );

    assert.equal(conflict.status, 409);
    assert.equal(financialCount('tenant-1'), beforeTenant1 + 1);

    console.log('B4.4: validacao financeira');

    const invalid = await post(
      {
        ...payload,
        operationKey: 'b44_http_operation_0002',
        amount: -10
      },
      owner1
    );

    assert.equal(
      invalid.status,
      400,
      `Validacao: ${JSON.stringify(invalid.body)}`
    );
    assert.equal(financialCount('tenant-1'), beforeTenant1 + 1);

    console.log('B4.4: mesma chave em empresas distintas');

    const secondTenant = await post(payload, owner2);

    assert.equal(
      secondTenant.status,
      201,
      `Segunda empresa: ${JSON.stringify(secondTenant.body)}`
    );
    assert.equal(secondTenant.body.transaction.tenantId, 'tenant-2');
    assert.equal(financialCount('tenant-2'), beforeTenant2 + 1);

    console.log('B4.4: Super Admin seleciona empresa');

    const adminPayload = {
      ...payload,
      operationKey: 'b44_http_operation_0003',
      tenantId: 'tenant-2'
    };

    const adminCreated = await post(adminPayload, admin);

    assert.equal(
      adminCreated.status,
      201,
      `Super Admin: ${JSON.stringify(adminCreated.body)}`
    );
    assert.equal(
      adminCreated.body.transaction.tenantId,
      'tenant-2'
    );

    console.log('B4.4: auditoria');

    const audits = db.get('auditLogs');

    assert.ok(
      audits.some(log =>
        log.tenantId === 'tenant-1' &&
        log.userId === 'user-owner-1'
      ),
      'Auditoria do Owner nao encontrada'
    );

    assert.ok(
      audits.some(log =>
        log.tenantId === 'tenant-2' &&
        log.userId === 'user-admin'
      ),
      'Auditoria do Super Admin nao encontrada'
    );

    console.log('B4.4: banco operacional nao utilizado');
    console.log('B4.4: verificacoes HTTP concluidas');

  } finally {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server!.close(error => {
          if (error) reject(error);
          else resolve();
        });
      });
    }

    if (previousDataDir === undefined) {
      delete process.env.DATA_DIR;
    } else {
      process.env.DATA_DIR = previousDataDir;
    }

    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }

    if (previousAllowEmpty === undefined) {
      delete process.env.ALLOW_EMPTY_DB;
    } else {
      process.env.ALLOW_EMPTY_DB = previousAllowEmpty;
    }

    fs.rmSync(dir, { recursive: true, force: true });
  }
});