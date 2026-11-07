# Cópia para desenvolvimento e importação no AI Studio

Sem dados reais ou backups no repositório. Veja IMPORTAR-AI-STUDIO.md. Para iniciar: npm ci, npm run setup:local, npm run dev. Para testar: npm test (fixtures sintéticas isoladas). Consulte CHANGELOG-R5.3.md e RELATORIO-R5.3.md para detalhes da versão R5.3.

# D'OR@NGE BUSINESS AI — R5.3
## Entrega R5.3 (v5.3.0)

Evolução de estabilização, experiência comercial e multissegmento sobre a R5.2. Consulte CHANGELOG-R5.3.md, RELATORIO-R5.3.md e OPERACAO-R5.2.md antes de implantação. Testes finais: 29/29 aprovados (incluindo suíte multissegmento e R4 8/8); typecheck e build passam 100%.

Principais destaques da R5.3:
- Proteção automática do banco de dados com autorrecuperação a partir de `database.backup.json` e bloqueio estrito de criação inadvertida de banco vazio (`ALLOW_EMPTY_DB=false`).
- Concorrência de recursos físicos (macas, salas, cadeiras, lavatórios e equipamentos) validada na criação e no reagendamento de atendimentos.
- Experiência comercial e vocabulário especializado para os 7 segmentos (`NAILS`, `BARBER`, `BEAUTY`, `BROWS_LASHES`, `ESTHETICS`, `MASSAGE`, `HOME_SERVICES`), sem contaminação de termos de unhas em barbearias ou massoterapia.
- Dashboard Executivo e livro caixa com métricas 100% reais (zero fallbacks artificiais) e emissão de comprovante imprimível com menção explícita de registro manual.
- Dados das pastas `data/` e `uploads/` são históricos e protegidos por `.gitignore`: nunca versionar dados reais de clientes no GitHub. Use `DATA_DIR` para o volume de produção.

As seções abaixo documentam a base preservada da R5.1; os resultados atuais e suas limitações estão no relatório R5.2.

Correção de segurança e estabilização sobre a R5 existente. Os módulos de agenda, clientes, catálogo, estoque, financeiro, marketing, pacotes, portfólio, WhatsApp e administração foram mantidos.

## Instalação e execução

Requer Node.js 24 e npm 11 (validação feita com Node 24.21.0 e npm 11.19.0).

```sh
npm ci
npm run lint
npm test
npm run build
npm start
```

`npm install` também funciona sem `--legacy-peer-deps`. O lockfile fixa a resolução. `npm start` usa `tsx`, incluído nas dependências de execução. Para servir o build, configure `NODE_ENV=production` antes de iniciar. `npm run dev` inicia o servidor com o frontend Vite.

Configurações em `.env.example`: `DATA_DIR`, `HOST`, `PORT`, `COOKIE_SECURE` e `GEMINI_API_KEY`. A porta padrão é 3000 e o host padrão é 127.0.0.1. Em implantação, use HTTPS, cookie seguro e encaminhamento do proxy que preserve host/protocolo; configure o proxy de forma restrita ao ambiente. O diretório de dados e uploads precisa de volume persistente e permissão de escrita para o usuário do serviço.

O runtime continua usando **JSON local**. PostgreSQL **não foi implantado**. Use apenas um processo por banco; um lock exclusivo rejeita uma segunda abertura. Sessões ficam em memória, expiram em oito horas e são revogadas no logout ou reinício. Não usar múltiplas réplicas com sessões e armazenamento locais.

## Acesso e recuperação de contas anteriores

Não existe login por perfil, token demonstrativo ou criação automática de administrador por HTTP. Login exige e-mail e senha. O backend usa scrypt com salt aleatório e comparação constante. Novas senhas têm entre 12 e 128 caracteres. A interface usa cookie HttpOnly/SameSite=Strict; não salva o token em localStorage. A API também aceita Bearer para clientes autorizados.

As contas da R5 foram preservadas. Contas sem `passwordHash` ficam bloqueadas; não foi definida senha padrão. Para recuperar uma conta existente, o operador deve primeiro verificar a identidade do titular por canal confiável, parar o servidor e executar:

```sh
npm run credentials -- email-da-conta < entrada-segura-da-senha
```

O comando recebe a senha pela entrada padrão, não pelo argumento da linha de comando, e nunca cria conta ou altera papel/empresa. Em PowerShell, utilize um mecanismo local seguro para fornecer a entrada padrão. Não versionar arquivos com senhas. Reinicie o servidor após a ativação para invalidar quaisquer sessões anteriores. Recuperação por e-mail automatizada não está implementada; a rota HTTP retorna orientação genérica sem revelar existência de conta.

O Super Admin existente usa o mesmo procedimento de ativação local. Não há endpoint público para criar/promover administradores.

## Cadastro e segmentos

Cadastro cria empresa, proprietário vinculado, hash, profissional, serviços, estoque inicial específico do segmento e sessão. Recebe abertura/fechamento, pausa e buffer. Estoque inicial tem quantidade zero: os insumos precisam ser conferidos pelo estabelecimento. Presets: manicure, barbearia, salão, sobrancelhas/cílios, estética, massagem e atendimento domiciliar.

Serviços personalizados e os sugeridos pela IA aparecem para confirmação e são persistidos com preço e duração. Sem chave de IA, o onboarding pode retornar sugestões locais do segmento; isso não é uma chamada Gemini bem-sucedida. As integrações externas precisam de credenciais e validação próprias.

`POST /api/onboarding/session` cria autorização temporária de 30 minutos. O frontend usa `x-onboarding-token` para uploads de cadastro e sua conclusão. Essa autorização só permite o diretório temporário reservado ao futuro tenant. Não utiliza a sessão de outro estabelecimento. Limites por IP reduzem abuso do cadastro e login.

## APIs e imagens

APIs privadas passam por uma barreira central de autenticação, papel, tenant e referências de recursos. A criação pública de agendamento permanece disponível, validando empresa, serviço, profissional, expediente, pausa, bloqueios e conflitos. A consulta pública é `GET /api/public/booking/:slug?date=AAAA-MM-DD`: entrega somente campos necessários do estabelecimento, serviços, profissionais, portfólio publicado e horários ocupados; não inclui cadastro de clientes, telefone de clientes, custos, CPF/CNPJ, configuração WhatsApp ou financeiro.

Logo/capa, catálogo e portfólio usam upload real. Formatos PNG, JPEG e WebP, até 8 MB e 25 milhões de pixels; imagens são decodificadas e convertidas para WebP. HTML, MIME divergente, imagens inválidas e animações são recusados. Limites: 50 arquivos e 100 MB por empresa. Exclusão exige autorização e limpa referências persistidas. Falhas de upload não são convertidas em base64 salvo.

Arquivos não publicados exigem sessão da empresa ou autorização temporária do cadastro. Logo, capa, imagens de serviços ativos e portfólio explicitamente publicado são públicos por finalidade; não devem conter material confidencial. URLs HTTPS externas permanecem suportadas, mas disponibilidade depende do provedor externo.

Uploads de cadastros abandonados ficam inacessíveis após expiração; a limpeza automática desses arquivos órfãos ainda não foi implementada. Deve haver monitoramento do armazenamento e política operacional de retenção antes de exposição ampla.

Imagens institucionais estão em `public/images`; a rota `/src/assets/images` permanece como compatibilidade para referências históricas, sem reescrever dados antigos. Identidade institucional usa BUSINESS AI e mantém as marcas individuais.

## Persistência e migração

Gravação JSON usa arquivo temporário, fsync e rename, com backup anterior. Falhas propagam erro e revertem o estado em memória. Banco ausente/inválido interrompe a inicialização; nenhum banco existente é substituído por seeds. `ALLOW_EMPTY_DB=true` é somente para inicialização deliberada de uma instalação nova, nunca para recuperação. Backups precisam de validação e cópia externa; o arquivo anterior local não substitui backup operacional.

Auditoria R5 sem modificar o original:

```sh
npx tsx scripts/migrate-r5-segments.ts
```

Para gerar uma cópia, informe um **novo caminho** de saída. O script só preenche segmentos ausentes com nails, verifica integridade e não cria empresas demonstrativas nem altera planos silenciosamente.

Exportação PostgreSQL:

```sh
npx tsx scripts/migrate-to-postgres.ts
```

Gera `data/migration_r51.sql` e recusa sobrescrever um arquivo existente. `SQL_OUTPUT` permite outro destino. Não conecta nem executa SQL em produção. Aplique `src/db/schema.sql` e o dump somente em ambiente controlado, após revisão. As extensões opcionais uuid-ossp/pgcrypto exigem permissões/disponibilidade no servidor PostgreSQL de destino.

Schema inclui plano START, segmento, horários, recursos físicos, vínculo profissional–serviço e associação usuário–empresa. Exportação cobre financeiro, estoque/movimentos, pacotes, portfólio, marketing e demais coleções. Um snapshot JSONB e `raw_payload` conservam campos sem representação relacional direta. Vínculos inválidos impedem a exportação. Inserts são idempotentes por ID; não atualizam registros já existentes nem resolvem divergências automaticamente. O snapshot contém dados pessoais e hashes: proteja o dump como um backup confidencial.

## Testes e limites da validação

`npm test` usa cópias temporárias dos dados. Inclui login sem senha, papéis, tokens fabricados, cookie, expiração/logout, autorização de APIs, upload real/falso e exclusão, isolamento, cadastro de três segmentos, horários/pausas, serviços personalizados, estoque, concorrência de agenda, preservação de registros, erro de gravação, banco corrompido e exportação/importação PostgreSQL embutida. A suíte R4 de oito cenários também roda com credenciais reais no harness isolado.

O teste SQL usa PGlite em memória e omite apenas as instruções das extensões opcionais. Ele não comprova configuração, acesso, backup ou implantação em um servidor PostgreSQL externo. TypeScript e build são verificações separadas. Não houve teste manual em celular, validação visual completa nem teste de serviços externos reais. O build ainda avisa sobre o tamanho do bundle; isso não bloqueia a compilação.

Antes de produção: ativar as credenciais existentes com identidade verificada; configurar HTTPS/volume/backups; definir retenção dos temporários; executar homologação das telas e de dispositivos; validar credenciais das integrações. Verificar também políticas de consentimento e reservas públicas contra abuso. O cadastro de recursos físicos foi preservado, mas controle de capacidade na agenda não foi acrescentado nesta correção.

O arquivo data/migration_dump.sql da R5 foi conservado como histórico. Use o novo exportador R5.1; não trate esse dump antigo como migração completa.


A operação de encerramento de conta agora desativa a empresa e revoga as sessões, preservando todos os registros. A exclusão definitiva por solicitação LGPD exige revisão operacional de retenção; o sistema não afirma que os dados foram apagados.

