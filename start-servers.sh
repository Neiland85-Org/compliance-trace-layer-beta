#!/bin/bash

echo "🚀 INICIANDO SERVIDORES DEL JUEGO..."
echo "====================================="

# Función para verificar si un puerto está ocupado
check_port() {
    lsof -i :$1 >/dev/null 2>&1
    return $?
}

# Función para esperar a que un servicio esté listo
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1

    echo "⏳ Esperando $service_name..."
    while [ $attempt -le $max_attempts ]; do
        if curl -s --connect-timeout 2 "$url" >/dev/null 2>&1; then
            echo "✅ $service_name listo!"
            return 0
        fi
        echo "   Intento $attempt/$max_attempts..."
        sleep 1
        ((attempt++))
    done

    echo "❌ ERROR: $service_name no respondió después de $max_attempts segundos"
    return 1
}

# Verificar y liberar puertos si es necesario
echo "🔍 Verificando puertos..."
if check_port 4000; then
    echo "⚠️  Puerto 4000 ocupado, liberando..."
    pkill -f "node server.js" 2>/dev/null
    sleep 2
fi

if check_port 5173; then
    echo "⚠️  Puerto 5173 ocupado, liberando..."
    pkill -f "vite" 2>/dev/null
    sleep 2
fi

# Iniciar backend
echo ""
echo "🔧 Iniciando backend..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

echo "🔧 Iniciando frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "⏳ Esperando que los servicios estén listos..."

# Esperar backend
if ! wait_for_service "http://localhost:4000/health" "Backend"; then
    echo "❌ Error iniciando backend"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 1
fi

# Esperar frontend
if ! wait_for_service "http://localhost:5173" "Frontend"; then
    echo "❌ Error iniciando frontend"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo "🎉 ¡SERVIDORES INICIADOS EXITOSAMENTE!"
echo "====================================="
echo "🌐 Backend: http://localhost:4000"
echo "🌐 Frontend: http://localhost:5173"
echo ""
echo "💡 Ejecuta './open-game.sh' para abrir el juego en el navegador"
echo ""
echo "📊 PIDs de procesos:"
echo "   Backend: $BACKEND_PID"
echo "   Frontend: $FRONTEND_PID"
echo ""
echo "🛑 Para detener: pkill -f 'vite' && pkill -f 'node server.js'"