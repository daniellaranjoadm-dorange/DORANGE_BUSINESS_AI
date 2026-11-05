# R5.2 — 05/11/2026

- Linguagem neutra nos módulos compartilhados, perfis, termos, clientes, pacotes e reservas. Presets próprios de unhas permanecem no segmento correto.
- Categorias de estoque/portfólio incluem dados existentes e opções adequadas ao segmento; categoria do estoque aceita texto, preservando valores históricos.
- Portfólio exige foto e consentimento antes de enviar; deixa de sugerir foto de unhas como trabalho real.
- Marketing usa capa do negócio, hashtags retornadas e distingue sugestão local de resposta Gemini. Fallbacks de chat usam estoque cadastrado; texto genérico deixa de promover unhas em outros segmentos.
- Removida cópia de código PIX fictício; demonstração informa ausência de cobrança/integrador.
- Zoom liberado, safe area, fontes de formulário mobile, foco visível, movimento reduzido e limite de altura de modais. Corrigida rolagem horizontal comprovada no cadastro a 390 × 844.
- Menu mobile oculta Super Admin dos demais perfis. Backend continua sendo a barreira de autorização.
- Cabeçalhos globais de segurança, healthz mínimo e limpeza/limite de entradas do rate limiter. Chaves distinguem rotas para não misturar contagens de login e cadastro.
- Cadastros automatizados ampliados de três para sete segmentos; teste de healthz e cabeçalhos. 25 testes passam, incluindo a suíte R4 de oito cenários.
- Versão 5.2.0, script typecheck, build atualizado, evidências e procedimento operacional.

Nenhuma migração executada nos dados entregues; módulos e arquivos data/ preservados. Limitações e pendências em RELATORIO-R5.2.md.
