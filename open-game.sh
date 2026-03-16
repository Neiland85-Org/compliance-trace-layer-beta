#!/bin/bash

echo "🚀 ABRIENDO JUEGO EN NAVEGADOR..."
echo "=================================="

# Verificar que los servidores estén corriendo
BACKEND_OK=$(curl -s --connect-timeout 2 http://localhost:4000/api/trace/check 2>/dev/null)
FRONTEND_OK=$(curl -s --connect-timeout 2 http://localhost:5173 2>/dev/null | grep -o "<!doctype html>" 2>/dev/null)

if [ -z "$BACKEND_OK" ] || [ -z "$FRONTEND_OK" ]; then
    echo "❌ ERROR: Los servidores no están funcionando"
    echo "Ejecuta primero: ./start-servers.sh"
    exit 1
fi

echo "✅ Servidores verificados"

# Abrir navegador
echo "🌐 Abriendo navegador en: http://localhost:5173"

# Detectar sistema operativo y abrir navegador
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open "http://localhost:5173"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open "http://localhost:5173" 2>/dev/null || echo "Abre manualmente: http://localhost:5173"
else
    # Windows o desconocido
    echo "🌐 Abre tu navegador y ve a: http://localhost:5173"
fi

echo ""
echo "🎮 INSTRUCCIONES:"
echo "1. Si no ves el juego, presiona Ctrl+F5 (hard refresh)"
echo "2. Si aún no carga, limpia cache del navegador"
echo "3. El juego debería mostrar una escena 3D con astronauta y Tierra"