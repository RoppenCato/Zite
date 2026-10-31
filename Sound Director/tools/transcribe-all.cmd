@echo off
rem Transcribe every track in Inspiration\ that has no notes.json yet, then analyse each. CPU only; do not run beside a render.
rem   tools\transcribe-all.cmd
setlocal enabledelayedexpansion
cd /d "%~dp0.."
for %%f in ("Inspiration\*.mp3") do (
  set "name=%%~nf"
  node -e "const p=process.argv[1].replace(/^\d+\s*/,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');process.stdout.write(p)" "!name!" > "%TEMP%\sgslug.txt"
  set /p slug=<"%TEMP%\sgslug.txt"
  if not exist "work\study\!slug!\notes.json" (
    echo === %%~nxf
    node tools\transcribe.js "%%f"
  )
  node tools\study.js "work\study\!slug!"
)
