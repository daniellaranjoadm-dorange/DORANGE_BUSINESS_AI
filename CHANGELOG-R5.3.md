# R5.3 — 06/11/2026

## Estabilização, Experiência Comercial e Evolução Multissegmento

- **Proteção e Resiliência do Banco de Dados**:
  - Implementada restauração segura e automática a partir de `database.backup.json` quando `database.json` estiver ausente.
  - Mantido bloqueio estrito de inicialização com banco vazio sem `ALLOW_EMPTY_DB=true`.
  - Proteção de privacidade: diretórios `data/` e `uploads/` mantidos em `.gitignore` para evitar envio acidental de dados de clientes ao GitHub.
  - Preservado o locking por PID e mutações transacionais em memória/disco com rollback em falha atômica.

- **Gestão e Concorrência de Recursos Físicos Compartilhados**:
  - Validação de conflito de agenda por recurso físico (`resourceId`: macas, salas, cadeiras, lavatórios e equipamentos) na criação e no reagendamento de atendimentos.
  - Seleção de recursos integrada ao modal de novo agendamento com identificação automática de capacidade do recurso.

- **Experiência Multissegmento sem Contaminação de Domínio**:
  - `CatalogView`: Categorias dinâmicas derivadas dos serviços cadastrados e sugestões do segmento ativo, eliminando abas fixas de unhas em barbearias, salões, clínicas de estética e massoterapia.
  - `MarketingAiView`: Placeholders de tema e botões de atalho rápido (resgate de clientes inativos, vagas de fim de semana, aniversariantes do mês e dicas do especialista) personalizados para cada um dos 7 segmentos de negócio.
  - `server.ts`: Fallbacks de IA para cópias de redes sociais com redação, hashtags e tom de voz específicos para os 7 segmentos suportados.
  - `SalonHeader`: Título atualizado para "Portfólio & Galeria de Trabalhos", universal para todos os segmentos.

- **Onboarding e Cadastro Ágil**:
  - Etapas 4 e 5 redesenhadas com componentes Tailwind fluidos do design system para adição de serviços avulsos, preços, durações e horários de intervalo/almoço.

- **Dashboard Executivo e Transparência Financeira**:
  - `DashboardView`: Eliminação de métricas artificiais (ticket médio real sem fallback fixo, receita dos últimos 7 dias calculada a partir de transações pagas, ranking de serviços reais com estado vazio).
  - `FinancialView`: Emissão de comprovante/recibo imprimível de caixa para atendimentos e movimentações, com menção explícita de "Registro Manual no Caixa (Sem integração bancária automática)".
  - Compartilhamento WhatsApp do portal atualizado para utilizar o domínio real da aplicação (`window.location.origin`).

- **Garantia de Qualidade e Testes**:
  - Suíte de testes expandida para 29 testes automatizados (`tests/*.test.ts` e `tests/multisegment.test.ts`), cobrindo integridade referencial, banco embutido PGlite, mutações atômicas, os 7 segmentos, recuperação de backup e conflito de recursos físicos.
  - `npm run typecheck` e `npm run build` aprovados sem erros.
