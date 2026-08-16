# ===================================================================
# SkillMatrix Service Uninstaller (PowerShell)
# ===================================================================

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
& (Join-Path $ScriptDir "service-stop.ps1")

$TaskName = "SkillMatrix_AutoStart"
try {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
    Write-Host "Unregistered Scheduled Task: $TaskName" -ForegroundColor Green
} catch {
    Write-Host "No registered task found."
}

Write-Host "SkillMatrix service uninstallation complete."
