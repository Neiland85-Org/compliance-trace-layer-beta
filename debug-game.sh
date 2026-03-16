#!/bin/bash

echo "🔥 DIAGNÓSTICO COMPLETO DEL JUEGO"
echo "=================================="

echo "📊 ESTADO DE SERVIDORES:"
echo "Backend (localhost:4000): $(curl -s --connect-timeout 2 http://localhost:4000/api/trace/check 2>/dev/null && echo '✅ FUNCIONANDO' || echo '❌ NO RESPONDE')"
echo "Frontend (localhost:5173): $(curl -s --connect-timeout 2 http://localhost:5173 2>/dev/null | grep -q '<!doctype html>' && echo '✅ FUNCIONANDO' || echo '❌ NO RESPONDE')"

echo ""
echo "🔍 PROCESOS ACTIVOS:"
ps aux | grep -E "(vite|node.*server)" | grep -v grep | wc -l | xargs echo "procesos encontrados:"

echo ""
echo "🌐 PRUEBA MANUAL:"
echo "1. Abre tu navegador"
echo "2. Ve a: http://localhost:5173"
echo "3. Si ves una página en blanco:"
echo "   - Presiona F12 (Developer Tools)"
echo "   - Ve a la pestaña 'Console'"
echo "   - Copia cualquier error rojo que veas"
echo "4. Si no carga nada:"
echo "   - Presiona Ctrl+Shift+R (hard refresh)"
echo "   - O limpia cache: Ctrl+Shift+Delete"

echo ""
echo "🛠️ COMANDOS DE DEBUG:"
echo "Ver logs del frontend: ps aux | grep vite | grep -v grep | awk '{print \$2}' | xargs kill -USR1"
echo "Reiniciar todo: ./start-servers.sh"
echo "Detener todo: pkill -f 'vite' && pkill -f 'node server.js'"

echo ""
echo "📞 SI SIGUE SIN FUNCIONAR:"
echo "- ¿Qué ves exactamente en http://localhost:5173?"
echo "- ¿Aparece algún error en la consola del navegador?"
echo "- ¿Estás usando un navegador específico?"