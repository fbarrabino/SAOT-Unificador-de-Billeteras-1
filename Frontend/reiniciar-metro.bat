@echo off
cd /d "%~dp0"
echo Limpiando cache de Metro...
if exist "%TEMP%\metro-*" del /f /q "%TEMP%\metro-*" 2>nul
if exist "%LOCALAPPDATA%\Temp\metro-*" del /f /q "%LOCALAPPDATA%\Temp\metro-*" 2>nul
echo Iniciando servidor con cache limpio...
pnpm start --clear
