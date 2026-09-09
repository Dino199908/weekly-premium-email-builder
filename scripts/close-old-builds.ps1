$ErrorActionPreference = "SilentlyContinue"

$processes = Get-CimInstance Win32_Process |
  Where-Object {
    $_.Name -like "Weekly Premium Email Builder*.exe" -or
    $_.CommandLine -like "*Weekly Premium Email Builder*.exe*"
  }

foreach ($process in $processes) {
  $running = Get-Process -Id $process.ProcessId -ErrorAction SilentlyContinue
  if ($running -and $running.MainWindowHandle -ne 0) {
    if ($running.CloseMainWindow()) { $running.WaitForExit(8000) | Out-Null }
  }
}

foreach ($process in $processes) {
  Stop-Process -Id $process.ProcessId -Force
}
