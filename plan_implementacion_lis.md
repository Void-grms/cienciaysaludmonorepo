# Plan de Implementación — Sistema de Gestión de Laboratorio Clínico (LIS)

**Plan técnico maestro — Base de Datos · Backend · Frontend**

| Campo | Valor |
|---|---|
| Sistema | LIS — Laboratory Information System |
| Versión del plan | 2.0 (mejora sobre Especificación Funcional v1.0) |
| Fecha | 14 de mayo de 2026 |
| Tipo de documento | Plan maestro de implementación |
| Arquitectura | Monolito modular + 3 portales SPA + API REST versionada |
| Metodología | Scrum, sprints de 2 semanas, entrega por MVPs incrementales |
| Modelo de acceso | 3 roles: **Administrador · Paciente · Referencia** |
| Cambio principal vs v1.0 | Se reemplaza "Paciente / Personal / Admin" por **"Administrador / Paciente / Referencia"** e incorpora el portal externo para consultorios, postas, policlínicos y médicos referidores |

---

## Tabla de contenidos

1. [Resumen ejecutivo y alcance de la mejora](#1-resumen-ejecutivo-y-alcance-de-la-mejora)
2. [Decisiones de arquitectura (ADRs)](#2-decisiones-de-arquitectura-adrs)
3. [Modelo de roles, permisos y aislamiento de datos](#3-modelo-de-roles-permisos-y-aislamiento-de-datos)
4. [Arquitectura general del sistema](#4-arquitectura-general-del-sistema)
5. [BASE DE DATOS — diseño detallado](#5-base-de-datos--diseño-detallado)
6. [BACKEND — diseño detallado](#6-backend--diseño-detallado)
7. [FRONTEND — diseño detallado](#7-frontend--diseño-detallado)
8. [Seguridad y cumplimiento normativo](#8-seguridad-y-cumplimiento-normativo)
9. [DevOps, entornos y despliegue](#9-devops-entornos-y-despliegue)
10. [Roadmap Scrum por MVPs](#10-roadmap-scrum-por-mvps)
11. [Riesgos y mitigaciones](#11-riesgos-y-mitigaciones)
12. [Definition of Ready / Definition of Done](#12-definition-of-ready--definition-of-done)
13. [Glosario](#13-glosario)

---

## 1. Resumen ejecutivo y alcance de la mejora

### 1.1 Qué es el sistema

Un Sistema de Información de Laboratorio Clínico (LIS) web que cubre el ciclo operativo completo del laboratorio: registro del paciente, registro de la orden y exámenes, toma y seguimiento de muestras con cadena de custodia, ingreso y validación de resultados en dos niveles, liberación controlada, notificación multicanal, descarga de reportes PDF con QR de verificación, facturación y comprobantes, tarifario versionado, convenios, inventario de reactivos, control de calidad, reportes administrativos y auditoría inmutable.

### 1.2 Qué cambia respecto a la Especificación Funcional v1.0

La especificación original definía tres roles: **Paciente · Personal · Administrador**. Este plan los reemplaza por el modelo que pediste:

| Rol nuevo | Reemplaza / absorbe | Naturaleza del acceso |
|---|---|---|
| **Administrador** | "Personal de Laboratorio" + "Administrador" de la v1.0 | Portal interno completo: opera *y* administra el laboratorio |
| **Paciente** | "Paciente" de la v1.0 (sin cambios mayores) | Portal de autoservicio del paciente |
| **Referencia** | **Rol NUEVO** — no existía en la v1.0 | Portal externo para consultorios, postas, policlínicos y médicos que **envían pacientes** al laboratorio y consultan los resultados de **sus** pacientes |

El caso de uso del rol **Referencia** es exactamente el que describiste: así como un laboratorio mayor (ej. "CCVLAB") te da un acceso para ver lo que le envías día a día, este sistema dará un acceso equivalente a cada consultorio, posta o médico que te remite pacientes. La diferencia clave de negocio: **el resultado puede entregarse a la Referencia (médico/consultorio) y no al paciente final**, o a ambos. Esto se modela con el campo `entrega` de la orden (ver §3.6).

### 1.3 Principio rector

"Las mejores prácticas posibles" se traduce, en concreto, en: monolito modular con separación estricta de capas; autorización por roles + permisos finos; **aislamiento de datos por fila** (una Referencia jamás ve un paciente que no remitió, defensa en profundidad en 3 capas); auditoría inmutable append-only; API REST versionada y documentada en OpenAPI; cobertura de tests por capa; y un roadmap incremental que entrega valor operativo desde el primer MVP. Se prioriza lo mantenible y verificable sobre lo vistoso.

### 1.4 Alcance por fase (resumen — detalle en §10)

| Fase | Entregable principal | Duración estimada |
|---|---|---|
| Fase 0 — Setup | Repos, CI/CD, infraestructura base, esqueleto de los 3 portales, auth funcional | 2 semanas |
| Fase 1 — MVP operativo | Auth + 3 roles, pacientes, atención/orden, ingreso de resultados, PDF básico, portal paciente y portal referencia básicos | 3–4 meses |
| Fase 2 — Operación completa | Cadena de custodia, validación doble nivel, notificaciones multicanal, tarifario + paquetes, comprobantes | 2–3 meses |
| Fase 3 — Gestión avanzada | Reportes financieros, dashboard ejecutivo, inventario de reactivos, convenios con facturación consolidada, QC, auditoría completa | 2–3 meses |
| Fase 4 — Integraciones | HL7/ASTM con analizadores, firma digital PKI, multi-sede, HL7 FHIR | 2–3 meses |

### 1.5 Fuera de alcance (explícito)

No forman parte de este plan: app móvil nativa (el portal es web responsive); módulo contable/ERP completo (solo emisión de comprobantes e integración con facturador electrónico); historia clínica electrónica completa tipo HIS; telemedicina. Estos quedan como posibles extensiones post-Fase 4.

---

## 2. Decisiones de arquitectura (ADRs)

Cada decisión técnica relevante se documenta como Architecture Decision Record. Estos ADRs deben vivir en el repositorio bajo `/docs/adr/` y revisarse en cada cambio mayor.

### ADR-001 — Modelo de 3 roles: el Administrador absorbe la operación del laboratorio

**Fecha:** 2026-05-14 · **Estado:** Aceptado — *requiere confirmación del cliente antes de Fase 1*

**Contexto.** El cliente pidió explícitamente **3 accesos**: Administrador, Paciente, Referencia. La Especificación v1.0 tenía un rol "Personal de Laboratorio" que ejecuta toda la operación diaria (registrar órdenes, gestionar muestras, ingresar resultados). Si se elimina "Personal" sin más, nadie operaría el laboratorio; y la validación en dos niveles (técnico ingresa → bioquímico valida) — una mejora crítica de cumplimiento ISO 15189 — perdería sentido con un único actor interno.

**Opciones consideradas.**
1. **Mantener 4 roles** (Admin, Personal, Paciente, Referencia) — ❌ contradice el pedido explícito del cliente.
2. **3 roles; el Administrador hace toda la operación e administración; la doble validación se modela con _permisos por usuario_, no con un rol aparte** — ✅ respeta el pedido; ✅ realista para un laboratorio pequeño donde el dueño opera; ✅ no sacrifica la integridad de la validación.
3. **3 roles puros sin doble validación** — ❌ se pierde una mejora crítica de cumplimiento.

**Decisión.** Opción 2. El sistema tiene **3 roles** (`ADMINISTRADOR`, `PACIENTE`, `REFERENCIA`). El rol `ADMINISTRADOR` agrupa toda la operación interna. La doble validación se implementa con **dos permisos independientes a nivel de usuario**: `puede_ingresar_resultados` y `puede_validar_resultados`. Un laboratorio pequeño puede tener un solo usuario administrador con ambos permisos; uno más grande crea varios usuarios administradores, unos solo con ingreso (técnicos) y otros con validación (bioquímico jefe). El modelo de roles queda preparado para añadir granularidad sin rediseñarse.

**Consecuencias.** Positivas: cumple el pedido; RBAC extensible; doble validación preservada. Negativas: "Administrador" es un rol amplio — se mitiga con permisos finos y auditoría inmutable. Riesgo: si el cliente en realidad quería conservar "Personal" como 4º rol, este ADR debe revertirse → **punto de confirmación bloqueante antes de Fase 1.**

### ADR-002 — Aislamiento de datos de la Referencia a nivel de orden, no de paciente

**Fecha:** 2026-05-14 · **Estado:** Aceptado

**Contexto.** Un mismo paciente puede ser remitido por distintas referencias en distintas fechas (hoy lo manda el Dr. Pérez, el mes próximo la Posta San Juan, otro día llega directo al laboratorio). Una Referencia no debe ver toda la historia del paciente, solo **lo que ella remitió**.

**Decisión.** El data scoping se aplica sobre la entidad **Atención/Orden**, no sobre **Paciente**. La orden lleva `id_referencia` (nullable). El portal de Referencia consulta siempre con un filtro forzado `WHERE id_referencia = <referencia del usuario>`. El paciente solo es "visible" para una Referencia a través de las órdenes que esa Referencia generó. Se implementa con un **guard de scope** en el backend que inyecta el filtro automáticamente; nunca se confía en que el frontend filtre.

**Consecuencias.** Positivas: privacidad correcta y conforme a Ley 29733. Negativas: toda query del portal Referencia debe pasar por el guard de scope — se centraliza en un interceptor para que no se pueda olvidar. Riesgo: una query escrita a mano que omita el guard expone datos → mitigado con tests de seguridad obligatorios por endpoint (ver §6.7).

### ADR-003 — La Referencia es una entidad propia, vinculada opcionalmente a Convenio y/o Médico

**Fecha:** 2026-05-14 · **Estado:** Aceptado

**Contexto.** "Referencia" engloba consultorios, postas, policlínicos y médicos individuales. Algunos tienen convenio comercial (tarifa diferenciada, facturación consolidada); otros son solo un médico que remite pacientes.

**Decisión.** Se crea la entidad `referencias` con `tipo` ∈ {`CONSULTORIO`, `POSTA`, `POLICLINICO`, `MEDICO`, `OTRO`}. Una referencia puede vincularse opcionalmente a un `convenio` (para tarifas y facturación consolidada) y puede tener uno o varios `medicos_referidores` asociados. El `usuario` de rol `REFERENCIA` apunta a una `referencia`. Esto reutiliza la entidad `Convenio` de la v1.0 y el concepto de médico referidor sin duplicar datos.

**Consecuencias.** Positivas: cubre todos los casos descritos por el cliente con una sola entidad flexible. Negativas: hay que mantener consistencia entre `referencia`, `convenio` y `medico_referidor` — se resuelve con FKs explícitas y reglas de integridad en BD.

### ADR-004 — Stack tecnológico: TypeScript end-to-end

**Fecha:** 2026-05-14 · **Estado:** Aceptado

**Contexto.** La spec sugiere React+Vite+TS en frontend y ".NET 8 o Node" en backend, PostgreSQL en datos.

**Opciones de backend.** (A) ASP.NET Core 8 — robusto, tipado, buen ecosistema salud. (B) **NestJS (Node 20 + TypeScript)** — mismo lenguaje que el frontend, arquitectura modular impuesta por el framework (módulos, providers, guards, interceptors), excelente para RBAC y data scoping.

**Decisión.**
- **Frontend:** React 18 + Vite + TypeScript + TailwindCSS + shadcn/ui + React Router + TanStack Query + Zustand + React Hook Form + Zod.
- **Backend:** **NestJS** (Node 20 + TypeScript), arquitectura de monolito modular. Alternativa válida documentada: ASP.NET Core 8 (si el equipo es .NET, se mantiene el mismo modelo de capas y este plan sigue siendo válido cambiando solo nombres de framework).
- **ORM / migraciones:** Prisma (type-safety extremo + migraciones versionadas). Alternativa: TypeORM.
- **Base de datos:** PostgreSQL 16.
- **Cache / colas:** Redis 7 + BullMQ (jobs asíncronos: generación de PDF, notificaciones, alertas).
- **Almacenamiento de archivos:** MinIO self-hosted (o Amazon S3) — PDFs, plantillas, adjuntos.
- **Generación de PDF:** Puppeteer (render de plantilla HTML → PDF; habilita plantillas configurables por tipo de análisis).
- **Validación compartida:** esquemas Zod compartidos entre frontend y backend vía paquete `packages/contracts` del monorepo.
- **Auth:** JWT (access + refresh) + MFA TOTP obligatorio para `ADMINISTRADOR`.
- **Contenedores:** Docker + Docker Compose (dev y staging); orquestación de producción a definir en Fase 4 (Kubernetes opcional).

**Justificación.** Un solo lenguaje reduce fricción de contexto, permite compartir tipos y validaciones (DTOs/Zod) entre capas, y acelera a un equipo pequeño. NestJS impone una estructura modular que encaja con el modelo de "un módulo por bloque funcional".

**Consecuencias.** Positivas: velocidad de desarrollo, contratos tipados extremo a extremo. Negativas: Node es menos común que .NET en entornos hospitalarios peruanos — se mitiga dejando documentada la alternativa .NET equivalente.

### ADR-005 — Monolito modular, no microservicios

**Fecha:** 2026-05-14 · **Estado:** Aceptado

**Decisión.** El sistema arranca como **monolito modular** desplegable como una sola unidad. Cada bloque funcional es un módulo NestJS con frontera clara: `auth`, `usuarios`, `pacientes`, `referencias`, `atencion`, `muestras`, `resultados`, `reportes-pdf`, `facturacion`, `tarifario`, `notificaciones`, `inventario`, `calidad`, `reportes-admin`, `auditoria`, `configuracion`. Justificación: equipo pequeño, time-to-market prioritario, < 10.000 usuarios esperados. Los microservicios se evalúan solo si la escala lo exige y no antes de Fase 4.

**Consecuencias.** Positivas: un solo despliegue, debugging simple, transacciones ACID directas. Negativas: el repositorio crece — se mitiga con fronteras de módulo estrictas (un módulo no importa el `service` de otro: se comunica por interfaces públicas o eventos internos).

### ADR-006 — Auditoría inmutable mediante tabla append-only

**Fecha:** 2026-05-14 · **Estado:** Aceptado

**Decisión.** La tabla `auditoria` es **append-only**: sin `UPDATE` ni `DELETE` a nivel de aplicación, reforzado con permisos del rol de base de datos (la app escribe con un rol que solo tiene `INSERT` y `SELECT` sobre `auditoria`). Toda acción sensible (crear, modificar, liberar resultado, anular comprobante, login, logout) se registra vía un interceptor transversal que captura usuario, acción, entidad, diff JSON e IP. Cumple el requisito "no negociable" de la spec.

**Consecuencias.** Positivas: cumplimiento regulatorio, trazabilidad total. Negativas: la tabla crece sin parar — se mitiga con particionado por mes y política de archivado (no borrado) a partir de los 5 años.

### ADR-007 — Multi-sede y HL7 preparados, no implementados en MVP

**Fecha:** 2026-05-14 · **Estado:** Aceptado

**Decisión.** El modelo de datos incluye `id_sede` desde el día 1 (toda orden, usuario y muestra pertenece a una sede), pero el MVP opera con una sede única sembrada por defecto. La integración HL7/ASTM se aísla detrás de un "puerto" (`ResultImporterPort`) para que la importación automática desde analizadores se enchufe en Fase 4 sin tocar el dominio de resultados.

**Consecuencias.** Positivas: evita una migración dolorosa de datos al crecer; el dominio queda desacoplado del transporte HL7. Negativas: un poco de complejidad extra desde el inicio (campo `id_sede` en varias tablas) — es deuda barata comparada con migrar después.

---

## 3. Modelo de roles, permisos y aislamiento de datos

Esta sección es el corazón de la mejora pedida. Define los 3 roles, qué ve cada uno y cómo se garantiza técnicamente que nadie vea lo que no debe.

### 3.1 Los tres roles — vista general

```
┌────────────────────────────────────────────────────────────────────────┐
│                              SISTEMA LIS                               │
│                                                                        │
│  ┌────────────────┐    ┌────────────────┐    ┌──────────────────────┐   │
│  │  ADMINISTRADOR │    │    PACIENTE    │    │      REFERENCIA      │   │
│  │ Portal interno │    │ Portal self-   │    │ Portal externo       │   │
│  │ del laboratorio│    │ service        │    │ (consultorio/médico) │   │
│  └────────────────┘    └────────────────┘    └──────────────────────┘   │
│          │                     │                       │               │
│   opera + administra      ve SUS resultados      ve resultados de       │
│   TODO el laboratorio     y SU historial         SUS pacientes          │
│                                                  remitidos              │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.2 ROL: ADMINISTRADOR

Portal interno. Es quien opera y administra el laboratorio. Subdivisible por **permisos de usuario** (ver ADR-001).

**Operación diaria (heredada de "Personal de Laboratorio" v1.0):**
- Registrar atención/orden: datos del paciente, exámenes solicitados, médico solicitante, seguro/convenio y **referencia que remite** (si aplica).
- Crear/buscar pacientes; ver el historial clínico completo de cualquier paciente del laboratorio.
- Gestionar el envío y recepción de muestras (tipo, código de barra, destino in-house o externo, condición).
- Actualizar el estado de las órdenes en el flujo de proceso.
- Ingresar valores de resultados en formularios vinculados a la plantilla PDF — *requiere permiso `puede_ingresar_resultados`*.
- Validar resultados, segundo nivel — *requiere permiso `puede_validar_resultados`*.
- Habilitar/deshabilitar la visibilidad del resultado para paciente y/o referencia.
- Ver su bandeja de trabajo por área (hematología, bioquímica, microbiología…) y prioridad.
- Generar comprobantes de pago (boleta/factura) por atención.
- Recibir y gestionar alertas de valores críticos y muestras rechazadas.

**Administración (heredada de "Administrador" v1.0):**
- Cargar y versionar tarifarios de análisis individuales y de paquetes (con fechas de vigencia).
- Gestionar paquetes de análisis (nombre, exámenes incluidos, precio total).
- Gestionar convenios y clientes corporativos con tarifas diferenciadas.
- **Gestionar Referencias**: alta de consultorios/postas/policlínicos/médicos, crear y revocar su acceso, vincularlas a un convenio, asociar médicos referidores.
- Ver reportes de producción por usuario, ingresos por período, médicos/referencias referidores, estado de órdenes.
- Gestionar usuarios del sistema y asignar roles + permisos finos.
- Gestionar plantillas de reportes PDF por tipo de análisis (versionables).
- Ver el log de auditoría completo del sistema.
- Gestionar inventario de reactivos y alertas de stock mínimo/vencimiento.
- Gestionar acreditaciones y certificaciones del laboratorio y del personal con alertas de vencimiento (30/60/90 días).
- Configurar parámetros del laboratorio (datos fiscales, sedes, canales de notificación, umbrales de valores críticos).

### 3.3 ROL: PACIENTE

Portal de autoservicio. Ve **solo lo suyo**.

- Ver su historial clínico completo en el laboratorio.
- Ver la lista de análisis solicitados con fecha y médico solicitante.
- Ver el estado en tiempo real de cada análisis (stepper visual).
- Recibir notificaciones cuando el resultado esté listo (email / SMS / app).
- Descargar resultados en PDF con plantilla oficial — *solo cuando el Administrador habilitó la visibilidad para el paciente*.
- Ver historial de pagos y descargar comprobantes.
- Firmar consentimiento informado digital antes de ciertos análisis (genéticos, VIH, etc.).
- Agendar cita para toma de muestra (si el laboratorio lo habilita).
- Ver instrucciones previas al análisis (ej. ayuno requerido).
- Auto-registro y auto-actualización de sus datos de contacto.

**Regla de visibilidad clave:** un resultado puede estar "liberado" internamente pero **no visible para el paciente** si el laboratorio decidió entregarlo solo a la Referencia (caso del médico que pide que el resultado le llegue a él, no al paciente). Se controla con el campo `entrega` de la orden (ver §3.6).

### 3.4 ROL: REFERENCIA (nuevo)

Portal externo para consultorios, postas, policlínicos y médicos referidores. Ve **solo los pacientes que esa Referencia remitió**.

- Ver el listado de **sus** pacientes remitidos (no todos los del laboratorio).
- Ver, por cada paciente remitido, las órdenes y análisis **que esa Referencia generó/remitió**.
- Ver el estado en tiempo real de cada análisis remitido (stepper visual).
- Descargar el PDF del resultado de sus pacientes — *cuando el resultado está liberado y la `entrega` incluye a la referencia*.
- Recibir notificación cuando un resultado de un paciente suyo esté listo.
- Ver y usar el QR de verificación de autenticidad del reporte.
- *(Si la Referencia tiene convenio)* ver su estado de cuenta mensual y descargar comprobantes consolidados.
- *(Opcional, configurable por el Administrador)* registrar en línea una solicitud/derivación de paciente, que el Administrador convierte luego en orden formal.
- Gestionar sus propios datos de contacto.

**Lo que la Referencia NO puede hacer:** ver pacientes de otras referencias; ver pacientes que llegaron directo al laboratorio; ingresar o validar resultados; ver tarifarios internos; ver reportes administrativos; ver el log de auditoría; gestionar usuarios.

### 3.5 Matriz de permisos (resumen)

| Capacidad | Administrador | Paciente | Referencia |
|---|:---:|:---:|:---:|
| Registrar orden de atención | ✔ | ✘ | ◐ (solo solicitud previa, opcional) |
| Ver historial clínico del paciente | ✔ (todos) | ✔ (solo el suyo) | ◐ (solo lo que remitió) |
| Gestionar muestras y cadena de custodia | ✔ | ✘ | ✘ |
| Ingresar resultados | ✔ *(con permiso)* | ✘ | ✘ |
| Validar resultados (2º nivel) | ✔ *(con permiso)* | ✘ | ✘ |
| Habilitar visibilidad del resultado | ✔ | ✘ | ✘ |
| Descargar PDF de resultado | ✔ (todos) | ✔ (los suyos, si visibles) | ✔ (de sus pacientes, si visibles) |
| Ver stepper de estado del análisis | ✔ (todos) | ✔ (los suyos) | ✔ (los que remitió) |
| Gestionar tarifario / paquetes / convenios | ✔ | ✘ | ✘ |
| Gestionar Referencias y sus accesos | ✔ | ✘ | ✘ |
| Emitir comprobantes | ✔ | ✘ | ✘ |
| Ver historial de pagos / comprobantes | ✔ (todos) | ✔ (los suyos) | ◐ (estado de cuenta del convenio) |
| Reportes administrativos / dashboard ejecutivo | ✔ | ✘ | ✘ |
| Gestión de usuarios y roles | ✔ | ✘ | ✘ |
| Inventario de reactivos | ✔ | ✘ | ✘ |
| Ver log de auditoría | ✔ | ✘ | ✘ |
| Gestionar su propio perfil/datos de contacto | ✔ | ✔ | ✔ |

✔ = permitido · ✘ = no permitido · ◐ = permitido con alcance limitado

### 3.6 Reglas de entrega y visibilidad de resultados

Cada orden lleva un campo `entrega` que determina a quién se le habilita el resultado una vez liberado:

| Valor de `entrega` | Visible para Paciente | Visible para Referencia | Caso de uso |
|---|:---:|:---:|---|
| `PACIENTE` | ✔ | ✘ | Paciente que llega directo al laboratorio |
| `REFERENCIA` | ✘ | ✔ | El médico pide que el resultado le llegue a él, no al paciente |
| `AMBOS` | ✔ | ✔ | Se entrega al paciente y a quien lo remitió |

Independientemente de `entrega`, el resultado solo se vuelve visible cuando el Administrador ejecuta la acción **"Liberar resultado"** (la orden pasa a estado `LIBERADA`). Antes de eso, ningún actor externo lo ve. El valor por defecto de `entrega` es configurable por el laboratorio y puede pre-seleccionarse según la referencia (ej. el Dr. Pérez siempre quiere `REFERENCIA`).

### 3.7 Cómo se implementa el aislamiento — defensa en profundidad

El aislamiento de datos **no** se delega al frontend. Se aplica en 4 capas:

1. **Autenticación (JWT).** El access token lleva `sub` (id de usuario), `rol`, y — si el rol es `REFERENCIA` — `id_referencia`; si es `PACIENTE`, `id_paciente`. El token se firma y se valida en cada request.
2. **`RolesGuard`.** Decorador `@Roles('ADMINISTRADOR')` por endpoint; bloquea con `403` si el rol del token no está en la lista permitida.
3. **`PermisosGuard`.** Decorador `@Permisos('puede_validar_resultados')` para acciones internas finas dentro del rol Administrador.
4. **`ScopeInterceptor`.** Para roles `PACIENTE` y `REFERENCIA`, inyecta automáticamente en cada query el filtro de propiedad (`id_paciente = token.id_paciente` o `id_referencia = token.id_referencia`). El service nunca recibe datos sin filtrar; aunque un desarrollador olvide el `WHERE`, el interceptor lo agrega. Se complementa con tests de seguridad que intentan acceder a recursos ajenos y esperan `403/404` (ver §6.7).

A nivel de base de datos, además, se evalúa activar **Row-Level Security (RLS)** de PostgreSQL en las tablas más sensibles (`atenciones`, `resultados`, `reportes`) como última línea de defensa en Fase 3.

---

## 4. Arquitectura general del sistema

### 4.1 Diagrama de contexto (C4 nivel 1)

```mermaid
graph TD
  ADM[Administrador / Personal del laboratorio] --> LIS
  PAC[Paciente] --> LIS
  REF[Referencia: consultorio, posta, medico] --> LIS
  LIS[Sistema LIS] --> EMAIL[Proveedor Email: SES / SendGrid]
  LIS --> SMS[Proveedor SMS / WhatsApp: Twilio / SNS]
  LIS --> FACT[Facturador electronico: SUNAT / OSE]
  LIS --> STORAGE[(Almacenamiento de archivos: MinIO / S3)]
  LIS -. Fase 4 .-> ANALIZADOR[Analizadores clinicos via HL7/ASTM]
  LIS -. Fase 4 .-> HIS[HIS / EMR externos via HL7 FHIR]
  PUBLICO[Verificador publico de QR] --> LIS
```

### 4.2 Diagrama de contenedores (C4 nivel 2)

```mermaid
graph TD
  subgraph Cliente
    P1[Portal Administrador - SPA React]
    P2[Portal Paciente - SPA React]
    P3[Portal Referencia - SPA React]
  end
  P1 --> API
  P2 --> API
  P3 --> API
  API[API REST NestJS - monolito modular] --> DB[(PostgreSQL 16)]
  API --> REDIS[(Redis 7 - cache + colas)]
  API --> OBJ[(MinIO / S3 - PDFs y plantillas)]
  WORKER[Worker BullMQ - PDF, notificaciones, alertas] --> DB
  WORKER --> REDIS
  WORKER --> OBJ
  WORKER --> EMAIL[Email]
  WORKER --> SMS[SMS / WhatsApp]
  API --> WORKER
```

Los 3 portales son aplicaciones SPA que comparten un paquete de componentes UI y de tipos, pero se compilan y despliegan por separado (cada uno con su propio dominio o subdominio). Comparten la misma API. El **Worker** corre el mismo código que la API pero arranca en modo "consumidor de colas": procesa jobs pesados (render de PDF con Puppeteer, envío de notificaciones, evaluación de alertas) sin bloquear los requests HTTP.

### 4.3 Capas del backend (dentro del monolito)

Cada módulo NestJS respeta esta separación de responsabilidades:

```
Controller   -> Solo HTTP: parseo de request, validacion de DTO, codigos de respuesta.
                Cero logica de negocio.
Service      -> Logica de negocio y orquestacion. Reglas del dominio LIS.
Repository   -> Acceso a datos (Prisma). Cero logica de negocio.
DTO          -> Contratos de entrada/salida, validados con Zod/class-validator.
Entity       -> Modelo de dominio (mapea a tabla Prisma).
Guard        -> Autorizacion (RolesGuard, PermisosGuard).
Interceptor  -> Transversal (ScopeInterceptor, AuditInterceptor, LoggingInterceptor).
```

Regla de oro: **un controller no toca la base de datos directamente** y **un módulo no importa el `service` de otro módulo**; la comunicación entre módulos es por interfaces públicas exportadas o por eventos internos (`EventEmitter` de NestJS, ej. `resultado.liberado` → el módulo de notificaciones reacciona).

### 4.4 Estructura de carpetas del monorepo

```
lis/
├── apps/
│   ├── api/                      # Backend NestJS (API + Worker)
│   │   └── src/
│   │       ├── modules/          # Un módulo por bloque funcional
│   │       │   ├── auth/
│   │       │   ├── usuarios/
│   │       │   ├── pacientes/
│   │       │   ├── referencias/
│   │       │   ├── atencion/
│   │       │   ├── muestras/
│   │       │   ├── resultados/
│   │       │   ├── reportes-pdf/
│   │       │   ├── facturacion/
│   │       │   ├── tarifario/
│   │       │   ├── notificaciones/
│   │       │   ├── inventario/
│   │       │   ├── calidad/
│   │       │   ├── reportes-admin/
│   │       │   ├── auditoria/
│   │       │   └── configuracion/
│   │       ├── common/           # guards, interceptors, filters, decorators
│   │       ├── config/           # carga de variables de entorno tipada
│   │       ├── jobs/             # consumidores BullMQ
│   │       ├── main.ts           # bootstrap API
│   │       └── worker.ts         # bootstrap Worker
│   ├── portal-admin/             # SPA React — Administrador
│   ├── portal-paciente/          # SPA React — Paciente
│   └── portal-referencia/        # SPA React — Referencia
├── packages/
│   ├── contracts/                # Tipos + esquemas Zod compartidos FE/BE
│   ├── ui/                       # Componentes shadcn/ui compartidos por los 3 portales
│   └── config-eslint/            # Config lint compartida
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── docs/
│   ├── adr/                      # Architecture Decision Records
│   └── openapi/                  # Especificación OpenAPI generada
├── docker-compose.yml
├── .env.example
└── README.md
```

### 4.5 Flujo operativo extremo a extremo (el caso central del sistema)

Este es el flujo de la spec (§3) traducido a responsabilidades técnicas. Es el caso de uso que articula casi todos los módulos:

| Paso | Acción | Actor | Estado de la orden | Módulos involucrados |
|---|---|---|---|---|
| 1 | Registro / búsqueda del paciente | Administrador | — | `pacientes` |
| 2 | Registro de la orden + exámenes + referencia + `entrega` | Administrador | `PENDIENTE_MUESTRA` | `atencion`, `tarifario`, `referencias` |
| 3 | Toma de muestra y asignación de código de barra | Administrador | `MUESTRA_TOMADA` | `muestras` |
| 4 | Envío de muestra (in-house o laboratorio externo) | Administrador | `ENVIADA` | `muestras` |
| 5 | Procesamiento del análisis | Administrador / equipo | `EN_PROCESO` | `muestras`, `resultados` |
| 6 | Ingreso de resultados (manual; HL7 en Fase 4) | Administrador *(permiso ingreso)* | `EN_PROCESO` | `resultados` |
| 7 | Validación de resultados (2º nivel) | Administrador *(permiso validación)* | `COMPLETADA` | `resultados`, `calidad` |
| 8 | Liberación del resultado según `entrega` | Administrador | `LIBERADA` | `resultados`, `reportes-pdf` |
| 9 | Notificación al destinatario (paciente y/o referencia) | Sistema (Worker) | `LIBERADA` | `notificaciones` |
| 10 | Descarga del PDF (con QR) por paciente y/o referencia | Paciente / Referencia | `LIBERADA` | `reportes-pdf` |
| 11 | Emisión del comprobante de pago | Administrador | — | `facturacion` |

Toda transición de estado se registra en `auditoria` (ADR-006) y dispara, donde aplica, un evento interno que el Worker consume.

---

## 5. BASE DE DATOS — diseño detallado

### 5.1 Principios de diseño

- **Motor:** PostgreSQL 16. Una sola base de datos para el monolito.
- **Claves primarias:** `id UUID DEFAULT gen_random_uuid()` en todas las tablas (no se expone autoincrement).
- **Auditoría básica:** `created_at`, `updated_at`, `deleted_at` (soft delete) en todas las tablas de negocio.
- **Nombres:** `snake_case`, tablas en plural.
- **Integridad:** FKs con `ON DELETE RESTRICT` en todo lo clínico y financiero; nunca borrado físico de datos clínicos.
- **Constraints de negocio en la BD**, no solo en la app: `CHECK`, `UNIQUE`, FKs.
- **Índices** en todas las FKs, campos de búsqueda y campos de filtro de listados; índices parciales `WHERE deleted_at IS NULL`.
- **Multi-sede preparado** (ADR-007): `id_sede` presente desde el día 1 en `usuarios`, `atenciones`, `muestras`.

### 5.2 Diagrama entidad-relación (resumen)

```mermaid
erDiagram
  SEDES ||--o{ USUARIOS : tiene
  SEDES ||--o{ ATENCIONES : registra
  USUARIOS ||--o| PACIENTES : "vincula (rol PACIENTE)"
  USUARIOS ||--o| REFERENCIAS : "vincula (rol REFERENCIA)"
  REFERENCIAS ||--o{ MEDICOS_REFERIDORES : agrupa
  REFERENCIAS }o--o| CONVENIOS : "vinculada opcional"
  CONVENIOS ||--o{ TARIFAS : define
  PACIENTES ||--o{ ATENCIONES : "es atendido en"
  REFERENCIAS ||--o{ ATENCIONES : "remite"
  MEDICOS_REFERIDORES ||--o{ ATENCIONES : "solicita"
  ATENCIONES ||--|{ DETALLE_ATENCION : contiene
  PRUEBAS ||--o{ DETALLE_ATENCION : "es"
  PRUEBAS ||--o{ TARIFAS : "tiene precio"
  PAQUETES ||--|{ DETALLE_PAQUETE : agrupa
  PRUEBAS ||--o{ DETALLE_PAQUETE : "incluida en"
  ATENCIONES ||--o{ MUESTRAS : genera
  MUESTRAS ||--o{ LOG_CUSTODIA : "registra eventos"
  DETALLE_ATENCION ||--o| RESULTADOS : produce
  PRUEBAS ||--o{ PLANTILLAS : "tiene plantilla PDF"
  ATENCIONES ||--o{ REPORTES : "genera PDF"
  PLANTILLAS ||--o{ REPORTES : "usa"
  ATENCIONES ||--o{ COMPROBANTES : factura
  COMPROBANTES ||--o{ PAGOS : "recibe"
  ATENCIONES ||--o{ CONSENTIMIENTOS : "puede requerir"
  PACIENTES ||--o{ CITAS : agenda
  USUARIOS ||--o{ AUDITORIA : "genera registros"
```

### 5.3 Catálogo de tablas

#### Dominio: Identidad y acceso

**`sedes`** — soporte multi-sede (ADR-007). `id`, `nombre`, `direccion`, `ruc`, `telefono`, `es_principal BOOLEAN`, `estado`, auditoría.

**`usuarios`** — credenciales y rol de cualquier persona que entra al sistema.
`id`, `nombre`, `login` (único), `email`, `hash_password`, `rol` (`ADMINISTRADOR` | `PACIENTE` | `REFERENCIA`), `id_sede` FK, `id_paciente` FK NULL, `id_referencia` FK NULL, `mfa_secret` NULL, `mfa_habilitado BOOLEAN`, `estado` (`ACTIVO` | `INACTIVO` | `BLOQUEADO`), `ultimo_acceso`, auditoría.
- **`CHECK` de coherencia rol↔vínculo:** si `rol = PACIENTE` entonces `id_paciente` NOT NULL y `id_referencia` NULL; si `rol = REFERENCIA` entonces `id_referencia` NOT NULL y `id_paciente` NULL; si `rol = ADMINISTRADOR` ambos NULL.
- `mfa_habilitado` debe ser `true` para todo usuario `ADMINISTRADOR` (se valida en la app).

**`permisos_usuario`** — permisos finos del rol Administrador (ADR-001).
`id`, `id_usuario` FK, `permiso` (`puede_ingresar_resultados` | `puede_validar_resultados` | `puede_anular_comprobantes` | `puede_editar_resultado_liberado` | `puede_gestionar_usuarios` | `puede_ver_reportes_financieros` | …), `created_at`. `UNIQUE (id_usuario, permiso)`.

#### Dominio: Pacientes y referencias

**`pacientes`** — `id`, `tipo_doc` (`DNI` | `CE` | `PASAPORTE` | `CIP`), `nro_doc`, `nombres`, `apellidos`, `fecha_nacimiento`, `sexo`, `email`, `telefono`, `direccion`, `seguro` NULL, auditoría. `UNIQUE (tipo_doc, nro_doc)`.

**`referencias`** — entidad nueva del rol Referencia (ADR-003).
`id`, `tipo` (`CONSULTORIO` | `POSTA` | `POLICLINICO` | `MEDICO` | `OTRO`), `nombre`, `ruc` NULL, `direccion`, `telefono`, `email`, `id_convenio` FK NULL, `entrega_por_defecto` (`PACIENTE` | `REFERENCIA` | `AMBOS`), `estado`, auditoría.

**`medicos_referidores`** — médicos que solicitan exámenes; pueden o no pertenecer a una referencia.
`id`, `nombres`, `apellidos`, `cmp` (Colegio Médico del Perú, único), `id_referencia` FK NULL, `telefono`, `email`, `estado`, auditoría.

**`convenios`** — empresas, seguros o clínicas con tarifa diferenciada y facturación consolidada.
`id`, `nombre`, `ruc`, `tipo` (`EMPRESA` | `SEGURO` | `CLINICA`), `descuento_porcentaje DECIMAL(5,2)`, `contacto`, `email_facturacion`, `estado`, auditoría.

#### Dominio: Catálogo de pruebas y tarifario

**`pruebas`** — maestro de exámenes.
`id`, `codigo` (interno, único), `codigo_loinc` NULL, `descripcion`, `tipo_muestra` (`SANGRE_TOTAL` | `SUERO` | `PLASMA` | `ORINA` | `HECES` | `CULTIVO` | …), `area` (`HEMATOLOGIA` | `BIOQUIMICA` | `MICROBIOLOGIA` | `INMUNOLOGIA` | …), `tiempo_entrega_hrs INT`, `requiere_consentimiento BOOLEAN`, `estado`, auditoría.

**`campos_prueba`** — define el formulario dinámico de resultados de cada prueba (ej. hemoglobina, hematocrito…).
`id`, `id_prueba` FK, `nombre_campo`, `unidad`, `tipo_dato` (`NUMERICO` | `TEXTO` | `OPCION`), `orden INT`, `rango_ref_min` NULL, `rango_ref_max` NULL, `aplica_sexo` NULL, `edad_min` NULL, `edad_max` NULL. Permite rangos de referencia por sexo y edad.

**`tarifas`** — precio versionado por prueba (ADR de la spec: versionamiento con vigencia).
`id`, `id_prueba` FK, `tipo_tarifa` (`PARTICULAR` | `CONVENIO` | `SEGURO`), `id_convenio` FK NULL, `precio DECIMAL(10,2)`, `fecha_vigencia_desde DATE`, `fecha_vigencia_hasta DATE` NULL, `id_usuario_creo` FK, `created_at`. Una prueba puede tener varias tarifas vigentes simultáneamente (una particular, varias por convenio). Constraint: no se solapan rangos de vigencia para el mismo `(id_prueba, tipo_tarifa, id_convenio)`.

**`paquetes`** — agrupación de N pruebas con precio global.
`id`, `nombre`, `descripcion`, `precio_total DECIMAL(10,2)`, `estado`, auditoría.

**`detalle_paquete`** — `id`, `id_paquete` FK, `id_prueba` FK. `UNIQUE (id_paquete, id_prueba)`.

#### Dominio: Atención, muestras y resultados

**`atenciones`** — la orden. Entidad central del aislamiento de datos (ADR-002).
`id`, `codigo` (único, legible, ej. `ORD-2026-000123`), `id_paciente` FK, `id_sede` FK, `id_usuario_registro` FK, `id_medico_referidor` FK NULL, **`id_referencia` FK NULL**, `id_convenio` FK NULL, `fecha`, `tipo_atencion` (`AMBULATORIO` | `OCUPACIONAL` | `URGENCIA` | `REFERENCIA_EXTERNA`), **`entrega`** (`PACIENTE` | `REFERENCIA` | `AMBOS`), `estado` (`PENDIENTE_MUESTRA` | `MUESTRA_TOMADA` | `ENVIADA` | `EN_PROCESO` | `COMPLETADA` | `LIBERADA` | `ANULADA`), `prioridad` (`RUTINA` | `URGENTE`), `total DECIMAL(10,2)`, auditoría.
- Índices: `id_paciente`, `id_referencia`, `id_medico_referidor`, `estado`, `fecha`.

**`detalle_atencion`** — cada examen dentro de una orden.
`id`, `id_atencion` FK, `id_prueba` FK, `id_tarifa` FK, `precio_aplicado DECIMAL(10,2)`, `estado` (`PENDIENTE` | `EN_PROCESO` | `RESULTADO_INGRESADO` | `VALIDADO`), auditoría.

**`muestras`** — cadena de custodia.
`id`, `id_atencion` FK, `tipo_muestra`, `codigo_barra` (único), `condicion` (`OPTIMA` | `HEMOLIZADA` | `INSUFICIENTE` | `MAL_ETIQUETADA`), `destino` (`IN_HOUSE` | `EXTERNO`), `id_lab_externo` NULL, `fecha_toma`, `fecha_envio` NULL, `id_usuario_toma` FK, `motivo_rechazo` NULL, auditoría.

**`log_custodia`** — log inmutable de eventos de cada muestra.
`id`, `id_muestra` FK, `evento` (`TOMADA` | `RECIBIDA` | `ENVIADA` | `PROCESADA` | `RECHAZADA`), `id_usuario` FK, `timestamp TIMESTAMPTZ`, `observacion` NULL. Append-only.

**`resultados`** — valor de cada campo de cada examen, con doble validación.
`id`, `id_detalle_atencion` FK, `id_campo_prueba` FK, `valor`, `unidad`, `rango_ref_min` NULL, `rango_ref_max` NULL, `flag` (`N` normal | `L` bajo | `H` alto | `C` crítico), `fecha_ingreso`, `id_usuario_tecnico` FK NULL, `fecha_validacion` NULL, `id_usuario_validador` FK NULL, `bloqueado BOOLEAN` (true tras liberación), auditoría.

**`controles_calidad`** — corridas de QC (mejora estratégica de la spec).
`id`, `id_prueba` FK, `valor_esperado`, `valor_obtenido`, `fecha`, `id_equipo` NULL, `id_usuario` FK, `resultado` (`OK` | `FALLA`), `observacion` NULL.

#### Dominio: Reportes PDF, notificaciones y consentimientos

**`plantillas`** — plantilla PDF por tipo de análisis, versionable.
`id`, `nombre`, `id_prueba` FK NULL (NULL = plantilla global), `version INT`, `archivo_plantilla` (ruta en MinIO/S3, HTML con placeholders), `fecha_vigencia DATE`, `activa BOOLEAN`, auditoría.

**`reportes`** — PDF generado de una orden.
`id`, `id_atencion` FK, `id_plantilla` FK, `fecha_generacion`, `url_pdf` (MinIO/S3), `hash_pdf` (SHA-256), `qr_token` (único, usado por el verificador público), `estado` (`GENERADO` | `ANULADO`), auditoría.

**`notificaciones`** — bitácora de notificaciones enviadas.
`id`, `canal` (`EMAIL` | `SMS` | `WHATSAPP` | `APP`), `destinatario_tipo` (`PACIENTE` | `REFERENCIA` | `USUARIO`), `id_destinatario`, `id_atencion` FK NULL, `asunto`, `cuerpo`, `estado` (`PENDIENTE` | `ENVIADA` | `FALLIDA`), `intentos INT`, `enviada_en` NULL, `error` NULL, `created_at`.

**`consentimientos`** — consentimiento informado digital.
`id`, `id_atencion` FK, `id_prueba` FK, `texto_version`, `firmado BOOLEAN`, `fecha_firma` NULL, `firma_paciente` (imagen o token), `ip_firma INET` NULL, auditoría.

**`citas`** — agendamiento de toma de muestra (opcional).
`id`, `id_paciente` FK, `id_sede` FK, `fecha_hora`, `estado` (`AGENDADA` | `ATENDIDA` | `CANCELADA`), `observacion` NULL, auditoría.

#### Dominio: Facturación

**`comprobantes`** — boleta/factura electrónica.
`id`, `tipo` (`BOLETA` | `FACTURA` | `NOTA_CREDITO`), `serie`, `numero`, `id_atencion` FK NULL, `id_convenio` FK NULL (para facturación consolidada), `monto DECIMAL(10,2)`, `estado` (`PENDIENTE` | `PAGADO` | `ANULADO`), `fecha_emision`, `id_usuario` FK, `id_comprobante_referencia` FK NULL (la NC referencia su comprobante origen), auditoría. `UNIQUE (tipo, serie, numero)`.

**`pagos`** — soporte de pago parcial / adelanto.
`id`, `id_comprobante` FK, `monto DECIMAL(10,2)`, `metodo` (`EFECTIVO` | `TARJETA` | `TRANSFERENCIA` | `YAPE_PLIN`), `fecha`, `id_usuario` FK.

#### Dominio: Inventario, acreditaciones y auditoría

**`inventario`** — reactivos.
`id`, `reactivo`, `proveedor`, `lote`, `stock_actual DECIMAL`, `stock_minimo DECIMAL`, `unidad`, `fecha_vencimiento DATE`, `id_sede` FK, auditoría.

**`movimientos_inventario`** — entradas/salidas de stock para trazar consumo.
`id`, `id_inventario` FK, `tipo` (`ENTRADA` | `SALIDA` | `AJUSTE`), `cantidad DECIMAL`, `motivo`, `id_usuario` FK, `fecha`.

**`acreditaciones`** — certificaciones del laboratorio y del personal.
`id`, `tipo` (`ISO_15189` | `CLIA` | `LICENCIA_PERSONAL` | `OTRO`), `entidad`, `numero`, `fecha_emision`, `fecha_vencimiento DATE`, `id_usuario` FK NULL (si es del personal), `estado`, auditoría.

**`auditoria`** — registro inmutable append-only (ADR-006).
`id`, `timestamp TIMESTAMPTZ`, `id_usuario` FK, `accion` (`CREAR` | `MODIFICAR` | `ELIMINAR` | `LIBERAR` | `ANULAR` | `LOGIN` | `LOGOUT`), `entidad`, `id_entidad`, `detalle_json JSONB` (diff antes/después), `ip_origen INET`. Sin `UPDATE` ni `DELETE`; el rol de BD de la aplicación solo tiene `INSERT` y `SELECT` sobre esta tabla. Particionada por mes.

### 5.4 Estrategia de migraciones e integridad

- **Prisma Migrate** — cada cambio de esquema es una migración versionada en `/prisma/migrations`, revisable en PR. Nunca se edita una migración ya aplicada en producción.
- **Seeds** (`prisma/seed.ts`) — datos base por entorno: sede principal, usuario administrador inicial, áreas, catálogo mínimo de pruebas con sus campos, una plantilla PDF global, umbrales de valores críticos por defecto.
- **Integridad referencial estricta:** `ON DELETE RESTRICT` en todo lo clínico/financiero; soft delete (`deleted_at`) en lugar de borrado físico.
- **Constraints de negocio en BD:** `CHECK` de coherencia rol↔vínculo en `usuarios`; unicidad de `codigo_barra`; unicidad `(tipo, serie, numero)` en comprobantes; no solapamiento de vigencias en `tarifas`.
- **Índices parciales:** `CREATE INDEX ... WHERE deleted_at IS NULL` en los listados frecuentes (atenciones, pacientes, muestras).
- **Backups:** respaldo automático diario con retención mínima de 90 días (requisito de la spec); prueba de restauración trimestral.
- **Roles de BD:** rol `lis_app` (CRUD sobre tablas de negocio, solo INSERT/SELECT en `auditoria` y `log_custodia`); rol `lis_migrate` (DDL, usado solo por el pipeline de migraciones); rol `lis_readonly` (para reportería y BI futura).

---

## 6. BACKEND — diseño detallado

### 6.1 Responsabilidades del backend

El backend NestJS expone la API REST `v1`, contiene toda la lógica de negocio del LIS, aplica la autorización y el aislamiento de datos, orquesta los jobs asíncronos (Worker) y es la única capa que toca la base de datos y el almacenamiento de archivos. Los 3 portales no comparten lógica de negocio: toda regla vive aquí.

### 6.2 Módulos del backend y su alcance

| Módulo | Responsabilidad | Endpoints principales (resumen) |
|---|---|---|
| `auth` | Login, refresh, logout, MFA TOTP, recuperación de contraseña, emisión y validación de JWT | `POST /auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/mfa/setup`, `/auth/mfa/verify`, `/auth/forgot-password`, `/auth/reset-password` |
| `usuarios` | CRUD de usuarios, asignación de rol y permisos finos, alta de accesos de Paciente y Referencia | `GET/POST/PATCH /usuarios`, `PATCH /usuarios/{id}/permisos`, `PATCH /usuarios/{id}/estado` |
| `pacientes` | CRUD de pacientes, búsqueda por documento, auto-registro y auto-actualización | `GET /pacientes`, `GET /pacientes/{id}`, `POST /pacientes`, `PATCH /pacientes/{id}`, `GET /pacientes/buscar?doc=` |
| `referencias` | CRUD de referencias, médicos referidores, vínculo con convenio, gestión de su acceso | `GET/POST/PATCH /referencias`, `GET/POST /referencias/{id}/medicos`, `POST /referencias/{id}/acceso` |
| `atencion` | Crear y gestionar órdenes, detalle de exámenes, cálculo de total, transición de estados, campo `entrega` | `GET/POST /atenciones`, `GET /atenciones/{id}`, `PATCH /atenciones/{id}/estado`, `POST /atenciones/{id}/anular` |
| `muestras` | Registro de muestras, código de barra, cadena de custodia, rechazo de muestra | `POST /atenciones/{id}/muestras`, `PATCH /muestras/{id}/estado`, `POST /muestras/{id}/rechazar`, `GET /muestras/{id}/custodia` |
| `resultados` | Formulario dinámico por prueba, ingreso, marcado de flags, validación doble nivel, liberación, alertas críticas | `GET /atenciones/{id}/resultados`, `PUT /detalle-atencion/{id}/resultados`, `POST /detalle-atencion/{id}/validar`, `POST /atenciones/{id}/liberar` |
| `reportes-pdf` | Motor de plantillas, generación de PDF con QR, gestión de plantillas, endpoint público de verificación | `POST /atenciones/{id}/reporte`, `GET /reportes/{id}/pdf`, `GET /verificar/{qr_token}` (público), `GET/POST/PATCH /plantillas` |
| `facturacion` | Comprobantes (boleta/factura/NC), pagos parciales, facturación consolidada por convenio, export | `GET/POST /comprobantes`, `POST /comprobantes/{id}/pagos`, `POST /comprobantes/{id}/anular`, `GET /convenios/{id}/estado-cuenta` |
| `tarifario` | Maestro de pruebas, campos de prueba, tarifas versionadas, paquetes | `GET/POST/PATCH /pruebas`, `GET/POST /tarifas`, `GET/POST/PATCH /paquetes` |
| `notificaciones` | Envío multicanal (email/SMS/WhatsApp/app), bitácora, reintentos | (interno, disparado por eventos) + `GET /notificaciones` |
| `inventario` | Reactivos, movimientos de stock, alertas de stock mínimo y vencimiento | `GET/POST/PATCH /inventario`, `POST /inventario/{id}/movimientos` |
| `calidad` | Registro de corridas de QC, consulta de tendencias | `GET/POST /controles-calidad` |
| `reportes-admin` | Reportes operativos y financieros, dashboard ejecutivo, export a Excel | `GET /reportes/produccion`, `/reportes/ingresos`, `/reportes/referidores`, `/dashboard/kpis` |
| `auditoria` | Consulta del log inmutable; el `INSERT` lo hace el `AuditInterceptor`, no un endpoint | `GET /auditoria` (solo lectura, solo Admin) |
| `configuracion` | Parámetros del laboratorio, sedes, canales de notificación, umbrales de valores críticos, acreditaciones | `GET/PATCH /configuracion`, `GET/POST /sedes`, `GET/POST/PATCH /acreditaciones` |

### 6.3 Convenciones de la API REST

Siguiendo el estándar del proyecto:

- **Base:** `/api/v1`. Versionado por URL; un breaking change crea `/api/v2`.
- **Recursos en plural, sin verbos:** `/atenciones`, `/atenciones/{id}/muestras`. Anidamiento máximo 2 niveles; más profundidad → query params.
- **Métodos HTTP semánticos:** `GET` leer, `POST` crear, `PATCH` actualizar parcial, `DELETE` eliminar (soft).
- **Respuesta exitosa:** `{ "success": true, "data": {...}, "meta": { "timestamp", "version" } }`.
- **Respuesta paginada:** `{ "success": true, "data": [...], "pagination": { page, per_page, total, total_pages, has_next, has_prev } }`.
- **Respuesta de error:** `{ "success": false, "error": { "code", "message", "details": [{ field, message }] }, "meta": { timestamp, request_id } }`.
- **Códigos HTTP:** `200` lectura/actualización OK, `201` creación, `204` borrado/acción sin retorno, `400` validación, `401` no autenticado, `403` autenticado sin permiso (o recurso fuera de scope), `404` no existe, `409` conflicto (duplicado), `422` válido en formato pero inválido en lógica de negocio, `429` rate limit, `500` error inesperado.
- **Filtros y paginación de listados:** `?page=&per_page=&search=&sort=&order=&estado=&fecha_desde=&fecha_hasta=`.
- **Fechas:** ISO 8601 UTC.
- **Documentación:** OpenAPI 3.1 autogenerado por NestJS (`@nestjs/swagger`), publicado en `/api/docs` y versionado en `/docs/openapi/`.

### 6.4 Autenticación y autorización

**Flujo de login.**
1. `POST /auth/login` con `login` + `password`. Si el usuario es `ADMINISTRADOR`, la respuesta es `mfa_required: true` y un token temporal de MFA.
2. `POST /auth/mfa/verify` con el código TOTP → emite `access_token` (vida corta, 15 min) + `refresh_token` (vida larga, en cookie httpOnly o store seguro).
3. El `access_token` JWT lleva: `sub`, `rol`, `id_sede`, y `id_paciente` o `id_referencia` según el rol, además de `permisos` para Administrador.
4. `POST /auth/refresh` rota el `refresh_token` (rotación de tokens, detección de reuso).

**Cadena de guards/interceptors por request** (orden de ejecución):
1. `JwtAuthGuard` — valida firma y expiración del token; rechaza con `401`.
2. `RolesGuard` — lee `@Roles(...)` del endpoint; rechaza con `403` si el rol no aplica.
3. `PermisosGuard` — lee `@Permisos(...)`; rechaza con `403` si el Administrador no tiene el permiso fino.
4. `ScopeInterceptor` — para `PACIENTE`/`REFERENCIA`, inyecta el filtro de propiedad en el contexto de la query (ver §3.7 y §6.7).
5. `AuditInterceptor` — tras una mutación exitosa, escribe en `auditoria` el diff, usuario e IP.
6. `LoggingInterceptor` — log estructurado de request/response con `request_id`.

**Reglas de sesión y contraseñas.** Timeout de inactividad configurable (15–30 min); contraseñas con bcrypt/argon2; política de complejidad mínima; bloqueo tras N intentos fallidos; MFA TOTP obligatorio para Administrador; recuperación de contraseña por token de un solo uso con expiración.

### 6.5 Reglas de negocio críticas que vive el backend

Estas reglas no pueden estar en el frontend; el backend las garantiza siempre:

- **Transición de estados de la orden:** solo se permiten las transiciones del flujo (`PENDIENTE_MUESTRA → MUESTRA_TOMADA → ENVIADA → EN_PROCESO → COMPLETADA → LIBERADA`), más `→ ANULADA` desde estados previos a `LIBERADA`. Una máquina de estados explícita rechaza saltos inválidos.
- **Doble validación:** un resultado solo pasa a `VALIDADO` si lo valida un usuario con `puede_validar_resultados` **distinto** del que lo ingresó (si la configuración del laboratorio exige separación de personas). El laboratorio pequeño puede permitir el mismo usuario vía un flag de configuración.
- **Liberación controlada:** `POST /atenciones/{id}/liberar` solo procede si todos los `detalle_atencion` están `VALIDADO`. Al liberar, se marca `resultados.bloqueado = true`, se fija el estado `LIBERADA`, se aplica el campo `entrega` para calcular visibilidad, se dispara la generación de PDF y la notificación.
- **Bloqueo post-liberación:** un resultado liberado solo es editable por un usuario con `puede_editar_resultado_liberado`, queda registrado en `auditoria` con el diff, y genera una nueva versión del reporte PDF.
- **Valores críticos:** al ingresar un resultado, el backend compara contra los umbrales configurados; si es crítico, marca `flag = 'C'`, registra en bitácora y encola una alerta inmediata al personal de turno.
- **Cálculo de precio:** el `precio_aplicado` de cada `detalle_atencion` se resuelve en el backend según la tarifa vigente para el tipo de tarifa del paciente/convenio en la fecha de la orden. El frontend nunca envía el precio; lo calcula y devuelve el backend.
- **Aislamiento de la Referencia:** toda lectura desde el portal Referencia se filtra por `id_referencia`; un intento de acceder a una orden de otra referencia responde `404` (no `403`, para no revelar existencia).
- **Consentimiento obligatorio:** si una prueba tiene `requiere_consentimiento = true`, la orden no avanza a `MUESTRA_TOMADA` sin el consentimiento firmado.
- **Inmutabilidad de auditoría y custodia:** la app nunca ejecuta `UPDATE`/`DELETE` sobre `auditoria` ni `log_custodia`.

### 6.6 Jobs asíncronos (Worker + BullMQ)

El Worker corre en proceso separado y consume colas de Redis. Jobs definidos:

| Cola / Job | Disparador | Qué hace |
|---|---|---|
| `pdf.generar` | Evento `resultado.liberado` | Renderiza la plantilla HTML con los datos de la orden vía Puppeteer, calcula `hash_pdf`, genera `qr_token`, sube el PDF a MinIO/S3, guarda el registro en `reportes` |
| `notificacion.enviar` | Evento `resultado.liberado`, `valor.critico`, `muestra.rechazada` | Envía email/SMS/WhatsApp según `entrega` y canal; registra en `notificaciones`; reintenta con backoff exponencial hasta 3 veces |
| `alerta.valor-critico` | Evento `valor.critico` | Notifica al personal de turno y crea una alerta en su bandeja |
| `alertas.vencimientos` | Cron diario | Revisa `inventario` (stock mínimo, vencimiento) y `acreditaciones` (30/60/90 días) y genera alertas |
| `reporte.export` | Petición de export a Excel | Genera el archivo de reporte financiero/operativo de forma asíncrona y notifica el link de descarga |

Los jobs son idempotentes (un reintento no duplica un PDF ni una notificación) y registran su resultado para trazabilidad.

### 6.7 Estrategia de testing del backend

- **Unitarios (Vitest/Jest):** services y reglas de negocio. Objetivo de cobertura ≥ 80% en `services`. Mínimo 3 casos por use case (happy path, validación, borde).
- **Integración:** endpoints contra una base PostgreSQL efímera (Testcontainers). Verifican contrato, códigos HTTP y persistencia.
- **Tests de seguridad de aislamiento (obligatorios):** por cada endpoint de los portales Paciente y Referencia, un test que autentica como usuario A e intenta leer un recurso de usuario B; debe responder `403/404`. Sin estos tests, el endpoint no pasa el DoD.
- **Tests de máquina de estados:** verifican que toda transición inválida de orden se rechaza.
- **E2E (Playwright):** flujos críticos completos por portal en Fase 1+ (login → orden → resultado → liberación → descarga).
- **Contract tests:** los esquemas Zod de `packages/contracts` se validan contra las respuestas reales en CI.

### 6.8 Manejo de errores y observabilidad

- **Filtro global de excepciones** que traduce cualquier error al formato de error estándar con `request_id`.
- **Logs estructurados** (JSON) con `request_id`, `id_usuario`, `rol`, ruta, latencia.
- **Health checks:** `/health` (liveness) y `/health/ready` (readiness: BD, Redis, almacenamiento).
- **Métricas:** latencia por endpoint, tasa de error, profundidad de colas BullMQ, jobs fallidos.
- **Sentry** (o equivalente) para captura de excepciones en staging y producción.

---

## 7. FRONTEND — diseño detallado

### 7.1 Estrategia: tres portales, una base compartida

Se construyen **3 SPAs separadas** (`portal-admin`, `portal-paciente`, `portal-referencia`), cada una con su propio bundle y su propio dominio/subdominio, pero compartiendo:

- `packages/ui` — componentes shadcn/ui temáticos (botones, tablas, formularios, stepper, modales).
- `packages/contracts` — tipos TypeScript y esquemas Zod compartidos con el backend; el frontend nunca define a mano la forma de una respuesta.
- Hooks de infraestructura comunes — cliente HTTP, manejo de auth, manejo de errores, paginación.

**Por qué separadas y no una sola app con rutas por rol:** menor superficie de ataque (el bundle del Paciente no contiene el código del Administrador), despliegue independiente, y un fallo o cambio en un portal no afecta a los otros. El costo (algo de duplicación de bootstrap) se neutraliza con los paquetes compartidos del monorepo.

### 7.2 Stack y librerías

| Concern | Librería | Uso |
|---|---|---|
| Framework | React 18 + Vite + TypeScript | Base de las 3 SPAs |
| Routing | React Router | Rutas + guards de ruta por rol |
| Estado servidor | TanStack Query | Fetching, caché, invalidación, reintentos |
| Estado cliente | Zustand | Sesión, UI state, preferencias |
| Formularios | React Hook Form + Zod | Formularios tipados, validación con los esquemas compartidos |
| UI | TailwindCSS + shadcn/ui | Sistema de diseño consistente entre portales |
| Tablas/datos | TanStack Table | Listados con orden, filtro y paginación server-side |
| Gráficas | Recharts | Dashboard ejecutivo y reportes |
| Fechas | date-fns | Formateo y manejo de zonas horarias |
| Tests | Vitest + Testing Library + Playwright | Unitarios, de componente y E2E |

### 7.3 Portal Administrador — pantallas

Es el portal más extenso. Pantallas agrupadas por módulo:

- **Dashboard operativo** — órdenes pendientes/en proceso/completadas del día, tiempos promedio, alertas de valores críticos y muestras rechazadas, accesos rápidos.
- **Atención / Órdenes** — búsqueda de paciente por documento con autocompletado; alta de paciente; creación de orden con selección de exámenes/paquetes desde catálogo, precio automático, médico referidor, **referencia que remite**, tipo de atención y **selector de `entrega`** (Paciente / Referencia / Ambos); detalle de la orden con su stepper de estado.
- **Muestras** — registro de muestra, generación e impresión de etiqueta con código de barra, recepción, rechazo con motivo, vista de la cadena de custodia.
- **Bandeja de trabajo** — órdenes filtradas por área y prioridad; formulario dinámico de ingreso de resultados por prueba con marcado automático de fuera de rango; acción de validación (2º nivel); acción de liberación con confirmación del `entrega`.
- **Pacientes** — listado, ficha del paciente, historial clínico completo.
- **Referencias** — listado y alta de consultorios/postas/policlínicos/médicos; gestión de su acceso (crear/revocar); vínculo con convenio; médicos referidores asociados; `entrega_por_defecto`.
- **Tarifario** — maestro de pruebas y sus campos; tarifas con fechas de vigencia; paquetes; convenios.
- **Facturación** — emisión de boleta/factura, registro de pagos parciales, notas de crédito, estado de cuenta consolidado por convenio, export.
- **Reportes y Dashboard ejecutivo** — producción por usuario, ingresos por período/tipo/convenio, ranking de exámenes, referidores, estado de órdenes; KPIs en tiempo real; export a Excel.
- **Inventario** — reactivos, movimientos de stock, alertas de stock mínimo y vencimiento.
- **Control de calidad** — registro de corridas QC y tendencias.
- **Administración** — usuarios y permisos finos, plantillas PDF, acreditaciones, configuración del laboratorio, **log de auditoría**.

### 7.4 Portal Paciente — pantallas

Portal sobrio, claro, pensado para personas no técnicas y uso desde el móvil:

- **Inicio / Mis análisis** — lista de órdenes con su estado; cada una con el **stepper visual** (Muestra recibida → En análisis → En revisión → Listo).
- **Detalle de la orden** — exámenes solicitados, fecha, médico solicitante, instrucciones pre-análisis (ej. ayuno).
- **Resultados** — descarga del PDF (solo si `entrega` incluye al paciente y la orden está `LIBERADA`); vista del QR de verificación.
- **Pagos** — historial de comprobantes y descarga.
- **Consentimiento informado** — firma digital cuando un examen lo requiere.
- **Citas** — agendar toma de muestra (si el laboratorio lo habilita).
- **Mi perfil** — auto-actualización de datos de contacto.
- **Notificaciones** — badge y centro de notificaciones in-app.

### 7.5 Portal Referencia — pantallas

El portal nuevo. Equivale al acceso que un laboratorio mayor le da a este laboratorio (caso "CCVLAB"):

- **Inicio / Mis pacientes remitidos** — solo los pacientes que esta referencia remitió; buscador por nombre o documento.
- **Detalle del paciente remitido** — solo las órdenes y análisis que **esta referencia** generó; nunca el historial completo del paciente.
- **Estado de análisis** — stepper visual por orden remitida.
- **Resultados** — descarga del PDF de sus pacientes (cuando está liberado y `entrega` incluye a la referencia); QR de verificación.
- **Solicitud de derivación** (opcional, si el Administrador lo habilita) — formulario para registrar en línea un paciente a derivar, que el Administrador convierte en orden formal.
- **Estado de cuenta** (si la referencia tiene convenio) — comprobantes consolidados mensuales y su descarga.
- **Notificaciones** — aviso cuando un resultado de un paciente suyo está listo.
- **Mi perfil** — datos de contacto de la referencia.

### 7.6 Patrones de frontend transversales

- **Guards de ruta:** cada portal valida el rol del token al cargar; una ruta no autorizada redirige a login. El guard de ruta es defensa de UX, no de seguridad — la seguridad real está en el backend (§6.4).
- **Cliente HTTP:** interceptor que adjunta el `access_token`, renueva con `refresh_token` ante `401`, y normaliza el formato de error del backend a un tipo `ApiError`.
- **Manejo de estado servidor:** TanStack Query con claves de caché por recurso; invalidación tras mutaciones; estados de `loading`/`error`/`empty` explícitos en cada vista (nunca una pantalla en blanco).
- **Formularios:** React Hook Form + el esquema Zod de `packages/contracts` — la misma validación que el backend, sin duplicar reglas.
- **Stepper de estado:** componente compartido en `packages/ui`, alimentado por el estado de la orden; idéntico en los 3 portales para coherencia.
- **Accesibilidad:** componentes shadcn/ui accesibles por defecto; foco visible, etiquetas, contraste AA; navegación por teclado en formularios de ingreso de resultados (uso intensivo del personal).
- **Responsive:** el portal Paciente y el portal Referencia son mobile-first; el portal Administrador prioriza desktop pero degrada con dignidad.
- **i18n:** textos en español desde el día 1, pero extraídos a un catálogo para no quemar strings en componentes.
- **Sin datos sensibles en el cliente:** el frontend no decide visibilidad de resultados ni precios; solo muestra lo que el backend ya filtró.

### 7.7 Estrategia de testing del frontend

- **Unitarios/de componente (Vitest + Testing Library):** componentes con lógica (stepper, formulario dinámico de resultados, selector de `entrega`, tabla con filtros).
- **E2E (Playwright):** un flujo crítico por portal — Administrador: crear orden → ingresar resultado → validar → liberar. Paciente: login → ver stepper → descargar PDF. Referencia: login → ver solo sus pacientes → descargar PDF de un paciente suyo.
- **Test de aislamiento visual:** en el portal Referencia, un E2E que confirma que un paciente de otra referencia no aparece ni es accesible por URL directa.

---

## 8. Seguridad y cumplimiento normativo

### 8.1 Autenticación y sesión

- JWT access token de vida corta (15 min) + refresh token con rotación y detección de reuso.
- **MFA TOTP obligatorio** para el rol `ADMINISTRADOR`.
- Contraseñas con argon2/bcrypt; política de complejidad; bloqueo tras intentos fallidos.
- Timeout de inactividad configurable (15–30 min).
- Recuperación de contraseña por token de un solo uso con expiración corta.

### 8.2 Autorización y aislamiento

- RBAC por rol + permisos finos (§3, §6.4).
- Aislamiento de datos en 4 capas con defensa en profundidad (§3.7); tests de aislamiento obligatorios (§6.7).
- Endpoint público de verificación de QR: solo expone "válido/ inválido" y datos mínimos del reporte; nunca el resultado clínico completo.

### 8.3 Protección de datos

- **HTTPS/TLS 1.2+** en todo el sistema; HSTS.
- **Cifrado en reposo** de campos sensibles de salud (resultados, datos clínicos) y de los PDFs en el almacenamiento.
- **Cifrado en tránsito** hacia proveedores externos (email, SMS, facturador).
- PDFs protegidos contra edición; QR de verificación con hash SHA-256; firma digital PKI en Fase 4.
- Enlaces de descarga de resultados con expiración (24–72 h) y token de un solo uso.
- Minimización: el JWT lleva solo lo imprescindible; los logs no registran datos clínicos ni credenciales.

### 8.4 Auditoría

- Tabla `auditoria` append-only e inmutable (ADR-006); reforzada con permisos de rol de BD.
- Registra crear/modificar/eliminar/liberar/anular/login/logout con usuario, IP, entidad y diff JSON.
- `log_custodia` también append-only para la cadena de custodia de muestras.
- Solo el Administrador consulta el log; nadie lo edita ni lo borra.

### 8.5 Cumplimiento normativo

- **Ley N° 29733 — Protección de Datos Personales (Perú):** consentimiento informado digital; derecho de acceso del paciente a sus datos; minimización; el aislamiento de la Referencia garantiza que solo accede a lo que le corresponde; registro de tratamiento de datos en la auditoría.
- **ISO 15189 (laboratorios clínicos):** cadena de custodia de muestras, validación en dos niveles, control de calidad, trazabilidad de quién hizo qué y cuándo, gestión de acreditaciones.
- **Comprobantes electrónicos:** integración con OSE/SUNAT para boletas y facturas válidas.
- **Backups:** respaldo diario, retención mínima 90 días, prueba de restauración periódica.

### 8.6 Hardening operativo

- Rate limiting en endpoints sensibles (`/auth/*`, verificación de QR, export de reportes).
- Cabeceras de seguridad (CSP, X-Content-Type-Options, etc.) en los 3 portales.
- Validación estricta de entrada (Zod) en todos los endpoints; sanitización de archivos subidos (plantillas, adjuntos).
- Secretos fuera del código (variables de entorno / gestor de secretos); `.env.example` documentado, `.env` nunca versionado.
- Dependencias auditadas en CI (`npm audit` / Dependabot).
- Principio de menor privilegio en los roles de base de datos (§5.4).

---

## 9. DevOps, entornos y despliegue

### 9.1 Entornos

| Entorno | Propósito | Datos | Despliegue |
|---|---|---|---|
| `local` | Desarrollo en la máquina del dev | Seeds + datos de prueba | Docker Compose |
| `staging` | QA, demos al cliente, pruebas de aceptación | Datos sintéticos representativos | Automático desde `main` |
| `production` | Operación real del laboratorio | Datos reales | Manual con aprobación, desde tag |

### 9.2 Contenedores

`docker-compose.yml` para `local` y `staging` levanta: `api`, `worker`, `postgres:16-alpine`, `redis:7-alpine`, `minio`. Cada servicio con health check; `api` y `worker` dependen de `postgres` y `redis` saludables. Producción: la orquestación (Docker Compose en VM robusta vs. Kubernetes) se decide en Fase 4 según escala; el sistema no asume Kubernetes.

### 9.3 CI/CD

Pipeline (GitHub Actions o GitLab CI) en cada PR:
1. **Lint + typecheck** (backend y los 3 portales).
2. **Tests unitarios + integración** (backend con Testcontainers).
3. **Tests de aislamiento de datos** — gate obligatorio (§6.7).
4. **Build** de la API y de los 3 portales.
5. **Auditoría de dependencias** (`npm audit`).
6. **Contract tests** Zod.
7. Merge a `main` → despliegue automático a `staging` + migraciones Prisma.
8. Tag de release → despliegue a `production` con aprobación manual; migraciones aplicadas con el rol `lis_migrate`; estrategia de rollback documentada.

### 9.4 Variables de entorno (`.env.example`)

```bash
# App
APP_ENV=development            # development | staging | production
API_PORT=8000
JWT_SECRET=change-me
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=30d
SESSION_TIMEOUT_MIN=20

# Base de datos
DATABASE_URL=postgresql://lis_app:pass@localhost:5432/lis
DATABASE_MIGRATE_URL=postgresql://lis_migrate:pass@localhost:5432/lis

# Redis / colas
REDIS_URL=redis://localhost:6379

# Almacenamiento
STORAGE_PROVIDER=minio         # minio | s3
S3_ENDPOINT=
S3_BUCKET=lis-reportes
S3_ACCESS_KEY=
S3_SECRET_KEY=

# Notificaciones
EMAIL_PROVIDER=ses             # ses | sendgrid | smtp
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMS_PROVIDER=twilio            # twilio | sns
TWILIO_SID=
TWILIO_TOKEN=

# Facturación electrónica
OSE_ENDPOINT=
OSE_API_KEY=

# Observabilidad
SENTRY_DSN=
```

### 9.5 Backups y recuperación

- Respaldo automático diario de PostgreSQL; retención mínima 90 días.
- Respaldo del almacenamiento de objetos (PDFs, plantillas).
- Prueba de restauración trimestral en `staging`.
- Plan de recuperación ante desastres documentado: RPO ≤ 24 h, RTO objetivo definido con el cliente.

---

## 10. Roadmap Scrum por MVPs

Sprints de **2 semanas**. Estimación en story points (Fibonacci). La velocidad real se calibra tras los primeros 3 sprints; las cifras de SP aquí son una guía de tamaño relativo. Cada Historia de Usuario (HU) se descompone en tareas por capa: **Base de Datos**, **Backend**, **Frontend**, **Transversales**.

### Fase 0 — Setup (1 sprint, 2 semanas)

**Sprint Goal:** "El equipo puede levantar el sistema completo en local y en staging, con login funcional para los 3 roles y el pipeline de CI/CD en verde."

| HU / Tarea | Capa | SP |
|---|---|---|
| Configurar monorepo (workspaces, ESLint, TS, estructura de carpetas) | Transversal | 3 |
| `docker-compose.yml` con postgres, redis, minio, api, worker + health checks | Transversal | 3 |
| Esquema Prisma inicial con todas las tablas del §5 + primera migración | Base de Datos | 5 |
| Seed: sede principal, usuario administrador, áreas, catálogo mínimo de pruebas, plantilla global | Base de Datos | 3 |
| Módulo `auth`: login, refresh, logout, JWT, hash de contraseñas | Backend | 5 |
| MFA TOTP para Administrador (setup + verify) | Backend | 3 |
| Guards e interceptors base: `JwtAuthGuard`, `RolesGuard`, `PermisosGuard`, `ScopeInterceptor`, `AuditInterceptor` | Backend | 5 |
| Filtro global de errores + formato de respuesta estándar + OpenAPI base | Backend | 3 |
| Bootstrap de los 3 portales SPA (Vite + React + Tailwind + shadcn/ui) + `packages/ui` y `packages/contracts` | Frontend | 5 |
| Pantalla de login + flujo MFA + guards de ruta en los 3 portales | Frontend | 5 |
| Pipeline CI/CD: lint, typecheck, tests, build, deploy a staging | Transversal | 5 |

### Fase 1 — MVP operativo (6–8 sprints, 3–4 meses)

Objetivo de la fase: **el laboratorio puede operar el ciclo central** — registrar pacientes y órdenes, tomar muestras, ingresar resultados, liberar y entregar el PDF; el paciente y la referencia pueden ver lo suyo.

**Épicas de la fase:**
1. Gestión de usuarios, pacientes y referencias.
2. Atención / órdenes con `entrega` y catálogo de pruebas.
3. Muestras y código de barra (cadena de custodia básica).
4. Ingreso de resultados y liberación.
5. Reporte PDF básico con QR.
6. Portal Paciente básico.
7. Portal Referencia básico.

**Ejemplo de descomposición — HU-ATN-01: "Como Administrador quiero registrar una orden de atención asociando paciente, exámenes, referencia y modo de entrega, para iniciar el ciclo del análisis."**

*Criterios de aceptación:* (a) puedo buscar un paciente por documento o crearlo si no existe; (b) puedo seleccionar pruebas y paquetes del catálogo y el total se calcula automáticamente según la tarifa vigente; (c) puedo asignar referencia, médico referidor y seleccionar `entrega` (Paciente/Referencia/Ambos); (d) al guardar, la orden queda en estado `PENDIENTE_MUESTRA` con código único; (e) la acción queda registrada en auditoría.

| Tarea | Capa | SP |
|---|---|---|
| Migración/ajuste de `atenciones` y `detalle_atencion` + índices | Base de Datos | 2 |
| `AtencionService`: crear orden, calcular total con tarifa vigente, generar código, estado inicial | Backend | 5 |
| `POST /atenciones` + DTO Zod + validaciones de negocio | Backend | 3 |
| `GET /pacientes/buscar` y `POST /pacientes` | Backend | 3 |
| Endpoint de catálogo de pruebas/paquetes con precio resuelto | Backend | 2 |
| Tests unitarios de cálculo de total y estado inicial + test de auditoría | Backend | 3 |
| Pantalla "Nueva orden": búsqueda/alta de paciente, selección de exámenes, selector de `entrega`, resumen de precios | Frontend | 8 |
| Integración API + manejo de loading/error + invalidación de caché | Frontend | 3 |
| Actualizar OpenAPI + code review BE/FE | Transversal | 2 |

El resto de HUs de la fase (ingreso de resultados con formulario dinámico, validación doble nivel, liberación con `entrega`, generación de PDF + QR, stepper en portal Paciente, listado aislado en portal Referencia, etc.) se descomponen con el **mismo patrón por capa** durante cada Sprint Planning. Distribución sugerida:

| Sprint | Foco |
|---|---|
| 1 | Usuarios + permisos finos + pacientes (CRUD y búsqueda) |
| 2 | Referencias + médicos referidores + alta de accesos |
| 3 | Atención / órdenes + catálogo + tarifa básica |
| 4 | Muestras + código de barra + custodia básica |
| 5 | Resultados: formulario dinámico + ingreso + flags |
| 6 | Validación doble nivel + liberación + `entrega` |
| 7 | Reporte PDF básico + QR + verificador público |
| 8 | Portales Paciente y Referencia básicos + E2E + estabilización |

### Fase 2 — Operación completa (4–6 sprints, 2–3 meses)

| Épica | Contenido |
|---|---|
| Cadena de custodia completa | `log_custodia` con todos los eventos, rechazo de muestra con motivo y alerta |
| Validación doble nivel reforzada | Separación de personas configurable, bloqueo post-liberación, edición con permiso especial y auditoría |
| Notificaciones multicanal | Worker BullMQ: email + SMS/WhatsApp + in-app; bitácora y reintentos |
| Tarifario y paquetes | Versionamiento con vigencias, no solapamiento, historial de cambios de precio |
| Comprobantes y facturación | Boleta/factura, pagos parciales, notas de crédito, integración OSE/SUNAT |
| Consentimiento informado | Firma digital, bloqueo de avance de orden sin consentimiento |

### Fase 3 — Gestión avanzada (4–6 sprints, 2–3 meses)

| Épica | Contenido |
|---|---|
| Reportes administrativos | Producción por usuario, ingresos por período/tipo/convenio, referidores, estado de órdenes; export a Excel asíncrono |
| Dashboard ejecutivo | KPIs en tiempo real con Recharts |
| Inventario de reactivos | Stock, movimientos, alertas de stock mínimo y vencimiento |
| Convenios con facturación consolidada | Estado de cuenta mensual por empresa, comprobantes consolidados |
| Control de calidad | Registro de corridas QC, tendencias |
| Auditoría completa | Particionado de la tabla, visor de auditoría, RLS en tablas sensibles |
| Acreditaciones | Gestión y alertas 30/60/90 días |

### Fase 4 — Integraciones (4–6 sprints, 2–3 meses)

| Épica | Contenido |
|---|---|
| Integración HL7/ASTM | Adaptador del `ResultImporterPort`: importación automática de resultados desde analizadores |
| Firma digital PKI | Firma de PDFs con certificado |
| Multi-sede | Activar la operación con varias sedes (el modelo ya lo soporta) |
| Interoperabilidad HL7 FHIR | Compartir resultados con HIS/EMR externos |

---

## 11. Riesgos y mitigaciones

| # | Riesgo | Impacto | Probabilidad | Mitigación |
|---|---|---|---|---|
| R1 | El cliente quería conservar "Personal" como 4º rol y ADR-001 no es lo que esperaba | Alto — rediseño del modelo de roles | Media | Confirmación bloqueante del ADR-001 antes de iniciar Fase 1 |
| R2 | Una query del portal Referencia omite el guard de scope y expone datos de otra referencia | Crítico — fuga de datos de salud | Media | `ScopeInterceptor` centralizado + tests de aislamiento obligatorios por endpoint + RLS en Fase 3 |
| R3 | Integración con OSE/SUNAT más compleja de lo previsto | Medio — retraso en facturación | Alta | Aislar la facturación tras una interfaz; empezar la integración temprano en Fase 2; tener un modo "comprobante manual" de respaldo |
| R4 | Generación de PDF con Puppeteer pesada o inestable bajo carga | Medio — lentitud en liberación de resultados | Media | PDF siempre en Worker asíncrono; pool de instancias de Puppeteer; jobs idempotentes con reintentos |
| R5 | Equipo poco familiarizado con NestJS/Node en entorno salud | Medio — curva de aprendizaje | Media | Alternativa .NET documentada en ADR-004; sprint 0 incluye spikes; pair programming inicial |
| R6 | Cambios de tarifario mal versionados generan precios incorrectos en órdenes | Alto — error financiero | Media | No solapamiento de vigencias en BD; precio siempre resuelto y congelado en el backend al crear la orden (`precio_aplicado`) |
| R7 | Notificaciones SMS/WhatsApp con costo o entregabilidad variable | Bajo–Medio | Media | Proveedor configurable; email como canal garantizado; bitácora con reintentos |
| R8 | Crecimiento de `auditoria` degrada el rendimiento | Medio | Alta (a largo plazo) | Particionado por mes desde Fase 3; política de archivado, nunca borrado |
| R9 | Requisitos HL7/ASTM dependientes de hardware específico del laboratorio | Medio — bloqueo en Fase 4 | Media | Puerto de importación aislado desde el día 1 (ADR-007); levantar requisitos de los analizadores reales antes de Fase 4 |
| R10 | Alcance crece sprint a sprint (scope creep) | Medio | Alta | DoR estricto; backlog priorizado por el PO; lo nuevo entra al backlog, no al sprint en curso |

---

## 12. Definition of Ready / Definition of Done

### 12.1 Definition of Ready (una HU puede entrar a sprint)

- [ ] Título claro y descripción en formato "Como… quiero… para…".
- [ ] Al menos 3 criterios de aceptación verificables.
- [ ] Estimada por el equipo (tiene story points).
- [ ] Sin dependencias bloqueantes sin resolver.
- [ ] El equipo entiende qué construir; no hay preguntas abiertas.
- [ ] Mockups/diseños disponibles si la HU tiene UI.
- [ ] Acceso a sistemas externos confirmado si la HU lo requiere (ej. credenciales OSE).
- [ ] Se identificó en qué capas impacta (BD / Backend / Frontend / Transversal).

### 12.2 Definition of Done (una tarea/HU está terminada)

- [ ] Código cumple los criterios de aceptación.
- [ ] Migración Prisma creada y revisada (si hubo cambio de esquema).
- [ ] Tests unitarios escritos y en verde (≥ 80% en `services` afectados).
- [ ] Test de integración del endpoint en verde (si aplica).
- [ ] **Test de aislamiento de datos en verde** (si el endpoint sirve a Paciente o Referencia).
- [ ] OpenAPI actualizado.
- [ ] La acción sensible queda registrada en `auditoria` (si aplica).
- [ ] Estados de loading/error/empty implementados en la UI (si aplica).
- [ ] Code review de backend y frontend aprobado.
- [ ] Sin secretos quemados; `.env.example` actualizado si hubo variable nueva.
- [ ] Desplegado y verificado en `staging`.

---

## 13. Glosario

| Término | Definición |
|---|---|
| **LIS** | Laboratory Information System — sistema de información de laboratorio clínico. |
| **Referencia** | Consultorio, posta, policlínico o médico que remite pacientes/muestras al laboratorio y consulta los resultados de sus pacientes. Rol nuevo de este plan. |
| **Médico referidor** | Médico que solicita los exámenes; puede o no pertenecer a una Referencia. |
| **Convenio** | Empresa, seguro o clínica con tarifa diferenciada y, opcionalmente, facturación consolidada. |
| **`entrega`** | Campo de la orden que define a quién se habilita el resultado liberado: Paciente, Referencia o Ambos. |
| **Cadena de custodia** | Registro inmutable de quién tomó, recibió, procesó y validó cada muestra, con timestamps. |
| **Validación en dos niveles** | El técnico ingresa el resultado; un validador (bioquímico/jefe) lo aprueba antes de liberarlo. |
| **Liberación** | Acción del Administrador que hace el resultado visible para los actores externos según `entrega`. |
| **Stepper** | Componente visual que muestra el progreso de un análisis (Muestra recibida → En análisis → En revisión → Listo). |
| **ADR** | Architecture Decision Record — registro documentado de una decisión técnica. |
| **RBAC** | Role-Based Access Control — control de acceso basado en roles. |
| **Data scoping / aislamiento** | Filtrado automático de datos para que un usuario solo vea lo que le corresponde. |
| **Monolito modular** | Aplicación desplegada como una unidad pero dividida internamente en módulos con fronteras claras. |
| **Worker** | Proceso separado que ejecuta jobs asíncronos (PDF, notificaciones, alertas) desde colas Redis. |
| **MFA / TOTP** | Autenticación multifactor con código temporal; obligatoria para el rol Administrador. |
| **Append-only** | Tabla que solo admite inserciones; no se actualiza ni se borra (auditoría, custodia). |
| **DoR / DoD** | Definition of Ready / Definition of Done — criterios de entrada y de cierre de una HU. |
| **HL7 / ASTM / FHIR** | Estándares de interoperabilidad clínica para intercambiar datos con analizadores y otros sistemas de salud. |
| **OSE** | Operador de Servicios Electrónicos — intermediario para emitir comprobantes electrónicos válidos ante SUNAT. |

---

## Próximos pasos inmediatos

1. **Confirmar ADR-001** (modelo de 3 roles con Administrador operativo) — es la única decisión bloqueante; todo lo demás depende de ella.
2. Confirmar el stack de ADR-004 (NestJS vs. ASP.NET Core) según el perfil del equipo.
3. Levantar los datos reales que faltan: catálogo de pruebas del laboratorio con sus campos y rangos de referencia, tarifario actual, lista inicial de referencias y convenios, datos fiscales y de sedes, umbrales de valores críticos.
4. Confirmar el proveedor de comprobantes electrónicos (OSE) y conseguir credenciales de pruebas.
5. Arrancar la **Fase 0** con el Sprint Planning del Sprint 0.

> Si algún supuesto de este plan no coincide con tu operación real — por ejemplo, si una Referencia sí debe poder ver el historial completo del paciente, o si quieres conservar un rol "Personal" separado — conviene ajustarlo antes de la Fase 1, porque cambia el modelo de datos y de permisos.
