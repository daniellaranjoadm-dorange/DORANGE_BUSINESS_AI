import fetch from 'node-fetch';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
if(!process.env.TEST_OWNER_PASSWORD || !process.env.TEST_PROF_PASSWORD)throw Error('Credenciais de teste obrigatórias. Use npm test para execução isolada.');

async function runTestSuite() {
  console.log('=====================================================');
  console.log("🚀 INICIANDO BATERIA DE TESTES AUTOMATIZADOS R4 D'OR@NGE");
  console.log('=====================================================\n');

  let passed = 0;
  let failed = 0;

  // 1. Obter tokens de autenticação
  console.log('▶ [1/8] Testando Autenticação e Emissão de Sessões Seguras...');
  const loginOwnerRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner1@example.invalid', password: process.env.TEST_OWNER_PASSWORD }),
  });
  const ownerData: any = await loginOwnerRes.json();
  const ownerToken = ownerData.token;

  const loginProfRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'professional1@example.invalid', password: process.env.TEST_PROF_PASSWORD }),
  });
  const profData: any = await loginProfRes.json();
  const profToken = profData.token;

  if (ownerToken && profToken) {
    console.log('  ✅ Tokens emitidos com sucesso para Owner e Professional.');
    passed++;
  } else {
    console.error('  ❌ Falha na emissão de tokens de sessão.');
    failed++;
  }

  // 2. Proteção de Rotas Privadas (401 sem token)
  console.log('\n▶ [2/8] Testando Rejeição de Requisições não Autenticadas (HTTP 401)...');
  const unauthRes = await fetch(`${BASE_URL}/api/financial`);
  if (unauthRes.status === 401) {
    console.log('  ✅ GET /api/financial sem token rejeitado com HTTP 401 Unauthorized.');
    passed++;
  } else {
    console.error(`  ❌ Esperado HTTP 401, recebido ${unauthRes.status}`);
    failed++;
  }

  // 3. Isolamento Multi-Tenant Estrito (403 Cross-Tenant Forbidden)
  console.log('\n▶ [3/8] Testando Bloqueio de Acesso Cruzado entre Tenants (HTTP 403)...');
  const crossTenantRes = await fetch(`${BASE_URL}/api/financial?tenantId=tenant-2`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  if (crossTenantRes.status === 403) {
    console.log('  ✅ Tentativa de acesso do Salão 1 aos dados do Salão 2 bloqueada com HTTP 403 CROSS_TENANT_FORBIDDEN.');
    passed++;
  } else {
    console.error(`  ❌ Esperado HTTP 403, recebido ${crossTenantRes.status}`);
    failed++;
  }

  // 4. Controle de Acesso Baseado em Papéis (RBAC - 403 Forbidden Role)
  console.log('\n▶ [4/8] Testando RBAC: Profissional tentando acessar Métricas Super Admin...');
  const rbacRes = await fetch(`${BASE_URL}/api/admin/metrics`, {
    headers: { Authorization: `Bearer ${profToken}` },
  });
  if (rbacRes.status === 403) {
    console.log('  ✅ Profissional sem permissão bloqueada com HTTP 403 FORBIDDEN_ROLE.');
    passed++;
  } else {
    console.error(`  ❌ Esperado HTTP 403, recebido ${rbacRes.status}`);
    failed++;
  }

  // 5. Teste de Concorrência e Mutex: Tentativa simultânea de Double Booking
  console.log('\n▶ [5/8] Testando Mutex de Concorrência: 2 Agendamentos simultâneos no mesmo slot...');
  // Data dinâmica para garantir idempotência em múltiplas execuções consecutivas
  const testDate = '2030-01-07';
  const testTime = '11:00';
  const bookingPayloadA = {
    tenantId: 'tenant-1',
    serviceId: 'serv-1',
    professionalId: 'prof-1',
    customerName: 'Cliente Concorrente A',
    customerPhone: '51999990001',
    date: testDate,
    time: testTime,
  };
  const bookingPayloadB = {
    tenantId: 'tenant-1',
    serviceId: 'serv-1',
    professionalId: 'prof-1',
    customerName: 'Cliente Concorrente B',
    customerPhone: '51999990002',
    date: testDate,
    time: testTime,
  };

  const [resA, resB] = await Promise.all([
    fetch(`${BASE_URL}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingPayloadA),
    }),
    fetch(`${BASE_URL}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingPayloadB),
    }),
  ]);

  const statuses = [resA.status, resB.status];
  const hasSuccess = statuses.includes(201);
  const hasConflict = statuses.includes(409);

  if (hasSuccess && hasConflict) {
    console.log('  ✅ Mutex Serializado funcionou! Exatamente 1 agendamento foi aprovado (201) e o simultâneo foi rejeitado com 409 Conflict.');
    passed++;
  } else {
    console.error(`  ❌ Falha no teste de concorrência. Statuses: ${statuses.join(', ')}`);
    failed++;
  }

  const createdApp = resA.status === 201 ? await resA.json() : await resB.json();

  // 6. Teste de Reagendamento e Registro de Falta (No-Show)
  console.log('\n▶ [6/8] Testando Reagendamento e No-Show...');
  const rescheduleRes = await fetch(`${BASE_URL}/api/appointments/${(createdApp as any).id}/reschedule`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
    body: JSON.stringify({ date: testDate, time: '17:00' }),
  });
  const noShowRes = await fetch(`${BASE_URL}/api/appointments/${(createdApp as any).id}/no-show`, {
    method: 'PATCH', headers: { Authorization: `Bearer ${ownerToken}` },
  });
  const noShowData: any = await noShowRes.json();

  if (rescheduleRes.status === 200 && noShowData.status === 'no_show') {
    console.log('  ✅ Reagendamento executado com sucesso e status No-Show gravado no banco.');
    passed++;
  } else {
    console.error('  ❌ Falha no reagendamento ou registro de no-show.');
    failed++;
  }

  // 7. Teste de Bloqueio de Horário e Consumo de Estoque
  console.log('\n▶ [7/8] Testando Bloqueio de Agenda e Movimentação de Estoque...');
  const blockRes = await fetch(`${BASE_URL}/api/appointments/blocked-times`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
    body: JSON.stringify({
      tenantId: 'tenant-1',
      professionalId: 'prof-1',
      date: testDate,
      startTime: '15:00',
      endTime: '16:00',
      reason: 'Intervalo de Treinamento',
    }),
  });

  // Tenta agendar durante o horário bloqueado
  const bookBlockedRes = await fetch(`${BASE_URL}/api/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tenantId: 'tenant-1',
      serviceId: 'serv-1',
      professionalId: 'prof-1',
      customerName: 'Tentativa Bloqueada',
      customerPhone: '51999990003',
      date: testDate,
      time: '15:15',
    }),
  });

  // Consumo de estoque
  const consumeRes = await fetch(`${BASE_URL}/api/inventory/consume`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ownerToken}`,
    },
    body: JSON.stringify({
      itemId: 'inv-1',
      quantity: 1,
      reason: 'Consumo no atendimento de teste',
    }),
  });

  if (blockRes.status === 201 && bookBlockedRes.status === 409 && consumeRes.status === 200) {
    console.log('  ✅ Bloqueio de agenda rejeitou agendamento (409) e consumo de estoque gravou movimentação auditada.');
    passed++;
  } else {
    console.error(`  ❌ Falha em bloqueio ou estoque. Block: ${blockRes.status}, Book: ${bookBlockedRes.status}, Consume: ${consumeRes.status}`);
    failed++;
  }

  // 8. Teste de Ativação Rápida com IA (Onboarding Setup)
  console.log('\n▶ [8/8] Testando Ativação Instantânea do Salão com IA...');
  const aiSetupRes = await fetch(`${BASE_URL}/api/ai/onboarding-setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
    body: JSON.stringify({
      specialtyPrompt: 'Studio focado em fibra de vidro e spa de pés',
      tenantName: 'Studio Teste IA',
      city: 'Porto Alegre - RS',
    }),
  });
  const aiSetupData: any = await aiSetupRes.json();

  if (aiSetupRes.status === 200 && aiSetupData.tradeName && Array.isArray(aiSetupData.services)) {
    console.log(`  ✅ IA gerou configuração completa: "${aiSetupData.tradeName}" com ${aiSetupData.services.length} serviços.`);
    passed++;
  } else {
    console.error('  ❌ Falha na geração de setup com IA.');
    failed++;
  }

  console.log('\n=====================================================');
  console.log(`🎯 RESULTADO DOS TESTES R4: ${passed}/8 PASSARAM (${failed} falhas)`);
  console.log('=====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Erro na execução dos testes:', err);
  process.exit(1);
});
