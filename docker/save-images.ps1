# ===================================================================
# SkillMatrix Docker Offline Image Saver (PowerShell)
# Bundles both SkillMatrix App and PostgreSQL 16 Alpine
# ===================================================================

$RootDir = Split-Path -Parent $PSScriptRoot
Set-Location $RootDir

$ImagesDir = Join-Path $RootDir "images"
if (-not (Test-Path $ImagesDir)) {
    New-Item -ItemType Directory -Path $ImagesDir -Force | Out-Null
}

$TarPath = Join-Path $ImagesDir "skillmatrix-offline-image.tar"

Write-Host "1/3 Pulling lightweight PostgreSQL 16 Alpine image (approx 85MB)..." -ForegroundColor Cyan
docker pull postgres:16-alpine

Write-Host "2/3 Building SkillMatrix Docker image..." -ForegroundColor Cyan
docker build -t skillmatrix-app:latest -f docker/Dockerfile .

Write-Host "3/3 Saving all-in-one image archive (App + PostgreSQL) to $TarPath..." -ForegroundColor Cyan
docker save -o $TarPath skillmatrix-app:latest postgres:16-alpine

Write-Host "Done! Total offline bundle created at: $TarPath" -ForegroundColor Green
Write-Host "Transfer 'images/skillmatrix-offline-image.tar', 'docker/docker-compose.yml', and '.env.example' to the offline host." -ForegroundColor Green
