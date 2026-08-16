# ===================================================================
# SkillMatrix Service Status (PowerShell)
# ===================================================================

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

$Existing = Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object {
    $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)").CommandLine
    $cmd -like "*dist\index.js*"
}

Write-Host "-----------------------------------------------------"
if ($Existing) {
    Write-Host "SkillMatrix Status: RUNNING" -ForegroundColor Green
    Write-Host "Process ID (PID):   $($Existing.Id)"
    Write-Host "Working Set Memory: $([math]::Round($Existing.WorkingSet64 / 1MB, 2)) MB"
    & (Join-Path $ScriptDir "healthcheck.ps1")
} else {
    Write-Host "SkillMatrix Status: STOPPED" -ForegroundColor Red
}
Write-Host "-----------------------------------------------------"
