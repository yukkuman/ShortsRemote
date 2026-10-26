# アイコンを生成する（デザインツール不要で再生成できるように）
# 使い方: powershell -ExecutionPolicy Bypass -File tools/make-icons.ps1
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$outDir = Join-Path $PSScriptRoot '..\extension\icons'
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

function New-RoundedPath([float]$w, [float]$h, [float]$r) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $path.AddArc(0, 0, $d, $d, 180, 90)
  $path.AddArc($w - $d, 0, $d, $d, 270, 90)
  $path.AddArc($w - $d, $h - $d, $d, $d, 0, 90)
  $path.AddArc(0, $h - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  return $path
}

foreach ($size in 16, 32, 48, 128) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.Color]::Transparent)

  $bg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(232, 33, 12))
  $path = New-RoundedPath $size $size ([float]($size * 0.22))
  $g.FillPath($bg, $path)

  $white = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
  $w = [float]($size * 0.42)
  $h = [float]($size * 0.22)
  $x = [float](($size - $w) / 2)

  foreach ($top in @(([float]($size * 0.20)), ([float]($size * 0.52)))) {
    $points = @(
      (New-Object System.Drawing.PointF($x, $top)),
      (New-Object System.Drawing.PointF(($x + $w), $top)),
      (New-Object System.Drawing.PointF(($x + $w / 2), ($top + $h)))
    )
    $g.FillPolygon($white, [System.Drawing.PointF[]]$points)
  }

  $file = Join-Path $outDir ("icon{0}.png" -f $size)
  $bmp.Save($file, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
  Write-Host ("wrote {0}" -f $file)
}
