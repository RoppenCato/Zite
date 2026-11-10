@echo off
rem Makes the PC start the world by itself when Robin logs in (Robin, 2026-11-10): a scheduled task "Zite world" that
rem runs tools\online-loop.cmd hidden (the server, the tunnel, started again if they stop). Run this once, as yourself;
rem no admin is needed for a task of your own. It also starts the task right away.
rem   To stop the world for now:   tools\stop-world.cmd   (it comes back at the next logon)
rem   To remove the task:          schtasks /delete /tn "Zite world" /f
set "HERE=%~dp0"
schtasks /create /f /tn "Zite world" /sc onlogon /rl limited /tr "wscript.exe \"%HERE%online-hidden.vbs\""
if errorlevel 1 (
  echo Could not create the task. Run this file by double-clicking it, or paste its schtasks line into a command window.
  pause
  exit /b 1
)
schtasks /run /tn "Zite world"
echo.
echo The task "Zite world" is made and started. The link for the phone is in server\data\online.json within a minute,
echo and in the log server\data\online.log. Ask Miles, GD for it in the chat.
pause
