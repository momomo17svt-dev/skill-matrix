# ===================================================================
# SkillMatrix Service Stop (PowerShell)
# ===================================================================

$Existing = Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object {
    $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)").CommandLine
    $cmd -like "*dist\index.js*"
}

if ($Existing) {
    foreach ($proc in $Existing) {
        Write-Host "Stopping SkillMatrix process (PID: $($proc.Id))..." -ForegroundColor Yellow
        Stop-Process -Id $proc.Id -Force
    }
    Write-Host "SkillMatrix stopped successfully." -ForegroundColor Green
} else {
    Write-Host "SkillMatrix is not running." -ForegroundColor Gray
}
