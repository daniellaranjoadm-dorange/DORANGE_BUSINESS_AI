# R5.3.1 — 06/11/2026

## Hotfix Crítico: Estabilização do Onboarding e Autenticação do Proprietário

- **Diagnóstico e Resolução do Travamento na Etapa 5 (Agenda & Horários)**:
  - **Filtro de Origem Resiliente a Proxies**: Corrigido `privateGate` em `server/security.ts`. Ambientes com terminação SSL externa (Cloud Run / AI Studio / proxies reversos) apresentavam `req.protocol` como `http` enquanto o header `Origin` do navegador continha `https://`, gerando HTTP 403 (*"Origem não autorizada"*) silencioso. A validação agora compara estritamente o host (`originHost !== expectedHost`).
  - **Eliminação de Modais Bloqueados em iFrame**: Substituídos `alert()` nativos por banner visual de erro reativo (`submitError`) na interface do `OnboardingModal.tsx`, permitindo retry imediato sem recarregar e sem perda dos dados preenchidos.
  - **Proteção de Submissão e Duplo Clique**: Adicionado estado `isSubmitting` com spinner animado e bloqueio do botão *"Concluir & Publicar Empresa"* durante a requisição transacional.

- **Cadastro e Autenticação Transparente do Proprietário**:
  - **Credenciais em Destaque na Etapa 1**: O formulário agora solicita imediatamente Nome Completo, E-mail de Acesso, Senha (mínimo de 12 caracteres com medidor de requisitos e toggle de visibilidade) e Confirmação de Senha.
  - **Validação Pre-flight**: A Etapa 1 só permite avanço quando as credenciais do proprietário são válidas e as senhas coincidem.
  - **Conclusão Transacional e Atômica (`POST /api/tenants`)**: Validação de confirmação de senha no backend, detecção de e-mail duplicado retornando HTTP 409 legível, geração de hash criptográfico seguro via `scrypt` com salt aleatório e criação atômica do usuário com perfil `OWNER` (sem privilégios indevidos de Super Admin).

- **Persistência de Sessão e Acesso Direto ao Painel**:
  - **Suporte Robusto a iFrame**: `AppContext.tsx` preserva o token de sessão retornado pela criação da empresa em `localStorage` e o injeta como cabeçalho `Authorization: Bearer` nas chamadas subsequentes, garantindo navegação sem deslogar em navegadores com restrições a cookies de terceiros.
  - **Etapa 6 de Confirmação**: Exibe resumo visual das credenciais criadas (e-mail e papel OWNER) com botão de acesso direto ao painel executivo da empresa.

- **Garantia de Qualidade e Testes**:
  - Nova suíte de testes automatizados `tests/hotfix-r531.test.ts` cobrindo o fluxo transacional completo, validação de senha fraca, rejeição de e-mail duplicado, hashing scrypt e isolamento entre estabelecimentos.
  - 30 de 30 testes aprovados em `npm test` sem quebra de compatibilidade com versões anteriores.
