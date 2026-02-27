# Progreso de Auditoría Técnica — Polla Mundialista Core

**Auditoría original**: Febrero 2026 (commit `b3b636c`)
**Revisión de progreso**: Febrero 2026 (branch `main`, commit `27b3de5`)
**Revisado por**: Claude Code

---

## Leyenda

| Símbolo | Significado |
|---------|-------------|
| ✅ | Resuelto completamente |
| ⚠️ | Resuelto parcialmente |
| ❌ | Pendiente |

---

## Resumen ejecutivo

| Categoría | Total | Resueltos | Parciales | Pendientes |
|-----------|-------|-----------|-----------|------------|
| 🔴 Crítico | 5 | 5 | 0 | 0 |
| 🟠 Alto | 7 | 4 | 2 | 1 |
| 🟡 Medio | 10 | 3 | 1 | 6 |
| ⚪ Bajo | 5 | 1 | 0 | 4 |
| **Total** | **27** | **13** | **3** | **11** |

**Porcentaje resuelto: 48% (13/27 completados, 3 parciales)**

---

## 🔴 Crítico — Todos resueltos antes del lanzamiento ✅

### ✅ C1 — CORS completamente abierto
**Archivo**: `apps/api/src/main.ts:34-62`

Resuelto. Se reemplazó `origin: true` por una función callback con whitelist explícita:
```typescript
origin: (origin, callback) => {
  const allowedOrigins = [
    'https://lapollavirtual.com',
    'https://www.lapollavirtual.com',
    'https://champions.lapollavirtual.com',
    ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:3000', ...] : []),
  ];
  ...
}
```

---

### ✅ C2 — JWT almacenado en localStorage
**Archivo**: `apps/web/src/lib/api.ts`

Resuelto. El token ya no se lee ni escribe en `localStorage`. El cliente usa `withCredentials: true` para enviar automáticamente la cookie `httpOnly` `auth_token` en cada request. Se agregó `cookieParser()` en `main.ts`.

---

### ✅ C3 — Race condition en la lógica del Joker
**Archivo**: `apps/api/src/predictions/predictions.service.ts:91-93`

Resuelto. La lógica del joker ahora corre dentro de un `QueryRunner` con `SELECT FOR UPDATE`:
```typescript
const queryRunner = this.dataSource.createQueryRunner();
await queryRunner.connect();
await queryRunner.startTransaction();
// ...
.setLock('pessimistic_write')
```

---

### ✅ C4 — `tournamentId` con fallback silencioso a `'WC2026'`
**Archivos**: `apps/api/src/leagues/leagues.service.ts`, `common/constants/tournament.constants.ts`

Resuelto en el core. Se creó `common/constants/tournament.constants.ts` con `DEFAULT_TOURNAMENT_ID = 'WC2026'` y `leagues.service.ts` lo importa explícitamente. El patrón `|| 'WC2026'` fue eliminado de la lógica de negocio principal. Los 8 usos restantes están confinados a scripts de utilidad y demo (`brackets.service.ts`, `bonus.service.ts`, `demo.controller.ts`, scripts de diagnóstico).

---

### ✅ C5 — Solapamiento de crons en match sync
**Archivo**: `apps/api/src/matches/match-sync.service.ts:14,27-30`

Resuelto. Se agregó `private isSyncing = false` como guard de ejecución única:
```typescript
if (this.isSyncing) {
  this.logger.warn('⏭️ Sync already in progress, skipping this run.');
  return;
}
this.isSyncing = true;
```
Además se agregó el filtro de ventana temporal (−3h a +1h) que resuelve también el problema C4.2 de cuota de API.

---

## 🟠 Alto

### ✅ A1 — JWT sin rol del usuario
**Archivo**: `apps/api/src/auth/auth.service.ts:73`

Resuelto. El payload ahora incluye el rol:
```typescript
const payload = { email: user.email, sub: user.id, role: user.role };
```

---

### ✅ A2 — Cálculo de puntos sin transacción (N saves individuales)
**Archivo**: `apps/api/src/scoring/scoring.service.ts:81-103`

Resuelto. Se reemplazaron los saves individuales por un batch dentro de una transacción con invalidación proactiva de caché:
```typescript
await this.predictionsRepository.manager.transaction(async (manager) => {
  await manager.save(Prediction, predictions);
});
// Invalidación proactiva de caché
await this.cacheManager.del(`ranking:league:${leagueId}`);
await this.cacheManager.del(`ranking:global:${match.tournamentId}`);
```

---

### ✅ A3 — `createLeague` sin transacción completa
**Archivo**: `apps/api/src/leagues/leagues.service.ts:135-237`

Resuelto. Las 6 operaciones (verificar límite, guardar liga, actualizar teléfono, crear transacción $0, agregar participante) ahora corren dentro de un `QueryRunner` con commit/rollback atómico. La notificación Telegram queda fuera de la transacción intencionalmente como efecto secundario no crítico.

---

### ✅ A4 — Estados de partidos incompletos en el sync
**Archivo**: `apps/api/src/matches/match-sync.service.ts:150-177`

Resuelto. Se agregó manejo explícito para estados cancelados/postergados:
```typescript
const CANCELLED_STATUSES = ['PST', 'CANC', 'ABD'];
// ...
} else if (CANCELLED_STATUSES.includes(statusShort)) {
  match.status = statusShort;
}
```

---

### ⚠️ A5 — `console.log` masivo en producción
**Afecta a**: Múltiples servicios core

Parcialmente resuelto. `auth.service.ts` migró a `this.logger` de NestJS. Sin embargo:
- `leagues.service.ts`: **37 `console.log` restantes**
- `predictions.service.ts`: **7 `console.log` restantes** (incluyendo los de debug de `removeAllPredictions`)
- `matches.service.ts`: **27 `console.log` restantes**
- `brackets.service.ts`: **11 `console.log` restantes**

El `Logger` de NestJS está disponible en `LeaguesService` (`private readonly logger = new Logger(LeaguesService.name)`) pero solo se usa en algunos métodos.

---

### ⚠️ A6 — Sin Error Boundaries en frontend
**Afecta a**: `apps/web/src/app/**`

Parcialmente resuelto. Existe `apps/web/src/app/error.tsx` global que captura errores a nivel de la aplicación completa. Pendiente: agregar `error.tsx` específicos por rutas críticas (`/leagues/[id]`, `/dashboard`, `/predictions`).

---

### ❌ A7 — `LeaguesService` viola el principio de responsabilidad única
**Archivo**: `apps/api/src/leagues/leagues.service.ts`

Pendiente. El servicio sigue inyectando 10 dependencias (se agregó `DataSource` respecto a la auditoría original). No se realizó la separación en `LeagueAdminService`, `LeagueRankingService`, `LeagueSocialService` ni la migración a `EventEmitter` para efectos secundarios.

---

## 🟡 Medio

### ❌ M1 — Campos redundantes `isBlocked` + `status` en `LeagueParticipant`
**Archivo**: `apps/api/src/database/entities/league-participant.entity.ts:39-40`

Pendiente. El campo `isBlocked` sigue existiendo en la entidad junto al enum `status`. No se realizó la migración para unificarlos.

---

### ⚠️ M2 — Magic strings duplicados
**Archivos**: Múltiples

Parcialmente resuelto. Se creó `common/constants/tournament.constants.ts` con `DEFAULT_TOURNAMENT_ID`. Pendiente: centralizar estados de partido (`FINISHED_STATUSES`), tipos de paquete y emails de demo en un `constants/index.ts` completo.

---

### ✅ M3 — Sin endpoint de health check
**Archivo**: `apps/api/src/health/health.controller.ts`

Resuelto. Se creó un controller dedicado que verifica el estado de la base de datos:
```typescript
@Get()
async check() {
  return { status: dbOk ? 'ok' : 'degraded', timestamp, database };
}
```

---

### ❌ M4 — Verificación de código sin expiración
**Archivo**: `apps/api/src/auth/auth.service.ts:194`

Pendiente. La validación de código de verificación de 6 dígitos sigue sin comprobar timestamp de expiración. No se agregó `verificationCodeExpiresAt` ni throttle específico en el endpoint.

---

### ✅ M5 — Cron consume cuota de API en O(n) partidos
**Archivo**: `apps/api/src/matches/match-sync.service.ts:40-57`

Resuelto (también cubre C5). Se aplica filtro de ventana temporal en memoria:
```typescript
const filteredMatches = activeMatches.filter((m) => {
  const matchDate = new Date(m.date);
  return matchDate >= threeHoursAgo && matchDate <= oneHourFromNow;
});
```

---

### ❌ M6 — Pool de conexiones de 50 sin evaluación
**Archivo**: `apps/api/src/app.module.ts:125`

Pendiente. El pool sigue configurado en `max: 50` sin documentación del plan de Railway ni validación de límites.

---

### ❌ M7 — Sin soft deletes en entidades críticas
**Afecta a**: `League`, `User`, `Prediction`

Pendiente. No se agregó `@DeleteDateColumn()` a ninguna entidad.

---

### ❌ M8 — `logging: true` en `data-source.ts`
**Archivo**: `apps/api/src/data-source.ts:25`

Pendiente. Sigue con `logging: true`, lo que imprime todas las queries de migración en producción.

---

### ❌ M9 — Sin cancelación de requests en navegación (frontend)
**Afecta a**: Hooks de fetching en `apps/web/src`

Pendiente. No se implementó `AbortController` ni configuración de SWR para cancelar requests al desmontar componentes.

---

## ⚪ Bajo

### ❌ B1 — Cobertura de tests ~0%
**Afecta a**: Backend y frontend

Pendiente. No se identificaron nuevos archivos de test más allá de los 3 originales.

---

### ✅ B2 — Sin documentación Swagger/OpenAPI
**Archivo**: `apps/api/src/main.ts:65-74`

Resuelto. Se configuró Swagger con `DocumentBuilder` disponible en `/api/docs`:
```typescript
const config = new DocumentBuilder()
  .setTitle('Polla Mundialista API')
  .addBearerAuth()
  .build();
SwaggerModule.setup('api/docs', app, document);
```

---

### ❌ B3 — Respuesta de API inconsistente
**Afecta a**: Múltiples controllers

Pendiente. No se implementó un envelope estándar `{ data, meta, error }` ni un interceptor global de respuestas.

---

### ❌ B4 — Código de debug en `removeAllPredictions`
**Archivo**: `apps/api/src/predictions/predictions.service.ts:341-369`

Pendiente. Los 7 `console.log` de debug con datos de usuarios e IDs internos siguen presentes en producción.

---

### ❌ B5 — `getLeagueRanking` con 5 queries secuenciales
**Archivo**: `apps/api/src/leagues/leagues.service.ts:786-982`

Pendiente. Las 5 queries independientes no fueron paralelizadas con `Promise.all()`.

---

## Hallazgos adicionales no estaban en la auditoría original

### ⚠️ `console.log` en `apps/web/src/lib/api.ts:7`
```typescript
console.log('🌍 API URL CONFIGURADA:', API_URL);
```
Este log de la URL del API sigue activo en el cliente (browser) en producción.

### ⚠️ `console.log` de 401 en interceptor de respuesta
```typescript
// api.ts:78
console.log('Sesión expirada (401). Redirigiendo a /login.');
```
Se mejoró el manejo del redirect (ya no hace redirect en rutas públicas, resolviendo el riesgo de loop), pero el `console.log` sigue expuesto en el navegador.

---

## Deuda técnica pendiente por prioridad

### Resolver antes de campaña de marketing / carga alta

| # | Item | Archivo | Esfuerzo |
|---|------|---------|----------|
| 1 | Eliminar debug logs en `removeAllPredictions` | `predictions.service.ts:341` | 30 min |
| 2 | `logging: false` en `data-source.ts` | `data-source.ts:25` | 5 min |
| 3 | Eliminar `console.log` de API URL en frontend | `api.ts:7` | 5 min |
| 4 | Expiración de código de verificación | `auth.service.ts:194` | 2h |

### Sprint de deuda técnica planificado

| # | Item | Esfuerzo estimado |
|---|------|------------------|
| 5 | Migrar 37 `console.log` de `leagues.service.ts` a Logger | 3h |
| 6 | Migrar 27 `console.log` de `matches.service.ts` a Logger | 2h |
| 7 | Eliminar `isBlocked`, usar solo `status` + migración | 4h |
| 8 | Completar `constants/index.ts` (estados, paquetes, emails demo) | 2h |
| 9 | Error Boundaries por ruta (`/leagues/[id]`, `/dashboard`) | 2h |
| 10 | Pool de conexiones: validar límites del plan Railway | 1h |

### Largo plazo

| # | Item | Esfuerzo estimado |
|---|------|------------------|
| 11 | Separar `LeaguesService` en servicios menores | 2-3 semanas |
| 12 | Tests unitarios: predictions, leagues, auth | 4-6 semanas |
| 13 | Envelope de respuesta estándar `{ data, meta, error }` | 1 semana |
| 14 | `Promise.all()` en `getLeagueRanking` | 2h |
| 15 | Soft deletes en `League`, `User`, `Prediction` | 1 semana |
| 16 | AbortController en hooks de fetching | 1 semana |
