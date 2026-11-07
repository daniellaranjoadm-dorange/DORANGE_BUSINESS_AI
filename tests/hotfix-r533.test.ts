import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { Request } from 'express';
import { formatCEP, validateCEP } from '../src/utils/validators.js';
import { fetchAddressByCEP } from '../src/utils/cep.js';

test('HOTFIX R5.3.3: 1. Validação e Formatação de CEP', async () => {
  // Teste de formatação
  assert.equal(formatCEP('90010150'), '90010-150');
  assert.equal(formatCEP('90010-150'), '90010-150');
  assert.equal(formatCEP('90010abc150'), '90010-150');
  assert.equal(formatCEP('9001'), '9001');

  // Teste de validação
  assert.equal(validateCEP('90010-150'), true);
  assert.equal(validateCEP('90010150'), true);
  assert.equal(validateCEP('01001-000'), true);
  assert.equal(validateCEP('12345'), false);
  assert.equal(validateCEP('11111111'), false, 'Dígitos repetidos são inválidos');
  assert.equal(validateCEP('00000-000'), false, 'Dígitos repetidos são inválidos');
});

test('HOTFIX R5.3.3: 2. Consulta de CEP com Mock e Tratamento de Erros / Fallback', async () => {
  const originalFetch = global.fetch;
  try {
    // 2.1 CEP existente com sucesso
    global.fetch = async (url: any) => {
      if (String(url).includes('90010150')) {
        return {
          ok: true,
          json: async () => ({
            cep: '90010-150',
            logradouro: 'Rua dos Andradas',
            complemento: 'até 1000',
            bairro: 'Centro Histórico',
            localidade: 'Porto Alegre',
            uf: 'RS',
            ibge: '4314902',
            ddd: '51',
          }),
        } as any;
      }
      if (String(url).includes('00000999')) {
        return {
          ok: true,
          json: async () => ({
            erro: true,
          }),
        } as any;
      }
      throw new Error('Network timeout');
    };

    const successRes = await fetchAddressByCEP('90010-150');
    assert.equal(successRes.success, true);
    assert.ok(successRes.data);
    assert.equal(successRes.data.street, 'Rua dos Andradas');
    assert.equal(successRes.data.neighborhood, 'Centro Histórico');
    assert.equal(successRes.data.city, 'Porto Alegre');
    assert.equal(successRes.data.state, 'RS');

    // 2.2 CEP inexistente (erro da base dos Correios)
    const notFoundRes = await fetchAddressByCEP('00000-999');
    assert.equal(notFoundRes.success, false);
    assert.ok(notFoundRes.error?.includes('não localizado') || notFoundRes.error?.includes('não encontrado'));

    // 2.3 Falha de rede / Timeout com fallback manual não bloqueante
    const networkFailRes = await fetchAddressByCEP('98765-432');
    assert.equal(networkFailRes.success, false);
    assert.ok(networkFailRes.error?.includes('Falha de conexão') || networkFailRes.error?.includes('Preencha'));
  } finally {
    global.fetch = originalFetch;
  }
});

test('HOTFIX R5.3.3: 3. Validação de Regras de Endereço por Modalidade (Estabelecimento vs Domicílio)', () => {
  function validateStep2(form: {
    tradeName: string;
    city: string;
    state: string;
    phone: string;
    serviceType: 'establishment' | 'domicile' | 'both';
    street: string;
    number: string;
    address: string;
    document?: string;
  }) {
    const isTradeNameValid = form.tradeName.trim().length >= 2;
    const isLocationValid = form.city.trim().length >= 2 && form.state.trim().length === 2;
    const isPhoneValid = form.phone.replace(/\D/g, '').length >= 10;
    
    let isAddressValid = false;
    if (form.serviceType === 'domicile') {
      isAddressValid = true;
    } else {
      isAddressValid = (form.street.trim().length >= 2 && form.number.trim().length >= 1) || form.address.trim().length >= 3;
    }

    return isTradeNameValid && isLocationValid && isPhoneValid && isAddressValid;
  }

  // Estabelecimento sem logradouro/número -> inválido
  const estWithoutAddress = validateStep2({
    tradeName: 'Studio Bela',
    city: 'Porto Alegre',
    state: 'RS',
    phone: '(51) 98888-7777',
    serviceType: 'establishment',
    street: '',
    number: '',
    address: '',
  });
  assert.equal(estWithoutAddress, false, 'Estabelecimento físico deve exigir endereço');

  // Estabelecimento com logradouro e número -> válido
  const estWithAddress = validateStep2({
    tradeName: 'Studio Bela',
    city: 'Porto Alegre',
    state: 'RS',
    phone: '(51) 98888-7777',
    serviceType: 'establishment',
    street: 'Av. Paulista',
    number: '1000',
    address: '',
  });
  assert.equal(estWithAddress, true, 'Estabelecimento com rua e número deve ser válido');

  // Domicílio sem endereço físico -> válido (apenas cidade/UF e contato)
  const domicileWithoutAddress = validateStep2({
    tradeName: 'Manicure Domiciliar Carol',
    city: 'São Paulo',
    state: 'SP',
    phone: '(11) 97777-6666',
    serviceType: 'domicile',
    street: '',
    number: '',
    address: '',
  });
  assert.equal(domicileWithoutAddress, true, 'Atendimento a domicílio não exige endereço físico');
});

const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dorange-hotfix-r533-'));
fs.copyFileSync('tests/fixtures/database.synthetic.json', path.join(testDir, 'database.json'));
process.env.DATA_DIR = testDir;
process.env.NODE_ENV = 'test';

test('HOTFIX R5.3.3: 4. Validação de Origens Confiáveis e Rejeição de Origens Não Autorizadas (isAllowedOrigin)', async () => {
  const { isAllowedOrigin } = await import('../server/security.js');

  const mockReq = {
    get: (header: string) => {
      if (header.toLowerCase() === 'host') return 'localhost:3000';
      return undefined;
    },
    headers: {},
  } as unknown as Request;

  // Origens permitidas
  assert.equal(isAllowedOrigin('http://localhost:3000', mockReq), true);
  assert.equal(isAllowedOrigin('http://127.0.0.1:3000', mockReq), true);
  assert.equal(isAllowedOrigin('https://ais-dev-5jj4esyowfkvq7hbhiuxb7-181264991107.us-east1.run.app', mockReq), true);
  assert.equal(isAllowedOrigin('https://ais-pre-5jj4esyowfkvq7hbhiuxb7-181264991107.us-east1.run.app', mockReq), true);
  assert.equal(isAllowedOrigin('https://aistudio.google.com', mockReq), true);

  // Origens externas não autorizadas
  assert.equal(isAllowedOrigin('https://evil-hacker.com', mockReq), false);
  assert.equal(isAllowedOrigin('http://malicious-site.net', mockReq), false);
  assert.equal(isAllowedOrigin('https://run.app.phishing.org', mockReq), false);
});

test('HOTFIX R5.3.3: 5. Criação HTTP Transacional de Empresa com CEP, Usuário OWNER e Acesso ao Dashboard', async () => {
  const { app } = await import('../server.js');
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const base = 'http://127.0.0.1:' + (server.address() as any).port;

  try {
    // 5.1 Obter token de sessão de onboarding
    const sessionRes = await fetch(`${base}/api/onboarding/session`, {
      method: 'POST',
      headers: {
        'Origin': base,
      },
    });
    assert.equal(sessionRes.status, 200, 'Sessão de onboarding deve retornar 200');
    const { token: obToken } = await sessionRes.json();
    assert.ok(obToken, 'Token de onboarding deve ser emitido');

    // 5.2 Criar empresa com CEP, logradouro e credenciais completas
    const createRes = await fetch(`${base}/api/tenants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-onboarding-token': obToken,
        'Origin': base,
      },
      body: JSON.stringify({
        businessSegment: 'nails',
        name: 'Tatiana Nails Master',
        email: 'tatiana.nails@dorange.test',
        password: 'SenhaForteR533!@#123',
        passwordConfirmation: 'SenhaForteR533!@#123',
        tradeName: 'Studio Tatiana Nails VIP',
        phone: '51999991234',
        whatsapp: '51999991234',
        city: 'Porto Alegre',
        state: 'RS',
        openTime: '09:00',
        closeTime: '19:00',
        serviceType: 'establishment',
        cep: '90010-150',
        neighborhood: 'Centro Histórico',
        address: 'Rua dos Andradas, 500 - Sala 301 - Centro Histórico - CEP 90010-150',
        primaryColor: '#D97706',
        secondaryColor: '#B45309',
        selectedServiceNames: ['Alongamento em Gel', 'Manicure Tradicional'],
      }),
    });

    assert.equal(createRes.status, 201, 'Criação de empresa deve retornar 201 Created');
    const createData = await createRes.json();
    assert.ok(createData.tenant.id, 'Deve retornar ID da empresa');
    assert.ok(createData.token, 'Deve retornar token de autenticação');
    assert.ok(createData.user, 'Deve retornar usuário proprietário');
    assert.equal(createData.user.role, 'owner', 'Usuário deve ser OWNER');
    assert.equal(createData.user.email, 'tatiana.nails@dorange.test');
    assert.equal(createData.tenant.cep, '90010-150', 'CEP deve ser persistido no tenant');
    assert.equal(createData.tenant.neighborhood, 'Centro Histórico', 'Bairro deve ser persistido no tenant');

    // 5.3 Login com as novas credenciais criadas
    const loginRes = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': base,
      },
      body: JSON.stringify({
        email: 'tatiana.nails@dorange.test',
        password: 'SenhaForteR533!@#123',
      }),
    });
    assert.equal(loginRes.status, 200, 'Login do novo proprietário deve retornar 200');
    const loginData = await loginRes.json();
    assert.ok(loginData.token, 'Deve retornar token JWT no login');
    assert.equal(loginData.user.role, 'owner');
    assert.equal(loginData.user.tenantId, createData.tenant.id);

    // 5.4 Teste de duplicidade: tentar cadastrar novamente com o mesmo e-mail deve falhar com 409
    const sessionRes2 = await fetch(`${base}/api/onboarding/session`, {
      method: 'POST',
      headers: {
        'Origin': base,
      },
    });
    const { token: obToken2 } = await sessionRes2.json();

    const dupRes = await fetch(`${base}/api/tenants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-onboarding-token': obToken2,
        'Origin': base,
      },
      body: JSON.stringify({
        businessSegment: 'beauty',
        name: 'Tentativa Duplicada',
        email: 'tatiana.nails@dorange.test',
        password: 'OutraSenhaForte123!@#',
        passwordConfirmation: 'OutraSenhaForte123!@#',
        tradeName: 'Outro Salão Duplicado',
        phone: '51988880000',
        city: 'Porto Alegre',
        state: 'RS',
        serviceType: 'establishment',
      }),
    });
    assert.equal(dupRes.status, 409, 'Cadastro com e-mail duplicado deve retornar 409 Conflict');
    const dupData = await dupRes.json();
    assert.match(dupData.error, /E-mail já cadastrado/);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    fs.rmSync(testDir, { recursive: true, force: true });
  }
});
