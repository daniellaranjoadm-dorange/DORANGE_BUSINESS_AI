param([Parameter(Mandatory=$true)][string]$SourceDatabase,[Parameter(Mandatory=$true)][string]$TargetDirectory)
$ErrorActionPreference='Stop'
$source=(Resolve-Path -LiteralPath $SourceDatabase).Path
$target=[IO.Path]::GetFullPath($TargetDirectory)
if(Test-Path -LiteralPath $target){throw 'Destino já existe. Escolha uma pasta NOVA, fora do repositório.'}
$repo=[IO.Path]::GetFullPath((Split-Path $PSScriptRoot -Parent)).TrimEnd('\')+'\'
if($target.StartsWith($repo,[StringComparison]::OrdinalIgnoreCase) -or ($target+'\') -eq $repo){throw 'Banco privado deve ficar fora do repositório.'}
$data=Get-Content -LiteralPath $source -Raw|ConvertFrom-Json
foreach($key in @('tenants','users','professionals','services','customers','appointments','financialTransactions','inventory')) {
 if($data.$key -isnot [array]){throw "Banco inválido: coleção obrigatória ausente ($key)."}
}
$before=(Get-FileHash -LiteralPath $source).Hash
[IO.Directory]::CreateDirectory($target)|Out-Null
$dest=Join-Path $target 'database.json'
[IO.File]::Copy($source,$dest,$false)
if((Get-FileHash -LiteralPath $dest).Hash -ne $before){throw 'Falha na conferência da cópia.'}
if((Get-FileHash -LiteralPath $source).Hash -ne $before){throw 'Fonte mudou durante a cópia; preserve ambas para análise.'}
Write-Output 'Cópia criada e hash conferido. O banco original foi preservado. Execute a auditoria antes de iniciar.'
