@echo off
rem Keeps the world up: runs npm run online (the server and the tunnel) and starts it again if it ever stops.
rem The scheduled task "Zite world" runs this hidden through online-hidden.vbs; it can also be run by hand in a window.
cd /d "%~dp0.."
if not exist server\data mkdir server\data
:again
echo [loop] %date% %time% starting >> server\data\online.log
call npm run online >> server\data\online.log 2>&1
echo [loop] %date% %time% stopped, again in 15 s >> server\data\online.log
timeout /t 15 /nobreak >nul
goto again
