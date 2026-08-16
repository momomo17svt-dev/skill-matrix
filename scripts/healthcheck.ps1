# ===================================================================
# SkillMatrix Healthcheck (PowerShell)
# ===================================================================

param (
    [string]$HostUrl = "http://localhost:3000"
)

$HealthUrl = "$HostUrl/health"
$ReadyUrl = "$HostUrl/ready"

try {
    $healthRes = Invoke-RestMethod -Uri $HealthUrl -Method Get -TimeoutSec 5
    Write-Host "[Health] GET $HealthUrl -> Status: $($healthRes.status)" -ForegroundColor Green

    $readyRes = Invoke-RestMethod -Uri $ReadyUrl -Method Get -TimeoutSec 5
    Write-Host "[Ready]  GET $ReadyUrl  -> Status: $($readyRes.status) (DB: $($readyRes.components.database))" -ForegroundColor Green
} catch {
    Write-Host "[Error] Health check failed: $_" -ForegroundColor Red
}
