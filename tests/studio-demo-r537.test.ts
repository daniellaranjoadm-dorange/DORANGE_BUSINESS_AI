import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { configureStudioDemo } from '../server/studio-demo.js';

const keys = [
  'DORANGE_STUDIO_DEMO',
  'DORANGE_STUDIO_ALLOW_SEED',
  'NODE_ENV',
  'ALLOW_EMPTY_DB',
  'DATA_DIR'
] as const;

function isolatedEnvironment(
  values: Record<string, string | undefined>,
  operation: () => void
) {
  const original = Object.fromEntries(
    keys.map(key => [key, process.env[key]])
  );

  try {
    for (const key of keys) delete process.env[key];

    for (const [key, value] of Object.entries(values)) {
      if (value !== undefined) process.env[key] = value;
    }

    operation();
  } finally {
    for (const key of keys) {
      const value = original[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test('R5.3.7: modo Studio desativado e recusado', () => {
  isolatedEnvironment({}, () => {
    assert.throws(configureStudioDemo, /nao autorizado/);
  });
});

test('R5.3.7: criacao demonstrativa exige autorizacao', () => {
  isolatedEnvironment({
    DORANGE_STUDIO_DEMO: 'true'
  }, () => {
    assert.throws(configureStudioDemo, /Criacao demonstrativa/);
  });
});

test('R5.3.7: producao bloqueia modo Studio', () => {
  isolatedEnvironment({
    DORANGE_STUDIO_DEMO: 'true',
    DORANGE_STUDIO_ALLOW_SEED: 'true',
    NODE_ENV: 'production'
  }, () => {
    assert.throws(configureStudioDemo, /producao/);
  });
});

test('R5.3.7: DATA_DIR existente impede inicializacao', () => {
  isolatedEnvironment({
    DORANGE_STUDIO_DEMO: 'true',
    DORANGE_STUDIO_ALLOW_SEED: 'true',
    DATA_DIR: path.join(os.tmpdir(), 'banco-real-protegido')
  }, () => {
    assert.throws(configureStudioDemo, /DATA_DIR preexistente/);
  });
});

test('R5.3.7: demonstracao reutiliza armazenamento isolado', () => {
  isolatedEnvironment({
    DORANGE_STUDIO_DEMO: 'true',
    DORANGE_STUDIO_ALLOW_SEED: 'true'
  }, () => {
    const demoDir = configureStudioDemo();

    assert.ok(fs.existsSync(demoDir));
    assert.equal(process.env.DATA_DIR, demoDir);
    assert.equal(process.env.ALLOW_EMPTY_DB, 'true');

    assert.equal(
      path.basename(demoDir),
      'dorange-business-ai-studio-r537'
    );

    const envFile = path.join(demoDir, '.studio-empty.env');

    assert.ok(fs.existsSync(envFile));
    assert.equal(process.env.DOTENV_CONFIG_PATH, envFile);

    // Verifica a reutilizacao sem criar nem apagar dados reais.
    const previousDataDir = process.env.DATA_DIR;
    const previousAllowEmpty = process.env.ALLOW_EMPTY_DB;

    delete process.env.DATA_DIR;
    process.env.ALLOW_EMPTY_DB = 'false';

    const secondDir = configureStudioDemo();

    assert.equal(secondDir, demoDir);
    assert.equal(process.env.DATA_DIR, previousDataDir);
    assert.equal(process.env.ALLOW_EMPTY_DB, previousAllowEmpty);
  });
});
