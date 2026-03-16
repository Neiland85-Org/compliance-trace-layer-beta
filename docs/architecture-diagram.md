# Compliance Trace Layer Architecture

```mermaid
flowchart TD

A[Application Domain<br>FinTech / Carbon Markets / Supply Chain]

A --> B[API Gateway]

B --> C[Trace Service]

C --> D[Validation Engine]

C --> E[Trace Storage]

E --> F[(Persistence Layer)]

F --> F1[Blockchain]
F --> F2[Event Store]
F --> F3[Ledger DB]

E --> G[Query Engine]

G --> H[Visualization Interface]

H --> I[3D Trace Explorer]
H --> J[Audit Dashboard]

GitHub lo renderiza automáticamente.

---

# 5️⃣ Añadir referencia en el README

Abre el README:

```bash
code README.md
```