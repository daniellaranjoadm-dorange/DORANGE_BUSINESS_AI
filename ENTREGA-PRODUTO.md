# Evolução local do D’OR@NGE Business AI

Entrega de desenvolvimento em 07/11/2026, sobre a branch `recovery/business-ai-r533`. Não representa liberação comercial ou promoção de `main`.

## Melhorias implementadas

- Entrada institucional redesenhada com a identidade tipográfica D’OR@NGE, grafite e dourado, formulário acessível e visual adaptado a telas menores.
- Painel administrativo com cores da empresa nos elementos principais, escolha automática de texto claro/escuro para contraste, logotipos sem recorte e título do navegador com o nome do negócio. O menu lateral agora abre em telas pequenas. A personalização não substitui nomes ou cores ao aplicar sugestões de catálogo.
- Endereço personalizado do portal efetivamente salvo, com validação de formato, unicidade e nomes reservados. Formulários são reiniciados ao trocar de empresa para evitar reaproveitar dados de outra conta.
- Suporte inicial a 12 nichos: unhas, barbearia, cabelo/beleza, sobrancelhas/cílios, estética, massagem, serviços domiciliares, banho/tosa pet, estética automotiva, fotografia, aulas particulares e costura. Os cinco novos têm modelos de serviços e materiais, não fluxos especializados completos.
- Sugestões de insumos por nicho, com supressão de tipos já cadastrados, revisão de unidade, quantidade, mínimo e custo antes de cadastrar. Não há compras automáticas. Quantidades e custos não são inventados.
- Importação de texto e CSV separado por ponto e vírgula, análise local padrão, valores em reais com centavos e milhares, duração em horas/minutos, revisão editável e detecção de repetidos. Campos ausentes ficam vazios. A gravação é atômica: um item inválido ou duplicado recusa o lote, sem importação parcial. IA externa é opcional e explicitamente identificada.
- Simulador de preço baseado em materiais, duração, estrutura por hora, remuneração por hora, taxas, comissão e margem informadas pelo operador. Não altera preços automaticamente nem representa pesquisa de mercado. Removida a apresentação de referências regionais sem fonte verificável.
- Painel de prioridades para confirmações, recebimentos pendentes, atendimentos anteriores sem desfecho e reposição. Removida a contagem fictícia de seis vagas fixas.
- Indicadores financeiros por mês/empresa e visão de todo o histórico no financeiro. Caixa pago separado de pendências e de agenda futura, com dedução de sinais. Removidas afirmações automáticas de lucro real ou margem saudável.
- Datas do calendário, novo agendamento e portal usam o dia local do dispositivo. O formulário respeita a data/horário de origem ao abrir e não preenche um horário arbitrário quando não houve escolha.
- Assistente em modo econômico padrão, com orientações locais e atalhos para os módulos. Removidos agendamentos com cliente/telefone/horário fictícios e a simulação de reconhecimento de voz. Mensagens não gravam reservas nem movimentam valores.
- Textos de marketing locais por padrão. Chamadas externas exigem opção explícita e retornam aviso quando não configuradas. Removidas alegações automáticas de escassez e descontos pré-fixados nas sugestões de campanha.
- Telas carregadas sob demanda: o arquivo JavaScript principal passou de aproximadamente 601 kB da base para 384 kB, antes de compressão. Isso mede o arquivo principal; não equivale a redução de todos os arquivos baixados durante uma sessão.

## Uso e economia

Em http://127.0.0.1:3000, entre com a conta já ativada. Explore as prioridades na página inicial, o simulador de preço, a importação de catálogo e as sugestões no estoque. Em Marca & Horários, escolha o nicho e personalize o negócio. Simulações e prévias não alteram dados; salvar cadastros, importar ou aplicar sugestões altera a cópia de trabalho.

Análise local de catálogo, sugestões de cadastro, kits de insumos, simulador e modo econômico do assistente não chamam modelos externos. Isso evita consumo de créditos do provedor nessas funções. O trabalho de desenvolvimento no Codex continua sujeito ao plano da ferramenta. IA externa usa a chave privada e o modelo configurados pelo operador, com limite de saída; nenhuma chamada paga foi necessária para desenvolver ou testar esta entrega.

## Validação

Typecheck, build e 55 testes automatizados aprovados. Cobertura inclui cadastro dos 12 nichos, isolamento entre empresas, preservação dos registros anteriores, escrita atômica, importação integral ou recusada, preços/durações ausentes, duplicados, cálculos financeiros, sinais, precificação e fluxo local do assistente sem gravar agendamentos.

Prévia no navegador conferida para o painel, simulador e importação. Exemplo de cálculo de preço retornou R$ 66,67 com os mesmos dados do teste automatizado. A importação manteve preço e duração ausentes para revisão e não foi gravada no banco comercial durante a inspeção.

## Antes de vender

1. Homologar um fluxo completo por nicho, do cadastro ao atendimento e recebimento. Campos próprios de pet, veículo, aluno ou peça ainda precisam ser definidos conforme os primeiros clientes.
2. Receber o arquivo oficial da marca D’OR@NGE: o repositório não identificou uma logo oficial confirmada. A entrega preserva o nome e a paleta existentes; não certifica o ícone atual como logo oficial.
3. Testar IA externa com chave/modelo da conta e orçamento definido. Não foi homologada com chamadas pagas.
4. Homologar o portal fora do computador, links compartilháveis, HTTPS, persistência, backup e restauração. A instalação atual usa JSON privado local; não é uma arquitetura de produção multi-instância.
5. Validar a proposta comercial com clientes: tempo economizado, uso recorrente, conversão de agendamentos, recebimentos e margem por serviço. Definir preços de assinatura com base nesse valor e no custo real de atendimento, hospedagem e IA.
6. Implementar cobrança recorrente, limites de plano e onboarding comercial apenas depois dessa validação. Os planos já existentes no código não comprovam integração de cobrança.

O GitHub guarda código. Banco, backups, senhas e uploads privados permanecem separados. O Studio deve receber código validado e dados de teste; não o banco comercial.
