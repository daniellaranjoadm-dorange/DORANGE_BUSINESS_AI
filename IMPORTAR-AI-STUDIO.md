# Continuar R5.3.3 no Google AI Studio

O GitHub é a fonte oficial do código. O Windows mantém a instalação local com banco privado. O Studio é complementar, com dados sintéticos de teste. Não envie banco recuperado, backups, uploads privados, .env ou credenciais ao GitHub.

## Estado atual

A cópia local está na branch recovery/business-ai-r533, baseada em 03ebb21894cc255fbcad02e0bb6f2c9f342a3c3b. As correções locais precisam ser revisadas e publicadas nessa branch antes de serem trazidas ao Studio; não houve publicação automática. Preserve main.

O login histórico local foi confirmado após ativação da senha pelo responsável. Isso não equivale a homologação completa de agenda, financeiro, IA ou produção.

## Integração

1. Preserve o projeto atual do Studio e compare quaisquer mudanças exclusivas dele com a cópia local antes de sincronizar.
2. Revise diff, arquivos rastreados e histórico local; execute a validação de README-WINDOWS. Publique apenas código revisado na branch de recuperação.
3. O Studio documenta Import from GitHub no menu de adicionar arquivos (+) e sincronização na aba GitHub das configurações. Confira as opções disponíveis e o commit importado. Não presuma seleção de branch nem aceite gravações em main. Se a interface não conseguir trazer a revisão pretendida sem alterar main, continue localmente até estabelecer uma integração verificável.
4. Para o Preview, use um diretório NOVO e exclusivo de testes. Um operador pode copiar tests/fixtures/database.synthetic.json para esse diretório como database.json somente após confirmar que o destino não tem dados, backups ou candidatos de recuperação. Isso é uma instalação de teste, nunca recuperação de dados comerciais.
5. Configure DATA_DIR para o diretório sintético antes de iniciar e mantenha ALLOW_EMPTY_DB=false. Não execute setup:local em ambiente recuperado ou com estado desconhecido.
6. Configure GEMINI_API_KEY somente nos segredos do ambiente, se necessário. Valide tipos, testes e build. No Studio, use npm run dev; start:local e atalhos Windows são destinados ao computador local.
7. Para login sintético, ative uma conta exclusivamente de teste por entrada privada. Não reutilize senhas reais nem exponha uma rota pública de recuperação.
8. Revise as mudanças vindas do Studio e repita a validação local antes de integrar. Evite editar os mesmos arquivos simultaneamente nos dois ambientes. Sincronização de código não preserva nem sincroniza o banco.

Para disponibilizar a clientes, prepare hospedagem HTTPS, armazenamento persistente e backups privados com restauração testada. Não considere o sistema de arquivos do Preview como armazenamento operacional certificado.

## Android

Este projeto é React/Vite com servidor Node/Express e banco JSON local. A pasta não é um projeto Android nativo pronto para gerar APK.

Uma opção posterior é Capacitor, reutilizando a interface web e gerando um projeto Android para abrir no Android Studio. Será preciso adaptar endereço da API, autenticação entre origens e conexão segura com o servidor. Servidor, banco comercial e segredos ficam fora do APK. Offline e sincronização exigem implementação própria.

Recomendação: concluir e homologar a versão web, preparar hospedagem e persistência, e então escolher PWA instalável ou Capacitor conforme a necessidade no celular.

Documentação oficial consultada em 07/11/2026:

- https://ai.google.dev/gemini-api/docs/aistudio-build-mode
- https://capacitorjs.com/docs/getting-started
