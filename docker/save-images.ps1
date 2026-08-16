# ===================================================================
# SkillMatrix Docker Offline Image Saver (PowerShell)
# ===================================================================

$RootDir = Split-Path -Parent $PSScriptRoot
Set-Location $RootDir

Write-Host "Building SkillMatrix Docker image..." -ForegroundColor Cyan
docker build -t skillmatrix-app:latest -f docker/Dockerfile .

Write-Host "Saving image to tar file for offline transport..." -ForegroundColor Cyan
docker save -o skillmatrix-offline-image.tar skillmatrix-app:latest

Write-Host "Done! Transfer 'skillmatrix-offline-image.tar', 'docker-compose.yml', and '.env.example' to the offline host." -ForegroundColor Green
