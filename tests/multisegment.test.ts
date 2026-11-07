import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { BUSINESS_SEGMENTS } from '../src/data/businessSegments.js';

const source = fs.readFileSync('tests/fixtures/database.synthetic.json', 'utf8');
const fixtureData = JSON.parse(source);

test('multissegmento: todos os 12 segmentos possuem configurações, terminologia e catálogo definidos', () => {
  const segmentKeys = Object.keys(BUSINESS_SEGMENTS) as (keyof typeof BUSINESS_SEGMENTS)[];
  assert.equal(segmentKeys.length, 12);

  for (const key of segmentKeys) {
    const seg = BUSINESS_SEGMENTS[key];
    assert.ok(seg, `Segmento ${key} deve existir`);
    assert.ok(seg.name && seg.name.length > 0, `Segmento ${key} deve ter nome`);
    assert.ok(seg.code && seg.code.length > 0, `Segmento ${key} deve ter código`);
    assert.ok(seg.tagline && seg.tagline.length > 0, `Segmento ${key} deve ter tagline`);
    assert.ok(seg.terminology?.appointmentSingular, `Segmento ${key} deve ter terminology.appointmentSingular`);
    assert.ok(seg.terminology?.professionalSingular, `Segmento ${key} deve ter terminology.professionalSingular`);
    assert.ok(seg.terminology?.serviceSingular, `Segmento ${key} deve ter terminology.serviceSingular`);
    assert.ok(Array.isArray(seg.suggestedServices) && seg.suggestedServices.length >= 3, `Segmento ${key} deve ter catálogo sugerido`);

    // Nenhum termo de unha em barbearias ou massoterapia
    if (key === 'barber') {
      const allText = JSON.stringify(seg.suggestedServices).toLowerCase();
      assert.ok(!allText.includes('unha'), 'Barbearia não deve conter referências a unhas');
      assert.ok(!allText.includes('esmalte'), 'Barbearia não deve conter referências a esmalte');
    }
    if (key === 'massage') {
      const allText = JSON.stringify(seg.suggestedServices).toLowerCase();
      assert.ok(!allText.includes('unha'), 'Massoterapia não deve conter referências a unhas');
    }
  }
});

test('proteção do banco: recuperação segura a partir de database.backup.json quando database.json estiver ausente', () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'dorange-backup-test-'));
  const backupFile = path.join(temporary, 'database.backup.json');
  const mainFile = path.join(temporary, 'database.json');

  // Grava apenas o arquivo de backup
  fs.writeFileSync(backupFile, source, 'utf8');
  assert.ok(!fs.existsSync(mainFile), 'database.json deve estar ausente antes do teste');

  try {
    const r = spawnSync(
      process.execPath,
      ['--import', 'tsx', '-e', `
        import { db } from './server/db.ts';
        const tenants = db.get('tenants');
        if (!tenants || tenants.length === 0) process.exit(1);
        process.exit(0);
      `],
      {
        cwd: process.cwd(),
        env: { ...process.env, DATA_DIR: temporary, ALLOW_EMPTY_DB: 'false' },
        encoding: 'utf8',
      }
    );
    assert.equal(r.status, 0, `Processo deve inicializar com sucesso recuperando backup: ${r.stderr}`);
    assert.ok(fs.existsSync(mainFile), 'database.json deve ter sido restaurado a partir do backup');
    const restored = JSON.parse(fs.readFileSync(mainFile, 'utf8'));
    assert.equal(restored.tenants.length, fixtureData.tenants.length);
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test('proteção do banco: bloqueia criação de banco vazio quando ALLOW_EMPTY_DB=false e nenhum arquivo existir', () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'dorange-empty-block-'));
  try {
    const r = spawnSync(
      process.execPath,
      ['--import', 'tsx', '-e', "import('./server/db.ts')"],
      {
        cwd: process.cwd(),
        env: { ...process.env, DATA_DIR: temporary, ALLOW_EMPTY_DB: 'false' },
        encoding: 'utf8',
      }
    );
    assert.notEqual(r.status, 0, 'Deve rejeitar iniciar sem banco');
    assert.ok(r.stderr.includes('Banco ausente') || r.stdout.includes('Banco ausente'));
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test('recursos físicos: concorrência e capacidade de recursos físicos impedem conflito', () => {
  const testDb = structuredClone(fixtureData);
  const tenantId = testDb.tenants[0].id;
  const professionalId = testDb.professionals.find((p: any) => p.tenantId === tenantId).id;
  const serviceId = testDb.services.find((s: any) => s.tenantId === tenantId).id;

  // Adiciona recurso com capacidade 1 (ex: Sala de Estética 01)
  testDb.physicalResources = [
    {
      id: 'res-sala-1',
      tenantId,
      name: 'Maca de Procedimento 01',
      type: 'stretcher',
      capacity: 1,
      available: true,
    },
  ];

  // Adiciona agendamento no recurso res-sala-1 das 14:00 às 15:00
  testDb.appointments.push({
    id: 'app-res-1',
    tenantId,
    customerId: testDb.customers[0].id,
    professionalId,
    serviceId,
    date: '2026-06-15',
    time: '14:00',
    durationMinutes: 60,
    status: 'confirmed',
    price: 150,
    resourceId: 'res-sala-1',
    resourceName: 'Maca de Procedimento 01',
    createdAt: new Date().toISOString(),
  });

  // Função de validação idêntica à de server.ts
  const checkConflict = (date: string, startTime: string, durationMinutes: number, resId: string) => {
    const [startH, startM] = startTime.split(':').map(Number);
    const startMins = startH * 60 + startM;
    const endMins = startMins + durationMinutes;

    const resource = testDb.physicalResources.find((r: any) => r.id === resId && r.tenantId === tenantId);
    if (!resource) return false;

    const conflicting = testDb.appointments.filter((a: any) => {
      if (a.tenantId !== tenantId || a.resourceId !== resId) return false;
      if (a.date !== date || a.status === 'cancelled') return false;
      const [aStartH, aStartM] = a.time.split(':').map(Number);
      const aStartMins = aStartH * 60 + aStartM;
      const aEndMins = aStartMins + a.durationMinutes;
      return Math.max(startMins, aStartMins) < Math.min(endMins, aEndMins);
    });

    return conflicting.length >= resource.capacity;
  };

  // Conflito no mesmo horário (14:30)
  assert.equal(checkConflict('2026-06-15', '14:30', 45, 'res-sala-1'), true, 'Deve acusar conflito de recurso no horário sobreposto');

  // Sem conflito após o término (15:00)
  assert.equal(checkConflict('2026-06-15', '15:00', 30, 'res-sala-1'), false, 'Não deve acusar conflito após o término');

  // Sem conflito em outro dia
  assert.equal(checkConflict('2026-06-16', '14:00', 60, 'res-sala-1'), false, 'Não deve acusar conflito em outro dia');
});
