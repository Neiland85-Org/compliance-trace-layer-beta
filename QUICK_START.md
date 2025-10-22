# 🚀 Guía de Inicio Rápido - 5 Minutos

## Objetivo

Levantar la aplicación en modo desarrollo **sin microservicios ni base de datos**, solo para ver la interfaz 3D y el sistema idempotente funcionando.

## Requisitos Previos

- Node.js v22 LTS (verificar con `node -v`)
- npm v10+ (verificar con `npm -v`)

**Si tienes Node.js v24:**

```bash
nvm install 22
nvm use 22
# O simplemente: nvm use (si existe .nvmrc)
```

## Pasos (5 minutos)

### 1. Instalar Dependencias (2 minutos)

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configurar Variables de Entorno (30 segundos)

```bash
# Backend - copiar archivo de ejemplo
cd backend
cp .env.example .env
# Los valores por defecto son correctos para desarrollo

# Frontend - copiar archivo de ejemplo
cd ../frontend
cp .env.example .env
# Los valores por defecto son correctos para desarrollo
```

### 3. Levantar Servidores (30 segundos)

**Terminal 1 - Backend:**

```bash
cd backend
npm start
# Debe mostrar: "Backend running on port 4000"
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
# Debe mostrar: "VITE v7.1.10  ready in XXX ms"
# Debe abrir navegador automáticamente en http://localhost:5173
```

### 4. Verificar que Todo Funciona (1 minuto)

Abre http://localhost:5173 en tu navegador y verifica:

**✅ Elementos visibles:**

- [ ] Escena 3D con estrellas de fondo
- [ ] 3 planetas (Earth en centro, Mars a la derecha, Titan a la izquierda)
- [ ] Satélite dorado orbitando
- [ ] Astronauta flotando (traje blanco, casco azul)
- [ ] Agujero negro con anillo rojo/naranja
- [ ] GameHUD en el centro (muestra STABILITY: 0, CARBON: 50)
- [ ] **Banner de cookies flotando** (fondo negro con glassmorphism)
- [ ] Dashboard de API en la parte inferior

**✅ Interacciones funcionando:**

1. **Click en Satellite:**

   - Aparece onda expansiva cyan
   - Aparece marcador ⟲ rotatorio
   - Satellite cambia a color cyan
   - STABILITY en HUD sube a 50%
   - Console muestra: "Satellite: Zone stabilized"

2. **Click en Astronaut:**

   - Aparece onda expansiva cyan
   - Aparece marcador ⟲ rotatorio
   - Astronaut cambia a color cyan
   - STABILITY en HUD sube a 100%
   - BlackHole comienza a desaparecer
   - Aparece pantalla de VICTORIA

3. **Banner de Cookies:**
   - Click en "Aceptar todas" → Banner desaparece
   - Click en "Rechazar todas" → Banner desaparece
   - Click en "Gestionar" → Muestra vista detallada con toggles

**⚠️ Si el banner de cookies NO aparece:**

Verifica que está integrado en EarthScene.jsx:

```bash
grep -n "CookieBanner" frontend/src/components/EarthScene.jsx
```

Debe mostrar:

```
11:import CookieBanner from './CookieBanner.jsx';
...
105:<CookieBanner position={[0, -4, 0]} onConsentChange={handleConsentChange} />
```

Si NO aparece, el componente no está integrado. Consulta `TROUBLESHOOTING.md` sección "Componentes No Visibles".

**⚠️ Si ves errores en consola del navegador:**

```
Error: Failed to load categories
Error: Network Error (api/cookies/categories)
```

**Causa:** El backend de cookies (microservicio) no está corriendo.

**Solución temporal:** Ignorar - el banner seguirá visible y funcional, solo no guardará en base de datos.

**Solución completa:** Levantar microservicios con Docker Compose (ver sección siguiente).

## Modo Avanzado: Con Microservicios (Opcional)

Si quieres probar el sistema completo con base de datos PostgreSQL y microservicios:

### Requisitos adicionales:

- Docker Desktop instalado y corriendo
- docker-compose disponible

### Pasos:

```bash
# Desde la raíz del proyecto
docker-compose up --build

# Esto levantará:
# - PostgreSQL (puerto 5432)
# - API Gateway (puerto 4000)
# - Trace Service (puerto 4001)
# - Cookie Consent Service (puerto 4002)
# - Frontend (puerto 5173)
```

**Verificar servicios:**

```bash
# API Gateway
curl http://localhost:4000/api/health

# Categorías de cookies
curl http://localhost:4000/api/cookies/categories

# Vendors de terceros
curl http://localhost:4000/api/cookies/vendors
```

**Con microservicios corriendo:**

- El banner de cookies cargará categorías reales desde la BD
- Las preferencias se guardarán en PostgreSQL
- Podrás ver el historial de consentimientos en la tabla `cookie_consents`

## Troubleshooting Rápido

**Frontend no inicia:**

```bash
cd frontend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
npm run dev
```

**Backend no responde:**

```bash
# Verificar que está corriendo
lsof -i :4000

# Si no hay proceso, reiniciar
cd backend
npm start
```

**Banner de cookies no aparece:**

- Verificar integración en EarthScene.jsx (ver arriba)
- Verificar consola del navegador (F12) para errores
- Verificar que no hay consentimiento previo: `localStorage.clear()` en consola

**Sistema idempotente no funciona:**

- Verificar que Satellite y Astronaut tienen handlers onClick
- Verificar consola para mensajes de click
- Presionar tecla `r` para resetear estabilización

## Recursos Adicionales

- 📖 [README completo](./README.md) - Documentación completa del proyecto
- 🔧 [TROUBLESHOOTING](./TROUBLESHOOTING.md) - Soluciones a problemas comunes
- 🔒 [SECURITY_SETUP](./SECURITY_SETUP.md) - Configuración de seguridad
- 🏗️ [ARCHITECTURE](./ARCHITECTURE.md) - Arquitectura de microservicios

## Próximos Pasos

Una vez que tengas la aplicación corriendo:

1. **Explorar el sistema idempotente** - Click en objetos 3D para estabilizar
2. **Probar el banner de cookies** - Gestionar preferencias granulares
3. **Generar transacciones** - Usar el Dashboard de API
4. **Configurar microservicios** - Levantar con Docker Compose
5. **Revisar código** - Entender la arquitectura y patrones

¡Disfruta explorando el Compliance Trace Layer! 🚀
