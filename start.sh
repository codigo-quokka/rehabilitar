#!/bin/bash

echo "Iniciando el proyecto RehabilitAR..."

# cerrar ambos procesos
cleanup() {
    echo ""
    echo "Deteniendo servicios..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit
}

# trap para todos los cierres
trap cleanup SIGINT EXIT SIGTERM

echo "Iniciando Backend (API)..."
cd Rehabilitar-back/src/API
dotnet run &
BACKEND_PID=$!
cd ../../../

echo "Iniciando Frontend (React)..."
cd Rehabilitar-Front
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "Servicios en ejecución."
echo "Tirá Ctrl+C o cerrá esta ventana para detener ambos."

# Mantener el script corriendo para escuchar el Ctrl+C
wait $BACKEND_PID $FRONTEND_PID
