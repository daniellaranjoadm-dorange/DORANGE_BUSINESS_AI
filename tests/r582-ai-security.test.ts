import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const server = readFileSync('server.ts', 'utf8');

const protectedRoutes = [
  '/api/ai/chat',
  '/api/ai/parse-catalogue',
  '/api/ai/generate-copy',
  '/api/catalogue/import',
];

for (const route of protectedRoutes) {
  test(`R5.8.2: ${route} possui middlewares obrigatorios`, () => {
    const declaration = server
      .split('\n')
      .find(line => line.includes(`app.post('${route}'`));

    assert.ok(declaration, `Rota ausente: ${route}`);

    const required = [
      'requireAuth',
      'enforceTenantIsolation',
      'requireRoles',
    ];

    for (const middleware of required) {
      assert.ok(
        declaration.includes(middleware),
        `${route} sem ${middleware}`
      );
    }

    assert.ok(
      declaration.indexOf('requireAuth') <
      declaration.indexOf('enforceTenantIsolation'),
      'Autenticacao deve preceder isolamento'
    );
  });
}

test('R5.8.2: componentes de IA utilizam cliente compartilhado', () => {
  for (const name of [
    'AiAssistantWorkspace.tsx',
    'CatalogueImportWorkspace.tsx',
  ]) {
    const source = readFileSync(`src/components/${name}`, 'utf8');

    assert.match(source, /import\s*\{\s*authenticatedFetch\s*\}/);
    assert.doesNotMatch(
      source,
      /const authenticatedFetch\s*=/
    );
  }
});

test('R5.8.2: cliente compartilhado preserva autenticacao', () => {
  const source = readFileSync(
    'src/utils/authenticatedFetch.ts',
    'utf8'
  );

  assert.match(source, /Authorization/);
  assert.match(source, /Bearer/);
  assert.match(source, /credentials:\s*'same-origin'/);
});