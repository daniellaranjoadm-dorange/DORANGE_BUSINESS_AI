import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

test('HOTFIX R5.3.1: fluxo completo de onboarding transacional, credenciais do proprietário e autenticação', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dorange-hotfix-r531-'));
  fs.copyFileSync('tests/fixtures/database.synthetic.json', path.join(dir, 'database.json'));
  process.env.DATA_DIR = dir;
  process.env.NODE_ENV = 'test';

  const { app } = await import('../server.js');
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const base = 'http://127.0.0.1:' + (server.address() as any).port;

  try {
    // 1. Obter token de onboarding
    const sessionRes = await fetch(`${base}/api/onboarding/session`, {
      method: 'POST',
      headers: {
        'Origin': base,
      },
    });
    assert.equal(sessionRes.status, 200, 'Sessão de onboarding deve retornar 200');
    const { token: obToken } = await sessionRes.json();
    assert.ok(obToken, 'Token de onboarding deve ser emitido');

    // 2. Rejeição de senha inválida (< 12 caracteres)
    const invalidPwdRes = await fetch(`${base}/api/tenants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-onboarding-token': obToken,
        'Origin': base,
      },
      body: JSON.stringify({
        businessSegment: 'barber',
        name: 'Carlos Oliveira',
        email: 'carlos.barber@teste.com',
        password: 'curta',
        passwordConfirmation: 'curta',
        tradeName: 'Barbearia do Carlos',
        phone: '11987654321',
      }),
    });
    assert.equal(invalidPwdRes.status, 400, 'Senha curta deve ser rejeitada com 400');
    const invalidPwdData = await invalidPwdRes.json();
    assert.match(invalidPwdData.error, /12 e 128/, 'Mensagem de erro deve indicar tamanho mínimo');

    // 3. Rejeição de confirmação de senha divergente
    const pwdMismatchRes = await fetch(`${base}/api/tenants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-onboarding-token': obToken,
        'Origin': base,
      },
      body: JSON.stringify({
        businessSegment: 'barber',
        name: 'Carlos Oliveira',
        email: 'carlos.barber@teste.com',
        password: 'Senha-Forte-Valida-2026!',
        passwordConfirmation: 'Outra-Senha-Diferente!',
        tradeName: 'Barbearia do Carlos',
        phone: '11987654321',
      }),
    });
    assert.equal(pwdMismatchRes.status, 400, 'Confirmação de senha divergente deve ser rejeitada com 400');

    // 4. Cadastro completo com e-mail e senha válidos
    const validRegistrationRes = await fetch(`${base}/api/tenants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-onboarding-token': obToken,
        'Origin': base,
      },
      body: JSON.stringify({
        businessSegment: 'barber',
        name: 'Carlos Oliveira',
        email: 'carlos.barber@teste.com',
        password: 'Senha-Forte-Valida-2026!',
        passwordConfirmation: 'Senha-Forte-Valida-2026!',
        tradeName: 'Barbearia do Carlos',
        document: '12345678909',
        documentType: 'CPF',
        phone: '11987654321',
        city: 'São Paulo',
        state: 'SP',
        openTime: '08:00',
        closeTime: '20:00',
        breakStart: '12:00',
        breakEnd: '13:00',
        bufferMinutes: 10,
        selectedServiceNames: ['Corte Masculino Degradê', 'Barba Terapia com Toalha Quente'],
      }),
    });
    assert.equal(validRegistrationRes.status, 201, 'Cadastro válido deve retornar 201');
    const created = await validRegistrationRes.json();

    // Verificação de papel OWNER
    assert.ok(created.user, 'Usuário deve ser retornado no cadastro');
    assert.equal(created.user.role, 'owner', 'Usuário criado deve ter papel OWNER estrito');
    assert.equal(created.user.email, 'carlos.barber@teste.com');
    assert.equal(created.user.passwordHash, undefined, 'Hash de senha nunca deve ser vazado para o cliente');
    assert.ok(created.token, 'Token de sessão deve ser emitido no cadastro');
    assert.ok(created.tenant.id, 'TenantId deve existir');
    const newTenantId = created.tenant.id;

    // 5. Rejeição de submissão duplicada / mesmo e-mail
    // Obter novo token de onboarding para testar conflito de e-mail
    const ob2Res = await fetch(`${base}/api/onboarding/session`, {
      method: 'POST',
      headers: { 'Origin': base },
    });
    const { token: obToken2 } = await ob2Res.json();
    const duplicateEmailRes = await fetch(`${base}/api/tenants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-onboarding-token': obToken2,
        'Origin': base,
      },
      body: JSON.stringify({
        businessSegment: 'barber',
        name: 'Carlos Outro',
        email: 'carlos.barber@teste.com', // Mesmo e-mail
        password: 'Senha-Forte-Valida-2026!',
        tradeName: 'Outra Barbearia',
        phone: '11987654321',
      }),
    });
    assert.equal(duplicateEmailRes.status, 409, 'E-mail duplicado deve retornar 409 Conflict');

    // 6. Login do proprietário após cadastro com as credenciais cadastradas
    const loginRes = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': base,
      },
      body: JSON.stringify({
        email: 'carlos.barber@teste.com',
        password: 'Senha-Forte-Valida-2026!',
      }),
    });
    assert.equal(loginRes.status, 200, 'Login do proprietário deve ser bem-sucedido');
    const loginData = await loginRes.json();
    assert.equal(loginData.user.role, 'owner', 'Papel no login deve ser owner');
    assert.equal(loginData.user.tenantId, newTenantId, 'TenantId do proprietário deve corresponder');
    const ownerToken = loginData.token;

    // 7. Acesso autenticado ao dashboard da empresa correta
    const meRes = await fetch(`${base}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${ownerToken}`,
      },
    });
    assert.equal(meRes.status, 200);
    const meData = await meRes.json();
    assert.equal(meData.user.tenantId, newTenantId);

    // 8. Consulta às empresas: o proprietário só enxerga a sua própria empresa
    const tenantsRes = await fetch(`${base}/api/tenants`, {
      headers: {
        'Authorization': `Bearer ${ownerToken}`,
      },
    });
    assert.equal(tenantsRes.status, 200);
    const tenantsList = await tenantsRes.json();
    assert.equal(tenantsList.length, 1, 'Proprietário deve enxergar exclusivamente sua própria empresa');
    assert.equal(tenantsList[0].id, newTenantId);

    // 9. Bloqueio de acesso a dados de outro tenant (Isolamento estrito)
    const crossTenantRes = await fetch(`${base}/api/services?tenantId=tenant-1`, {
      headers: {
        'Authorization': `Bearer ${ownerToken}`,
      },
    });
    assert.equal(crossTenantRes.status, 403, 'Acesso a outro tenant deve retornar 403 Forbidden');

  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
