# Auditoría Técnica — Polla Mundialista Core

**Fecha**: Febrero 2026
**Rama auditada**: `main` (commit `b3b636c`)
**Alcance**: Backend NestJS (`apps/api`) + Frontend Next.js (`apps/web`)

---

## Tabla de contenidos

1. [Descripción de la arquitectura](#1-descripción-de-la-arquitectura)
2. [Seguridad](#2-seguridad)
3. [Confiabilidad y consistencia de datos](#3-confiabilidad-y-consistencia-de-datos)
4. [Rendimiento](#4-rendimiento)
5. [Diseño y arquitectura de código](#5-diseño-y-arquitectura-de-código)
6. [Calidad de código y mantenibilidad](#6-calidad-de-código-y-mantenibilidad)
7. [Frontend](#7-frontend)
8. [Base de datos y migraciones](#8-base-de-datos-y-migraciones)
9. [DevOps y configuración](#9-devops-y-configuración)
10. [Cobertura de tests](#10-cobertura-de-tests)
11. [Tabla de recomendaciones por prioridad](#11-tabla-de-recomendaciones-por-prioridad)
12. [Resumen ejecutivo](#12-resumen-ejecutivo)

---

## 1. Descripción de la arquitectura

### 1.1 Visión general

**Polla Mundialista** es una plataforma de predicciones deportivas multi-torneo (Mundial 2026 / Champions League 25-26) con soporte para ligas empresariales. El proyecto vive en un monorepo NX con dos aplicaciones:

```
polla-mundialista-core/
└── Polla/
    ├── apps/
    │   ├── api/        ← NestJS 11 + TypeORM + PostgreSQL (puerto 3001)
    │   └── web/        ← Next.js 16 + React 19 (puerto 3000)
    ├── scripts/        ← Seeders de datos (Mundial, Champions, brackets)
    └── docs/           ← Documentación técnica interna
```

### 1.2 Backend — NestJS

Sigue el patrón modular estándar de NestJS. Cada dominio tiene su propio módulo con `Controller → Service → Repository (TypeORM)`. El bootstrap está en `apps/api/src/main.ts` y el módulo raíz en `app.module.ts`.

#### Módulos principales

| Módulo | Archivo raíz | Responsabilidad |
|--------|-------------|-----------------|
| `AuthModule` | `auth/auth.module.ts` | JWT, Google OAuth2 (Passport), verificación de email, reset de contraseña |
| `LeaguesModule` | `leagues/leagues.module.ts` | Crear/unirse a ligas (VIP/CLASSIC/PUBLIC/COMPANY), rankings con Redis |
| `MatchesModule` | `matches/matches.module.ts` | Fixtures, sincronización vía cron con API-SPORTS, bloqueos manuales |
| `PredictionsModule` | `predictions/predictions.module.ts` | Guardar predicciones (upsert), sistema de joker, sincronización global→liga |
| `ScoringModule` | `scoring/scoring.module.ts` | Motor de puntos: 1+1+2+3+joker×2 |
| `BracketsModule` | `brackets/brackets.module.ts` | Predicciones de fases eliminatorias |
| `KnockoutPhasesModule` | `knockout-phases/` | Control de cuándo se desbloquean las fases para predecir |
| `BonusModule` | `bonus/bonus.module.ts` | Preguntas trivia por liga con puntos |
| `StandingsModule` | `standings/standings.module.ts` | Clasificaciones globales |
| `PaymentsModule` | `payments/payments.module.ts` | Pasarela Wompi, webhook, idempotencia |
| `NotificationsModule` | `notifications/` | Email (Nodemailer + Handlebars) + Telegram |
| `AiPredictionModule` | `ai-prediction/` | Predicciones automáticas vía Google Generative AI |
| `AdminModule` | `admin/` | Paneles de administración y herramientas de SUPER_ADMIN |

#### Infraestructura transversal

- **Autenticación**: JWT (HS256) + Google OAuth2 vía Passport. Guards: `JwtAuthGuard`, `RolesGuard`.
- **Caché**: Redis (`cache-manager-redis-yet` 5.1) con fallback a memoria. TTL global de 10s; ranking global usa 30s, ranking de liga usa 20s.
- **Rate limiting**: ThrottlerGuard global — 500 req / 60 s.
- **Seguridad HTTP**: Helmet en toda la API.
- **Validación**: `ValidationPipe` global con `whitelist: true` y `forbidNonWhitelisted: true`.
- **Base de datos**: TypeORM 0.3, PostgreSQL 15, `synchronize: false`, pool de 50 conexiones.
- **Eventos**: `@nestjs/event-emitter` disponible pero subutilizado.

#### Diagrama de capas

```
                    ┌─────────────────────────────┐
                    │      Next.js (Browser)       │
                    │  Zustand · SWR · Tailwind     │
                    └──────────────┬──────────────┘
                                   │ REST / JSON
                    ┌──────────────▼──────────────┐
                    │        NestJS API            │
                    │  Guards → Controllers        │
                    │        ↓                     │
                    │      Services                │
                    │        ↓                     │
                    │   TypeORM Repositories       │
                    └──────┬──────────────┬────────┘
                           │              │
               ┌───────────▼──┐    ┌──────▼───────┐
               │  PostgreSQL   │    │    Redis      │
               │  (datos)      │    │   (rankings)  │
               └───────────────┘    └──────────────┘
```

### 1.3 Frontend — Next.js

Usa el **App Router** de Next.js 16 con componentes de servidor y cliente. El flujo de datos es:

```
Páginas (app/) → Servicios (src/services/) → lib/api.ts (axios) → API REST
                                                  ↕
                                          Zustand Store (auth, UI)
                                          SWR (datos async con revalidación)
```

**Gestión de estado**: Zustand para estado global (usuario autenticado, torneo seleccionado). SWR para fetching de datos con caché en cliente.

**Autenticación en cliente**: Token JWT almacenado en `localStorage`. Interceptor de axios lo inyecta automáticamente en cada request. Ante un 401, limpia el token y redirige a `/login`.

**Contexto de torneo**: El interceptor de axios resuelve el `tournamentId` activo en orden: parámetro explícito > query string > `localStorage` > hostname. Esto se aplica automáticamente a todos los requests como header `X-Tournament-Id` y query param.

---

## 2. Seguridad

### 2.1 CORS completamente abierto
**Severidad**: 🔴 Crítica
**Archivo**: `apps/api/src/main.ts:29-42`

```typescript
// ACTUAL — permite cualquier dominio
app.enableCors({
  origin: true, // Refleja el origen de la petición (Permite cualquier dominio)
  credentials: true,
  ...
});
```

`origin: true` hace que NestJS/Express refleje el header `Origin` de cada request como un `Access-Control-Allow-Origin` permitido. Esto equivale a `origin: '*'` pero con soporte para `credentials: true`, lo cual es más peligroso porque permite cookies e headers de autorización desde cualquier dominio.

**Impacto**: Cualquier sitio web puede hacer requests autenticados a la API en nombre de un usuario logueado.

**Corrección**:
```typescript
app.enableCors({
  origin: [
    'https://lapollavirtual.com',
    'https://champions.lapollavirtual.com',
    ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:3000'] : []),
  ],
  credentials: true,
});
```

---

### 2.2 Token JWT almacenado en localStorage
**Severidad**: 🔴 Crítica
**Archivo**: `apps/web/src/lib/api.ts:16`

```typescript
const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
```

`localStorage` es accesible desde cualquier script JavaScript en la página. Un ataque XSS (inyección de script por contenido de usuario, dependencia comprometida, etc.) puede leer y exfiltrar el token.

**Corrección**: Migrar a cookies `httpOnly` con `Secure` y `SameSite=Strict`. El servidor envía la cookie en login; el navegador la adjunta automáticamente y JavaScript no puede leerla.

---

### 2.3 JWT sin rol del usuario
**Severidad**: 🟠 Alta
**Archivo**: `apps/api/src/auth/auth.service.ts:70-72`

```typescript
const payload = { email: user.email, sub: user.id }; // ← sin role
return {
  access_token: this.jwtService.sign(payload),
  ...
};
```

El payload del token no incluye el rol. Cada endpoint que verifica permisos debe hacer una query a la base de datos para obtener el rol del usuario. Esto implica una query extra por request en rutas protegidas, y hace imposible el caching de autorización.

**Corrección**: Agregar `role: user.role` al payload. El `RolesGuard` podría leer el rol directamente del token decodificado en `request.user`.

---

### 2.4 Usuarios de Google bypasean verificación de email
**Severidad**: 🟠 Alta
**Archivo**: `apps/api/src/auth/auth.service.ts:63-68`

```typescript
async login(user: User) {
  if (!user.isVerified && user.password) {
    // Solo requerir verificación si tiene password (no Google)
    throw new UnauthorizedException('Email not verified...');
  }
  ...
}
```

La condición `!user.isVerified && user.password` hace que los usuarios de Google nunca necesiten verificación. Esto está intencionado, pero crea un estado ambiguo: un usuario puede registrarse con contraseña (queda `isVerified: false`), y luego iniciar sesión con Google para saltarse la verificación y quedar con `isVerified: true` (línea 343 en `validateGoogleUser`).

```typescript
// validateGoogleUser — línea 340-344
const updatedUser = await this.usersService.update(existingUser, {
  googleId: profile.email,
  avatarUrl: profile.picture,
  isVerified: true, // ← sobrescribe el false del registro por contraseña
});
```

**Impacto**: Un atacante con acceso a un email puede registrar la cuenta con contraseña, y luego usar Google OAuth con ese email para quedar verificado sin controlar el email.

---

### 2.5 Webhook de pagos: procesamiento async sin garantía de idempotencia
**Severidad**: 🟠 Alta
**Archivo**: `apps/api/src/payments/payments.service.ts:147-169`

La validación de firma existe y funciona correctamente (líneas 153-155). Sin embargo, el procesamiento del pago se delega a `setImmediate`:

```typescript
setImmediate(() => {
  this.processPayment(webhookData).catch((error) => {
    this.logger.error(`Error processing payment: ${error.message}`, error.stack);
  });
});
return { received: true };
```

**Problemas**:
1. Si el servidor se reinicia entre el `200 OK` y la ejecución del `setImmediate`, el pago se pierde.
2. Si Wompi reenvía el webhook (política estándar ante timeout), puede haber dos ejecuciones concurrentes del mismo pago. La protección de idempotencia en `processPayment` (líneas 95-103) funciona para el estado `APPROVED` pero depende de una ventana de tiempo sin race condition.

**Corrección**: Usar una cola de trabajos (BullMQ) para el procesamiento de webhooks con garantías de exactly-once delivery.

---

### 2.6 Verificación de código sin expiración
**Severidad**: 🟡 Media
**Archivo**: `apps/api/src/auth/auth.service.ts:214`

```typescript
if (user.verificationCode !== verifyEmailDto.code) {
  throw new BadRequestException('Invalid verification code');
}
```

El código de verificación de 6 dígitos numérico no tiene timestamp de expiración. Un atacante puede hacer fuerza bruta con 1.000.000 combinaciones sin límite de tiempo. El throttler global es de 500 req/min, insuficiente para proteger este endpoint específico.

**Corrección**: Guardar `verificationCodeExpiresAt` y validarlo. Usar `@Throttle({ limit: 5, ttl: 60000 })` en el endpoint de verificación.

---

### 2.7 Código de verificación impreso en logs de producción
**Severidad**: 🟡 Media
**Archivo**: `apps/api/src/auth/auth.service.ts:183-184`

```typescript
console.log(`   Message: Your verification code is: ${verificationCode}`);
console.log(`   Message: Your verification code is: ${verificationCode}`); // duplicado
```

El código secreto de verificación se imprime dos veces en los logs. Cualquier sistema de logging centralizado (Railway logs, etc.) registra datos sensibles en texto plano.

---

## 3. Confiabilidad y consistencia de datos

### 3.1 Race condition en la lógica del Joker (upsertPrediction)
**Severidad**: 🔴 Crítica
**Archivo**: `apps/api/src/predictions/predictions.service.ts:73-128`

El flujo de activación del joker realiza múltiples operaciones de base de datos sin transacción:

```typescript
// Paso 1: Buscar jokers activos (query 1)
const previousJokers = await this.predictionsRepository
  .createQueryBuilder('p')
  ...
  .getMany();

// Paso 2: Desactivar cada joker anterior (queries 2..N)
for (const joker of previousJokers) {
  if (joker.match.id !== matchId) {
    await this.predictionsRepository.save({ ...joker, isJoker: false });
  }
}

// Paso 3: Guardar la nueva predicción con joker (query N+1)
const savedPrediction = await this.predictionsRepository.save(prediction);
```

Si dos requests del mismo usuario llegan simultáneamente (doble click, reconexión, petición duplicada), ambos pueden pasar el paso 1 antes de que alguno ejecute el paso 2. El resultado es **dos jokers activos para el mismo usuario en la misma fase**.

Además, la sincronización al contexto global (líneas 161-195) agrega más queries fuera de la misma transacción, ampliando la ventana de inconsistencia.

**Corrección**:
```typescript
// Envolver toda la lógica en una transacción
const queryRunner = this.predictionsRepository.manager.connection.createQueryRunner();
await queryRunner.connect();
await queryRunner.startTransaction();
try {
  // SELECT ... FOR UPDATE para bloquear la fila
  const previousJokers = await queryRunner.manager
    .createQueryBuilder(Prediction, 'p')
    ...
    .setLock('pessimistic_write')
    .getMany();

  // ... resto de la lógica
  await queryRunner.commitTransaction();
} catch (err) {
  await queryRunner.rollbackTransaction();
  throw err;
} finally {
  await queryRunner.release();
}
```

---

### 3.2 Cálculo de puntos en loop sin transacción (N saves individuales)
**Severidad**: 🟠 Alta
**Archivo**: `apps/api/src/scoring/scoring.service.ts:65-85`

```typescript
async calculatePointsForMatch(matchId: string): Promise<void> {
  const predictions = await this.predictionsRepository.find({
    where: { match: { id: matchId } },
    relations: ['user'],
  });

  for (const prediction of predictions) {
    const points = this.calculatePoints(match, prediction);
    prediction.points = points;
    await this.predictionsRepository.save(prediction); // ← save por cada predicción
  }
}
```

Con 500 participantes en un partido, esto ejecuta 500 queries individuales de UPDATE. Si el proceso falla a mitad, algunas predicciones tienen puntos calculados y otras no. No hay manera de saber en qué estado quedó el sistema.

**Corrección**: Usar un bulk update en una sola transacción:
```typescript
await this.predictionsRepository.manager.transaction(async (em) => {
  await em.save(predictions.map(p => ({ ...p, points: this.calculatePoints(match, p) })));
});
```

---

### 3.3 Sincronización de partidos sin protección ante solapamiento de crons
**Severidad**: 🟠 Alta
**Archivo**: `apps/api/src/matches/match-sync.service.ts:24-84`

```typescript
@Cron('*/5 * * * *')
async syncLiveMatches() {
  // 2 segundos por partido × N partidos = puede exceder 5 minutos
  for (const match of activeMatches) {
    await new Promise(resolve => setTimeout(resolve, 2000)); // throttle
  }
}
```

Con 50 partidos activos el ciclo tarda ~100 segundos. Con 150 partidos, supera los 5 minutos y el siguiente cron se dispara antes de que termine el anterior. No existe ningún mecanismo de lock para evitar ejecuciones concurrentes del mismo cron.

**Consecuencias**:
- Múltiples llamadas simultáneas a API-SPORTS para el mismo partido.
- Escrituras concurrentes en la misma fila de `Match`.
- Posible disparo múltiple de `calculatePointsForMatch` para el mismo partido.

**Corrección**: Usar una variable de estado (`isRunning: boolean`) o un lock distribuido en Redis para garantizar ejecución única.

---

### 3.4 `tournamentId` con fallback silencioso a `'WC2026'`
**Severidad**: 🟠 Alta
**Archivos**: `apps/api/src/leagues/leagues.service.ts:141,193`, `apps/api/src/leagues/leagues.service.ts:1539`, múltiples servicios

```typescript
// leagues.service.ts:141
const targetTournamentId = tournamentId || 'WC2026';

// leagues.service.ts:193
tournamentId: tournamentId || 'WC2026',

// leagues.service.ts:1539
const tournamentId = league.tournamentId || 'WC2026';
```

El patrón `|| 'WC2026'` aparece en más de 20 lugares. Cuando el sistema tiene activos dos torneos simultáneamente (UCL + WC2026), cualquier request sin `tournamentId` explícito opera silenciosamente sobre el Mundial. Esto no genera error, solo datos incorrectos.

**Corrección**: Hacer `tournamentId` obligatorio (`@IsNotEmpty()`) en los DTOs de creación. Eliminar todos los fallbacks.

---

### 3.5 `createLeague` sin transacción entre operaciones relacionadas
**Severidad**: 🟡 Media
**Archivo**: `apps/api/src/leagues/leagues.service.ts:172-243`

La creación de una liga realiza en secuencia (sin transacción):
1. Verificar límite de ligas gratuitas (línea 146)
2. Guardar la liga (línea 196)
3. Enviar notificación Telegram (línea 203)
4. Actualizar teléfono del usuario (línea 219)
5. Crear transacción de $0 (línea 227)
6. Agregar al creador como participante (línea 238-243)

Si el paso 6 falla (por ejemplo, violación de unique constraint), la liga ya existe en la base de datos pero sin participante administrador. La liga queda en estado inconsistente y el usuario puede volver a intentar crear una, excediendo el límite gratuito.

---

### 3.6 Estados de partidos incompletos en el sync
**Severidad**: 🟡 Media
**Archivo**: `apps/api/src/matches/match-sync.service.ts:118-139`

```typescript
if (['FT', 'AET', 'PEN'].includes(statusShort)) {
  // → FINISHED
} else if (['1H', '2H', 'HT', 'ET', 'P', 'BT', 'LIVE', 'INT'].includes(statusShort)) {
  // → LIVE
} else {
  // Solo guarda el partido (sin cambiar status)
}
```

Los estados `PST` (postponed), `CANC` (cancelled), `ABD` (abandoned), `AWD` (awarded), `WO` (walkover) caen en el `else` y el partido permanece como `NOT_STARTED` indefinidamente. El cron seguirá intentando sincronizar estos partidos en cada ciclo sin nunca marcarlos apropiadamente, desperdiciando cuota de API.

---

## 4. Rendimiento

### 4.1 N+1 implícito en cálculo de puntos por partido
**Severidad**: 🟠 Alta
**Archivo**: `apps/api/src/scoring/scoring.service.ts:71-83`

```typescript
const predictions = await this.predictionsRepository.find({
  where: { match: { id: matchId } },
  relations: ['user'], // ← carga el user de cada prediction
});

for (const prediction of predictions) {
  prediction.points = points;
  await this.predictionsRepository.save(prediction); // ← 1 UPDATE por predicción
}
```

Para 500 predicciones: 1 SELECT + 500 UPDATEs = 501 queries. Con `save()` de TypeORM que hace un SELECT antes de cada UPDATE para verificar la entidad, puede llegar a 1001 queries por partido terminado.

---

### 4.2 Cron de sincronización consume cuota de API en O(n) partidos
**Severidad**: 🟠 Alta
**Archivo**: `apps/api/src/matches/match-sync.service.ts:30-34`

```typescript
const activeMatches = await this.matchesRepository.find({
  where: {
    status: Not('FINISHED'),
    externalId: Not(IsNull())
  }
});
```

Todos los partidos que no están `FINISHED` se sincronizan individualmente, aunque estén a 3 meses de distancia. Durante la fase de grupos del Mundial habrá ~48 partidos en este estado, generando 48 requests por ciclo de 5 minutos = ~14.000 requests al día. La API-SPORTS tiene límites diarios.

**Corrección**: Agregar filtro de ventana temporal: `date >= NOW() - INTERVAL '3 hours' AND date <= NOW() + INTERVAL '30 minutes'`.

---

### 4.3 Caché con TTL demasiado corto para datos estables
**Severidad**: 🟡 Media
**Archivo**: `apps/api/src/leagues/leagues.service.ts:427-513`

```typescript
await this.cacheManager.set(cacheKey, finalResults, 30 * 1000); // 30 segundos (global)
await this.cacheManager.set(cacheKey, result, 20 * 1000);       // 20 segundos (liga)
```

Los rankings solo cambian cuando termina un partido. Con TTL de 20-30 segundos, durante un partido en vivo (cuando no cambian los puntos porque el partido aún no terminó), se recalcula el ranking completo 3 veces por minuto innecesariamente.

**Corrección**: TTL largo (5-10 minutos) con invalidación explícita cuando `calculatePointsForMatch` termina.

---

### 4.4 `getLeagueRanking` hace 5 queries independientes
**Severidad**: 🟡 Media
**Archivo**: `apps/api/src/leagues/leagues.service.ts:786-982`

El método ejecuta en secuencia:
1. Fetch participantes activos
2. Query de goles reales (tiebreaker)
3. Query de predicciones con puntos
4. Query de bracket points
5. Query de bonus points

Estas 5 queries son independientes entre sí y podrían ejecutarse en paralelo con `Promise.all()`. En una liga de 100 participantes, esto reduce la latencia aproximadamente a la de la query más lenta en vez de la suma de todas.

---

### 4.5 `getAllLeagues` sin paginación
**Severidad**: 🟡 Media
**Archivo**: `apps/api/src/leagues/leagues.service.ts:516-555`

```typescript
async getAllLeagues(tournamentId?: string) {
  const leagues = await this.leaguesRepository.find({
    where: tournamentId ? { tournamentId } : {},
    relations: ['creator', 'participants'], // ← carga TODOS los participantes de TODAS las ligas
    order: { name: 'ASC' },
  });
```

Este endpoint carga todas las ligas con todos sus participantes. Con 1000 ligas de 100 participantes cada una, se cargan 100.000 entidades de `LeagueParticipant` en memoria. Solo es usado por el panel de SUPER_ADMIN pero no tiene paginación ni límite.

---

## 5. Diseño y arquitectura de código

### 5.1 `LeaguesService` viola el principio de responsabilidad única
**Severidad**: 🟠 Alta
**Archivo**: `apps/api/src/leagues/leagues.service.ts:39-53`

```typescript
constructor(
  private leaguesRepository,
  private leagueParticipantsRepository,
  private userRepository,
  private predictionRepository,
  private leagueCommentsRepository,
  private transactionsService,
  private pdfService,           // ← generación de PDF
  private telegramService,      // ← notificaciones
  @Inject(CACHE_MANAGER) private cacheManager,
) {}
```

El servicio inyecta 9 dependencias y mezcla responsabilidades: gestión de ligas, rankings, comentarios sociales, exportación PDF, notificaciones. El método `createLeague` tiene ~200 líneas y hace 6 cosas distintas.

**Impacto**: Es prácticamente imposible escribir tests unitarios para este servicio. Cualquier cambio en cualquier dependencia puede romper funcionalidades no relacionadas.

**Corrección**: Separar en servicios más pequeños (`LeagueAdminService`, `LeagueRankingService`, `LeagueSocialService`) y usar `EventEmitter` para efectos secundarios como notificaciones:

```typescript
// En lugar de llamar directamente
this.telegramService.notifyNewLeague(...).catch(...);

// Emitir evento y manejar en un listener dedicado
this.eventEmitter.emit('league.created', new LeagueCreatedEvent(savedLeague, creator));
```

---

### 5.2 `removeAllPredictions` con normalización defensiva exagerada
**Severidad**: 🟡 Media
**Archivo**: `apps/api/src/predictions/predictions.service.ts:284-376`

```typescript
let lId = Array.isArray(leagueId) ? leagueId[0] : leagueId;
if (typeof lId === 'string' && lId.includes(',')) lId = lId.split(',')[0];
if (!lId || lId === 'null' || lId === 'undefined' || lId === 'global' || lId === '') {
  lId = null;
}
```

Este código normaliza manualmente strings como `'null'`, `'undefined'`, `'global'`, arrays, strings con comas. Esto indica que el contrato de la API no está bien definido — el cliente envía datos en múltiples formatos y el servidor los interpreta. La solución correcta es un DTO estricto que rechace entradas malformadas.

---

### 5.3 Respuesta inconsistente del API
**Severidad**: 🟡 Media
**Afecta a**: Múltiples controllers

Las respuestas de la API tienen formatos heterogéneos:
- `POST /api/auth/login` → `{ access_token, user }`
- `GET /api/leagues` → array directo
- `GET /api/leagues/:id/ranking` → array directo
- `DELETE /api/leagues/:id` → `{ success: true, message: '...' }`

No existe una estructura de respuesta estándar. El frontend debe manejar cada endpoint de forma diferente.

**Corrección**: Adoptar un envelope estándar: `{ data, meta?, error? }` con un interceptor global de NestJS.

---

### 5.4 `@ts-ignore` como supresión de errores de tipo
**Severidad**: 🟡 Media
**Archivo**: `apps/api/src/leagues/leagues.service.ts:1480`

```typescript
// @ts-ignore - Property 'department' comes from our modified getLeagueRanking returning extended object
const dept = r.department || 'General';
```

`@ts-ignore` suprime el error de TypeScript en lugar de tipar correctamente el retorno de `getLeagueRanking`. Esto indica que el tipo de retorno del método no refleja la estructura real del objeto.

---

### 5.5 Lógica de joker duplicada entre `upsertPrediction` y `upsertBulkPredictions`
**Severidad**: 🟡 Media
**Archivos**: `predictions.service.ts:73-128` y `predictions.service.ts:507-511`

El flujo individual tiene lógica completa de desactivación de jokers anteriores. El flujo bulk tiene este comentario:

```typescript
// Desactivamos Jokers globales si es necesario (Bulk logic simplified: no complex joker check for performance)
// Si la data viene con isJoker=true, asumimos que el cliente sabe lo que hace.
```

La lógica de joker es diferente dependiendo de si la predicción es individual o masiva. Esto puede crear inconsistencias: un usuario puede terminar con múltiples jokers activos si usa la ruta bulk.

---

## 6. Calidad de código y mantenibilidad

### 6.1 `console.log` masivo en código de producción
**Severidad**: 🟠 Alta
**Afecta a**: Prácticamente todos los archivos de servicios

El archivo `leagues.service.ts` solo tiene más de 30 llamadas a `console.log/error`. Ejemplos:

```typescript
// leagues.service.ts:76-81
console.log('--- CREATE LEAGUE DEBUG ---');
console.log('Package Type:', packageType);
console.log('Calculated isPaid:', ...);
console.log('---------------------------');

// leagues.service.ts:313
console.log(`[DEBUG] League ${leagueId} not found`);

// auth.service.ts:96-100
console.log('🔄 [Register] Usuario de Google encontrado...');
console.log(`   Email: ${existingUser.email}`);
console.log(`   ID: ${existingUser.id}`);
```

**Consecuencias**:
- Datos de usuarios (email, ID, teléfono) impresos en logs sin estructura.
- Imposible filtrar, buscar o correlacionar logs por request.
- El `Logger` de NestJS está disponible y es el patrón correcto, pero solo se usa en `MatchSyncService` de forma consistente.

**Corrección**: Reemplazar todos los `console.*` por `private readonly logger = new Logger(NombreServicio.name)` y usar métodos contextuales (`logger.log`, `logger.warn`, `logger.error`).

---

### 6.2 Magic strings distribuidos en todo el codebase
**Severidad**: 🟠 Alta
**Afecta a**: Múltiples archivos

```typescript
// Estado de partidos — 3 variantes distintas para "terminado":
"m.status IN ('FINISHED', 'COMPLETED')"    // leagues.service.ts:803
"m.status IN ('FINISHED', 'COMPLETED')"    // leagues.service.ts:826
match.status !== 'FINISHED'                // scoring.service.ts:23
match.status !== 'COMPLETED'               // scoring.service.ts:23

// tournamentId:
tournamentId || 'WC2026'      // 20+ lugares

// packageType:
['familia', 'starter', 'FREE', 'launch_promo', 'ENTERPRISE_LAUNCH']  // 4 repeticiones idénticas

// Emails excluidos del ranking:
u.email NOT LIKE '%@demo.com'
u.email NOT IN ('demo@lapollavirtual.com', 'demo-social@lapollavirtual.com')
```

Estos strings están duplicados y cualquier cambio requiere buscar manualmente todas las ocurrencias.

**Corrección**: Crear un archivo `src/common/constants/index.ts` con:
```typescript
export const MATCH_FINISHED_STATUSES = ['FINISHED', 'COMPLETED'] as const;
export const FREE_PACKAGE_TYPES = ['familia', 'starter', 'FREE', 'launch_promo', 'ENTERPRISE_LAUNCH'] as const;
export const DEFAULT_TOURNAMENT_ID = 'WC2026';
export const DEMO_EMAIL_PATTERN = '%@demo.com';
```

---

### 6.3 Verificación de permisos con strings en lugar de enums
**Severidad**: 🟡 Media
**Archivo**: `apps/api/src/leagues/leagues.service.ts:605`

```typescript
async getParticipants(leagueId: string, userId: string, userRole?: string) {
  if (userRole === 'SUPER_ADMIN') { // ← string literal
    ...
  }
```

En múltiples lugares del código se comparan roles con strings literales (`'SUPER_ADMIN'`, `'ADMIN'`, `'PLAYER'`). El enum `UserRole` existe pero no se usa de forma consistente para estas comparaciones. Una errata (`'SUPERADMIN'` vs `'SUPER_ADMIN'`) silenciosamente deniega acceso.

---

### 6.4 Código duplicado en `getLeagueForUser` y `getLeagueDetails`
**Severidad**: 🟡 Media
**Archivo**: `apps/api/src/leagues/leagues.service.ts:306-382` y `651-754`

Ambos métodos devuelven prácticamente el mismo objeto con los datos de una liga. La diferencia es mínima. El objeto mapeado tiene ~30 campos y se construye dos veces con la misma estructura. Un cambio en la entidad `League` (agregar un campo) requiere actualizarlo en ambos lugares.

---

### 6.5 Código de debug dejado en producción
**Severidad**: 🟡 Media
**Archivo**: `apps/api/src/predictions/predictions.service.ts:303-359`

```typescript
console.log(`🚀 [CLEAR DEBUG] Normalizado -> User: ${userId} | League: ${lId} | Tournament: ${tId}`);
console.log(`📊 [CLEAR DEBUG] DB Total: ${allUserPredictions.length}. Filtros...`);
console.log(`📝 [CLEAR DEBUG] Sample DB Prediction: ID=${sample.id}...`);
console.log('🔍 [CLEAR DEBUG] ¿Por qué no se borró nada?');
```

El método `removeAllPredictions` tiene 8 `console.log` de debug que imprimen IDs de predicciones, usuarios y datos internos en producción. Aparentemente fue escrito para depurar un bug y nunca se limpió.

---

### 6.6 API_URL logeada en el navegador en producción
**Severidad**: 🟡 Media
**Archivo**: `apps/web/src/lib/api.ts:6`

```typescript
console.log('🌍 API URL CONFIGURADA:', API_URL);
```

Esta línea se ejecuta en cada load del módulo, imprimiendo la URL del API en la consola del navegador de cada usuario. Es información innecesaria expuesta públicamente.

---

## 7. Frontend

### 7.1 Contexto de torneo implícito y potencialmente incorrecto
**Severidad**: 🟠 Alta
**Archivo**: `apps/web/src/lib/api.ts:22-51`

```typescript
const defaultTournamentId = storedTournament ||
  (hostname.includes('champions') ? 'UCL2526' : 'WC2026');

const targetTournamentId = explicitTournamentId || defaultTournamentId;

config.headers['X-Tournament-Id'] = targetTournamentId;
config.params.tournamentId = targetTournamentId;
```

El interceptor inyecta el `tournamentId` en **todos** los requests automáticamente. Si un usuario navega a `?tournament=UCL2526`, ese valor se guarda en `localStorage` y persiste para todos los requests futuros, incluso cuando navega a otra página sin ese parámetro.

**Escenario problemático**: Usuario abre un link de Champions → visita el dashboard → el dashboard muestra datos de Champions en lugar de Mundial, sin indicación visual alguna.

---

### 7.2 Sin Error Boundaries en componentes de página
**Severidad**: 🟠 Alta
**Afecta a**: `apps/web/src/app/**`

Next.js App Router no agrega Error Boundaries automáticamente a los componentes de cliente. Un error de JavaScript en cualquier componente (por ejemplo, `Cannot read property 'x' of null` ante datos inesperados de la API) rompe toda la página sin mensaje de error controlado al usuario.

**Corrección**: Agregar `error.tsx` en los directorios relevantes de `app/`:
```typescript
// app/leagues/[id]/error.tsx
'use client';
export default function Error({ error, reset }) {
  return <div>Error: {error.message} <button onClick={reset}>Reintentar</button></div>;
}
```

---

### 7.3 Redirect ante 401 en interceptor puede causar loops
**Severidad**: 🟡 Media
**Archivo**: `apps/web/src/lib/api.ts:60-69`

```typescript
if (error.response && error.response.status === 401) {
  localStorage.removeItem('token');
  window.location.href = '/login';
}
```

Si la página `/login` hace algún request a la API (por ejemplo, verificar sesión activa) y ese request falla con 401, se produce un loop de redirección. Además, todos los requests en vuelo al momento del 401 también dispararían el redirect simultáneamente.

---

### 7.4 Sin cancelación de requests en navegación
**Severidad**: 🟡 Media
**Afecta a**: Todos los hooks de fetching

Cuando el usuario navega entre páginas, los requests de la página anterior siguen en vuelo. Si completan después de que el componente fue desmontado, intentan actualizar estado de un componente inexistente (error de React en dev, comportamiento silencioso en prod).

**Corrección**: Usar `AbortController` en los `useEffect` que hacen fetching, o configurar SWR para cancelar automáticamente.

---

### 7.5 Información sensible en `console.log` del browser
**Severidad**: 🟡 Media
**Archivo**: `apps/web/src/lib/api.ts:49`

```typescript
console.log(`[API] Using explicit tournamentId: ${explicitTournamentId} (ignoring context: ${defaultTournamentId})`);
```

El interceptor imprime información de contexto en cada request donde el tournamentId difiere. Esto puede revelar la arquitectura interna del sistema a usuarios que abran las devtools.

---

## 8. Base de datos y migraciones

### 8.1 Campos redundantes en `LeagueParticipant`
**Severidad**: 🟡 Media
**Archivo**: `apps/api/src/database/entities/league-participant.entity.ts:39-68`

```typescript
@Column({ name: 'is_blocked', default: false })
isBlocked: boolean;  // ← redundante con status

@Column({ type: 'enum', enum: LeagueParticipantStatus, default: ACTIVE })
status: LeagueParticipantStatus;  // ACTIVE | PENDING | BLOCKED
```

Existen dos mecanismos para representar el mismo estado. El código usa ambos inconsistentemente:

```typescript
// En getWoodenSpoon (línea 1619):
.andWhere('lp.isBlocked = :isBlocked', { isBlocked: false })

// En getLeagueRanking (línea 793):
const activeParticipants = participants.filter((p) => !p.isBlocked);

// En upsertPrediction (línea 47):
if (participant && (participant.isBlocked || participant.status === LeagueParticipantStatus.PENDING))

// En fetchParticipants (línea 641):
status: p.isBlocked ? 'BLOCKED' : p.status,  // ← sobrescribe el enum con string
```

Esta incoherencia puede causar que un usuario con `status: BLOCKED` pero `isBlocked: false` pueda acceder a funciones bloqueadas.

**Corrección**: Eliminar `isBlocked`, usar solo `status`. Crear una migración para sincronizar los datos.

---

### 8.2 `leagueId` en predicciones sin foreign key constraint
**Severidad**: 🟡 Media
**Archivo**: `apps/api/src/database/entities/prediction.entity.ts`

El campo `leagueId` en `Prediction` se almacena como string directamente, sin una relación TypeORM ni un constraint de foreign key en la base de datos. Si se elimina una liga, las predicciones de esa liga quedan huérfanas (aunque el método `deleteLeague` las borra explícitamente, no hay garantía de integridad referencial a nivel de BD).

---

### 8.3 Sin soft deletes
**Severidad**: 🟡 Media
**Afecta a**: `League`, `User`, `Prediction`

El sistema elimina registros permanentemente sin rastro de auditoría. Si un usuario elimina su liga accidentalmente, no hay forma de recuperarla. TypeORM soporta `@DeleteDateColumn()` para soft deletes nativamente.

---

### 8.4 `logging: true` en `data-source.ts` en producción
**Severidad**: 🟡 Media
**Archivo**: `apps/api/src/data-source.ts:25`

```typescript
logging: true,
```

Este archivo es el DataSource usado por las migraciones (CLI de TypeORM). Con `logging: true`, cada query ejecutada durante una migración se imprime. En producción, las migraciones pueden imprimir miles de líneas con datos sensibles de la base de datos.

---

## 9. DevOps y configuración

### 9.1 Contraseña hardcodeada en `docker-compose.yml`
**Severidad**: 🟡 Media
**Archivo**: `docker-compose.yml`

```yaml
POSTGRES_PASSWORD: password123
```

Aunque es solo para desarrollo local, desarrolladores nuevos pueden olvidar cambiar este valor y desplegarlo accidentalmente.

**Corrección**: Usar variables de entorno con fallback: `${DB_PASSWORD:-password123}`.

---

### 9.2 Pool de conexiones de 50 sin justificación documentada
**Severidad**: 🟡 Media
**Archivo**: `apps/api/src/app.module.ts:117`

```typescript
extra: {
  max: 50, // Aumentado para soportar alta concurrencia
  connectionTimeoutMillis: 5000,
},
```

PostgreSQL en Railway (plan básico) tiene un límite de conexiones concurrentes. Un pool de 50 conexiones desde una sola instancia puede agotar el límite del plan, especialmente si hay múltiples replicas o se ejecutan migraciones en paralelo.

---

### 9.3 Sin endpoint de health check
**Severidad**: 🟡 Media

No existe un endpoint `/api/health` o `/api/status`. Railway y otros servicios de infraestructura usan health checks para determinar si el servicio está disponible antes de enrutar tráfico. Sin él, Railway puede enrutar tráfico a una instancia que está inicializando o en estado degradado.

**Corrección**:
```typescript
@Controller('health')
export class HealthController {
  @Get()
  check() { return { status: 'ok', timestamp: new Date().toISOString() }; }
}
```

---

### 9.4 `FRONTEND_URL` con fallback a URL de producción hardcodeada
**Severidad**: 🟡 Media
**Archivo**: `apps/api/src/auth/auth.service.ts:269-271`

```typescript
const frontendUrl = (
  process.env.FRONTEND_URL || 'https://lapollavirtual.com'
).replace(/\/$/, '');
```

Si `FRONTEND_URL` no está configurado en un entorno de staging o testing, los emails de reset de contraseña apuntarán a producción.

---

## 10. Cobertura de tests

### Estado actual

Se identificaron 3 archivos de test en el backend y 0 en el frontend:

| Archivo | Módulo | Tipo |
|---------|--------|------|
| `app.controller.spec.ts` | App | Unit |
| `scoring/scoring.service.spec.ts` | Scoring | Unit |
| `leagues/global-ranking.spec.ts` | Leagues | Unit |

**Cobertura estimada: < 2% del código de producción.**

### Áreas críticas sin tests

| Módulo | Riesgo sin tests |
|--------|-----------------|
| `PredictionsService` | Lógica de joker compleja con múltiples paths |
| `LeaguesService.createLeague` | Validación de límites, creación de usuario, permisos |
| `LeaguesService.getLeagueRanking` | Cálculo de puntos con joker, tiebreaker, fallback global |
| `PaymentsService` | Validación de firma, idempotencia |
| `AuthService` | Flujos de Google OAuth, verificación de email |
| `ScoringService.calculatePoints` | Motor de puntos (único con tests, pero limitado) |
| Frontend | 0 tests para ningún componente |

---

## 11. Tabla de recomendaciones por prioridad

### 🔴 Crítico — Resolver antes del lanzamiento

| # | Problema | Archivo(s) | Acción |
|---|----------|-----------|--------|
| 1 | CORS completamente abierto | `main.ts:29` | Whitelist explícita de dominios |
| 2 | JWT en localStorage | `web/src/lib/api.ts:16` | Migrar a cookies `httpOnly` |
| 3 | Race condition en joker | `predictions.service.ts:73` | Transacción + `SELECT FOR UPDATE` |
| 4 | `tournamentId` con fallback silencioso | 20+ archivos | Hacerlo obligatorio en DTOs |
| 5 | Solapamiento de crons en match sync | `match-sync.service.ts:24` | Lock de ejecución (Redis/variable) |

### 🟠 Alto — Resolver en el primer sprint post-lanzamiento

| # | Problema | Archivo(s) | Acción |
|---|----------|-----------|--------|
| 6 | JWT sin rol | `auth.service.ts:70` | Incluir `role` en payload |
| 7 | Cálculo de puntos sin transacción + N saves | `scoring.service.ts:65` | Bulk update en transacción |
| 8 | `createLeague` sin transacción completa | `leagues.service.ts:56` | Envolver en `manager.transaction()` |
| 9 | `LeaguesService` viola SRP | `leagues.service.ts` | Separar servicios + eventos |
| 10 | `console.log` masivo en producción | Todo el backend | Migrar a `Logger` de NestJS |
| 11 | Sin Error Boundaries en frontend | `apps/web/src/app/` | Agregar `error.tsx` por ruta |
| 12 | Estados de partidos incompletos | `match-sync.service.ts:118` | Manejar PST, CANC, ABD |

### 🟡 Medio — Deuda técnica planificada

| # | Problema | Acción |
|---|----------|--------|
| 13 | `isBlocked` + `status` redundantes en `LeagueParticipant` | Eliminar `isBlocked`, migración |
| 14 | Magic strings duplicados | Crear `constants/index.ts` |
| 15 | Sin endpoint de health check | Agregar `GET /api/health` |
| 16 | TTL de caché no refleja ciclo de invalidación real | TTL largo + invalidación explícita |
| 17 | `getAllLeagues` sin paginación | Agregar `limit` y `offset` |
| 18 | Verificación de código sin expiración | Guardar `expiresAt`, throttle específico |
| 19 | Pool de 50 conexiones sin evaluación | Validar límites del plan de Railway |
| 20 | Sin soft deletes en entidades críticas | Agregar `@DeleteDateColumn()` |
| 21 | `logging: true` en data-source.ts | Cambiar a `logging: ['error']` |
| 22 | Sin cancelación de requests en frontend | Usar AbortController o configurar SWR |

### ⚪ Bajo — Mejoras de largo plazo

| # | Problema | Acción |
|---|----------|--------|
| 23 | ~0% cobertura de tests | Tests unitarios: scoring, predictions, leagues |
| 24 | Sin Swagger/OpenAPI | Decoradores `@ApiOperation`, `@ApiResponse` |
| 25 | Respuesta de API inconsistente | Envelope estándar `{ data, meta, error }` |
| 26 | Código de debug en `removeAllPredictions` | Eliminar `console.log` de debug |
| 27 | `getLeagueRanking` con 5 queries secuenciales | Paralelizar con `Promise.all()` |

---

## 12. Resumen ejecutivo

### Fortalezas

- **Arquitectura modular correcta**: La separación en módulos NestJS está bien pensada y facilita la localización de código.
- **Scoring engine correcto**: La lógica de puntos (1+1+2+3+joker) está bien implementada y tiene al menos un test.
- **Integración de pagos con validación de firma**: `PaymentsService.handleWebhook` valida la firma de Wompi antes de procesar.
- **Bulk predictions con transacción**: `upsertBulkPredictions` usa correctamente `QueryRunner` con transacción.
- **Índice compuesto en leaderboard**: `@Index(['league', 'totalPoints'])` en `LeagueParticipant` es el índice correcto para ordenar rankings.

### Riesgos principales

El sistema tiene **tres categorías de riesgo** que deben atenderse antes de un lanzamiento con carga real:

**1. Seguridad inmediata**
El CORS abierto y el token en `localStorage` son vectores de ataque activos. Cualquier vulnerabilidad XSS en el frontend (dependencia comprometida, contenido de usuario sin sanitizar) puede resultar en robo de sesiones masivo.

**2. Corrupción de datos bajo carga concurrente**
La race condition en la lógica del joker y la ausencia de transacciones en `createLeague` y `calculatePointsForMatch` son bombas de tiempo. En un evento de alto tráfico (inicio del Mundial con miles de usuarios simultáneos), es probable que aparezcan estados inconsistentes: usuarios con dos jokers activos, ligas sin administrador, predicciones con puntos calculados parcialmente.

**3. Deuda técnica que frena el desarrollo**
La dispersión de `console.log`, la ausencia de tests, los magic strings duplicados y el monolito `LeaguesService` hacen que cada cambio sea de alto riesgo. Agregar una funcionalidad simple (como un nuevo tipo de puntaje o un campo en la liga) requiere modificar código en docenas de lugares.

### Estimación de esfuerzo

| Categoría | Ítems | Esfuerzo estimado |
|-----------|-------|------------------|
| Crítico (5 ítems) | Seguridad y corrupción de datos | 2-3 semanas |
| Alto (7 ítems) | Confiabilidad y arquitectura | 3-4 semanas |
| Medio (9 ítems) | Deuda técnica planificada | 4-6 semanas |
| Bajo (5 ítems) | Mejoras de largo plazo | Continuo |

Se recomienda abordar los ítems **críticos** antes de cualquier campaña de marketing o evento que atraiga carga significativa, dado que los problemas de corrupción de datos son difíciles o imposibles de revertir una vez que ocurren en producción.
