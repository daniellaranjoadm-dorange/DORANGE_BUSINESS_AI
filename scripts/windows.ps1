param([ValidateSet('Install','Validate','Start')][string]$Action='Start')
$ErrorActionPreference='Stop'
Push-Location (Split-Path $PSScriptRoot -Parent)
try {
 if (!(Get-Command node -ErrorAction SilentlyContinue)) {throw 'Instale Node.js 24 LTS.'}
 if ($Action -eq 'Install') {
  & npm.cmd ci --ignore-scripts --no-audit --no-fund
  if($LASTEXITCODE -ne 0){throw 'Instalação falhou.'}
  & git config core.hooksPath .githooks
  if($LASTEXITCODE -ne 0){throw 'Não foi possível ativar a proteção local de push.'}
 } elseif ($Action -eq 'Validate') {
  foreach($task in @('typecheck','test','build','check:publish')) {
   & npm.cmd run $task
   if($LASTEXITCODE -ne 0){throw "Validação falhou: $task"}
  }
 } else {
  if(!(Test-Path .env)){throw 'Crie .env a partir de .env.example e informe DATA_DIR para uma cópia privada do banco.'}
  & node --import tsx scripts/start-local.ts
  if($LASTEXITCODE -ne 0){throw 'Aplicação encerrou com erro.'}
 }
} finally {Pop-Location}
