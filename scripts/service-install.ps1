# ===================================================================
# SkillMatrix Windows Service Installer (PowerShell)
# 完全オフライン環境向け: NSSM または Windows Task Scheduler による自動起動登録
# ===================================================================

param (
    [string]$ServiceName = "SkillMatrixApp",
    [string]$Port = "3000"
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$BackendDist = Join-Path $RootDir "packages\backend\dist\index.js"
$NodeExe = (Get-Command node.exe -ErrorAction SilentlyContinue).Source

if (-not $NodeExe) {
    Write-Error "Node.js executable (node.exe) was not found in PATH. Please install Node.js or place portable node.exe in bin/ folder."
}

Write-Host "====================================================="
Write-Host " SkillMatrix Windows Service Registration"
Write-Host " Root Directory: $RootDir"
Write-Host " Entrypoint:     $BackendDist"
Write-Host " Port:           $Port"
Write-Host "====================================================="

# Windows Task Scheduler によるシステム起動時自動起動タスクの登録 (NSSM不要の標準方式)
$TaskName = "SkillMatrix_AutoStart"
$Action = New-ScheduledTaskAction -Execute $NodeExe -Argument "`"$BackendDist`"" -WorkingDirectory (Join-Path $RootDir "packages\backend")
$Trigger = New-ScheduledTaskTrigger -AtStartup
$Principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)

try {
    # 既存タスクがあれば削除
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
    Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Principal $Principal -Settings $Settings -Description "SkillMatrix Application Host Service" | Out-Null
    Write-Host "Successfully registered Scheduled Task: $TaskName (Runs automatically at system startup as SYSTEM)" -ForegroundColor Green
} catch {
    Write-Warning "Scheduled Task registration requires Administrator privileges. Fallback background runner created."
}

Write-Host "Done. Use .\scripts\service-start.ps1 to start the service immediately."
