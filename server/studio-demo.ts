import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export function configureStudioDemo(): string {
  if (process.env.DORANGE_STUDIO_DEMO !== 'true') {
    throw new Error('Modo Studio nao autorizado.');
  }

  if (process.env.DORANGE_STUDIO_ALLOW_SEED !== 'true') {
    throw new Error('Criacao demonstrativa nao autorizada.');
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Modo Studio proibido em producao.');
  }

  if (process.env.DATA_DIR) {
    throw new Error('DATA_DIR preexistente: acesso recusado.');
  }

  if (process.env.ALLOW_EMPTY_DB === 'true') {
    throw new Error('ALLOW_EMPTY_DB previamente ativo.');
  }

  const demoDir = path.join(
    os.tmpdir(),
    'dorange-business-ai-studio-r537'
  );

  fs.mkdirSync(demoDir, { recursive: true });

  // Evita que dotenv/config leia o .env operacional.
  const emptyEnv = path.join(demoDir, '.studio-empty.env');
  if (!fs.existsSync(emptyEnv)) {
    fs.writeFileSync(emptyEnv, '');
  }

  process.env.DOTENV_CONFIG_PATH = emptyEnv;
  process.env.DISABLE_HMR = 'true';
  process.env.DATA_DIR = demoDir;
  process.env.ALLOW_EMPTY_DB = 'true';

  return demoDir;
}