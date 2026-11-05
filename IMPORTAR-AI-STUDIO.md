# Importar R5.2 no Google AI Studio

Este repositório contém código e fixtures sintéticas; dados, backups, uploads e credenciais da entrega local não foram enviados.

1. No Build, use + → Import from GitHub e selecione este repositório privado.
2. Execute npm ci e npm run setup:local apenas na primeira instalação. O comando recusa sobrescrever banco existente.
3. Execute npm run typecheck, npm test e npm run build.
4. Inicie npm run dev e abra Cadastrar meu estabelecimento. Não há contas ou senhas padrão.
5. Configure GEMINI_API_KEY somente nos segredos do ambiente. Integrações externas continuam não homologadas.

O aplicativo requer Node/Express e diretório gravável. Persistência JSON no ambiente de prévia não equivale a volume de produção. Nunca sobrescreva dados existentes com fixtures. A importação não garante sincronização automática com GitHub. Confira as opções oferecidas pelo AI Studio antes de alternar editores.

Peça à IA: Leia README, relatório R5.2 e este guia. Continue sobre os módulos existentes, preserve autorização e dados, execute as verificações e registre concluído/não testado/pendente. Não reconstrua o app.
