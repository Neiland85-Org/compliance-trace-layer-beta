# ADR-002 — Domain Separation: Open-Core Bounded Contexts

Status: Accepted
Date: 2026-03-17

---

## 1. Contexto

El sistema compliance-trace-layer-beta evolucionó como un monolito con acoplamiento implícito entre runtime de despliegue, lógica de análisis de código, y templates vendibles. El código de despliegue (`deploy.js`, `tools/deploy-engine/`) importaba directamente módulos de análisis, y el frontend leía templates del filesystem local vía Vite glob imports.

La auditoría técnica (AUDIT-2026-03-17) identificó 3 problemas estructurales derivados:
- Imposibilidad de licenciar módulos independientemente (todo es un bloque).
- Acoplamiento runtime ↔ IP propietario (riesgo de exposición accidental del código de análisis en despliegues open-source).
- Ciclos de dependencia implícitos entre capas.

---

## 2. Problema

¿Cómo separar el sistema en módulos con fronteras de propiedad intelectual claras, permitiendo un modelo open-core donde el runtime sea libre y la inteligencia sea propietaria, sin romper la trazabilidad end-to-end?

---

## 3. Opciones evaluadas

### Opción A: Monorepo con carpetas lógicas (sin contratos)
- Separación por directorios sin validación en fronteras.
- Riesgo: acoplamiento vuelve a crecer sin enforcement.

### Opción B: Repositorios separados por dominio
- Cada bounded context en su propio repo con CI independiente.
- Riesgo: overhead operacional alto para un equipo pequeño, sincronización de versiones compleja.

### Opción C: Monorepo con workspaces + contratos Zod en fronteras (elegida)
- Un solo repositorio con npm workspaces: `contracts/`, `engine/`, `intelligence/`, `delivery/`, `apps/`.
- Fronteras entre contextos definidas por schemas Zod versionados.
- Cada workspace tiene su `package.json`, `tsconfig.json`, y tests independientes.

---

## 4. Evaluación comparativa

| Criterio                | A (carpetas) | B (repos)  | C (workspaces+contratos) |
|-------------------------|-------------|------------|--------------------------|
| Enforcement de fronteras | Nulo        | Fuerte     | Fuerte (Zod runtime)     |
| Overhead operacional     | Bajo        | Alto       | Bajo                     |
| Licenciamiento separado  | Imposible   | Natural    | Posible (excluir dirs)   |
| Trazabilidad cross-ctx   | Frágil      | Requiere API | Via contrato Zod       |
| Refactoring cost         | Bajo        | Alto       | Medio                    |
| CI/CD complexity         | Trivial     | N pipelines | 1 pipeline, N jobs     |

---

## 5. Decisión

**Opción C: Monorepo con npm workspaces + contratos Zod en fronteras.**

Bounded contexts resultantes:

| Context       | Workspace       | Propiedad       | Función                          |
|---------------|-----------------|-----------------|----------------------------------|
| Contracts     | `contracts/`    | Open            | Schemas Zod compartidos          |
| Engine        | `engine/`       | Open            | Runtime de despliegue (Docker)   |
| Intelligence  | `intelligence/` | Propietario     | Análisis, detección, propuesta   |
| Delivery      | `delivery/`     | Propietario     | Licencias, packaging, distribución |
| Console       | `apps/console/` | Open            | Frontend de gestión              |

Regla de dependencia unidireccional:
```
contracts ← engine
contracts ← intelligence
contracts ← delivery
intelligence → delivery (solo via contrato TemplatePackage)
engine ↛ intelligence (PROHIBIDO)
engine ↛ delivery (PROHIBIDO)
```

---

## 6. Consecuencias

### Positivas
- Engine puede publicarse como open-source sin exponer IP de análisis.
- Cada workspace se testea independientemente (`npm test -w <name>`).
- Contratos Zod proveen validación tanto en compilación (TypeScript) como en runtime.
- La cadena de trazabilidad (`snapshotId → analysisId → specId → manifestId`) cruza fronteras de forma explícita.

### Negativas
- Intelligence y Delivery comparten `contracts/` como dependencia — un cambio rompedor en un schema afecta a ambos.
- Excluir `intelligence/` y `delivery/` del build open-source requiere configuración explícita en CI.
- Los tipos TypeScript de contracts deben importarse con paths relativos (no hay publish a npm aún).

---

## 7. Plan de adopción

1. ✅ Crear workspace `contracts/` con schemas Zod versionados (SchemaVer 1-0-0).
2. ✅ Crear workspace `engine/` con SQLite + Docker adapter + reconciliation loop.
3. ✅ Crear workspace `intelligence/` con pipeline intake → analysis → proposal.
4. ✅ Crear workspace `delivery/` con license manager, envelope, exporter, registry client.
5. ✅ Eliminar `tools/deploy-engine/` (legacy, sin contratos).
6. ⬜ Configurar CI para build open-source (excluir intelligence/ + delivery/).
7. ⬜ Publicar `@trace/contracts` y `@trace/engine` a npm como paquetes públicos.

---

## 8. Métricas de éxito

| Métrica                              | Objetivo       | Actual          |
|--------------------------------------|---------------|-----------------|
| Imports cross-workspace sin contrato | 0             | 0               |
| Tests independientes por workspace   | 4/4           | 4/4             |
| TypeScript --noEmit limpio           | 4/4 workspaces| 4/4             |
| Engine imports de intelligence/      | 0             | 0               |
| Cadena de trazabilidad verificable   | end-to-end    | end-to-end      |

---

## 9. Plan de rollback

Si la separación por workspaces resulta insuficiente (ej: equipo crece y necesita CI independiente por dominio):

1. Extraer `intelligence/` a repo separado, publicar como npm privado.
2. Extraer `delivery/` a repo separado, publicar como npm privado.
3. Mantener `contracts/` como paquete compartido publicado en ambos registries.
4. Engine sigue en el repo principal, consume contracts via npm.
5. Estimación de migración: 2-3 días para un desarrollador.
