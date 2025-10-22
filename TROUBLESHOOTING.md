# 🔧 Guía de Troubleshooting - Frontend No Inicia

## Compliance Trace Layer — v0.1.0-beta

Esta guía proporciona soluciones detalladas para el problema identificado el 22 de octubre de 2025: el servidor de desarrollo del frontend no inicia con `npm run dev` mientras que `npm run build` funciona correctamente.

### Contexto del Problema

**Síntomas:**

- `npm run dev` no inicia el servidor Vite
- `npm run build` se ejecuta sin errores
- Node.js v24.4.1 instalado (versión muy reciente)

**Entorno afectado:**

- Node.js: v24.4.1
- Vite: 7.1.10
- React: 18.3.1
- Sistema operativo: macOS

**Causas probables (ordenadas por probabilidad):**

1. **Incompatibilidad Node v24 con dependencias nativas** (80% probabilidad)
2. **node_modules instalados con versión anterior de Node** (15% probabilidad)
3. **Archivo .env faltante o corrupto** (3% probabilidad)
4. **Conflicto de puertos** (2% probabilidad)

## 🔍 Diagnóstico Rápido (5 minutos)

### Comandos de verificación inicial

```bash
# Verificar versiones
node -v  # Debe mostrar v24.4.1
npm -v   # Debe mostrar v10.x

# Verificar que backend está corriendo
curl http://localhost:4000/api/trace/check
# Debe retornar: {"kyc":"passed","aml":"clean"}

# Verificar archivo .env del frontend
cat frontend/.env
# Debe contener: VITE_API_URL=http://localhost:4000

# Verificar puertos disponibles
lsof -i :5173
lsof -i :5174
# Si retorna algo, el puerto está ocupado

# Verificar integridad de node_modules
cd frontend
npm ls
# Buscar errores o dependencias faltantes
```

### Checklist de verificación

- [ ] Node.js v24.4.1 instalado
- [ ] Backend corriendo en puerto 4000
- [ ] Archivo `frontend/.env` existe y contiene `VITE_API_URL=http://localhost:4000`
- [ ] Puertos 5173 y 5174 están libres
- [ ] `npm install` completado sin errores
- [ ] `npm run build` funciona correctamente

## ⭐ Solución 1 - Limpiar y Reinstalar Dependencias (RECOMENDADO)

### Pasos detallados

```bash
# 1. Navegar al directorio del frontend
cd /Users/estudio/Projects/GitHub/NODE/compliance-trace-layer-beta/compliance-trace-layer-beta/frontend

# 2. Eliminar node_modules y lockfile
rm -rf node_modules package-lock.json

# 3. Limpiar caché de npm
npm cache clean --force

# 4. Verificar que .env existe
ls -la .env
# Si no existe: cp .env.example .env

# 5. Reinstalar dependencias con Node v24
npm install

# 6. Verificar que no hay errores en la instalación
# Buscar warnings sobre engines o peer dependencies

# 7. Intentar levantar dev server
npm run dev
```

### Salida esperada

```
VITE v7.1.10  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

### Si aparecen errores

- **Error de `EACCES`**: Problema de permisos, ejecutar con `sudo` o cambiar owner de node_modules
- **Error de `ENOENT`**: Archivo faltante, verificar que todos los archivos de configuración existen
- **Error de `MODULE_NOT_FOUND`**: Dependencia faltante, ejecutar `npm install` nuevamente
- **Error de `ERR_PNPM_UNSUPPORTED_ENGINE`**: Dependencia no soporta Node 24, ver Solución 3

### Por qué funciona

- Reconstruye todos los binarios nativos con Node v24
- Elimina cachés corruptos de versiones anteriores
- Resuelve conflictos de peer dependencies
- Regenera lockfile con resoluciones actualizadas

## � Problema: Componentes Implementados Pero No Visibles

**Síntomas:**

- Todos los archivos de componentes existen (CookieBanner.jsx, IdempotentWave.jsx, etc.)
- `npm run build` funciona sin errores
- El servidor levanta correctamente
- Pero al abrir la aplicación, no se ven los componentes nuevos
- La escena 3D se ve "vacía" o "incompleta"

**Causa:**
Los componentes fueron creados pero nunca se importaron/renderizaron en los componentes padre. Es como tener código que nunca se ejecuta.

**Verificación rápida:**

```bash
# Verificar que CookieBanner está importado en EarthScene.jsx
grep -n "import CookieBanner" frontend/src/components/EarthScene.jsx

# Verificar que CookieBanner está renderizado
grep -n "<CookieBanner" frontend/src/components/EarthScene.jsx

# Si ambos comandos no retornan resultados, el componente no está integrado
```

**Solución:**

1. Abrir `frontend/src/components/EarthScene.jsx`
2. Agregar import: `import CookieBanner from './CookieBanner.jsx';`
3. Agregar dentro del `<Canvas>`, después de `<BlackHole />`: `<CookieBanner position={[0, -4, 0]} onConsentChange={handleConsentChange} />`
4. Crear handler: `const handleConsentChange = (prefs) => console.log('Consent:', prefs);`
5. Guardar y recargar navegador

**Checklist de integración:**

- [ ] CookieBanner importado en EarthScene.jsx
- [ ] CookieBanner renderizado dentro de `<Canvas>`
- [ ] Handler `onConsentChange` creado
- [ ] Banner visible al cargar la aplicación
- [ ] Botones del banner funcionan (Aceptar/Rechazar/Gestionar)
- [ ] Sistema idempotente funciona (click en Satellite/Astronaut)
- [ ] GameHUD muestra stabilityScore
- [ ] GameOverScreen muestra victoria cuando stabilityScore = 100

**Nota sobre backend:**
Si el backend de cookies (microservicio) no está corriendo, el banner seguirá siendo visible pero mostrará errores en consola al intentar cargar categorías/vendors. Para funcionalidad completa, asegúrate de que:

- PostgreSQL está corriendo (puerto 5432)
- cookie-consent-service está corriendo (puerto 4002)
- api-gateway está corriendo (puerto 4000) y proxeando a cookie-consent-service

Para desarrollo rápido sin backend de cookies, el banner funcionará en "modo degradado" - se mostrará pero no guardará preferencias en base de datos.

## �🔌 Solución 2 - Verificar y Liberar Puertos

### Identificar proceso ocupando puerto

```bash
# Verificar puerto 5173
lsof -i :5173
# Output ejemplo:
# COMMAND   PID   USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
# node    12345  user   23u  IPv4  0x...      0t0  TCP *:5173 (LISTEN)

# Matar proceso si es necesario
kill -9 12345  # Reemplazar con PID real

# Verificar que el puerto está libre
lsof -i :5173
# No debe retornar nada
```

### Especificar puerto alternativo

```bash
cd frontend

# Intentar con puerto 5174
npm run dev -- --port 5174

# O con puerto personalizado
npm run dev -- --port 3000

# Con host expuesto para acceso desde red
npm run dev -- --port 5174 --host
```

### Modificar vite.config.js permanentemente

```javascript
// frontend/vite.config.js
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Puerto específico
    strictPort: true, // Fallar si puerto ocupado
    host: true,
    open: true,
  },
});
```

## ⚠️ Solución 3 - Downgrade a Node.js v22 LTS (SI TODO LO DEMÁS FALLA)

### Por qué Node 22 LTS

- Node.js v22 es la versión LTS actual (Long Term Support hasta abril 2027)
- Máxima compatibilidad con todo el ecosistema React/Vite/Three.js
- Todas las dependencias del proyecto están probadas con Node 22
- Node v24 es demasiado reciente (julio 2025) y muchas dependencias no lo soportan oficialmente

### Instalación con nvm (Node Version Manager)

```bash
# 1. Instalar nvm si no está instalado
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 2. Recargar shell
source ~/.bashrc  # o ~/.zshrc si usas zsh

# 3. Instalar Node 22 LTS
nvm install 22

# 4. Usar Node 22
nvm use 22

# 5. Verificar versión
node -v  # Debe mostrar v22.x.x
npm -v   # Debe mostrar v10.x.x

# 6. Configurar Node 22 como default
nvm alias default 22
```

### Reinstalar dependencias con Node 22

```bash
cd frontend

# Limpiar completamente
rm -rf node_modules package-lock.json
npm cache clean --force

# Reinstalar con Node 22
npm install

# Levantar dev server
npm run dev
```

### Verificar que funciona

```bash
# Debe abrir navegador automáticamente en http://localhost:5173
# O abrir manualmente y verificar:
# 1. Escena 3D se renderiza correctamente
# 2. No hay errores en consola del navegador (F12)
# 3. Botón "Generate Transaction" funciona
# 4. Peticiones al backend (localhost:4000) son exitosas
```

## 🔬 Solución 4 - Debug Profundo con Logs Detallados

### Ejecutar Vite con debug mode

```bash
cd frontend

# Modo debug completo
DEBUG=vite:* npm run dev

# O con más verbosidad
VITE_DEBUG=true npm run dev -- --debug

# Guardar logs en archivo para análisis
npm run dev 2>&1 | tee vite-debug.log
```

### Verificar logs de instalación

```bash
cd frontend

# Reinstalar con logs verbosos
npm install --loglevel verbose 2>&1 | tee install-debug.log

# Buscar errores específicos
grep -i "error" install-debug.log
grep -i "warn" install-debug.log
grep -i "deprecated" install-debug.log
```

### Errores comunes y soluciones

**Error: `EADDRINUSE`**

- Causa: Puerto ya en uso
- Solución: Ver Solución 2 (liberar puerto)

**Error: `MODULE_NOT_FOUND: Cannot find module 'vite'`**

- Causa: Instalación incompleta
- Solución: `rm -rf node_modules && npm install`

**Error: `Error: Cannot find module @rollup/rollup-[platform]`**

- Causa: Binario nativo de Rollup no compatible con Node 24
- Solución: Downgrade a Node 22 (Solución 3)

**Error: `[vite] Internal server error: Failed to resolve entry`**

- Causa: Archivo `src/main.jsx` no encontrado o corrupto
- Solución: Verificar que `frontend/src/main.jsx` existe y es válido

**Error: `EACCES: permission denied`**

- Causa: Permisos incorrectos en node_modules
- Solución: `sudo chown -R $USER:$USER node_modules`

**Error: `npm run dev` no inicia pero `./node_modules/.bin/vite dev --host --port 5173` sí funciona**

- Causa: Problema con la resolución de binarios de npm en Node.js v22
- Solución: Ejecutar vite directamente o actualizar el script en package.json
- Comando alternativo: `./node_modules/.bin/vite dev --host --port 5173`

## ✅ Verificación Post-Solución

### Checklist de verificación completa

- [ ] Frontend levanta sin errores en puerto 5173 o 5174
- [ ] Navegador abre automáticamente
- [ ] Escena 3D se renderiza correctamente
- [ ] No hay errores en consola del navegador (F12)
- [ ] DevTools → Network muestra peticiones al backend
- [ ] Botón "Generate Transaction" crea transacciones
- [ ] Peticiones POST a `http://localhost:4000/api/trace/create` retornan 200 OK
- [ ] Transacciones aparecen en la UI del frontend
- [ ] Hot Module Replacement (HMR) funciona al editar archivos

### Test de comunicación frontend-backend

```bash
# Terminal 1 - Backend (debe estar corriendo)
cd backend
npm start
# Output: Backend running on port 4000

# Terminal 2 - Frontend
cd frontend
npm run dev
# Output: VITE v7.1.10  ready in XXX ms

# Terminal 3 - Test manual con curl
curl -X POST http://localhost:4000/api/trace/create \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5173" \
  -d '{"transaction_id":"TEST-12345"}'

# Debe retornar:
# {"transaction_id":"TEST-12345","hash":"...","status":"verified","timestamp":"..."}
```

### Verificar headers de seguridad

```bash
# Verificar que CORS permite el frontend
curl -I -X OPTIONS http://localhost:4000/api/trace/create \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST"

# Debe incluir:
# Access-Control-Allow-Origin: http://localhost:5173
# Access-Control-Allow-Credentials: true
```

## 🚀 Prevención de Problemas Futuros

### Documentar versión de Node recomendada

- Agregar campo `engines` en `frontend/package.json`
- Crear archivo `.nvmrc` en raíz del proyecto con contenido `22`
- Actualizar README.md con requisitos de versión

### Script de verificación pre-start

- Crear `frontend/scripts/check-env.sh`
- Verificar versión de Node
- Verificar que .env existe
- Verificar que backend está corriendo
- Verificar que puertos están libres

### Configurar CI/CD con versión correcta

- Usar Node 22 LTS en GitHub Actions
- Cachear node_modules correctamente
- Ejecutar tests antes de deploy

## 📚 Recursos Adicionales

- [Documentación oficial de Vite 7](https://vite.dev/)
- [Guía de troubleshooting de Vite](https://vite.dev/guide/troubleshooting.html)
- [Node.js v24 release notes](https://nodejs.org/en/blog/release/v24.0.0)
- [React Three Fiber documentación](https://docs.pmnd.rs/react-three-fiber)
- [Guía de seguridad del proyecto](./SECURITY_SETUP.md)

## 📞 Contacto y Soporte

Si ninguna solución funciona, compartir:

- Output completo de `npm run dev`
- Output de `npm ls`
- Contenido de `vite-debug.log`
- Versión exacta de Node: `node -v`
- Sistema operativo y versión
