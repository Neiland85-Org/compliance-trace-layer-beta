# ADR-003 — Contract Versioning: SchemaVer + Zod Runtime Validation

Status: Accepted
Date: 2026-03-17

---

## 1. Contexto

El sistema tiene 5 contratos entre bounded contexts:

| Contrato                  | Productor      | Consumidor     |
|---------------------------|---------------|----------------|
| CodebaseSnapshot          | Intake        | Analysis       |
| AnalysisReport            | Analysis      | Proposal       |
| ArchitectureSpec          | Proposal      | Manifest/Engine|
| DeploymentManifest        | Manifest      | Deployment     |
| TemplatePackage           | Proposal      | Delivery       |

Además existen contratos de feedback: `DeploymentStateEvent` (Deployment → Supervisor).

Sin versionado explícito, cualquier cambio en un schema (añadir campo, cambiar tipo, eliminar campo) rompe consumidores sin aviso, y es imposible determinar compatibilidad entre versiones de productores y consumidores en runtime.

---

## 2. Problema

¿Cómo versionar los contratos entre bounded contexts de forma que:
- Los cambios rompedores sean detectados en compilación Y runtime?
- Productores y consumidores puedan negociar versiones?
- El historial de cambios sea trazable?
- La migración entre versiones sea incremental, no big-bang?

---

## 3. Opciones evaluadas

### Opción A: SemVer en package.json del workspace contracts/
- Se versiona el paquete `@trace/contracts`, no los schemas individuales.
- Un bump en cualquier schema fuerza rebuild de todos los consumidores.
- No permite coexistencia de versiones.

### Opción B: JSON Schema con $id y $schema URLs
- Estándar de industria (OpenAPI, AsyncAPI).
- Requiere hosting de schemas, validador externo (ajv).
- Overhead para un sistema donde productores y consumidores son co-locados.

### Opción C: SchemaVer por contrato + Zod runtime validation (elegida)
- Cada schema tiene `schemaVersion: "MODEL-REVISION-ADDITION"` (ej: `"1-0-0"`).
- Schemas viven en `contracts/<boundary>/v<MODEL>/`.
- Zod valida en runtime (parse/safeParse).
- TypeScript valida en compilación (z.infer).
- Nuevas versiones coexisten como directorios (`v1/`, `v2/`).

---

## 4. Evaluación comparativa

| Criterio                    | A (SemVer pkg) | B (JSON Schema)   | C (SchemaVer+Zod) |
|-----------------------------|----------------|--------------------|--------------------|
| Granularidad de versionado  | Por paquete    | Por schema         | Por schema         |
| Validación en compilación   | TS types       | Code-gen requerido | z.infer nativo     |
| Validación en runtime       | No             | ajv                | Zod parse          |
| Coexistencia de versiones   | No             | Sí (por URL)       | Sí (por directorio)|
| Overhead de tooling         | Bajo           | Alto               | Bajo               |
| Error messages legibles     | N/A            | ajv (crípticos)    | Zod (legibles)     |
| Soporta TypeScript nativo   | Sí             | Requiere codegen   | Sí (z.infer)       |

---

## 5. Decisión

**Opción C: SchemaVer por contrato + Zod runtime validation.**

### Convención SchemaVer

Formato: `MODEL-REVISION-ADDITION` (ej: `1-0-0`)

| Componente | Se incrementa cuando...                              |
|------------|------------------------------------------------------|
| MODEL      | Cambio rompedor: campo eliminado, tipo cambiado, semántica alterada |
| REVISION   | Campo existente modificado de forma retrocompatible   |
| ADDITION   | Campo nuevo opcional añadido                         |

### Estructura de directorios

```
contracts/
├── intake-analysis/
│   ├── v1/
│   │   ├── CodebaseSnapshot.ts    (schemaVersion: "1-0-0")
│   │   └── index.ts
│   └── v2/                         (futuro: cuando MODEL=2)
│       ├── CodebaseSnapshot.ts    (schemaVersion: "2-0-0")
│       └── index.ts
├── analysis-proposal/
│   └── v1/
└── ...
```

### Reglas de validación

1. Todo dato que cruza una frontera de bounded context DEBE pasar por `Schema.parse()`.
2. El campo `schemaVersion` es `z.literal("X-Y-Z")` — rechazo automático si no coincide.
3. Los consumidores importan la versión específica: `from "contracts/intake-analysis/v1"`.
4. Nunca se modifica un schema existente de forma rompedora — se crea `v(N+1)/`.

---

## 6. Consecuencias

### Positivas
- Un productor en v1 y un consumidor esperando v2 fallan con error Zod explícito (no con crash silencioso).
- La cadena de trazabilidad incluye la versión del schema en cada documento.
- Migración progresiva: ambas versiones coexisten hasta que todos los consumidores migran.
- Zod provee mensajes de error legibles para debugging.

### Negativas
- `z.literal("1-0-0")` es estricto — un schema en `"1-0-1"` será rechazado por un consumidor que espera `"1-0-0"`. Esto es deliberado (fail-fast) pero requiere disciplina de bump coordinado.
- No hay negociación automática de versiones (el consumidor no puede decir "acepto 1-0-0 a 1-0-5"). Si se necesita, implementar un `acceptsVersion(min, max)` wrapper.
- Barrel export en `contracts/index.ts` expone todas las versiones — un consumidor puede importar accidentalmente la versión incorrecta si no especifica path.

---

## 7. Plan de adopción

1. ✅ Definir 5 schemas v1 con `schemaVersion: "1-0-0"`.
2. ✅ Implementar validación Zod en todas las fronteras (intake→analysis→proposal→delivery).
3. ✅ Tests de validación: aceptar datos válidos, rechazar schema incorrecto, rechazar campos faltantes.
4. ⬜ Documentar proceso de bump: quién, cuándo, y checklist de migración.
5. ⬜ Añadir CI check: `contracts/test/validate-schemas.ts` en pipeline obligatorio.
6. ⬜ Evaluar si `acceptsVersion(min, max)` es necesario cuando haya consumidores externos.

---

## 8. Métricas de éxito

| Métrica                                | Objetivo | Actual |
|----------------------------------------|----------|--------|
| Schemas con `schemaVersion` literal    | 6/6      | 6/6    |
| Fronteras validadas con Zod parse      | 5/5      | 5/5    |
| Tests de rechazo por schema inválido   | ≥5       | 8      |
| Incidentes por schema mismatch silencioso | 0     | 0      |

---

## 9. Plan de rollback

Si SchemaVer resulta demasiado rígido o el equipo necesita negociación de versiones:

1. Mantener los schemas Zod pero cambiar `z.literal("1-0-0")` a `z.string().regex(/^\d+-\d+-\d+$/)`.
2. Añadir función `isCompatible(actual: string, expected: string): boolean` con reglas de compatibilidad.
3. Los consumidores llaman `isCompatible` antes de `parse`, permitiendo aceptar rangos.
4. Impacto: ~2 horas de cambio, retrocompatible con todos los datos existentes.
