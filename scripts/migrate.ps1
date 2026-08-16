# ===================================================================
# SkillMatrix Database Migration (PowerShell - Explicit Run)
# 本番アプリ起動時の自動マイグレーションは禁止されています。
# DB変更時はこのスクリプトを明示的に実行してください。
# ===================================================================

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$BackendDir = Join-Path $RootDir "packages\backend"

Write-Host "====================================================="
Write-Host " Running SkillMatrix Database Migration (SQL Server)"
Write-Host "====================================================="

Set-Location $BackendDir

# npx prisma db push または prisma migrate deploy
try {
    Write-Host "Applying database schema to SQL Server..." -ForegroundColor Cyan
    npx prisma db push --schema="./prisma/schema.prisma" --accept-data-loss
    Write-Host "Database migration applied successfully." -ForegroundColor Green
} catch {
    Write-Error "Database migration failed: $_"
} finally {
    Set-Location $RootDir
}
