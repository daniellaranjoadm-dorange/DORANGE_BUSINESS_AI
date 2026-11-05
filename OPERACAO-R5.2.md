# Operação e entrada em produção

## Preparar ambiente de homologação
1. Usar Node 24 e npm 11. Executar npm ci, npm run typecheck, npm test e npm run build. Testes precisam de conexão loopback e escrita/rename na pasta temporária. Nunca apontar testes para banco em produção.
2. Copiar dados para um volume de homologação. Definir DATA_DIR absoluto; NODE_ENV=production; HOST/PORT conforme o proxy; COOKIE_SECURE=true com HTTPS. Não criar .env com dados reais dentro do pacote versionado.
3. Executar uma única instância. Não ativar ALLOW_EMPTY_DB para tentar recuperar banco. Não apagar lock sem verificar se o processo anterior encerrou.
4. Ativar senhas antigas pelo procedimento do README após verificação de identidade; iniciar servidor. GET /healthz confirma processo HTTP, sem atestar banco gravável, integrações ou saúde comercial.

## Backup e atualização
- Restringir acesso ao volume, backups e ZIP: contêm dados históricos, inclusive informações pessoais. Antes da atualização, parar servidor e copiar integralmente DATA_DIR, uploads e versão anterior para destino protegido e externo ao host. Registrar hashes e horário.
- Testar restauração numa cópia isolada: conferir integridade referencial, contagens e acesso a imagens; comparar com origem. Definir responsável, retenção, frequência e metas de recuperação antes do lançamento. Esse ensaio operacional externo não foi realizado nesta entrega.
- Instalar release em nova pasta; reutilizar somente o volume existente configurado. Não sobrepor data/ de um cliente com os dados deste ZIP. Testar login, reserva, upload e registro financeiro no ambiente de homologação.
- Reversão: parar serviço, restaurar binário e snapshot completo anterior como conjunto, iniciar uma instância e conferir dados. Sessões serão invalidadas. Não sobrescrever gravações posteriores sem conciliação.

## Critérios ainda necessários para liberação
- HTTPS, cookies Secure e proxy confiável, volume persistente, alertas de erro/disco, backup/restore, controle de acesso operacional.
- Homologar fluxos autenticados, todos os segmentos, acessibilidade, Android/iOS reais, câmera, teclado virtual e redes lentas.
- Validar Gemini e modelo configurado, WhatsApp, redes sociais e pagamentos com credenciais próprias. O PIX do financeiro é apenas demonstração.
- Rever consentimentos, retenção/LGPD, exclusão definitiva, proteção de reservas públicas e temporários abandonados. Não fazer limpeza automática sem política aprovada.
- Planejar PostgreSQL/sessões compartilhadas antes de escalar; exportação PGlite não comprova servidor externo. Recursos físicos ainda não limitam capacidade da agenda.
- Auditoria atual de dependências/vulnerabilidades em ambiente com acesso ao registry; instalação desta entrega foi offline. Bundle continua acima de 500 kB.
