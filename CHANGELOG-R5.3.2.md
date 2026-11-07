# R5.3.2 — 06/11/2026

## Hotfix Crítico: Desbloqueio da Etapa 1 do Onboarding e Separação Visual

- **Causa Raiz do Bloqueio Identificada e Corrigida**:
  - O segmento `NAILS` iniciava selecionado por padrão, porém o botão de avanço permanecia desabilitado via `disabled={!isStep1Valid}` sem apresentar nenhuma explicação visual ao usuário sobre os requisitos pendentes.
  - A disposição dos 7 segmentos em formato vertical extenso empurrava os campos de credenciais do proprietário para fora da área visível inicial (abaixo da dobra da tela), levando o usuário à impressão de travamento.
  - A validação anterior só exibia avisos após o usuário já ter iniciado a digitação em algum campo, permanecendo completamente silenciosa quando o formulário estava em estado inicial.

- **Separação Visual em Duas Seções Distintas na Etapa 1**:
  - **Seção 1 — Tipo de Negócio (Segmento Comercial)**: Grade compacta e responsiva de 7 segmentos (NAILS, BARBER, BEAUTY, BROWS_LASHES, ESTHETICS, MASSAGE, HOME_SERVICES) com seleção reativa imediata, indicador do segmento ativo e consumo vertical otimizado.
  - **Seção 2 — Dados do Proprietário & Credenciais de Acesso**: Contêiner destacado com campos individuais para Nome Completo, E-mail de Acesso, Senha (mínimo 12 caracteres com medidor e alternador de visibilidade) e Confirmação de Senha idêntica.
  - **Indicador de Progresso da Etapa 1**: Barra superior de progresso e contagem em tempo real (`X de 5 requisitos atendidos`) com status independente de segmento e titular.

- **Validação Ativa e Rolagem Automática (Auto-Scroll)**:
  - O botão de avanço agora é interativo: ao ser acionado com campos incompletos, marca o formulário como submetido, exibe mensagens de erro em vermelho diretamente abaixo de cada campo inválido, emite notificação explicativa e executa rolagem suave (`scrollIntoView`) com foco automático no primeiro campo pendente.
  - Rodapé com diagnóstico claro: exibe exatamente os campos pendentes (ex: *"Pendente: Nome do proprietário, E-mail de Login, Senha"*) e confirmação em verde (*"Segmento e dados do proprietário validados"*) quando todos os requisitos forem preenchidos.
  - **Retenção de Estado**: A navegação entre as etapas (avançar para a Etapa 2 e clicar em "Voltar" para a Etapa 1) preserva integralmente todos os campos preenchidos, mantendo o botão habilitado para avanço imediato.

- **Preservação Integral de Segurança**:
  - Exigência estrita de senha forte (mínimo 12 caracteres, limite 128 caracteres).
  - Criptografia irreversível scrypt no backend.
  - Perfil estrito de titular `OWNER` vinculado ao tenant (sem acesso global a outros estabelecimentos ou Super Admin).

- **Garantia de Qualidade e Testes**:
  - Nova suíte automatizada `tests/hotfix-r532.test.ts` cobrindo seleção de segmentos, validação de campos obrigatórios, detecção de pendências, retenção de estado ao navegar e login do proprietário.
  - Total de 31 testes aprovados (`npm test`), build e typecheck 100% íntegros.
