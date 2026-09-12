Start-Process powershell -WindowStyle Hidden -ArgumentList '-NoProfile','-Command','cd D:\projek_react\PJBL\siedu; npm run dev 2>&1 | Out-File D:\projek_react\PJBL\siedu\dev.log -Encoding utf8'
for ($i = 0; $i -lt 60; $i++) {
  Start-Sleep -Seconds 5
  $c = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
  if ($c) { Write-Output "LISTENING after $($i * 5)s"; exit 0 }
}
Write-Output "TIMEOUT no listener on :3000"
exit 1
