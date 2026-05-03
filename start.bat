@echo off
echo -------------------- RehabilitAR --------------------

echo.
echo Iniciando Backend (API)...
start "Rehabilitar API" cmd /c "cd Rehabilitar-back\src\API && dotnet run"

echo.
echo Iniciando Frontend (React)...
start "Rehabilitar Frontend" cmd /c "cd Rehabilitar-Front && npm run dev"

echo.
echo Servicios iniciados en ventanas separadas.
echo.
timeout /t 10
