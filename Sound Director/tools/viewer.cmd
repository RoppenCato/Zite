@echo off
rem The studio's viewer: every delivered track and sound, played as the game would play them. http://localhost:8778/
rem   tools\viewer.cmd          starts the server and opens the page
start "" http://localhost:8778/
node "%~dp0serve.js" 8778
