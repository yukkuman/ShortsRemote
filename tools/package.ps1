# extension フォルダをリリース用の zip にまとめる。
# ストアへの申請物と GitHub Releases の添付物はこれ1つで足りる。
# 使い方: powershell -ExecutionPolicy Bypass -File tools/package.ps1
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$extensionDir = Join-Path $root 'extension'
$manifestPath = Join-Path $extensionDir 'manifest.json'

if (-not (Test-Path $manifestPath)) {
  throw "manifest.json が見つかりません: $manifestPath"
}

$manifest = Get-Content $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
$outDir = Join-Path $root 'dist'
if (-not (Test-Path $outDir)) {
  New-Item -ItemType Directory -Path $outDir | Out-Null
}

$zipPath = Join-Path $outDir ("shortup-v{0}.zip" -f $manifest.version)
if (Test-Path $zipPath) {
  Remove-Item $zipPath -Force
}

# 中身は extension/ の直下を zip のルートに置く（ストアの要求）
Compress-Archive -Path (Join-Path $extensionDir '*') -DestinationPath $zipPath -CompressionLevel Optimal

$size = [math]::Round((Get-Item $zipPath).Length / 1KB, 1)
Write-Host ("created: {0} ({1} KB, version {2})" -f $zipPath, $size, $manifest.version)
