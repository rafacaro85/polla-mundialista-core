# SECURITY_CONTEXT.md
# Contexto de Seguridad y Hoja de Ruta Técnica — Polla Virtual
# Mantenido por: Agente de Seguridad (Emamdual Solutions)
# Última actualización: Febrero 2026

---

## 1. DESCRIPCIÓN DEL PROYECTO

**Polla Virtual** (`lapollavirtual.com`) es una plataforma colombiana de pronósticos
deportivos (Mundial 2026 / Champions League 25-26) con soporte para ligas empresariales.

### Stack Tecnológico
| Capa | Tecnología | Versión |
|------|-----------|---------|
| Backend | NestJS + Express | 11.x / 5.x |
| Frontend | Next.js + React | 16.0 / 19.2 |
| Base de Datos | PostgreSQL | 15 |
| Caché | Redis | 4.7.1 |
| ORM | TypeORM | Última estable |
| Autenticación | JWT httpOnly Cookies + Google OAuth 2.0 | Passport 2.0 |
| Validación | Zod + class-validator | 4.x |
| Monorepo | NX Workspace | 22.x |
| Deploy Backend | Railway (Hobby Plan) | — |
| Deploy Frontend | Vercel | — |

### Estructura del Monorepo
```
polla-mundialista-core/
└── Polla/
    ├── apps/
    │   ├── api/     ← NestJS 11 (puerto 3001)
    │   └── web/     ← Next.js 16 (puerto 3000)
    ├── scripts/
    └── docs/
```

### Proyectos en Railway
| Proyecto | PostgreSQL | Redis | Estado |
|----------|-----------|-------|--------|
| POLLA MUNDIAL | ✅ Online | ✅ Online | Producción activa |
| POLLA CHAMPIONS | ✅ Online | ❌ Sin Redis | Producción activa |
| PEOPLE (PTWP) | ✅ Online | ✅ Online | En desarrollo |

---

## 2. ESTADO ACTUAL DE SEGURIDAD

### ✅ CORRECCIONES APLICADAS

#### C1 — CORS Cerrado (Desplegado ✅)
- **Archivo modificado:** `apps/api/src/main.ts`
- **Commit:** `fix(security): restrict CORS to allowed origins only`
- **Cambio:** `origin: true` → whitelist explícita con función callback
- **Dominios permitidos:**
  - `https://lapollavirtual.com`
  - `https://www.lapollavirtual.com`
  - `https://champions.lapollavirtual.com`
  - `http://localhost:3000` y `http://localhost:3001` (solo en desarrollo)
- **Requests sin origin:** Permitidos (mobile apps, Postman, server-to-server)
- **Verificado en producción:** ✅

#### C2 — JWT Migrado a Cookies httpOnly (Desplegado ✅)
- **Archivos modificados:** 14 archivos (ver detalle abajo)
- **Commit:** `fix(security): migrate JWT from localStorage to httpOnly cookies`
- **Cambio principal:** Token JWT migrado de `localStorage` a cookie `auth_token`
- **Configuración de la cookie:**
  ```
  httpOnly: true
  secure: true (NODE_ENV=production confirmado en Railway)
  sameSite: 'strict'
  maxAge: 7 días
  path: '/'
  ```
- **Google OAuth:** Rediseñado — el callback ya NO pasa el token en la URL
- **Fallback Bearer token:** Activo en JwtStrategy para compatibilidad con mobile/Postman
- **Archivos modificados:**
  - `apps/api/src/main.ts` (cookie-parser middleware)
  - `apps/api/src/auth/strategies/jwt.strategy.ts` (extractor cookie → fallback Bearer)
  - `apps/api/src/auth/auth.controller.ts` (set/clear cookie en login/logout/OAuth)
  - `apps/web/src/lib/api.ts` (withCredentials: true, sin localStorage)
  - `apps/web/src/lib/auth.tsx` (fetchUser sin chequeo de token)
  - `apps/web/src/app/auth/success/page.tsx` (rediseño: usa /auth/profile con cookie)
  - `apps/web/src/app/login/page.tsx` (elimina setItem token x2)
  - `apps/web/src/components/TieBreakerDialog.tsx` (usa api con withCredentials)
  - `apps/web/src/components/UserNav.tsx` (elimina fallback localStorage)
  - `apps/web/src/app/page.tsx` (verifica sesión solo con store)
  - `apps/web/src/app/demo/page.tsx` (elimina setItem token)
  - `apps/web/src/app/invite/[code]/page.tsx` (usa syncUserFromServer)
  - `apps/web/src/app/login/page_footer.tsx` (archivo huérfano — limpiado)
  - `apps/web/src/components/FloatingDemoWidget.tsx` (eliminado — código demo no usado)
- **Hotfix aplicado:** `fix(auth): prevent 401 redirect loop on login and auth routes`
  - Commit: `7dd4d4f`
  - El interceptor 401 ya no redirige si el usuario está en `/login` o `/auth/*`
- **Verificado en producción:** ✅
  - Sin loop de redirección ✅
  - Login funcionando ✅
  - URL `/auth/success` sin token expuesto ✅
  - Cookie `auth_token` httpOnly en DevTools ✅

#### NOTA — Archivo huérfano pendiente de limpieza
- `apps/web/src/app/login/page_footer.tsx` — No está importado en ningún componente.
  Tenía errores de lint preexistentes. Eliminar en Sprint 3.

---

## 3. HOJA DE RUTA COMPLETA — AUDITORÍA TÉCNICA

### 🔴 SPRINT 1 — Críticos (Esta semana)

| # | Tarea | Archivo(s) | Estado |
|---|-------|-----------|--------|
| C1 | CORS completamente abierto | `main.ts:29` | ✅ DONE |
| C2 | JWT en localStorage | `web/src/lib/api.ts:16` | ✅ DONE |
| C3 | Race condition en Joker | `predictions.service.ts:73` | ⏳ EN PROGRESO |
| C4 | Scoring secuencial (N × 17ms) | `scoring.service.ts:65` | ⏳ PENDIENTE |
| C5 | Cron sin ventana temporal | `match-sync.service.ts:24` | ⏳ PENDIENTE |

---

### 🟠 SPRINT 2 — Altos (Próximas 2 semanas)

| # | Tarea | Archivo(s) | Estado |
|---|-------|-----------|--------|
| A1 | Thundering herd en caché de rankings | `leagues.service.ts:427` | ⏳ PENDIENTE |
| A2 | `createLeague` sin transacción completa | `leagues.service.ts:56` | ⏳ PENDIENTE |
| A3 | JWT sin rol del usuario en payload | `auth.service.ts:70` | ⏳ PENDIENTE |
| A4 | `tournamentId` con fallback silencioso (`\|\| 'WC2026'`) | 20+ archivos | ⏳ PENDIENTE |
| A5 | Estados de partidos incompletos (PST, CANC, ABD) | `match-sync.service.ts:118` | ⏳ PENDIENTE |
| A6 | Sin Error Boundaries en frontend | `apps/web/src/app/**` | ⏳ PENDIENTE |
| A7 | `console.log` masivo en producción | Todo el backend | ⏳ PENDIENTE |

---

### 🟡 SPRINT 3 — Deuda técnica planificada (Próximo mes)

| # | Tarea | Archivo(s) |
|---|-------|-----------|
| D1 | `isBlocked` + `status` redundantes en `LeagueParticipant` | `league-participant.entity.ts` |
| D2 | Magic strings duplicados | Crear `constants/index.ts` |
| D3 | Sin endpoint de health check | Agregar `GET /api/health` |
| D4 | TTL de caché no refleja ciclo de invalidación real | `leagues.service.ts:427` |
| D5 | `getAllLeagues` sin paginación | `leagues.service.ts:516` |
| D6 | Verificación de código sin expiración | `auth.service.ts:214` |
| D7 | Pool de 50 conexiones — validar límites Railway | `app.module.ts:117` |
| D8 | Sin soft deletes en entidades críticas | `League`, `User`, `Prediction` |
| D9 | `logging: true` en `data-source.ts` | `data-source.ts:25` |
| D10 | Sin cancelación de requests en frontend | Hooks de fetching |
| D11 | Archivo huérfano `login/page_footer.tsx` | `apps/web/src/app/login/` |
| D12 | Roles con string literals en lugar de enums | `leagues.service.ts:605` |

---

### ⚪ SPRINT 4 — Mejoras de largo plazo (Continuo)

| # | Tarea |
|---|-------|
| L1 | ~0% cobertura de tests (PredictionsService, LeaguesService, PaymentsService, AuthService) |
| L2 | Sin Swagger/OpenAPI |
| L3 | Respuesta de API inconsistente — adoptar envelope `{ data, meta, error }` |
| L4 | `getLeagueRanking` con 5 queries secuenciales → paralelizar con `Promise.all()` |
| L5 | `LeaguesService` viola SRP — separar en servicios + usar EventEmitter |
| L6 | `leagueId` en predicciones sin foreign key constraint |
| L7 | Lógica de joker duplicada entre upsert individual y bulk |

---

## 4. DETALLE TÉCNICO DE TAREAS PENDIENTES

### C3 — Race Condition en el Joker
**Severidad:** 🔴 Crítica
**Archivo:** `apps/api/src/predictions/predictions.service.ts:73-128`

**Problema:**
```
REQUEST A → verifica joker activo = false → (pausa)
REQUEST B → verifica joker activo = false → activa joker
REQUEST A → reanuda ──────────────────────→ activa joker (2 veces)
```

**Solución requerida:** Transacción con `SELECT FOR UPDATE` (pessimistic locking)
```typescript
const queryRunner = this.dataSource.createQueryRunner();
await queryRunner.connect();
await queryRunner.startTransaction();
try {
  const prediction = await queryRunner.manager
    .createQueryBuilder(Prediction, 'prediction')
    .setLock('pessimistic_write') // SELECT FOR UPDATE
    .getOne();
  // ... lógica del joker
  await queryRunner.commitTransaction();
} catch (error) {
  await queryRunner.rollbackTransaction();
  throw error;
} finally {
  await queryRunner.release();
}
```
**Impacto en datos existentes:** Ninguno. No toca predicciones ni jokers ya activados.

---

### C4 — Scoring Secuencial (N × 17ms)
**Severidad:** 🔴 Crítica
**Archivo:** `apps/api/src/scoring/scoring.service.ts:65-85`

**Problema:** Con 5.000 usuarios, un partido tarda 68 segundos calculando puntos.
Con 16 partidos simultáneos (última jornada grupos), el pool de 50 conexiones colapsa.

**Solución requerida:** Bulk update en transacción única
```typescript
// ACTUAL (1 UPDATE por predicción):
for (const prediction of predictions) {
  await this.predictionsRepository.save(prediction);
}

// CORRECCIÓN (1 UPDATE para todas):
await this.predictionsRepository.manager.transaction(async (em) => {
  await em.save(predictions.map(p => ({
    ...p,
    points: this.calculatePoints(match, p)
  })));
});
```
**Impacto en datos existentes:** Ninguno. Solo cambia cómo se procesan los nuevos cálculos.
**Mejora de rendimiento:** De 68s a <1s para 5.000 usuarios.

---

### C5 — Cron sin Ventana Temporal
**Severidad:** 🔴 Crítica
**Archivo:** `apps/api/src/matches/match-sync.service.ts:24-84`

**Problema:** Sincroniza TODOS los partidos no terminados, incluyendo los que están
a meses de distancia. Consume ~14.000 requests/día a API-SPORTS (límite del plan: 100-1.000).
Con Champions + Mundial activos simultáneamente, excede el límite desde el día 1.

**Solución requerida:**
1. Filtro de ventana temporal en la query:
```typescript
date >= NOW() - INTERVAL '3 hours' AND date <= NOW() + INTERVAL '30 minutes'
```
2. Lock distribuido en Redis para evitar solapamiento de crons:
```typescript
private isRunning = false;

async syncLiveMatches() {
  if (this.isRunning) return; // Evitar solapamiento
  this.isRunning = true;
  try {
    // ... lógica de sync
  } finally {
    this.isRunning = false;
  }
}
```
**Impacto en datos existentes:** Ninguno. Solo cambia qué partidos se sincronizan.

---

### A1 — Thundering Herd en Caché de Rankings
**Severidad:** 🟠 Alta
**Archivo:** `apps/api/src/leagues/leagues.service.ts:427-513`

**Problema:** Cuando el TTL expira, múltiples requests concurrentes ejecutan las 5 queries
antes de que el primero guarde en caché. Con 20 ligas activas: potencialmente 500-1.500
queries en el mismo instante.

**Solución requerida:** TTL largo (10 min) + invalidación explícita al terminar partido:
```typescript
// Al terminar un partido — invalidar caché
await this.cacheManager.del(`ranking:league:${leagueId}`);
await this.cacheManager.del(`ranking:global:${tournamentId}`);
// TTL largo con invalidación proactiva
await this.cacheManager.set(cacheKey, result, 10 * 60 * 1000);
```

---

### A3 — JWT sin Rol del Usuario
**Severidad:** 🟠 Alta
**Archivo:** `apps/api/src/auth/auth.service.ts:70-72`

**Problema:**
```typescript
// ACTUAL — sin role
const payload = { email: user.email, sub: user.id };
```
Cada endpoint que verifica permisos hace una query extra a la BD para obtener el rol.

**Solución requerida:**
```typescript
// CORRECCIÓN — incluir role
const payload = { email: user.email, sub: user.id, role: user.role };
```
**Impacto en datos existentes:** Ninguno. Los tokens existentes expirarán naturalmente.
Los usuarios deberán hacer login nuevamente para obtener tokens con rol incluido.

---

### A4 — tournamentId con Fallback Silencioso
**Severidad:** 🟠 Alta
**Archivos:** `leagues.service.ts:141,193,1539` y 20+ lugares adicionales

**Problema:** `tournamentId || 'WC2026'` en 20+ lugares. Con Champions + Mundial activos,
requests sin tournamentId explícito operan silenciosamente sobre el Mundial.

**Solución requerida:**
- Hacer `tournamentId` obligatorio (`@IsNotEmpty()`) en todos los DTOs relevantes
- Eliminar todos los fallbacks `|| 'WC2026'`
- Crear constante en `src/common/constants/index.ts`

---

### A7 — console.log Masivo en Producción
**Severidad:** 🟠 Alta
**Afecta:** Prácticamente todos los archivos de servicios (30+ en leagues.service.ts solo)

**Problema:** Emails, IDs, teléfonos y códigos de verificación impresos en logs sin estructura.
El código de verificación de 6 dígitos se imprime DOS VECES en `auth.service.ts:183-184`.

**Solución requerida:**
```typescript
// ELIMINAR:
console.log(`Message: Your verification code is: ${verificationCode}`);

// REEMPLAZAR por:
private readonly logger = new Logger(AuthService.name);
this.logger.log('Verification code sent', { userId: user.id }); // sin el código
```

---

## 5. DECISIONES ARQUITECTÓNICAS (ADR)

### ADR-001 — Cookies httpOnly para JWT
- **Fecha:** Febrero 2026
- **Decisión:** Migrar JWT de localStorage a cookies httpOnly
- **Razón:** localStorage vulnerable a XSS con el Muro Social activo
- **Consecuencias:** Logout forzado único para usuarios existentes al deploy
- **Fallback:** Bearer token en Authorization header activo para mobile/Postman

### ADR-002 — Whitelist explícita de CORS
- **Fecha:** Febrero 2026
- **Decisión:** Lista explícita de dominios permitidos en lugar de `origin: true`
- **Razón:** `origin: true` con `credentials: true` permite cookies desde cualquier dominio
- **Dominios:** lapollavirtual.com, www.lapollavirtual.com, champions.lapollavirtual.com

### ADR-003 — Pessimistic Locking para el Joker
- **Fecha:** Febrero 2026 (pendiente de implementar)
- **Decisión:** `SELECT FOR UPDATE` en transacción para activación del joker
- **Razón:** Race condition bajo carga concurrente genera corrupción de datos irreversible
- **Alternativa descartada:** Optimistic locking (@Version) — no garantiza exclusión mutua

---

## 6. VARIABLES DE ENTORNO CRÍTICAS

| Variable | Servicio | Estado |
|----------|---------|--------|
| `NODE_ENV=production` | Railway API | ✅ Configurado |
| `JWT_SECRET` | Railway API | ✅ Configurado |
| `REDIS_URL` | Railway (MUNDIAL + PEOPLE) | ✅ Configurado |
| `FRONTEND_URL` | Railway API | ⚠️ Verificar — tiene fallback a producción hardcodeado |

**ALERTA:** `FRONTEND_URL` en `auth.service.ts:269` tiene fallback hardcodeado a
`https://lapollavirtual.com`. Si no está configurado en staging/testing, los emails
de reset apuntan a producción.

---

## 7. REGLAS DEL AGENTE DE SEGURIDAD

### ✅ Puedes ejecutar sin confirmación
- `npm audit` — auditoría de dependencias
- `git status`, `git diff`, `git log`
- `curl` para pruebas de endpoints
- Lectura de archivos y búsquedas con `grep`

### ⚠️ Requiere confirmación antes de ejecutar
- `npm install <paquete>` — instalación de dependencias
- Cambios en archivos `.env` o variables de entorno
- Cualquier migración de base de datos

### 🚫 Nunca ejecutar sin instrucción explícita
- Scripts de migración de base de datos
- Deploy a producción (`git push origin main`)
- Eliminación de archivos sin respaldo confirmado
- Modificación de lógica de negocio (puntos, predicciones, ligas)
- Cambios en estilos o componentes visuales

---

## 8. PROTOCOLO DE ACTUALIZACIÓN DE ESTE ARCHIVO

Después de completar cada tarea:
1. Mueve la tarea de "PENDIENTE" a "✅ DONE" en la tabla correspondiente
2. Agrega el commit hash en la columna de estado
3. Si se tomó una decisión arquitectónica importante, agrégala en la sección ADR
4. Si se descubrió una vulnerabilidad nueva, agrégala en el sprint correspondiente

---

*Generado por Arcas (Arquitecto de Soluciones) — Emamdual Solutions*
*Basado en auditoría técnica de Febrero 2026 — commit b3b636c*
