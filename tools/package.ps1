# extension フォルダをリリース用の zip にまとめる。
# ストアへの申請物と GitHub Releases の添付物はこれ1つで足りる。
# 使い方: powershell -ExecutionPolicy Bypass -File tools/package.ps1
#
# 注意: PowerShell 5.1 の Compress-Archive はエントリ名が "\" 区切りになり、
# 他環境で解凍したときに壊れることがある。ここでは ZipArchive を直接使って
# 必ず "/" 区切りで書く。
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

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

$basePath = (Resolve-Path $extensionDir).Path
$fileCount = 0

$stream = [System.IO.File]::Open($zipPath, [System.IO.FileMode]::Create)
try {
  $archive = New-Object System.IO.Compression.ZipArchive($stream, [System.IO.Compression.ZipArchiveMode]::Create)
  try {
    Get-ChildItem -Path $extensionDir -Recurse -File | ForEach-Object {
      $relative = $_.FullName.Substring($basePath.Length + 1).Replace('\', '/')
      [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $_.FullName, $relative) | Out-Null
      $fileCount += 1
    }
  } finally {
    $archive.Dispose()
  }
} finally {
  $stream.Dispose()
}

$size = [math]::Round((Get-Item $zipPath).Length / 1KB, 1)
Write-Host ("created: {0} ({1} KB, {2} files, version {3})" -f $zipPath, $size, $fileCount, $manifest.version)
