import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const server = readFileSync('server.ts', 'utf8');
const service = readFileSync(
  'server/aiFinancialPersistence.ts',
  'utf8'
);

test('B4.3: endpoint financeiro existe', () => {
  assert.match(server, /\/api\/ai\/financial\/confirm/);
});

test('B4.3: endpoint exige autenticacao', () => {
  assert.match(
    server,
    /\/api\/ai\/financial\/confirm'[\s\S]*?requireAuth/
  );
});

test('B4.3: endpoint exige isolamento multiempresa', () => {
  assert.match(
    server,
    /\/api\/ai\/financial\/confirm'[\s\S]*?enforceTenantIsolation/
  );
});

test('B4.3: endpoint restringe papeis', () => {
  assert.match(
    server,
    /\/api\/ai\/financial\/confirm'[\s\S]*?requireRoles\('superadmin', 'owner', 'manager'\)/
  );
});

test('B4.3: utiliza persistencia segura', () => {
  assert.match(
    server,
    /createConfirmedAiFinancialTransaction\(\s*db/
  );
});

test('B4.3: lancamentos da IA iniciam pendentes', () => {
  const creation = service.match(
    /const transaction: FinancialRecord = \{([\s\S]*?)\n  \};/
  );

  assert.ok(creation, 'Bloco de criacao nao encontrado');
  assert.match(creation[1], /status:\s*'pending'/);
  assert.doesNotMatch(creation[1], /status:\s*'paid'/);
});

test('B4.3: nao presume pagamento via PIX', () => {
  const creation = service.match(
    /const transaction: FinancialRecord = \{([\s\S]*?)\n  \};/
  );

  assert.ok(creation);
  assert.doesNotMatch(creation[1], /paymentMethod:\s*'pix'/);
});

test('B4.3: conflitos retornam HTTP 409', () => {
  assert.match(server, /res\.status\(409\)/);
});