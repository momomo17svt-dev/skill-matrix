# ===================================================================
# SkillMatrix Service Start (PowerShell)
# ===================================================================

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$BackendDir = Join-Path $RootDir "packages\backend"
$Entrypoint = Join-Path $BackendDir "dist\index.js"

# .env の読み込み
$EnvFile = Join-Path $RootDir ".env"
if (Test-Path $EnvFile) {
    Get-Content $EnvFile | ForEach-Object {
        if ($_ -match '^\s*([^#=]+)=(.*)$') {
            [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim())
        }
    }
}

# 既存プロセスの確認
$Existing = Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object {
    $_.Path -like "*node*" -and (Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)").CommandLine -like "*dist\index.js*"
}

if ($Existing) {
    Write-Host "SkillMatrix is already running with PID: $($Existing.Id)" -ForegroundColor Yellow
    exit 0
}

Write-Host "Starting SkillMatrix Backend process..." -ForegroundColor Cyan
$Process = Start-Process -FilePath "node" -ArgumentList "`"$Entrypoint`"" -WorkingDirectory $BackendDir -PassThru -WindowStyle Hidden

Start-Sleep -Seconds 2

if (-not $Process.HasExited) {
    Write-Host "SkillMatrix started successfully (PID: $($Process.Id))." -ForegroundColor Green
    & (Join-Path $ScriptDir "healthcheck.ps1")
} else {
    Write-Error "SkillMatrix failed to start. Check backend logs."
}
