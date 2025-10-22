# Compliance Trace Layer Beta

![Node.js Version](https://img.shields.io/badge/node-22.x%20LTS-brightgreen)
![npm Version](https://img.shields.io/badge/npm-10.x-blue)

**Compliance Trace Layer Beta** es un middleware de prueba de concepto (proof-of-concept) diseñado para validar y rastrear transacciones de créditos de carbono, desde la compra inicial hasta el retiro final en la blockchain. Este proyecto combina una arquitectura full-stack con una interfaz inmersiva en 3D, ofreciendo una experiencia visual única para monitorear el cumplimiento ambiental.

## Características Principales

### Arquitectura de Microservicios 🏗️

**Compliance Trace Layer Beta** implementa una arquitectura de microservicios moderna con base de datos compartida (PostgreSQL), diseñada para escalabilidad, mantenibilidad y despliegue independiente.

#### Servicios Independientes

- **API Gateway**: Punto de entrada único con seguridad global (CORS, rate limiting, Helmet)
- **Trace Service**: Gestión de transacciones de trazabilidad de carbono con PostgreSQL
- **Cookie Consent Service**: Gestión GDPR-compliant de consentimientos de cookies
- **Frontend**: Interfaz 3D inmersiva con banner de cookies integrado

#### Base de Datos Compartida

- **PostgreSQL 16**: Almacenamiento ACID para trazas y consentimientos
- **Esquemas Optimizados**: Índices, constraints y migraciones versionadas
- **Auditoría Completa**: Registro de IP, timestamps y metadatos

### Sistema de Estabilización Idempotente 🌀

**Compliance Trace Layer Beta** introduce un innovador sistema de juego basado en el concepto matemático de idempotencia (f(f(x)) = f(x)), donde hacer clic repetidamente en objetos 3D estabiliza el sistema sin cambiar el estado después de la estabilización inicial.

#### Mecánicas de Juego

- **Clicks Estabilizantes**: El primer clic en un objeto (Satélite o Astronauta) lo estabiliza, activando ondas expansivas cian y marcadores permanentes ⟲
- **Clicks Idempotentes**: Clicks posteriores en objetos ya estabilizados no cambian el estado pero refuerzan la estabilidad del sistema
- **Puntuación de Estabilidad**: Se calcula como porcentaje de objetos estabilizados (0-100)
- **Efectos Visuales**:
  - Ondas expansivas cian que se expanden desde el punto de clic
  - Marcadores ⟲ rotativos permanentes en objetos estabilizados
  - Cambio de color a cian en objetos estabilizados
  - Intensidad del Agujero Negro inversamente proporcional a la estabilidad

#### Condiciones de Victoria

- **Victoria Idempotente**: Alcanzar 100% de estabilidad estabilizando todos los objetos interactivos
- **Pantalla de Victoria**: Muestra "✨ VICTORY ACHIEVED ✨" con el símbolo ⟲ y mensaje de equilibrio perfecto

#### Estados del Sistema

- **Estabilidad < 50%**: Agujero Negro activo con alta intensidad, amenazando el sistema
- **Estabilidad 50-75%**: Estabilización parcial, ondas propagándose
- **Estabilidad 75-99%**: Resonancia casi completa, sistema cercano al equilibrio
- **Estabilidad 100%**: Armonía perfecta, victoria conseguida

### Backend (Node.js)

- **Arquitectura de Microservicios**: Servicios independientes con comunicación vía HTTP
- **API Gateway**: Punto de entrada único, proxy a servicios, seguridad global
- **Trace Service**: Gestión de transacciones de carbono con PostgreSQL
- **Cookie Consent Service**: Gestión GDPR-compliant de consentimientos
- **Base de Datos**: PostgreSQL 16 con esquemas optimizados y migraciones

### Frontend (React + Vite)

- **Interfaz 3D Interactiva**: Utiliza React Three Fiber y Three.js para renderizar una escena cósmica con planetas texturizados (Tierra, Marte y Júpiter), simbolizando la sostenibilidad planetaria y el impacto ambiental.
- **Banner de Cookies GDPR-compliant**: Integrado en escena 3D usando Html de drei, con diseño glassmorphism moderno
- **Controles Orbitales**: Permite navegación intuitiva alrededor de los planetas con zoom, rotación y selección interactiva.
- **Dashboard de Verificación**: Incluye componentes como consola UI, modales informativos y animaciones fluidas con Framer Motion.
- **Estilos Modernos**: Implementado con TailwindCSS para un diseño responsivo y minimalista, enfocado en la inmersión.
- **Estado Global**: Gestionado con Zustand para manejar selecciones de planetas y modales dinámicos.

## Tecnologías Utilizadas

- **Frontend**: React 18.3.1, Vite 7.1.10, React Three Fiber 8.18.0, @react-three/drei (Html component), Three.js 0.171.0, TailwindCSS 4.1.14, Framer Motion 11.0.0, Zustand 5.0.8, Axios.
- **Backend**: Node.js 22.x LTS, Express.js 5.1.0, PostgreSQL 16, pg (PostgreSQL client), http-proxy-middleware, express-validator, winston, helmet, express-rate-limit, cors, dotenv, uuid.
- **DevOps**: Docker, Docker Compose, ESLint, PostCSS, Autoprefixer.
- **Control de Versiones**: Git, con ramas main y development para gestión colaborativa.

**Nota sobre versiones**: Se utiliza `@react-three/postprocessing@^2.15.1` compatible con React Three Fiber 8.x. La versión 3.x requiere React 19 + R3F 9 y se adoptará al actualizar el stack. Three.js está fijado en ^0.171.0 para compatibilidad con postprocessing 2.x y evitar regresiones con versiones superiores.

## 📋 Requisitos del Sistema

### Versiones Recomendadas

- **Node.js**: `v22.x LTS` (recomendado) o `v20.x LTS`
- **npm**: `v10.x` o superior
- **Sistema operativo**: macOS, Linux, o Windows con WSL2

### ⚠️ Nota sobre Node.js v24

> ⚠️ **IMPORTANTE**: Node.js v24 puede causar problemas con el servidor de desarrollo del frontend debido a incompatibilidades con dependencias nativas (meyda, @react-three/cannon). Se recomienda usar Node.js v22 LTS para máxima estabilidad.

### Verificar versión de Node

```bash
node -v  # Debe mostrar v22.x.x
npm -v   # Debe mostrar v10.x.x
```

### Cambiar a Node 22 con nvm

```bash
# Instalar nvm si no está instalado
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Recargar shell
source ~/.bashrc  # o ~/.zshrc si usas zsh

# Instalar y usar Node 22
nvm install 22
nvm use 22

# O simplemente (si existe .nvmrc)
nvm use
```

## Instalación y Uso

1. **Clona el repositorio**:

   ```bash
   git clone https://github.com/Neiland85-Org/compliance-trace-layer-beta.git
   cd compliance-trace-layer-beta
   ```

2. **Instala dependencias**:

   - Backend: `cd backend && npm install`
   - Frontend: `cd frontend && npm install`

   > 💡 **Si tienes problemas con el frontend**: Si encuentras errores al instalar o ejecutar `npm run dev`, limpia y reinstala las dependencias:
   >
   > ```bash
   > cd frontend
   > rm -rf node_modules package-lock.json
   > npm cache clean --force
   > npm install
   > ```

2.5. **Configura variables de entorno**:

El proyecto soporta dos modos de ejecución del backend:

#### Modo Monolítico (Backend Único)

Para desarrollo simple usando `backend/server.js` (sin microservicios):

```bash
cp backend/.env.example backend/.env
# Edita backend/.env con valores apropiados
```

**Variables requeridas:**

- `PORT` - Puerto del servidor (ej: 4000)
- `NODE_ENV` - Entorno de ejecución (development/production)
- `ALLOWED_ORIGINS` - Orígenes CORS permitidos
- `RATE_LIMIT_WINDOW_MS` - Ventana rate limiting en ms
- `RATE_LIMIT_MAX_REQUESTS` - Máximo peticiones por ventana

**Ejemplo `.env` para desarrollo local:**

```bash
PORT=4000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

> **Nota:** En modo monolítico, los endpoints `/api/cookies/*` no estarán disponibles.

#### Modo Microservicios + API Gateway

Para desarrollo completo con servicios independientes:

```bash
cp backend/.env.example backend/.env
# Edita backend/.env con valores apropiados
```

**Variables requeridas adicionales:**

- `DATABASE_URL` - URL de conexión PostgreSQL
- `DATABASE_POOL_MAX` - Máximo conexiones al pool
- `DATABASE_POOL_IDLE_TIMEOUT` - Timeout conexiones idle
- `TRACE_SERVICE_URL` - URL del servicio de trazabilidad
- `COOKIE_CONSENT_SERVICE_URL` - URL del servicio de cookies
- `CONSENT_VERSION` - Versión del consentimiento
- `CONSENT_EXPIRY_MONTHS` - Meses de expiración del consentimiento

**Ejemplo `.env` para desarrollo local:**

```bash
# Servidor
PORT=4000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Base de datos
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/compliance_trace
DATABASE_POOL_MAX=20
DATABASE_POOL_IDLE_TIMEOUT=30000

# Microservicios (desarrollo local)
TRACE_SERVICE_URL=http://localhost:4001
COOKIE_CONSENT_SERVICE_URL=http://localhost:4002

# Configuración de cookies
CONSENT_VERSION=1.0.0
CONSENT_EXPIRY_MONTHS=12
```

**Ejemplo `.env` para Docker:**

```bash
# Servidor
PORT=4000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Base de datos
DATABASE_URL=postgresql://postgres:password@localhost:5432/compliance_trace
DATABASE_POOL_MAX=20
DATABASE_POOL_IDLE_TIMEOUT=30000

# Microservicios (nombres de contenedor Docker)
TRACE_SERVICE_URL=http://trace-service:4001
COOKIE_CONSENT_SERVICE_URL=http://cookie-consent-service:4002

# Configuración de cookies
CONSENT_VERSION=1.0.0
CONSENT_EXPIRY_MONTHS=12
```

**Frontend:**

```bash
cp frontend/.env.example frontend/.env
# Edita frontend/.env si el backend usa puerto diferente a 4000
```

Variable requerida: `VITE_API_URL`

⚠️ **Importante:** Los archivos `.env` NO deben subirse a git. Están protegidos por `.gitignore`.

3. **Ejecuta el proyecto**:

   - Backend: `cd backend && npm start`
   - Frontend: `cd frontend && npm run dev` (accede en `http://localhost:5173`)

   > 💡 **Tip**: Si el frontend no inicia con `npm run dev`, consulta la [Guía de Troubleshooting](./TROUBLESHOOTING.md) para soluciones detalladas.

### Desarrollo Local sin Docker

Para desarrollo local sin Docker, configura los microservicios para que se comuniquen vía `localhost`:

1. **Configura `backend/.env`** con URLs localhost:

   ```bash
   # Microservicios (URLs localhost para desarrollo sin Docker)
   TRACE_SERVICE_URL=http://localhost:4001
   COOKIE_CONSENT_SERVICE_URL=http://localhost:4002
   ```

2. **Inicia servicios en terminales separadas**:

   ```bash
   # Terminal A: Trace Service (puerto 4001)
   cd backend/trace-service && npm start

   # Terminal B: Cookie Consent Service (puerto 4002)
   cd backend/cookie-consent-service && npm start

   # Terminal C: API Gateway (puerto 4000)
   cd backend/api-gateway && npm start
   ```

3. **Verifica servicios funcionando**:

   ```bash
   # Health check de todos los servicios
   curl http://localhost:4000/api/health
   # Debe retornar: {"status":"healthy","services":{"trace":"up","cookies":"up"}}

   # Verificar endpoint de categorías de cookies
   curl http://localhost:4000/api/cookies/categories
   # Debe retornar: 200 OK con lista de categorías
   ```

### 3.1. Verificar que todo funciona correctamente

Después de levantar los servidores, verifica que todos los componentes sean visibles:

**Frontend (http://localhost:5173):**

- ✅ Escena 3D con planetas (Earth, Mars, Titan)
- ✅ Satélite orbitando (dorado, con paneles solares)
- ✅ Astronauta flotando (traje blanco con casco azul)
- ✅ Agujero negro activo (anillo rojo/naranja)
- ✅ GameHUD en el centro (muestra STABILITY y CARBON)
- ✅ **Banner de cookies flotando** (fondo negro con glassmorphism, botones Aceptar/Rechazar/Gestionar)
- ✅ Dashboard de API en la parte inferior

**Interacciones disponibles:**

1. **Click en Satellite** → Onda expansiva cyan + marcador ⟲ aparece
2. **Click en Astronaut** → Onda expansiva cyan + marcador ⟲ aparece
3. **Cuando ambos estabilizados** → BlackHole desaparece + pantalla de VICTORIA
4. **Banner de cookies** → Click en botones guarda preferencias

**Si NO ves el banner de cookies:**

```bash
# Verificar que está integrado en EarthScene.jsx
grep -n "CookieBanner" frontend/src/components/EarthScene.jsx

# Debe mostrar:
# - import CookieBanner from './CookieBanner.jsx';
# - <CookieBanner position={[0, -4, 0]} onConsentChange={handleConsentChange} />

# Si no aparece, el componente no está integrado
# Consulta TROUBLESHOOTING.md sección "Componentes No Visibles"
```

**Si el banner muestra errores en consola:**

- Error: `Failed to load categories/vendors` → Backend de cookies no está corriendo
- Solución temporal: El banner seguirá visible, solo no guardará en BD
- Solución completa: Levantar microservicios con Docker Compose (ver sección "Despliegue con Docker")

**Backend (http://localhost:4000):**

```bash
# Verificar que el backend responde
curl http://localhost:4000/api/trace/check
# Debe retornar: {"kyc":"passed","aml":"clean"}

# Verificar endpoint de cookies (si microservicios están corriendo)
curl http://localhost:4000/api/cookies/categories
# Debe retornar: [{"id":1,"category_key":"necessary",...}]
```

**Teclas de testing:**

- `v` - Forzar victoria (estabiliza ambas zonas)
- `r` - Reset estabilización
- `b` - Toggle BlackHole (si está implementado en EarthScene)

**Nota importante:**
Si estás usando Node.js v24, el frontend puede tener problemas para iniciar con `npm run dev`. Usa Node.js v22 LTS (ver sección "Requisitos del Sistema" y archivo `.nvmrc`).

4. **Explora la escena 3D**: Interactúa con los planetas para ver detalles sobre cumplimiento y trazabilidad.

## 🐳 Despliegue con Docker

### Levantar todos los servicios con Docker Compose

```bash
# Construir y levantar todos los servicios
docker-compose up --build

# En segundo plano
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down
```

### Servicios disponibles

- **API Gateway**: http://localhost:4000
- **Trace Service**: http://localhost:4001 (interno)
- **Cookie Consent Service**: http://localhost:4002 (interno)
- **Frontend**: http://localhost:5173
- **PostgreSQL**: localhost:5432

### Ejecutar migraciones de base de datos

```bash
docker-compose exec postgres psql -U postgres -d compliance_trace -f /docker-entrypoint-initdb.d/001_initial_schema.sql
```

## Arquitectura del Proyecto

- **Raíz**: Documentación, docker-compose.yml, configuración Docker
- **Backend/**: Microservicios independientes
  - **api-gateway/**: Punto de entrada, proxy, seguridad global
  - **trace-service/**: Gestión de trazabilidad con PostgreSQL
  - **cookie-consent-service/**: Gestión de consentimientos GDPR-compliant
  - **database/**: Esquemas SQL y migraciones
- **Frontend/**: Aplicación React con componentes 3D y UI

## 🔒 Seguridad y Configuración

Este proyecto implementa múltiples capas de seguridad para proteger la integridad de los datos y prevenir ataques comunes.

### Variables de Entorno

| Componente   | Variable                     | Descripción                      | Valor por Defecto                    | Modo           |
| ------------ | ---------------------------- | -------------------------------- | ------------------------------------ | -------------- |
| **Backend**  | `PORT`                       | Puerto del servidor              | `4000`                               | Monolítico     |
|              | `NODE_ENV`                   | Entorno de ejecución             | `development`                        | Monolítico     |
|              | `ALLOWED_ORIGINS`            | Orígenes CORS permitidos         | `http://localhost:5173`              | Monolítico     |
|              | `RATE_LIMIT_WINDOW_MS`       | Ventana rate limiting (ms)       | `900000` (15 min)                    | Monolítico     |
|              | `RATE_LIMIT_MAX_REQUESTS`    | Máximo peticiones por ventana    | `100`                                | Monolítico     |
|              | `DATABASE_URL`               | URL de conexión PostgreSQL       | `postgresql://...`                   | Microservicios |
|              | `DATABASE_POOL_MAX`          | Máximo conexiones al pool        | `20`                                 | Microservicios |
|              | `DATABASE_POOL_IDLE_TIMEOUT` | Timeout conexiones idle (ms)     | `30000`                              | Microservicios |
|              | `TRACE_SERVICE_URL`          | URL del servicio de trazabilidad | `http://trace-service:4001`          | Microservicios |
|              | `COOKIE_CONSENT_SERVICE_URL` | URL del servicio de cookies      | `http://cookie-consent-service:4002` | Microservicios |
|              | `CONSENT_VERSION`            | Versión del consentimiento       | `1.0.0`                              | Microservicios |
|              | `CONSENT_EXPIRY_MONTHS`      | Meses de expiración              | `12`                                 | Microservicios |
| **Frontend** | `VITE_API_URL`               | URL del backend                  | `http://localhost:4000`              | Siempre        |

### Características de Seguridad

- **CORS Restrictivo**: Solo permite orígenes configurados en `ALLOWED_ORIGINS`
- **Rate Limiting**: Limita peticiones a 100 por 15 minutos por IP (configurable)
- **Headers de Seguridad**: Helmet agrega headers HTTP de protección (CSP, X-Frame-Options, etc.)
- **Validación de Entrada**: Todos los endpoints validan tipo, longitud y formato de datos
- **Variables de Entorno**: Configuración sensible separada del código

### Testing y Verificación

Para verificar que todas las medidas de seguridad funcionan correctamente, consulta la guía detallada:

📖 **[Guía de Configuración y Verificación de Seguridad](./SECURITY_SETUP.md)**

**Verificaciones rápidas:**

- Archivos `.env` no están en git: `git status`
- Comunicación frontend-backend funciona
- Headers de seguridad presentes: `curl -I http://localhost:4000/api/trace/check`

## 🔧 Troubleshooting

Si encuentras problemas al levantar los servidores, especialmente con el frontend, consulta nuestra guía completa de troubleshooting.

### Problema Común: Frontend no inicia con npm run dev

**Síntomas:**

- `npm run dev` no inicia el servidor Vite
- `npm run build` funciona correctamente
- Usando Node.js v24.x

**Solución rápida:**

```bash
cd frontend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
npm run dev
```

**Si persiste el problema:**

- Cambiar a Node.js v22 LTS (ver sección de Requisitos)
- Consultar [Guía de Troubleshooting completa](./TROUBLESHOOTING.md)

### Otros Problemas Comunes

- **Error de CORS**: Verificar `ALLOWED_ORIGINS` en `backend/.env`
- **Error de conexión**: Verificar que backend está corriendo en puerto 4000
- **Puerto ocupado**: Usar `lsof -i :5173` y matar proceso o cambiar puerto
- **Variables de entorno**: Verificar que archivos `.env` existen y son correctos

### Recursos de Ayuda

- 📖 [Guía de Troubleshooting Detallada](./TROUBLESHOOTING.md)
- 🔒 [Guía de Seguridad y Configuración](./SECURITY_SETUP.md)

## Contribución

Este proyecto está en fase beta. Para contribuir:

- Crea una rama desde `development`.
- Implementa cambios y realiza commits descriptivos.
- Envía un pull request con descripción bilingüe (español/inglés).

## 🛡️ Reporte de Vulnerabilidades

Si encuentras una vulnerabilidad de seguridad, por favor NO la reportes públicamente. Contacta directamente al autor.

## Licencia

Ver `LICENSE` para detalles.

## Mejoras Futuras

- ✅ **Implementado: PostgreSQL con esquemas de trazabilidad y consentimientos**
- ✅ **Implementado: Winston para logging estructurado**
- **Database per Service**: Migrar de shared database a database-per-service para mayor independencia
- **Service Mesh**: Implementar Istio o Linkerd para observabilidad y seguridad entre servicios
- **Event-Driven Architecture**: Agregar message broker (RabbitMQ/Kafka) para comunicación asíncrona
- **Analytics Dashboard**: Panel de visualización de consentimientos y métricas de compliance

## 🍪 Sistema de Cookies y Privacidad

### Cumplimiento GDPR 2025

El sistema de gestión de cookies cumple con los requisitos más recientes de GDPR y ePrivacy:

- ✅ **Botones "Aceptar todas" y "Rechazar todas" con igual prominencia**
- ✅ **Sin cookies no-esenciales antes del consentimiento**
- ✅ **Gestión granular por categoría y vendor**
- ✅ **Retiro de consentimiento en cualquier momento**
- ✅ **Registro completo de auditoría (IP, timestamp, preferencias)**
- ✅ **Expiración automática después de 12 meses**
- ✅ **Sin pre-checks ni dark patterns**

### Categorías de Cookies

- **Necesarias**: Esenciales para el funcionamiento (siempre activas)
- **Analíticas**: Google Analytics para entender uso del sitio
- **Publicitarias**: Facebook Pixel, Google Ads para anuncios personalizados
- **Personalización**: Preferencias de usuario y configuración

### Gestión de Consentimiento

El banner de cookies aparece integrado en la escena 3D con diseño glassmorphism moderno. Los usuarios pueden:

1. **Aceptar todas las cookies** con un clic
2. **Rechazar todas** excepto las necesarias
3. **Gestionar preferencias granulares** por categoría
4. **Ver lista completa de vendors** de terceros
5. **Retirar consentimiento** desde configuración

Todos los consentimientos se almacenan en PostgreSQL con auditoría completa.

## Contribución
