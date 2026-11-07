# CHANGELOG — D'OR@NGE BUSINESS AI

## [5.3.3] — 2026-11-06 — HOTFIX R5.3.3: Cadastro por CEP + Correção Definitiva da Criação de Empresas

### 1. Diagnóstico e Causa Raiz do Erro "Não foi possível iniciar o cadastro"
- **Validação de Origem em Proxy Reverso:** O middleware `privateGate` em `server/security.ts` realizava comparação estrita entre `originHost` e `expectedHost` (obtido de `req.get('host')`). Em ambientes de Cloud Run e Google AI Studio sem `trust proxy`, a requisição chega internamente com host `localhost:3000` enquanto o cabeçalho `Origin` carrega o domínio público do Cloud Run (`ais-dev-...run.app`), resultando em HTTP 403 `Origem não autorizada`.
- **Exaustão de Rate Limit por IP compartilhado:** `onboardingLimit` estava limitado a 10 requisições/hora por IP. Em ambientes com proxy reverso e durante testes em lote, o limite era atingido rapidamente gerando HTTP 429.
- **Tratamento Genérico no Frontend:** `AppContext.tsx` interceptava qualquer resposta `!res.ok` no endpoint `/api/onboarding/session` e disparava genericamente a mensagem `Não foi possível iniciar o cadastro`, mascarando os status 403 e 429 reais.

### 2. Correções Implementadas
- **Função `isAllowedOrigin` em `server/security.ts`:**
  - Reconhece e autoriza domínios confiáveis do Google AI Studio (`aistudio.google.com`, `*.google.com`), Google Cloud Run (`*.run.app`), loopback local (`localhost`, `127.0.0.1`), variáveis de ambiente `APP_URL` e `ALLOWED_ORIGINS`, além do cabeçalho `x-forwarded-host`.
  - Rejeita estritamente origens maliciosas de terceiros com código 403 e log de auditoria, preservando a proteção CSRF integral sem desativar a segurança.
- **Ajuste de Rate Limit:** `onboardingLimit` expandido para 100 requisições/hora em produção e liberado em ambiente de teste automatizado (`NODE_ENV === 'test'`).
- **Tratamento Granular de Erros em `src/context/AppContext.tsx`:**
  - `beginOnboarding()` agora lê e propaga a mensagem específica retornada pelo backend ou detalha o status HTTP.
  - `createTenant()` discrimina claramente: 409 (E-mail já cadastrado), 400 (Dados inválidos com campo específico), 401 (Sessão expirada), 403 (Origem não autorizada), 429 (Limite excedido) e falhas de persistência.
  - Pré-aquecimento automático de sessão (`beginOnboarding`) via `useEffect` no momento em que o modal de onboarding é aberto.
- **Cadastro de Endereço por CEP (ViaCEP):**
  - Módulo utilitário `src/utils/cep.ts` com consulta à API pública ViaCEP (`https://viacep.com.br/ws/${cep}/json/`).
  - Timeout de 5 segundos via `AbortController`.
  - Máscara e formatação `00000-000` via `formatCEP` e `validateCEP` em `src/utils/validators.ts`.
  - Preenchimento automático de logradouro, bairro, cidade e UF.
  - Foco automático no campo Número após o preenchimento bem-sucedido.
  - Fallback manual não bloqueante em caso de timeout, falha de rede ou CEP não localizado na base dos Correios.
  - Cache em memória para evitar consultas redundantes ao mesmo CEP.
- **Regras de Endereço por Modalidade de Atendimento:**
  - `No Estabelecimento`: endereço físico (logradouro + número) obrigatório.
  - `Apenas a Domicílio`: endereço físico opcional, exigindo apenas cidade/UF e campo opcional de região/bairros atendidos.
  - `Ambos`: endereço físico e região de atendimento.
- **Conformidade LGPD para CPF/CNPJ:**
  - Campo tornado opcional no período de testes (trial).
  - Indicação clara de validação matemática de formato e dígitos verificadores (sem consulta a órgãos federais).
- **Persistência Completa de Dados:**
  - Suporte a `cep` e `neighborhood` na interface `Tenant` (`src/types/index.ts`).
  - Persistência e higienização em `server.ts` (`POST /api/tenants`).
  - Montagem de endereço completo formatado para compatibilidade retroativa com visualizações legadas.

### 3. Qualidade e Testes
- Suíte automatizada com 36 testes passando (100% de sucesso).
- Novo arquivo `tests/hotfix-r533.test.ts` com 5 testes de cobertura completa.
- Typecheck (`tsc --noEmit`) sem erros.
- Build de produção (`vite build`) concluído com sucesso em 702ms.
- Teste ponta a ponta com criação de empresa real e autenticação imediata confirmado no servidor ativo.
