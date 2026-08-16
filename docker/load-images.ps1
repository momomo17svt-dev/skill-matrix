# ===================================================================
# SkillMatrix Docker Offline Image Loader (PowerShell)
# ===================================================================

$TarPath = "images\skillmatrix-offline-image.tar"
if (-not (Test-Path $TarPath)) {
    $TarPath = "skillmatrix-offline-image.tar"
}

if (-not (Test-Path $TarPath)) {
    Write-Error "ERROR: skillmatrix-offline-image.tar was not found in ./images/ or current directory!"
}

Write-Host "Loading SkillMatrix Docker image from $TarPath..." -ForegroundColor Cyan
docker load -i $TarPath

Write-Host "Image successfully loaded! You can now start the application via:" -ForegroundColor Green
Write-Host "  docker compose -f docker/docker-compose.yml up -d"
