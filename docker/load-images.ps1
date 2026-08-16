# ===================================================================
# SkillMatrix Docker Offline Image Loader (PowerShell)
# ===================================================================

$TarFile = "skillmatrix-offline-image.tar"
if (-not (Test-Path $TarFile)) {
    Write-Error "ERROR: $TarFile not found in current directory!"
}

Write-Host "Loading SkillMatrix Docker image from tar file..." -ForegroundColor Cyan
docker load -i $TarFile

Write-Host "Image successfully loaded! You can now start the application via:" -ForegroundColor Green
Write-Host "  docker compose -f docker/docker-compose.yml up -d"
