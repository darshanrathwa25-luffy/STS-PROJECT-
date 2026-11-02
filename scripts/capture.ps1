$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$root = 'C:\Users\RATHWA DARSHAN\Desktop\STS-PROJECT-'
$outDir = Join-Path $root 'docs\screenshots'

$proc = Start-Process -FilePath "npx.cmd" -ArgumentList "vite", "preview", "--port", "5173" -WorkingDirectory $root -PassThru
Start-Sleep -Seconds 4

try {
  $deskOut = Join-Path $outDir 'shell-desktop.png'
  $mobOut = Join-Path $outDir 'shell-mobile.png'
  
  Write-Host "Capturing desktop..."
  & $edge --headless=new --no-sandbox --disable-gpu "--screenshot=$deskOut" "--window-size=1440,900" "http://localhost:5173"
  
  Write-Host "Capturing mobile..."
  & $edge --headless=new --no-sandbox --disable-gpu "--screenshot=$mobOut" "--window-size=390,844" "http://localhost:5173"
} finally {
  Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
}
