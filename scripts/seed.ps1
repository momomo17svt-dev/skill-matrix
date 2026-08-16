# ===================================================================
# SkillMatrix Seed (PowerShell)
# ===================================================================

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$BackendDir = Join-Path $RootDir "packages\backend"

Write-Host "====================================================="
Write-Host " Running SkillMatrix Demo Dataset Seed"
Write-Host "====================================================="

Set-Location $BackendDir

try {
    npx tsx prisma/seed.ts
    Write-Host "Demo data seeded successfully." -ForegroundColor Green
} catch {
    Write-Error "Seeding failed: $_"
} finally {
    Set-Location $RootDir
}
