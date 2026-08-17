$SourceDir = "c:\Users\tatsu\Desktop\GitHub\人材管理"
$DestDir = "c:\Users\tatsu\Desktop\GitHub\skill-matrix-enterprise"

if (-not (Test-Path $DestDir)) {
    New-Item -ItemType Directory -Path $DestDir -Force | Out-Null
}

Write-Host "Copying files to $DestDir..." -ForegroundColor Cyan
robocopy $SourceDir $DestDir /E /XD .git node_modules dist dist-offline-windows images .agents /XF *.zip *.tar

Set-Location $DestDir
Write-Host "Initializing new Git repository..." -ForegroundColor Cyan
git init -b main
git add .
git commit -m "feat: initial enterprise codebase for identity-platform integration"

Write-Host "Creating private GitHub repository: momomo17svt-dev/skill-matrix-enterprise..." -ForegroundColor Cyan
gh repo create momomo17svt-dev/skill-matrix-enterprise --private --source=. --remote=origin --push

Write-Host "Done! Enterprise repository successfully created and pushed." -ForegroundColor Green
