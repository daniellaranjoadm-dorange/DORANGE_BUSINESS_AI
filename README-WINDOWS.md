# D’OR@NGE Business AI R5.3.3 — Windows

Cópia de desenvolvimento derivada de `recovery/business-ai-r533`, commit `03ebb21894cc255fbcad02e0bb6f2c9f342a3c3b`. Consulte este documento para a recuperação local; instruções antigas sobre instalação nova não devem ser aplicadas ao banco recuperado.

## Iniciar nesta máquina

Atalhos disponíveis na pasta do projeto:

- `Iniciar Business AI.cmd`: inicia o servidor em segundo plano e abre o navegador.
- `Ativar meu acesso.cmd`: abre uma janela privada para escolher uma conta histórica existente e definir sua senha. Confere a confirmação, para o servidor local registrado, preserva um backup independente, ativa somente essa conta e reinicia o app. A senha segue por entrada padrão para o processo local, sem argumentos, chat ou arquivos de senha.
- `Encerrar Business AI.cmd`: encerra o servidor local registrado.

Para recuperar o acesso, o responsável deve operar a janela de senha pessoalmente. Nenhuma conta é criada e o banco original do ZIP não é alterado. O atalho depende da configuração privada desta máquina; outras máquinas precisam configurar DATA_DIR primeiro.

Node.js 24 LTS e Git são necessários. As dependências já foram instaladas nesta cópia. Na pasta do projeto, abra PowerShell e execute:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/windows.ps1 Start
```

Abra http://127.0.0.1:3000. Para encerrar, pressione Ctrl+C. A configuração `.env` privada desta máquina aponta para uma cópia de homologação fora do repositório. Nunca use duas instâncias no mesmo banco. O início local força acesso apenas por esta máquina e `ALLOW_EMPTY_DB=false`.

## Instalar em outra máquina

```powershell
powershell -ExecutionPolicy Bypass -File scripts/windows.ps1 Install
Copy-Item .env.example .env
```

Configure no `.env` um `DATA_DIR` absoluto para uma pasta privada NOVA fora do repositório. Para criar essa cópia a partir de um banco existente:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/restore-copy.ps1 -SourceDatabase 'C:\privado\fonte\database.json' -TargetDirectory 'C:\privado\homologacao-nova'
node --import tsx scripts/verify-recovery.ts 'C:\privado\homologacao-nova\database.json'
```

A restauração recusa destinos existentes e confere os hashes. A auditoria informa apenas contagens e total de violações, sem imprimir registros. Não execute `setup:local`: ele é destinado a instalações novas, não à recuperação. Os ZIPs e bancos originais devem permanecer intactos em armazenamento privado com backup independente. Os anexos têm dados pessoais e comerciais; não os publique.

Para esta recuperação, `database.json` tem SHA-256 `ca7e424671bd9c82436cb7fcfc655709544ecc92113680cdaafa84c55731a2d2`. A correspondência comprova a cópia, não a atualidade de todos os registros esperados.

## Configuração e contas

`GEMINI_API_KEY` é opcional para iniciar e deve ser preenchida privadamente somente quando necessário. Nunca coloque chaves no código do navegador ou em arquivos rastreados. Sem chave, funcionalidades que dependem da IA não foram homologadas.

As seis contas históricas do banco não possuem hash scrypt compatível com a autenticação atual. Nenhuma senha foi alterada. A ativação deve usar uma conta existente e a rotina `npm run credentials -- <email>`, com senha fornecida por entrada padrão privada, nunca em argumento ou histórico do terminal. Esse comando altera a cópia do banco; faça-o com o servidor parado e um backup privado previamente preservado. Login real e operações comerciais continuam pendentes de homologação com o responsável.

## Validação e publicação

```powershell
powershell -ExecutionPolicy Bypass -File scripts/windows.ps1 Validate
```

Em 07/11/2026: instalação limpa com `npm ci --ignore-scripts`, typecheck, build e 39 testes aprovados. O build emite aviso de tamanho do JavaScript (601 kB). Testes usam bancos sintéticos isolados. A verificação HTTP com cópia recuperada retornou `/healthz` 200, página 200 e API privada sem sessão 401; hash do banco permaneceu igual. Isso não homologa login histórico, IA, uploads externos ou todos os fluxos comerciais.

Mudanças locais: carga antecipada de `.env` pelo módulo do banco; bloqueio de criação vazia diante de qualquer candidato de recuperação; três testes de regressão; scripts Windows, restauração e auditoria; proteção local de push. `main` e o remoto não foram modificados.

O hook local permite apenas a branch e destino `recovery/business-ai-r533`, repetindo testes e compilação antes de push. `check:publish` examina arquivos rastreados, bloqueia caminhos privados e alguns padrões de credenciais. Ele não substitui a revisão de segredos, do diff e do histórico. Alterações não rastreadas precisam ser adicionadas explicitamente e revisadas. Hooks locais podem ser ignorados e não são proteção de branch no servidor.

## GitHub oficial e Studio complementar

1. Trabalhar na branch de recuperação, com código separado do banco e uploads privados.
2. Buscar mudanças do GitHub antes de integrar exportações do Studio. Comparar arquivo por arquivo; nunca substituir todo o projeto sem revisão.
3. Validar typecheck, testes, build, login e fluxos de agenda, catálogo e financeiro em uma cópia do banco. Testar gravação, reinício e restauração em outra cópia descartável antes da promoção.
4. Revisar diff, arquivos rastreados e histórico para impedir publicação de banco, ZIPs, credenciais e uploads privados. Fazer commit e push somente na branch de recuperação após homologação.
5. Abrir revisão para `main`; promover apenas após homologação, preservando backup e plano de retorno. Configurar proteção de `main` e verificações obrigatórias no GitHub antes da promoção.
6. Levar ao Studio apenas o código aprovado do GitHub. Restaurar dados privados por procedimento separado, verificando armazenamento persistente e backup externo. GitHub não é backup do banco. Não presumir sincronização automática de mão dupla.

O app Nails tem código divergente e permanece separado; não mesclar suas telas e rotas ao Business. Somente a cópia identificada do banco foi utilizada para homologação privada.
