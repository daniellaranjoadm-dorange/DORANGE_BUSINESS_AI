param([ValidateSet('Start','Access','Stop')][string]$Action='Start')
$ErrorActionPreference='Stop'
$project=Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $project
$node=(Get-Command node.exe -ErrorAction Stop).Source
$runtime=Join-Path $project '.local-run'
[IO.Directory]::CreateDirectory($runtime)|Out-Null
$pidFile=Join-Path $runtime 'server.pid'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
function Read-LocalConfig {
 $json=& $node scripts/local-config.mjs
 if($LASTEXITCODE -ne 0){throw 'Não foi possível ler a configuração e o banco privado.'}
 return ($json|ConvertFrom-Json)
}
function Stop-LocalApp {
 if(!(Test-Path -LiteralPath $pidFile)){return}
 $appPid=0
 if(![int]::TryParse(([IO.File]::ReadAllText($pidFile).Trim()),[ref]$appPid)){throw 'Identificador do processo inválido.'}
 $process=Get-CimInstance Win32_Process -Filter "ProcessId=$appPid"
 if(!$process){return}
 if($process.Name -ne 'node.exe' -or $process.CommandLine -notmatch 'scripts[/\\]start-local\.ts') {
  throw 'O processo registrado não corresponde ao aplicativo. Nenhum processo foi encerrado.'
 }
 Stop-Process -Id $appPid -ErrorAction Stop
 for($i=0;$i -lt 30;$i++){
  if(!(Get-Process -Id $appPid -ErrorAction SilentlyContinue)){return}
  Start-Sleep -Milliseconds 100
 }
 throw 'O servidor ainda está encerrando.'
}
function Start-LocalApp {
 $cfg=Read-LocalConfig
 $url="http://127.0.0.1:$($cfg.port)"
 $live=$false
 $occupied=@(Get-NetTCPConnection -LocalPort $cfg.port -State Listen -ErrorAction SilentlyContinue)
 if(Test-Path -LiteralPath $pidFile){
  $savedPid=0
  if([int]::TryParse(([IO.File]::ReadAllText($pidFile).Trim()),[ref]$savedPid)){
   $p=Get-CimInstance Win32_Process -Filter "ProcessId=$savedPid"
   $live=[bool](
    $p -and
    $p.Name -eq 'node.exe' -and
    $p.CommandLine -match 'scripts[/\\]start-local\.ts' -and
    @($occupied | Where-Object { $_.OwningProcess -eq $savedPid }).Count -gt 0
   )
  }
 }
 if(!$live){
  if($occupied.Count -gt 0){
   throw "Porta $($cfg.port) ocupada pelo processo $($occupied[0].OwningProcess). Nenhum novo servidor foi iniciado."
  }
  $p=Start-Process -FilePath $node -ArgumentList @('--import','tsx','scripts/start-local.ts') -WorkingDirectory $project -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtime 'server.stdout.log') -RedirectStandardError (Join-Path $runtime 'server.stderr.log') -PassThru
  [IO.File]::WriteAllText($pidFile,[string]$p.Id)
 }
 for($i=0;$i -lt 60;$i++){
  try{
   $health=Invoke-WebRequest -Uri "$url/healthz" -UseBasicParsing -TimeoutSec 1
   if($health.StatusCode -eq 200){Start-Process $url; return}
  }catch{}
  Start-Sleep -Milliseconds 250
 }
 throw 'O aplicativo não respondeu. Consulte .local-run/server.stderr.log.'
}
try{
 if($Action -eq 'Stop'){Stop-LocalApp;exit}
 if($Action -eq 'Start'){Start-LocalApp;exit}
 $cfg=Read-LocalConfig
 $form=New-Object Windows.Forms.Form
 $form.Text='DORANGE Business AI - Ativar meu acesso local'
 $form.ClientSize=New-Object Drawing.Size(540,350)
 $form.StartPosition='CenterScreen';$form.FormBorderStyle='FixedDialog';$form.MaximizeBox=$false
 $notice=New-Object Windows.Forms.Label
 $notice.Text='Escolha uma conta existente e defina sua senha. A alteração será feita somente na cópia local recuperada. O banco original será preservado.'
 $notice.Location=New-Object Drawing.Point(20,15);$notice.Size=New-Object Drawing.Size(495,48)
 $form.Controls.Add($notice)
 $accounts=New-Object Windows.Forms.ComboBox
 $accounts.Location=New-Object Drawing.Point(20,75);$accounts.Size=New-Object Drawing.Size(495,28)
 $accounts.DropDownStyle='DropDownList'
 foreach($user in $cfg.users){[void]$accounts.Items.Add([string]$user.email)}
 $form.Controls.Add($accounts)
 $label1=New-Object Windows.Forms.Label;$label1.Text='Nova senha (12 a 128 caracteres)';$label1.Location=New-Object Drawing.Point(20,116);$label1.AutoSize=$true;$form.Controls.Add($label1)
 $password=New-Object Windows.Forms.TextBox;$password.UseSystemPasswordChar=$true;$password.Location=New-Object Drawing.Point(20,140);$password.Width=495;$password.MaxLength=128;$form.Controls.Add($password)
 $label2=New-Object Windows.Forms.Label;$label2.Text='Repita a senha';$label2.Location=New-Object Drawing.Point(20,178);$label2.AutoSize=$true;$form.Controls.Add($label2)
 $confirm=New-Object Windows.Forms.TextBox;$confirm.UseSystemPasswordChar=$true;$confirm.Location=New-Object Drawing.Point(20,202);$confirm.Width=495;$confirm.MaxLength=128;$form.Controls.Add($confirm)
 $status=New-Object Windows.Forms.Label;$status.Location=New-Object Drawing.Point(20,239);$status.Size=New-Object Drawing.Size(495,42);$form.Controls.Add($status)
 $activate=New-Object Windows.Forms.Button;$activate.Text='Ativar senha nesta cópia';$activate.Location=New-Object Drawing.Point(270,295);$activate.Size=New-Object Drawing.Size(245,33);$form.Controls.Add($activate)
 $activate.Add_Click({
  if($accounts.SelectedIndex -lt 0){$status.Text='Selecione sua conta.';return}
  if($password.Text.Length -lt 12 -or $password.Text.Length -gt 128){$status.Text='A senha deve ter de 12 a 128 caracteres.';return}
  if($password.Text -cne $confirm.Text){$status.Text='As senhas não coincidem.';return}
  $activate.Enabled=$false
  try{
   Stop-LocalApp
   $backupRoot=Join-Path (Split-Path $cfg.dataDirectory -Parent) 'access-backups'
   [IO.Directory]::CreateDirectory($backupRoot)|Out-Null
   $backup=Join-Path $backupRoot ('database-before-access-'+[guid]::NewGuid().ToString('N')+'.json')
   [IO.File]::Copy((Join-Path $cfg.dataDirectory 'database.json'),$backup,$false)
   $psi=New-Object Diagnostics.ProcessStartInfo
   $psi.FileName=$node;$psi.Arguments='--import tsx scripts/set-password.ts';$psi.WorkingDirectory=$project
   $psi.UseShellExecute=$false;$psi.CreateNoWindow=$true
   $psi.RedirectStandardInput=$true;$psi.RedirectStandardOutput=$true;$psi.RedirectStandardError=$true
   $psi.EnvironmentVariables['DORANGE_OPERATOR_EMAIL']=[string]$accounts.SelectedItem
   $psi.EnvironmentVariables['DATA_DIR']=[string]$cfg.dataDirectory
   $psi.EnvironmentVariables['ALLOW_EMPTY_DB']='false'
   $proc=[Diagnostics.Process]::Start($psi)
   $proc.StandardInput.Write($password.Text);$proc.StandardInput.Close()
   $null=$proc.StandardOutput.ReadToEnd();$null=$proc.StandardError.ReadToEnd();$proc.WaitForExit()
   if($proc.ExitCode -ne 0){throw 'Ativação recusada. O backup privado foi preservado.'}
   $password.Clear();$confirm.Clear()
   Start-LocalApp
   [void][Windows.Forms.MessageBox]::Show('Senha ativada na cópia local. Entre no app com o e-mail selecionado e sua nova senha.','Acesso local')
   $form.Close()
  }catch{$status.Text=$_.Exception.Message;$activate.Enabled=$true}
 })
 [void]$form.ShowDialog()
}catch{
 [void][Windows.Forms.MessageBox]::Show($_.Exception.Message,'DORANGE Business AI')
 exit 1
}
