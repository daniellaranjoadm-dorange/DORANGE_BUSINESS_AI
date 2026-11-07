# D'OR@NGE BUSINESS AI — RELATÓRIO TÉCNICO HOTFIX R5.3.1
## Correção Crítica do Onboarding e Autenticação do Proprietário

**Data:** 06 de Novembro de 2026  
**Versão Anterior:** R5.3.0  
**Versão Atual:** R5.3.1  
**Autor:** CTO & Arquiteto Full-Stack D'OR@NGE BUSINESS AI  

---

## 1. RESUMO EXECUTIVO

Em testes operacionais manuais da versão R5.3.0, foi identificado um bloqueio crítico na conclusão do cadastro de novos estabelecimentos:
1. O usuário preenchia todas as 5 etapas do modal de onboarding, porém, ao acionar o botão de conclusão na **Etapa 5 (Agenda & Horários de Funcionamento)**, a interface travava em estado indefinido sem concluir o cadastro e sem feedback de erro explícito.
2. O formulário de onboarding não apresentava de forma clara e inicial a criação de credenciais de acesso (e-mail e senha com confirmação) para o proprietário da empresa, gerando insegurança operacional quanto a como o gestor acessaria o sistema após a conclusão.

Este Hotfix R5.3.1 diagnostica a causa raiz de rede e infraestrutura, reformula a experiência de cadastro de credenciais do proprietário para a Etapa 1, garante a transacionalidade atômica da criação da empresa e do usuário `OWNER`, e valida o redirecionamento imediato e seguro para o painel administrativo.

---

## 2. DIAGNÓSTICO E CAUSAS RAIZ

### 2.1 Rejeição de Origem no Reverse Proxy (`server/security.ts`)
- **Comportamento Observado:** O servidor retornava `HTTP 403 Forbidden` com corpo `{"error": "Origem não autorizada"}` para as requisições `POST /api/onboarding/session` e `POST /api/tenants`.
- **Causa Raiz:** O middleware de segurança `privateGate` comparava a string literal de origem com `${req.protocol}://${req.get('host')}`. No ambiente de build e preview conteinerizado (Cloud Run / AI Studio), o proxy reverso encerra o SSL externamente e encaminha as requisições ao backend Node.js em HTTP puro (`req.protocol === 'http'`), enquanto a requisição do navegador do usuário carrega o cabeçalho `Origin: https://...run.app`. A discrepância de protocolo causava a rejeição espúria de todas as mutações legítimas de clientes autenticáveis.

### 2.2 Bloqueio Silencioso de `alert()` em iFrames Modernos
- **Comportamento Observado:** Na falha da requisição, a interface mantinha o botão inerte e o usuário não recebia nenhuma indicação do motivo do erro.
- **Causa Raiz:** O bloco `catch` de `handleFinalize` em `src/components/OnboardingModal.tsx` utilizava a função padrão `alert(error.message)`. Políticas de segurança de iframes sandboxed bloqueiam ou silenciam janelas modais nativas de diálogo (`window.alert()`), impedindo a visualização da mensagem de erro e congelando a tela.

### 2.3 Tratamento de Token e Perda de Sessão
- **Comportamento Observado:** Usuários que conseguiam submeter o formulário caíam imediatamente na tela de login deslogados.
- **Causa Raiz:** Em `AppContext.tsx`, a função `createTenant` executava `localStorage.removeItem('dorange_token')` e `setSessionToken('')`, descartando o token JWT retornado pelo endpoint de criação e dependendo exclusivamente de cookies `Set-Cookie`. Em janelas incorporadas com isolamento de cookies de terceiros, as requisições subsequentes falhavam com `401 Unauthorized`.

### 2.4 Ausência de Confirmação de Senha e Validação Tardia
- **Comportamento Observado:** A senha era solicitada de forma secundária na Etapa 2 sem campo de confirmação, e caso o usuário digitasse uma senha menor que 12 caracteres, o erro só surgia na tentativa final de envio na Etapa 5.

---

## 3. SOLUÇÃO IMPLEMENTADA

### 3.1 Correção do Filtro de Origem (`server/security.ts`)
O middleware `privateGate` foi atualizado para comparar o host (`new URL(origin).host === req.get('host')`), garantindo compatibilidade com proxies reversos, balanceadores de carga com terminação SSL e portas alternativas de desenvolvimento, sem abrir mão da proteção estrita contra ataques CSRF e origens externas não autorizadas.

### 3.2 Redesenho da Etapa 1 — Credenciais do Proprietário (`src/components/OnboardingModal.tsx`)
A primeira etapa do modal foi promovida a **"Identificação do Negócio & Proprietário"**:
- **Campos Obrigatórios:** Nome do Estabelecimento, Segmento de Atuação, Nome Completo do Proprietário, E-mail do Proprietário, Senha de Acesso e Confirmação de Senha.
- **Validação Pre-flight em Tempo Real:** O botão de avanço para a Etapa 2 fica desabilitado até que:
  - O e-mail possua formato válido.
  - A senha atinja o requisito mínimo de 12 caracteres (com contador e barra de progresso visual de força).
  - A confirmação de senha coincida exatamente com a senha digitada.
  - O usuário conta com botão de alternância de visibilidade da senha (ícones Olho / Olho Riscado).

### 3.3 Conclusão Transacional e Atômica (`server.ts` & `server/db.ts`)
O endpoint `POST /api/tenants` executa em uma única transação atômica em memória e disco:
1. **Validação de Payload:** Checagem de e-mail, integridade de segmentos, serviços e horário comercial.
2. **Checagem de Conflitos:** Verificação prévia de unicidade de e-mail no banco. Retorna `HTTP 409 Conflict` com mensagem clara: *"Já existe uma conta cadastrada com este e-mail. Utilize outro e-mail ou faça login."*
3. **Criptografia Segura:** Geração de salt aleatório de 16 bytes e derivação de chave scrypt (N=16384, r=8, p=1). Senhas em texto puro são descartadas imediatamente da memória.
4. **Criação do Tenant e do Usuário OWNER:** Criação da empresa, vinculação do proprietário com perfil `OWNER` (nunca Super Admin global), registro do profissional titular no catálogo de equipe e persistência imediata dos serviços escolhidos e horários configurados.
5. **Geração de Token de Sessão:** O backend emite o cookie HttpOnly seguro e simultaneamente retorna o token JWT assinado no JSON de resposta.

### 3.4 Persistência de Sessão e Resiliência em iFrame (`src/context/AppContext.tsx`)
- `createTenant` e `login` agora persistem o token retornado em `localStorage.setItem('dorange_token', result.token)` e atualizam o estado React `sessionToken`.
- O helper de rede `authFetch` injeta o cabeçalho `Authorization: Bearer <token>` em todas as requisições protegidas, tornando o D'OR@NGE imune a bloqueios de cookies de terceiros em iframes e navegadores com proteção estrita de privacidade (Safari / Chrome Incognito / Firefox ETP).

### 3.5 Experiência de Conclusão e Feedback Visual (Etapa 5 e 6)
- **Banner de Erro Integrado:** Se ocorrer qualquer falha de rede ou validação na Etapa 5, um banner de alerta vermelho surge no topo do modal com mensagem explicativa e botão "Tentar Novamente", sem fechar o modal e sem perder nenhum dado preenchido.
- **Bloqueio de Duplo Clique (`isSubmitting`):** O botão exibe spinner animado e texto *"Criando seu Estabelecimento..."*, impedindo submissões concorrentes.
- **Etapa 6 (Confirmação & Boas-Vindas):** Exibe resumo das credenciais criadas (e-mail e papel `OWNER`) e aciona o botão *"Ir para o Meu Painel"*, que fecha o modal e transiciona diretamente o usuário para a visão `dashboard` do seu novo negócio.

---

## 4. AUDITORIA DE SEGURANÇA E ISOLAMENTO

| Critério de Segurança | Implementação | Status |
| :--- | :--- | :---: |
| **Hashing de Senha** | Scrypt criptográfico com salt aleatório (`server/passwords.ts`) | **Conforme** |
| **Credenciais em Logs** | Nenhuma senha trafega em logs de terminal ou console | **Conforme** |
| **Privilégios de Acesso** | Novo proprietário recebe perfil restrito `OWNER` (sem privilégios de `SUPER_ADMIN`) | **Conforme** |
| **Isolamento de Tenants** | Todas as consultas e gravações utilizam `tenantId` isolado | **Conforme** |
| **Proteção de Banco** | Mutações utilizam locking por PID; `ALLOW_EMPTY_DB=false` preservado | **Conforme** |
| **Segurança de Código** | Pastas `data/` e `uploads/` preservadas e excluídas no `.gitignore` | **Conforme** |

---

## 5. RESULTADOS DOS TESTES AUTOMATIZADOS

Foi desenvolvido o arquivo de teste `tests/hotfix-r531.test.ts` para homologar ponta a ponta as correções. Execução da suíte completa do projeto:

```bash
$ npm test
> dorange-business-ai@5.3.1 test
> tsx --test tests/*.test.ts

✔ cookie HttpOnly autentica a interface e bloqueia POST de outra origem (1776ms)
✔ auditoria referencial verifica todas as coleções e detecta vínculos entre empresas (7ms)
✔ schema e exportação executam em PostgreSQL embutido sem perda de coleções (5596ms)
✔ banco corrompido nunca é substituído por seeds (218ms)
✔ falha na escrita atômica é propagada e reverte memória e arquivo (12ms)
✔ HOTFIX R5.3.1: fluxo completo de onboarding transacional, credenciais do proprietário e autenticação (2229ms)
✔ suíte R4 mantém oito regressões com credenciais reais e banco isolado (2280ms)
✔ multissegmento: todos os 7 segmentos possuem configurações, terminologia e catálogo definidos (1ms)
✔ proteção do banco: recuperação segura a partir de database.backup.json quando database.json estiver ausente (313ms)
✔ proteção do banco: bloqueia criação de banco vazio quando ALLOW_EMPTY_DB=false e nenhum arquivo existir (338ms)
✔ recursos físicos: concorrência e capacidade de recursos físicos impedem conflito (3ms)
✔ login sem senha, por papel e com senha incorreta são rejeitados (1457ms)
✔ tokens previsíveis e fabricados são rejeitados (23ms)
✔ APIs privadas exigem autenticação, inclusive todas as operações de escrita (124ms)
✔ cadastro exige autorização temporária e senha forte (15ms)
✔ cadastro completo nails preserva serviços, horários e proprietário (105ms)
✔ cadastro completo barber preserva serviços, horários e proprietário (87ms)
✔ cadastro completo beauty preserva serviços, horários e proprietário (102ms)
✔ cadastro completo brows_lashes preserva serviços, horários e proprietário (87ms)
✔ cadastro completo esthetics preserva serviços, horários e proprietário (85ms)
✔ cadastro completo massage preserva serviços, horários e proprietário (64ms)
✔ cadastro completo home_services preserva serviços, horários e proprietário (60ms)
✔ login válido ignora papel do cliente; administrador e empresa alheia são negados (84ms)
✔ sessões expiram e logout revoga token (138ms)
✔ PNG falso, HTML, MIME errado e empresa alheia são rejeitados (16ms)
✔ imagem real é persistida, isolada, publicada explicitamente e excluída fisicamente (58ms)
✔ onboarding temporário não pode gravar na empresa de uma sessão existente (16ms)
✔ resposta pública é mínima e agenda impede conflito concorrente (30ms)
✔ encerramento de conta preserva dados e revoga sessões sem deixar vínculos órfãos (18ms)
✔ todos os registros anteriores permanecem iguais após as operações (1ms)

Total: 30 passed, 0 failed, 0 skipped.
```

---

## 6. CONCLUSÃO

O Hotfix R5.3.1 soluciona definitivamente a falha de travamento na Etapa 5 e eleva o padrão de experiência do usuário, permitindo que novos empreendedores cadastrem seu negócio em qualquer um dos sete segmentos, definam suas credenciais com segurança, e assumam imediatamente o comando operacional do seu estabelecimento.
