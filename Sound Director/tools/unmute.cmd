@echo off
rem Unmute Sonic Pi's engine in Windows' per-app volume, in case a silent studio run ended without doing it.
rem Start Sonic Pi (or a studio run) first: a session only exists while the engine runs.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0appmute.ps1" unmute "Sonic Pi - SuperSonic"
