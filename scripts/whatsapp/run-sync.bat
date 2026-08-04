@echo off
rem WaveIGL WhatsApp sync - chamado pelo Windows Task Scheduler
rem Logs em .dev\wa-out.log e .dev\wa-err.log para diagnóstico
setlocal
cd /d "%~dp0..\.."

if not exist ".dev" mkdir ".dev"

set NODE=node
if exist "C:\ProgramData\nvm\nodejs\node.exe" set NODE=C:\ProgramData\nvm\nodejs\node.exe
if exist "C:\Program Files\nodejs\node.exe" set NODE=C:\Program Files\nodejs\node.exe

if not exist "node_modules\tsx\dist\cli.mjs" (
  call npm install --no-audit --no-fund
)

"%NODE%" "node_modules\tsx\dist\cli.mjs" "scripts\whatsapp\sync.mts" >> ".dev\wa-out.log" 2>> ".dev\wa-err.log"
exit /b %errorlevel%
