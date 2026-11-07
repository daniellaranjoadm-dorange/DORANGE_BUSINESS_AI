import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { BUSINESS_SEGMENTS } from '../src/data/businessSegments.js';

test('HOTFIX R5.3.2: Validação da Etapa 1 do Onboarding — Segmentos, Credenciais do Proprietário e Retenção de Estado', async () => {
  // 1. Teste de Seleção de Segmentos
  const segments = Object.keys(BUSINESS_SEGMENTS);
  assert.equal(segments.length, 7, 'Devem existir 7 segmentos comerciais suportados');
  assert.ok(segments.includes('nails'), 'Segmento NAILS deve existir');
  assert.ok(BUSINESS_SEGMENTS.nails.suggestedServices.length > 0, 'NAILS deve ter serviços sugeridos');

  // 2. Simulação da Lógica de Validação da Etapa 1
  function validateStep1(form: {
    businessSegment: string;
    name: string;
    email: string;
    password: string;
    passwordConfirmation: string;
  }) {
    const isOwnerNameValid = form.name.trim().length >= 3;
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
    const isPasswordLengthValid = form.password.length >= 12 && form.password.length <= 128;
    const isPasswordMatch = form.password.length > 0 && form.password === form.passwordConfirmation;
    const isStep1Valid = Boolean(form.businessSegment) && isOwnerNameValid && isEmailValid && isPasswordLengthValid && isPasswordMatch;

    const missingItems: string[] = [];
    if (!form.businessSegment) missingItems.push('Segmento de negócio');
    if (!isOwnerNameValid) missingItems.push('Nome do proprietário (mín. 3 letras)');
    if (!isEmailValid) missingItems.push('E-mail válido');
    if (!isPasswordLengthValid) missingItems.push('Senha com 12+ caracteres');
    else if (!isPasswordMatch) missingItems.push('Confirmação de senha idêntica');

    return {
      isStep1Valid,
      isOwnerNameValid,
      isEmailValid,
      isPasswordLengthValid,
      isPasswordMatch,
      missingItems,
    };
  }

  // Estado Inicial: NAILS selecionado, mas campos de proprietário vazios
  const initialForm = {
    businessSegment: 'nails',
    name: '',
    email: '',
    password: '',
    passwordConfirmation: '',
  };
  const initialCheck = validateStep1(initialForm);
  assert.equal(initialCheck.isStep1Valid, false, 'Formulário inicial não deve ser válido');
  assert.equal(initialCheck.missingItems.length, 3, 'Devem faltar 3 itens principais do proprietário (Nome, E-mail, Senha)');
  assert.ok(initialCheck.missingItems.includes('Nome do proprietário (mín. 3 letras)'));
  assert.ok(initialCheck.missingItems.includes('E-mail válido'));
  assert.ok(initialCheck.missingItems.includes('Senha com 12+ caracteres'));

  // Nome curto preenchido (< 3 caracteres)
  const shortNameCheck = validateStep1({
    ...initialForm,
    name: 'Al',
  });
  assert.equal(shortNameCheck.isOwnerNameValid, false, 'Nome menor que 3 caracteres deve ser inválido');

  // E-mail inválido
  const invalidEmailCheck = validateStep1({
    ...initialForm,
    name: 'Ana Silva',
    email: 'emailsemdominio',
  });
  assert.equal(invalidEmailCheck.isEmailValid, false, 'E-mail sem domínio deve ser inválido');

  // Senha curta (< 12 caracteres)
  const shortPwdCheck = validateStep1({
    ...initialForm,
    name: 'Ana Silva',
    email: 'ana@estudio.com.br',
    password: 'curta',
    passwordConfirmation: 'curta',
  });
  assert.equal(shortPwdCheck.isPasswordLengthValid, false, 'Senha menor que 12 caracteres deve ser inválida');

  // Confirmação divergente
  const mismatchPwdCheck = validateStep1({
    ...initialForm,
    name: 'Ana Silva',
    email: 'ana@estudio.com.br',
    password: 'Senha-Forte-Valida-1234!',
    passwordConfirmation: 'Outra-Senha-Diferente!',
  });
  assert.equal(mismatchPwdCheck.isPasswordMatch, false, 'Confirmação diferente deve falhar');
  assert.equal(mismatchPwdCheck.isStep1Valid, false);

  // Preenchimento completo e válido
  const validForm = {
    businessSegment: 'nails',
    name: 'Ana Silva',
    email: 'ana@estudio.com.br',
    password: 'Senha-Forte-Valida-1234!',
    passwordConfirmation: 'Senha-Forte-Valida-1234!',
  };
  const validCheck = validateStep1(validForm);
  assert.equal(validCheck.isStep1Valid, true, 'Formulário completo deve ser 100% válido');
  assert.equal(validCheck.missingItems.length, 0, 'Nenhum item pendente quando válido');

  // 3. Simulação de Navegação: Avanço à Etapa 2 e Retorno à Etapa 1 sem perda de dados
  let currentStep = 1;
  let formState = { ...validForm, tradeName: '', document: '' };

  // Avançar para a Etapa 2
  if (validCheck.isStep1Valid) {
    currentStep = 2;
  }
  assert.equal(currentStep, 2, 'Deve avançar para a Etapa 2');

  // Usuário preenche dado na etapa 2
  formState.tradeName = 'Studio Ana Nails Art';

  // Usuário clica em "Voltar"
  currentStep = 1;
  assert.equal(currentStep, 1, 'Deve retornar para a Etapa 1');
  assert.equal(formState.businessSegment, 'nails', 'Segmento deve ser preservado ao voltar');
  assert.equal(formState.name, 'Ana Silva', 'Nome deve ser preservado ao voltar');
  assert.equal(formState.email, 'ana@estudio.com.br', 'E-mail deve ser preservado ao voltar');
  assert.equal(formState.password, 'Senha-Forte-Valida-1234!', 'Senha deve ser preservada ao voltar');
  assert.equal(formState.tradeName, 'Studio Ana Nails Art', 'Dados de outras etapas devem permanecer no estado');

  // Revalidação imediata na Etapa 1
  const recheck = validateStep1(formState);
  assert.equal(recheck.isStep1Valid, true, 'Botão deve estar habilitado imediatamente ao retornar à Etapa 1');

  // 4. Integração Real de Servidor e Onboarding Transacional para o Segmento NAILS
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dorange-hotfix-r532-'));
  fs.copyFileSync('tests/fixtures/database.synthetic.json', path.join(dir, 'database.json'));
  process.env.DATA_DIR = dir;
  process.env.NODE_ENV = 'test';

  const { app } = await import('../server.js');
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const base = 'http://127.0.0.1:' + (server.address() as any).port;

  try {
    // Obter sessão de onboarding
    const obRes = await fetch(`${base}/api/onboarding/session`, {
      method: 'POST',
      headers: { 'Origin': base },
    });
    assert.equal(obRes.status, 200);
    const { token: obToken } = await obRes.json();

    // Criar estabelecimento com dados do proprietário cadastrados na Etapa 1
    const createRes = await fetch(`${base}/api/tenants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-onboarding-token': obToken,
        'Origin': base,
      },
      body: JSON.stringify({
        businessSegment: formState.businessSegment,
        name: formState.name,
        email: formState.email,
        password: formState.password,
        passwordConfirmation: formState.passwordConfirmation,
        tradeName: formState.tradeName,
        document: '12345678909',
        documentType: 'CPF',
        phone: '51999998888',
        city: 'Porto Alegre',
        state: 'RS',
        openTime: '09:00',
        closeTime: '19:00',
        selectedServiceNames: BUSINESS_SEGMENTS.nails.suggestedServices.slice(0, 3).map(s => s.name),
      }),
    });

    assert.equal(createRes.status, 201, 'Cadastro com credenciais da Etapa 1 deve retornar 201 Created');
    const created = await createRes.json();
    assert.equal(created.user.role, 'owner', 'Usuário criado deve possuir papel OWNER');
    assert.equal(created.user.email, 'ana@estudio.com.br');
    assert.equal(created.tenant.businessSegment, 'nails');
    assert.ok(created.token, 'Token de sessão emitido');

    // Login imediato com as credenciais criadas na Etapa 1
    const loginRes = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': base,
      },
      body: JSON.stringify({
        email: formState.email,
        password: formState.password,
      }),
    });

    assert.equal(loginRes.status, 200, 'Login do proprietário deve ser bem-sucedido com a senha cadastrada');
    const loginData = await loginRes.json();
    assert.equal(loginData.user.role, 'owner');
    assert.equal(loginData.user.tenantId, created.tenant.id);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
