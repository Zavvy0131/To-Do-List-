@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js is required to run the mobile server.
  echo Install it from https://nodejs.org and then double-click this file again.
  echo.
  pause
  exit /b 1
)

node server.js
pause
