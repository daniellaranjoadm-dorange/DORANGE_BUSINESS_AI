# Verificação da cópia para GitHub — 05/11/2026

- Dados históricos, backups, uploads, evidências antigas, node_modules e build não são versionados.
- Removidos dados de pessoas do seed embutido. Nova instalação inicializa coleções vazias; contas são criadas pelo cadastro, sem senha padrão.
- Testes usam tests/fixtures/database.synthetic.json, construído com exemplos fictícios, sem hashes ou tokens reais.
- npm ci offline passou; npm run typecheck passou; npm test: 25/25 (incluindo R4 8/8); npm run build passou, com aviso de bundle acima de 500 kB.
- npm run setup:local criou banco vazio local, ignorado pelo Git. O comando recusa sobrescrever banco existente.
- A importação e execução dentro do Google AI Studio ainda não foram realizadas. Dados persistentes e integrações externas exigem homologação própria.
- RELATORIO-R5.2.md registra a entrega local anterior. As evidências/dados confidenciais referidos ali permanecem no ZIP local completo.
