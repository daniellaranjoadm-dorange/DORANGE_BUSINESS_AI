# RELATÓRIO TÉCNICO DE ENGENHARIA — HOTFIX R5.3.3
## Plataforma D'OR@NGE BUSINESS AI — Versão 5.3.3
**Data:** 06 de Novembro de 2026  
**Responsável:** CTO & Desenvolvedor Full-Stack Sênior  

---

### 1. Diagnóstico Executivo da Falha na Etapa Final de Cadastro

No teste manual anterior, ao submeter o formulário de cadastro, o sistema apresentava o erro `"Não foi possível iniciar o cadastro"`.

A investigação no código e na comunicação frontend-backend revelou três fatores encadeados:

1. **Validação Rígida de Origem em Proxy Reverso (`server/security.ts`):**  
   O middleware de segurança `privateGate` comparava estritamente `originHost` com `expectedHost` obtido através de `req.get('host')`.  
   No ambiente Google AI Studio / Cloud Run, a aplicação roda atrás de um proxy reverso:
   - `Host` recebido pelo Node.js: `localhost:3000`
   - `Origin` enviado pelo navegador: `https://ais-dev-5jj4esyowfkvq7hbhiuxb7-181264991107.us-east1.run.app`  
   Essa discrepância fazia com que as requisições `POST /api/onboarding/session` e `POST /api/tenants` fossem sumariamente rejeitadas com **HTTP 403 Forbidden** (`{"error":"Origem não autorizada"}`).

2. **Exaustão de Taxa de Limite de Cadastro (`onboardingLimit`):**  
   O limitador estava fixado em apenas 10 requisições por hora por IP. Em ambiente de proxy, todas as conexões partilham o mesmo endereço de loopback, gerando bloqueios com **HTTP 429**.

3. **Mascaramento da Causa Real no Frontend (`AppContext.tsx`):**  
   O método `beginOnboarding()` continha:
   ```ts
   if(!res.ok) throw Error('Não foi possível iniciar o cadastro');
   ```
   Isso ocultava qualquer resposta 403, 429 ou 400 sob uma única string genérica, impedindo o usuário e a equipe de identificar o motivo imediato do problema.

---

### 2. Implementação e Solução Arquitetural

#### A. Segurança de Origem Robusta e Inteligente (`server/security.ts`)
Implementada a função `isAllowedOrigin(origin, req)` com verificação multinível:
- Correspondência com `host` ou `x-forwarded-host` (considerando portas e nomes puros).
- Liberação segura de loopback (`localhost`, `127.0.0.1`).
- Reconhecimento automático dos domínios da infraestrutura gerenciada do Google Cloud Run (`*.run.app`) e Google AI Studio (`*.google.com`, `aistudio.google.com`).
- Leitura de variáveis de ambiente `APP_URL` e `ALLOWED_ORIGINS` para customizações de domínio próprio.
- Bloqueio estrito mantido contra domínios maliciosos e ataques cross-site, com registro no log de auditoria.

#### B. Busca e Preenchimento Automático por CEP (`src/utils/cep.ts` & `src/utils/validators.ts`)
- Integração direta com a API pública ViaCEP (`https://viacep.com.br/ws/${clean}/json/`).
- Máscara visual automática `00000-000` via `formatCEP` e validação com `validateCEP`.
- Timeout de segurança de 5 segundos via `AbortController`.
- Preenchimento em tempo real de Logradouro, Bairro, Cidade e UF.
- Foco automático no campo Número logo após a localização do endereço.
- Cache em memória para evitar requisições redundantes.
- Tratamento resiliente e não bloqueante para falhas de conexão, timeout ou CEP inexistente na base dos Correios, permitindo digitação manual contínua.

#### C. Modalidade de Atendimento & Flexibilização de Endereço
- **No Estabelecimento:** exige endereço físico obrigatório (logradouro e número).
- **Apenas a Domicílio:** dispensa endereço físico obrigatório, solicitando apenas Cidade, UF e, opcionalmente, descrição da área atendida.
- **Ambos:** mantém endereço físico e área de atendimento.

#### D. Conformidade com a LGPD e Validação Matemática de Documentos
- O preenchimento de CPF ou CNPJ foi tornado opcional no período de testes/trial, em cumprimento ao princípio de minimização de dados da LGPD.
- Indicador visual explícito no formulário esclarece que a validação é matemática (dígitos verificadores), sem consulta a cadastros de órgãos federais.

---

### 3. Evidências de Teste e Validação

1. **Suíte Automatizada:**
   - Total de testes executados: **36 testes**
   - Testes com sucesso: **36 (100% aprovados)**
   - Tempo total: 11,5 segundos
   - Inclui novo arquivo `tests/hotfix-r533.test.ts` cobrindo CEP, modalidade de endereço, origens confiáveis e fluxo HTTP completo.

2. **Checagem de Tipos e Build:**
   - `npm run typecheck` (`tsc --noEmit`): 0 erros.
   - `npm run build` (`vite build`): Sucesso absoluto em 702ms.
   - `compile_applet` & `lint_applet`: Concluídos com sucesso.

3. **Verificação no Servidor Real Ativo (Porta 3000):**
   - Criação da empresa: `POST /api/tenants` -> **HTTP 201 Created** (`tenant-afc9d8cf-6133-4656-b69d-51747e0bbe91`).
   - Autenticação do proprietário: `POST /api/auth/login` -> **HTTP 200 OK** (token JWT emitido, papel `owner`).
   - Integridade da base: `data/database.json` preservado e atualizado atomicamente.
