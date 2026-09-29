@echo off
rem ============================================================
rem  AnatoApp - lanzador
rem  Levanta un servidor local y abre la app en el navegador.
rem  Dejá esta ventana negra abierta mientras estudiás.
rem ============================================================
title AnatoApp
cd /d "%~dp0"

where python >nul 2>&1
if errorlevel 1 (
  echo No se encontro Python. Abri "index.html" con doble clic en su lugar.
  pause
  exit /b 1
)

echo.
echo   AnatoApp esta corriendo en  http://localhost:8777
echo   Dejá esta ventana abierta mientras estudias.
echo   Para cerrar la app: cerra esta ventana.
echo.

start "" http://localhost:8777
python -m http.server 8777 --bind 127.0.0.1
