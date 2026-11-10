@echo off
rem Stops the world on this PC: the keep-up loop, npm run online, the game server and the tunnel, by what each process
rem runs (Windows does not stop children with their parent). The scheduled task "Zite world" starts it all again at the
rem next logon; to stop that too: schtasks /delete /tn "Zite world" /f
powershell -NoProfile -Command ^
  "$marks = 'online-loop.cmd','tools/online.mjs','tools\online.mjs','server/src/index.ts','server\src\index.ts';" ^
  "Get-CimInstance Win32_Process | Where-Object { $cl = $_.CommandLine; $cl -and ($marks | Where-Object { $cl -like ('*' + $_ + '*') }) } | ForEach-Object { Write-Host ('stopping ' + $_.ProcessId + ' ' + $_.Name); Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue };" ^
  "Get-Process cloudflared -ErrorAction SilentlyContinue | ForEach-Object { Write-Host ('stopping ' + $_.Id + ' cloudflared'); Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue }"
echo The world is stopped on this PC.
