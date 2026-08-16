param (
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$OutputDir = Join-Path $RootDir "dist-offline-windows"
$ZipFile = Join-Path $RootDir "skillmatrix-offline-windows.zip"

Write-Host "====================================================="
Write-Host " Generating Windows Offline Deployment Bundle"
Write-Host " Output Archive: $ZipFile"
Write-Host "====================================================="

# 1. 全パッケージのビルド
if (-not $SkipBuild) {
    Write-Host "1. Building packages..." -ForegroundColor Cyan
    Set-Location $RootDir
    npm run build
}

# 2. 一時ディレクトリの整備
if (Test-Path $OutputDir) {
    Remove-Item $OutputDir -Recurse -Force -ErrorAction SilentlyContinue
}
New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null

# 3. 成果物のコピー
Write-Host "2. Assembling production assets..." -ForegroundColor Cyan
Copy-Item (Join-Path $RootDir ".env.example") (Join-Path $OutputDir ".env.example") -Force
Copy-Item (Join-Path $RootDir "README.md") (Join-Path $OutputDir "README.md") -Force
Copy-Item (Join-Path $RootDir "README.ja.md") (Join-Path $OutputDir "README.ja.md") -Force
Copy-Item (Join-Path $RootDir "LICENSE") (Join-Path $OutputDir "LICENSE") -Force
Copy-Item (Join-Path $RootDir "scripts") (Join-Path $OutputDir "scripts") -Recurse -Force

# packages/backend
$TargetBackend = Join-Path $OutputDir "packages\backend"
New-Item -ItemType Directory -Path $TargetBackend -Force | Out-Null
Copy-Item (Join-Path $RootDir "packages\backend\dist") (Join-Path $TargetBackend "dist") -Recurse -Force
Copy-Item (Join-Path $RootDir "packages\backend\prisma") (Join-Path $TargetBackend "prisma") -Recurse -Force
Copy-Item (Join-Path $RootDir "packages\backend\package.json") (Join-Path $TargetBackend "package.json") -Force

# packages/frontend (dist)
$TargetFrontend = Join-Path $OutputDir "packages\frontend"
New-Item -ItemType Directory -Path $TargetFrontend -Force | Out-Null
Copy-Item (Join-Path $RootDir "packages\frontend\dist") (Join-Path $TargetFrontend "dist") -Recurse -Force

# packages/shared (dist)
$TargetShared = Join-Path $OutputDir "packages\shared"
New-Item -ItemType Directory -Path $TargetShared -Force | Out-Null
Copy-Item (Join-Path $RootDir "packages\shared\dist") (Join-Path $TargetShared "dist") -Recurse -Force
Copy-Item (Join-Path $RootDir "packages\shared\package.json") (Join-Path $TargetShared "package.json") -Force

# node_modules のコピー
Write-Host "3. Copying node_modules runtime..." -ForegroundColor Cyan
Copy-Item (Join-Path $RootDir "node_modules") (Join-Path $OutputDir "node_modules") -Recurse -Force

# 4. ZIP圧縮 (.NET ZipFile を使用して高速圧縮)
Write-Host "4. Creating ZIP archive..." -ForegroundColor Cyan
if (Test-Path $ZipFile) {
    Remove-Item $ZipFile -Force
}
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($OutputDir, $ZipFile, [System.IO.Compression.CompressionLevel]::Fastest, $false)

# クリーンアップ
Remove-Item $OutputDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "====================================================="
Write-Host " SUCCESS: Standalone Windows Offline Package Generated!"
Write-Host " File: $ZipFile"
Write-Host "====================================================="
