# ===================================================================
# SkillMatrix Docker Offline Image Saver (PowerShell)
# ===================================================================

$RootDir = Split-Path -Parent $PSScriptRoot
Set-Location $RootDir

$ImagesDir = Join-Path $RootDir "images"
if (-not (Test-Path $ImagesDir)) {
    New-Item -ItemType Directory -Path $ImagesDir -Force | Out-Null
}

$TarPath = Join-Path $ImagesDir "skillmatrix-offline-image.tar"

Write-Host "Building SkillMatrix Docker image..." -ForegroundColor Cyan
docker build -t skillmatrix-app:latest -f docker/Dockerfile .

Write-Host "Saving image to $TarPath for offline transport..." -ForegroundColor Cyan
docker save -o $TarPath skillmatrix-app:latest

Write-Host "Done! Offline image archive created at: $TarPath" -ForegroundColor Green
Write-Host "Transfer 'images/skillmatrix-offline-image.tar', 'docker/docker-compose.yml', and '.env.example' to the offline host." -ForegroundColor Green
