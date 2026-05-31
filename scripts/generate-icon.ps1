$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$assetsDir = Join-Path $root "assets"
New-Item -ItemType Directory -Force -Path $assetsDir | Out-Null

$pngPath = Join-Path $assetsDir "icon.png"
$icoPath = Join-Path $assetsDir "icon.ico"

$size = 256
$bitmap = New-Object System.Drawing.Bitmap $size, $size
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.Clear([System.Drawing.Color]::Transparent)

$background = New-Object System.Drawing.Rectangle 12, 12, 232, 232
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$radius = 36
$diameter = $radius * 2
$path.AddArc($background.X, $background.Y, $diameter, $diameter, 180, 90)
$path.AddArc($background.Right - $diameter, $background.Y, $diameter, $diameter, 270, 90)
$path.AddArc($background.Right - $diameter, $background.Bottom - $diameter, $diameter, $diameter, 0, 90)
$path.AddArc($background.X, $background.Bottom - $diameter, $diameter, $diameter, 90, 90)
$path.CloseFigure()

$brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $background, ([System.Drawing.Color]::FromArgb(15, 123, 99)), ([System.Drawing.Color]::FromArgb(7, 92, 74)), 45
$graphics.FillPath($brush, $path)

$cardBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(246, 252, 249))
$graphics.FillRectangle($cardBrush, 58, 62, 140, 100)

$accentBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(197, 229, 218))
$graphics.FillRectangle($accentBrush, 58, 62, 140, 26)

$linePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(15, 123, 99)), 8
$graphics.DrawLine($linePen, 78, 106, 178, 106)
$graphics.DrawLine($linePen, 78, 130, 158, 130)

$mailPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::White), 12
$graphics.DrawRectangle($mailPen, 70, 168, 116, 58)
$graphics.DrawLine($mailPen, 70, 168, 128, 202)
$graphics.DrawLine($mailPen, 186, 168, 128, 202)

$graphics.Dispose()
$bitmap.Save($pngPath, [System.Drawing.Imaging.ImageFormat]::Png)

$pngBytes = [System.IO.File]::ReadAllBytes($pngPath)
$stream = New-Object System.IO.MemoryStream
$writer = New-Object System.IO.BinaryWriter $stream
$writer.Write([UInt16]0)
$writer.Write([UInt16]1)
$writer.Write([UInt16]1)
$writer.Write([Byte]0)
$writer.Write([Byte]0)
$writer.Write([Byte]0)
$writer.Write([Byte]0)
$writer.Write([UInt16]1)
$writer.Write([UInt16]32)
$writer.Write([UInt32]$pngBytes.Length)
$writer.Write([UInt32]22)
$writer.Write($pngBytes)
$writer.Flush()
[System.IO.File]::WriteAllBytes($icoPath, $stream.ToArray())
$writer.Dispose()
$stream.Dispose()
$bitmap.Dispose()
