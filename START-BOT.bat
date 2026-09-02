@echo off
setlocal
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Install the LTS version from https://nodejs.org/ then run this file again.
  pause
  exit /b 1
)
if not exist .env (
  copy .env.example .env >nul
  echo.
  echo A .env file was created. Open it, paste your Discord and OpenAI keys, save it, then run START-BOT.bat again.
  start notepad .env
  pause
  exit /b 0
)
if not exist node_modules (
  echo Installing bot packages. This happens only once...
  call npm install
  if errorlevel 1 (
    echo Package installation failed. Check your internet connection and try again.
    pause
    exit /b 1
  )
)
echo Starting Discord bot...
call npm start
pause
