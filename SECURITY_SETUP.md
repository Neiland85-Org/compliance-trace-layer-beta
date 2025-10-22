# Guía de Configuración y Verificación de Seguridad

## Compliance Trace Layer — v0.1.0-beta

Esta guía proporciona instrucciones detalladas para configurar y verificar que todas las medidas de seguridad implementadas funcionen correctamente en el proyecto Compliance Trace Layer.

## 🔍 Verificación de Archivos de Entorno

### Archivos Requeridos

Los siguientes archivos **NO deben estar en git** y deben existir localmente:

- `backend/.env` - Variables de entorno del backend
- `frontend/.env` - Variables de entorno del frontend

**Verificar que no están en git:**

```bash
git status
```

Los archivos `.env` no deben aparecer en la lista de archivos modificados.

### Variables Requeridas

#### Backend (`backend/.env`)

| Variable                  | Descripción                   | Valor Recomendado Desarrollo | Requerido |
| ------------------------- | ----------------------------- | ---------------------------- | --------- |
| `PORT`                    | Puerto del servidor Express   | `4000`                       | ✅        |
| `NODE_ENV`                | Entorno de ejecución          | `development`                | ✅        |
| `ALLOWED_ORIGINS`         | Orígenes CORS permitidos      | `http://localhost:5173`      | ✅        |
| `RATE_LIMIT_WINDOW_MS`    | Ventana de rate limiting (ms) | `900000` (15 min)            | ✅        |
| `RATE_LIMIT_MAX_REQUESTS` | Máximo peticiones por ventana | `100`                        | ✅        |

#### Frontend (`frontend/.env`)

| Variable       | Descripción     | Valor Recomendado Desarrollo | Requerido |
| -------------- | --------------- | ---------------------------- | --------- |
| `VITE_API_URL` | URL del backend | `http://localhost:4000`      | ✅        |

### Protección .gitignore

**Verificar protección en .gitignore raíz (líneas 69-71):**

```bash
git check-ignore backend/.env frontend/.env
```

Debe retornar ambos paths si están correctamente protegidos.

**Verificar protección en frontend/.gitignore (líneas 36-42):**

```bash
cat frontend/.gitignore | grep -A 10 "# Environment variables"
```

## 🧪 Testing de Comunicación Frontend-Backend

### Levantar Servidores

1. **Backend primero:**

```bash
cd backend
npm install  # Si no se ha hecho
node server.js
```

_Salida esperada:_ `Backend running on port 4000`

2. **Frontend después:**

```bash
cd ../frontend
npm install  # Si no se ha hecho
npm run dev
```

_Salida esperada:_ `Local: http://localhost:5173/`

### Verificar Conexión

1. Abrir navegador en `http://localhost:5173`
2. Abrir DevTools (F12) → pestaña **Network**
3. Hacer clic en botón **"Generate Transaction"**
4. Verificar en Network:
   - Petición **POST** a `http://localhost:4000/api/trace/create`
   - **Status: 200 OK**
   - **Response:** JSON con `transaction_id`, `hash`, `status`, `timestamp`
5. Verificar que la transacción aparece en la UI

### Testing de Errores

**Detener backend y verificar error:**

```bash
# En terminal del backend: Ctrl+C
# En frontend: verificar error en console del navegador
```

**Cambiar URL incorrecta:**

```bash
# Editar frontend/.env: VITE_API_URL=http://localhost:9999
# Reiniciar frontend: npm run dev
# Verificar error de conexión en console
```

## 🔒 Verificación de CORS

### Testing de Origen Permitido

**Verificar configuración:**

```bash
grep ALLOWED_ORIGINS backend/.env
```

Debe incluir `http://localhost:5173`

**Verificar headers en DevTools:**

- Network → seleccionar petición → Headers → Response Headers
- `Access-Control-Allow-Origin: http://localhost:5173`

### Testing de Origen Bloqueado

**Usar curl para simular origen no permitido:**

```bash
curl -X POST http://localhost:4000/api/trace/create \
  -H "Origin: http://malicious-site.com" \
  -H "Content-Type: application/json" \
  -d '{"transaction_id":"TEST"}'
```

**Respuesta esperada:** Error CORS (depende del navegador)

### Configuración para Múltiples Orígenes

**Formato en .env:**

```bash
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,https://tudominio.com
```

_Nota: Sin espacios alrededor de las comas_

## ⏱️ Validación de Rate Limiting

### Configuración Actual

- **Ventana:** 900000ms = 15 minutos
- **Máximo peticiones:** 100 por IP
- **Aplica a:** Todas las rutas `/api/*`

### Testing Manual

**Script para probar rate limiting:**

```bash
#!/bin/bash
# Hacer 105 peticiones para exceder el límite
for i in {1..105}; do
  echo "Petición $i:"
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST http://localhost:4000/api/trace/create \
    -H "Content-Type: application/json" \
    -d "{\"transaction_id\":\"TEST-$i\"}"
  sleep 0.1
done
```

**Resultado esperado:**

- Peticiones 1-100: `200`
- Peticiones 101-105: `429`

**Mensaje de error esperado:**

```json
{ "error": "Too many requests from this IP, please try again later." }
```

### Verificar Headers de Rate Limit

**Hacer una petición y verificar headers:**

```bash
curl -v -X POST http://localhost:4000/api/trace/create \
  -H "Content-Type: application/json" \
  -d '{"transaction_id":"TEST"}' 2>&1 | grep -E "(RateLimit|HTTP/)"
```

**Headers esperados:**

```
RateLimit-Limit: 100
RateLimit-Remaining: 99
RateLimit-Reset: [timestamp]
```

### Ajustar Límites

**Para desarrollo:** `RATE_LIMIT_MAX_REQUESTS=100`
**Para producción:** `RATE_LIMIT_MAX_REQUESTS=50` o menos

## 🛡️ Verificación de Headers de Seguridad (Helmet)

### Headers Esperados

| Header                         | Valor Esperado                               | Propósito                         |
| ------------------------------ | -------------------------------------------- | --------------------------------- |
| `X-Content-Type-Options`       | `nosniff`                                    | Previene MIME sniffing            |
| `X-Frame-Options`              | `SAMEORIGIN`                                 | Previene clickjacking             |
| `Strict-Transport-Security`    | `max-age=15552000; includeSubDomains`        | Fuerza HTTPS (solo en producción) |
| `Content-Security-Policy`      | `default-src 'none'; ... connect-src 'self'` | Política restrictiva para API     |
| `Referrer-Policy`              | `no-referrer`                                | Controla información de referrer  |
| `Cross-Origin-Opener-Policy`   | `same-origin`                                | Aísla contexto de navegación      |
| `Cross-Origin-Resource-Policy` | `same-origin`                                | Protege contra Spectre            |
| `X-DNS-Prefetch-Control`       | `off`                                        | Controla prefetch DNS             |

### Testing con curl

```bash
curl -I http://localhost:4000/api/trace/check
```

**Verificar presencia de todos los headers listados arriba.**

### Testing con DevTools

1. Abrir DevTools → Network
2. Seleccionar cualquier petición
3. Pestaña **Headers** → **Response Headers**
4. Verificar que todos los headers de seguridad están presentes

### ⚠️ Notas sobre HSTS en Producción

**HSTS (HTTP Strict Transport Security) solo se habilita en producción** cuando `NODE_ENV=production` y se detecta HTTPS. En desarrollo local (HTTP), el header `Strict-Transport-Security` **NO estará presente**.

**Para probar HSTS en producción:**

1. **Desplegar con HTTPS obligatorio** (certificado SSL válido)
2. **Configurar `NODE_ENV=production`** en el archivo `.env.production`
3. **Verificar header HSTS:**

   ```bash
   curl -I https://tu-dominio.com/api/trace/check
   ```

   Debe incluir: `Strict-Transport-Security: max-age=15552000; includeSubDomains`

4. **Consideraciones importantes:**
   - HSTS requiere HTTPS; no funciona sobre HTTP
   - Una vez activado, es difícil revertir (caché del navegador)
   - Asegúrate de que todo el sitio soporte HTTPS antes de activar
   - El preload está deshabilitado para evitar problemas irreversibles
   - Una vez activado HSTS, **NO se puede revertir fácilmente**
   - Asegúrate de que todo el sitio (incluyendo subdominios) soporte HTTPS
   - El preload es permanente y requiere remoción manual si es necesario

## ✅ Validación de Entrada

### Test 1 - transaction_id faltante

```bash
curl -X POST http://localhost:4000/api/trace/create \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Respuesta esperada (400):**

```json
{
  "error": "transaction_id is required and must be a string",
  "code": "INVALID_INPUT"
}
```

### Test 2 - transaction_id no es string

```bash
curl -X POST http://localhost:4000/api/trace/create \
  -H "Content-Type: application/json" \
  -d '{"transaction_id": 123}'
```

**Respuesta esperada:** `INVALID_INPUT`

### Test 3 - transaction_id muy largo

```bash
curl -X POST http://localhost:4000/api/trace/create \
  -H "Content-Type: application/json" \
  -d '{"transaction_id": "a1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890"}'
```

**Respuesta esperada (400):**

```json
{
  "error": "transaction_id must be between 1 and 100 characters",
  "code": "INVALID_LENGTH",
  "received": 101
}
```

### Test 4 - transaction_id con caracteres inválidos

```bash
curl -X POST http://localhost:4000/api/trace/create \
  -H "Content-Type: application/json" \
  -d '{"transaction_id": "TX-123@#$%"}'
```

**Respuesta esperada (400):**

```json
{
  "error": "transaction_id contains invalid characters. Only alphanumeric, hyphens, and underscores are allowed",
  "code": "INVALID_FORMAT"
}
```

### Test 5 - transaction_id válido

```bash
curl -X POST http://localhost:4000/api/trace/create \
  -H "Content-Type: application/json" \
  -d '{"transaction_id": "TX-12345"}'
```

**Respuesta esperada (200):**

```json
{
  "transaction_id": "TX-12345",
  "hash": "...",
  "status": "verified",
  "timestamp": "..."
}
```

## 📋 Checklist de Verificación Completa

- [ ] Archivos `.env` existen y no están en git
- [ ] Todas las variables de entorno configuradas
- [ ] Frontend se conecta correctamente al backend
- [ ] CORS bloquea orígenes no permitidos
- [ ] Rate limiting funciona después de 100 peticiones
- [ ] Headers de seguridad presentes en todas las respuestas
- [ ] Validación rechaza transaction_id inválidos
- [ ] Validación acepta transaction_id válidos
- [ ] Servidores levantan sin errores
- [ ] No hay warnings de seguridad en consola

## 🔧 Troubleshooting

### Problemas Comunes

**Error CORS:**

- Verificar `ALLOWED_ORIGINS` en `backend/.env`
- Asegurar que incluye el puerto correcto del frontend

**Error de conexión:**

- Verificar que backend está corriendo en puerto 4000
- Verificar `VITE_API_URL` en `frontend/.env`

**Rate limit no funciona:**

- Verificar variables `RATE_LIMIT_*` en `backend/.env`
- Reiniciar servidor después de cambios

**Headers faltantes:**

- Verificar que `helmet` está como primer middleware en `server.js`
- Verificar que no hay errores en consola del backend

**Validación no funciona:**

- Verificar orden de middlewares en `server.js`
- Verificar que validación está en `routes/trace.js`

## 🚀 Comandos Rápidos de Referencia

```bash
# Verificar protección .gitignore
git check-ignore backend/.env frontend/.env

# Levantar servidores
cd backend && node server.js &
cd ../frontend && npm run dev

# Test CORS con origen bloqueado
curl -X POST http://localhost:4000/api/trace/create \
  -H "Origin: http://malicious-site.com" \
  -H "Content-Type: application/json" \
  -d '{"transaction_id":"TEST"}'

# Test rate limiting (loop de 105 peticiones)
for i in {1..105}; do curl -s -o /dev/null -w "%{http_code} " \
  -X POST http://localhost:4000/api/trace/create \
  -H "Content-Type: application/json" \
  -d "{\"transaction_id\":\"TEST-$i\"}"; done; echo

# Ver headers de seguridad
curl -I http://localhost:4000/api/trace/check

# Test validaciones
curl -X POST http://localhost:4000/api/trace/create \
  -H "Content-Type: application/json" \
  -d '{"transaction_id": "TX-12345"}'
```

---

_Para más información sobre las librerías de seguridad:_

- [Helmet](https://helmetjs.github.io/)
- [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit)
- [CORS en Express](https://expressjs.com/en/resources/middleware/cors.html)</content>
  <parameter name="filePath">/Users/estudio/Projects/GitHub/NODE/compliance-trace-layer-beta/compliance-trace-layer-beta/SECURITY_SETUP.md
