$ErrorActionPreference = "SilentlyContinue"

$processes = Get-CimInstance Win32_Process |
  Where-Object {
    $_.Name -like "Weekly Premium Email Builder*.exe" -or
    $_.CommandLine -like "*Weekly Premium Email Builder*.exe*"
  }

foreach ($process in $processes) {
  Stop-Process -Id $process.ProcessId -Force
}
