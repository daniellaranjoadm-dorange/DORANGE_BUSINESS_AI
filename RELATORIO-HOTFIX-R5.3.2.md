# D'OR@NGE BUSINESS AI — RELATÓRIO TÉCNICO HOTFIX R5.3.2
## Resolução do Bloqueio na Etapa 1 do Onboarding e Separação Visual

**Data:** 06 de Novembro de 2026  
**Versão Anterior:** R5.3.1  
**Versão Atual:** R5.3.2  
**Autor:** CTO & Desenvolvedor Full-Stack D'OR@NGE BUSINESS AI  

---

## 1. DESCRIÇÃO DO PROBLEMA & EVIDÊNCIA

Em testes manuais no modal de cadastro de novos estabelecimentos (`OnboardingModal.tsx`), observou-se a seguinte evidência:
- Ao abrir o modal, o segmento comercial inicial **NAILS** já aparecia selecionado por padrão.
- No entanto, o botão de avanço **"Continuar para Dados do Salão"** permanecia desabilitado sem qualquer explicação visual no rodapé.
- O usuário não conseguia identificar de imediato por que a ação de avançar estava bloqueada.

---

## 2. ANÁLISE DE CAUSA RAIZ

A inspeção detalhada do código em `src/components/OnboardingModal.tsx` revelou três fatores convergentes:

1. **Botão Inerte por Desativação Estrita (`disabled={!isStep1Valid}`)**:
   O botão possuía a diretiva `disabled={!isStep1Valid}`. O valor de `isStep1Valid` é composto pela conjunção:
   `Boolean(businessSegment) && isOwnerNameValid && isEmailValid && isPasswordLengthValid && isPasswordMatch`.
   Como o segmento `nails` já estava selecionado mas os campos do proprietário iniciavam vazios (`name: ''`, `email: ''`, `password: ''`), a condição era `false`, desabilitando o botão. Como elementos HTML `<button disabled>` não disparam eventos de clique, o usuário tentava clicar no botão e nada acontecia.

2. **Ocultamento Visual dos Campos de Credenciais (Abaixo da Dobra)**:
   A lista dos 7 segmentos de negócio era renderizada em uma grade de 2 colunas com cartões altos (cada um com código, título e descrição completa), totalizando 4 linhas verticais (~450px). Em telas padrão de notebook ou tablets, essa grade ocupava toda a altura do modal, empurrando o contêiner de dados do proprietário para baixo do campo de visão imediato (scroll off-screen). O usuário via o segmento selecionado e o botão desabilitado no rodapé, sem perceber que havia campos de proprietário a serem preenchidos mais abaixo.

3. **Ausência de Feedback e Mensagens Condicionadas à Digitação Prévia**:
   O bloco de ajuda da validação só era renderizado se `(formData.name || formData.email || formData.password)` fosse verdadeiro. No primeiro acesso, quando nenhum caractere havia sido digitado, nenhum aviso era exibido na tela ou no rodapé.

---

## 3. MODIFICAÇÕES ARQUITETURAIS IMPLEMENTADAS

### 3.1 Separação Visual em Duas Seções Identificadas
A Etapa 1 foi reestruturada em dois blocos visuais nítidos e ordenados:
- **Seção 1 — Tipo de Negócio (Segmento Comercial)**:
  - Header dedicado com ícone `Layers`, título e badge do segmento ativo (`[Ativo: NAILS]`).
  - Grade compacta e responsiva de 7 segmentos (3 colunas em desktop, 2 colunas em mobile), ocupando apenas ~140px de altura vertical.
  - Seleção imediata ao clique, atualizando o catálogo sugerido, regras e cores do segmento.
- **Seção 2 — Dados do Proprietário & Credenciais de Acesso**:
  - Contêiner destacado com fundo branco, borda `stone-200`, sombra sutil e badge `[Administrador OWNER]`.
  - Campos visíveis e organizados em grade de 2 colunas:
    1. **Nome Completo do Proprietário** (mínimo 3 letras).
    2. **E-mail de Login do Proprietário** (validação de formato RFC 5322).
    3. **Senha de Acesso** (mínimo 12 caracteres, com alternador de visibilidade e contador em tempo real).
    4. **Confirmação de Senha** (indicador em tempo real: "Senhas coincidem" / "Divergência").

### 3.2 Indicador de Progresso da Etapa 1
No topo da Etapa 1 foi introduzido um painel de resumo dinâmico:
- Mostra a barra de progresso visual de requisitos atendidos (`X de 5 requisitos atendidos`).
- Exibe badges em tempo real:
  - Segmento Selecionado (ex: `Segmento: Manicures & Nail Designers`).
  - Status do Proprietário (`Proprietário Validado` em verde ou `Dados do Proprietário Pendentes` em âmbar).

### 3.3 Validação Interativa com Auto-Scroll e Foco
- O botão de avanço deixou de ser passivo e desabilitado sem explicação.
- Ao clicar no botão com campos pendentes:
  1. O estado `step1Attempted` é marcado como `true`.
  2. São exibidas mensagens de erro vermelhas com ícone `AlertCircle` logo abaixo de cada campo inválido.
  3. Uma notificação visual (toast) indica a pendência exata ao usuário.
  4. O sistema executa rolagem suave (`scrollIntoView({ behavior: 'smooth', block: 'center' })`) e foca automaticamente o cursor no primeiro campo inválido.
- Quando todos os campos obrigatórios são preenchidos corretamente, `isStep1Valid` torna-se `true`, o rodapé exibe o selo verde de validação e o botão avança diretamente para a Etapa 2.

### 3.4 Retenção Integral de Estado ao Navegar
- O fluxo de navegação entre etapas foi verificado e garantido:
  - Usuário preenche a Etapa 1 e avança para a Etapa 2.
  - Na Etapa 2, clica no botão "Voltar".
  - O sistema retorna para a Etapa 1 mantendo 100% dos dados digitados (`formData.businessSegment`, `name`, `email`, `password`, `passwordConfirmation`, etc.).
  - Como os dados permanecem válidos, o botão de avanço continua habilitado para prosseguimento sem necessidade de redigitação.

### 3.5 Preservação de Segurança
- Mantida a exigência inegociável de senha forte (mínimo de 12 caracteres).
- Criptografia via derivação de chave scrypt com salt no backend.
- Atribuição exclusiva do perfil restrito `OWNER` ao novo estabelecimento (sem privilégios de Super Admin global).

---

## 4. RESULTADOS DOS TESTES AUTOMATIZADOS

Foi criado o arquivo de homologação `tests/hotfix-r532.test.ts`. A suíte completa do projeto (`npm test`) executou 31 testes automatizados com 100% de aprovação:

```bash
$ npm test
> dorange-business-ai@5.3.2 test
> tsx --test tests/*.test.ts

✔ cookie HttpOnly autentica a interface e bloqueia POST de outra origem (1569ms)
✔ auditoria referencial verifica todas as coleções e detecta vínculos entre empresas (6ms)
✔ schema e exportação executam em PostgreSQL embutido sem perda de coleções (5160ms)
✔ banco corrompido nunca é substituído por seeds (220ms)
✔ falha na escrita atômica é propagada e reverte memória e arquivo (9ms)
✔ HOTFIX R5.3.1: fluxo completo de onboarding transacional, credenciais do proprietário e autenticação (1915ms)
✔ HOTFIX R5.3.2: Validação da Etapa 1 do Onboarding — Segmentos, Credenciais do Proprietário e Retenção de Estado (1581ms)
✔ suíte R4 mantém oito regressões com credenciais reais e banco isolado (2537ms)
✔ multissegmento: todos os 7 segmentos possuem configurações, terminologia e catálogo definidos (4ms)
✔ proteção do banco: recuperação segura a partir de database.backup.json quando database.json estiver ausente (351ms)
✔ proteção do banco: bloqueia criação de banco vazio quando ALLOW_EMPTY_DB=false e nenhum arquivo existir (196ms)
✔ recursos físicos: concorrência e capacidade de recursos físicos impedem conflito (2ms)
✔ login sem senha, por papel e com senha incorreta são rejeitados (630ms)
✔ tokens previsíveis e fabricados são rejeitados (18ms)
✔ APIs privadas exigem autenticação, inclusive todas as operações de escrita (111ms)
✔ cadastro exige autorização temporária e senha forte (24ms)
✔ cadastro completo nails preserva serviços, horários e proprietário (95ms)
✔ cadastro completo barber preserva serviços, horários e proprietário (92ms)
✔ cadastro completo beauty preserva serviços, horários e proprietário (85ms)
✔ cadastro completo brows_lashes preserva serviços, horários e proprietário (84ms)
✔ cadastro completo esthetics preserva serviços, horários e proprietário (84ms)
✔ cadastro completo massage preserva serviços, horários e proprietário (66ms)
✔ cadastro completo home_services preserva serviços, horários e proprietário (56ms)
✔ login válido ignora papel do cliente; administrador e empresa alheia são negados (76ms)
✔ sessões expiram e logout revoga token (113ms)
✔ PNG falso, HTML, MIME errado e empresa alheia são rejeitados (20ms)
✔ imagem real é persistida, isolada, publicada explicitamente e excluída fisicamente (50ms)
✔ onboarding temporário não pode gravar na empresa de uma sessão existente (17ms)
✔ resposta pública é mínima e agenda impede conflito concorrente (36ms)
✔ encerramento de conta preserva dados e revoga sessões sem deixar vínculos órfãos (17ms)
✔ todos os registros anteriores permanecem iguais após as operações (1ms)

Total: 31 passed, 0 failed, 0 skipped.
```

---

## 5. VALIDAÇÃO DE BUILD E LINT

- `npm run typecheck`: TypeScript aprovado sem emissão de erros.
- `npm run build`: Bundling com Vite aprovado (CSS e JS minificados).
- Dev server reinicializado e validado no endpoint `/healthz` (retornando status `ok`).

---

## 6. CONCLUSÃO

O Hotfix R5.3.2 elimina a ambiguidade na Etapa 1 do cadastro: a interface agora comunica claramente o progresso dos requisitos, organiza as seções de tipo de negócio e credenciais de maneira compacta e acessível, orienta o usuário de forma ativa com mensagens e auto-scroll ao primeiro campo pendente, e preserva toda a integridade de dados e segurança do D'OR@NGE BUSINESS AI.
