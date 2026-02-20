# Análisis de Escalabilidad — Polla Mundialista Core

**Fecha**: Febrero 2026
**Rama analizada**: `main` (commit `b3b636c`)
**Metodología**: Análisis estático del código fuente con modelado matemático de carga

---

## Tabla de contenidos

1. [Modelo de carga del sistema](#1-modelo-de-carga-del-sistema)
2. [Cuellos de botella cuantificados](#2-cuellos-de-botella-cuantificados)
3. [Capacidad por escenario](#3-capacidad-por-escenario)
4. [Proyección de volumen de datos](#4-proyección-de-volumen-de-datos)
5. [Límites de la infraestructura actual](#5-límites-de-la-infraestructura-actual)
6. [Mapa de escalabilidad](#6-mapa-de-escalabilidad)
7. [Hoja de ruta de escalado](#7-hoja-de-ruta-de-escalado)

---

## 1. Modelo de carga del sistema

### 1.1 Patrones de tráfico del Mundial 2026

El tráfico de una plataforma de predicciones no es uniforme. Hay tres picos bien definidos por día de partido:

```
Volumen de requests (normalizado)
│
100% ─────────────────────────────────── Pico predicción (T-5 min)
 80%
 60%                                  ┌──────┐
 40%                          ┌───┐   │      │   ┌────────────────
 20% ──────────┐              │   │   │      │   │
  5%           └──────────────┘   └───┘      └───┘
               │               │                │
             Mañana         T-30min          FT+0min
                           (predicciones)  (ranking rush)

  T = hora del partido
```

**Comportamiento típico de un usuario por día de partido:**

| Acción | Frecuencia | Endpoint |
|--------|-----------|----------|
| Consultar partidos del día | 2-3 veces | `GET /matches` |
| Guardar predicción | 1 vez por partido | `POST /predictions` |
| Ver ranking durante partido | 3-5 veces | `GET /leagues/:id/ranking` |
| Ver ranking al terminar partido | 2-3 veces (pico) | `GET /leagues/:id/ranking` |
| Ver ranking global | 1-2 veces | `GET /standings/global` |

**Requests por usuario activo en día de partido: ~15-20 requests/día**

### 1.2 Escenarios de torneo

El Mundial 2026 tiene fases bien diferenciadas en términos de carga:

| Fase | Partidos/día | Duración | Partidos simultáneos |
|------|-------------|----------|---------------------|
| Grupos (días 1-12) | 4 (primeros días hasta 8) | 12 días | Hasta 4 |
| Grupos (última jornada) | 16 simultáneos | 4 días | 16 (peor caso) |
| Octavos | 2 | 4 días | 2 |
| Cuartos | 2 | 2 días | 2 |
| Semis + Final | 1 | 3 días | 1 |

**El peor caso es la última jornada de grupos**: 16 partidos simultáneos a las 2pm → 16 eventos de fin de partido → 16 disparos de `calculatePointsForMatch` en paralelo.

---

## 2. Cuellos de botella cuantificados

### 2.1 Cuello de botella #1 — Cálculo de puntos al finalizar partido (CRÍTICO)

**Archivo**: `apps/api/src/scoring/scoring.service.ts:65-85`

```typescript
for (const prediction of predictions) {
  prediction.points = this.calculatePoints(match, prediction);
  await this.predictionsRepository.save(prediction); // ← 1 UPDATE por fila
}
```

**Modelo matemático:**

Cada `save()` en TypeORM con la configuración actual ejecuta implícitamente un `SELECT` + `UPDATE`. Para `N` usuarios con predicción en un partido:

```
Tiempo total = N × (tiempo_SELECT + tiempo_UPDATE + latencia_red_DB)
             = N × (5ms + 10ms + 2ms)
             = N × 17ms
```

| Usuarios registrados | Predicciones por partido (80% participación) | Tiempo de cálculo | Conexiones DB en uso |
|---------------------|---------------------------------------------|-------------------|---------------------|
| 500 | 400 | **6.8 s** | 1 (secuencial) |
| 1.000 | 800 | **13.6 s** | 1 (secuencial) |
| 5.000 | 4.000 | **68 s** | 1 (secuencial) |
| 10.000 | 8.000 | **136 s** | 1 (secuencial) |
| 50.000 | 40.000 | **680 s (11 min)** | 1 (secuencial) |

Durante esos segundos/minutos, la única conexión del scoring está ocupada. El resto del pool (49 conexiones) sigue disponible para otros requests. Sin embargo, **el cron de sincronización puede disparar este cálculo para múltiples partidos simultáneamente**, multiplicando el impacto:

```
Peor caso: Última jornada de grupos
= 16 partidos simultáneos × 4.000 predicciones × 17ms
= 16 cálculos en paralelo ← cada uno ocupa 1 conexión del pool
= 16 conexiones × 68 segundos = 68 segundos de saturación parcial del pool
```

Con 50.000 usuarios y 16 partidos simultáneos: **el pool de 50 conexiones queda saturado completamente** durante ~11 minutos. Todos los requests de usuarios durante ese tiempo hacen timeout.

---

### 2.2 Cuello de botella #2 — Ranking de liga con 5 queries secuenciales

**Archivo**: `apps/api/src/leagues/leagues.service.ts:786-982`

El método `getLeagueRanking` ejecuta siempre estas 5 queries en secuencia:

```
Q1: SELECT participants (todos los de la liga)          ~10-30ms
Q2: SELECT SUM goals reales (tiebreaker)                ~5-10ms
Q3: SELECT predictions con puntos (JOIN complex)        ~20-100ms
Q4: SELECT bracket points (GROUP BY)                    ~10-30ms
Q5: SELECT bonus points (JOIN + GROUP BY)               ~10-20ms
─────────────────────────────────────────────────────────────────
Total sin caché:                                       ~55-190ms por call
```

**TTL de caché: 20 segundos** para ranking de liga, **30 segundos** para global.

Con 1.000 usuarios activos durante un partido en vivo, todos refrescando el ranking:

```
Requests de ranking en 20 segundos (ventana de TTL):
= 1.000 usuarios × 1 refresh / 30s × 20s = ~667 requests en 20s

Distribución:
- Request #1: Cache MISS → 5 queries (~190ms) → guarda caché
- Requests #2-667: Cache HIT → 0 queries

→ Solo 1 hit a BD por ventana de 20s (en condiciones ideales)
```

**El problema es el "thundering herd"**: cuando el caché expira, múltiples requests concurrentes llegan al mismo tiempo antes de que el primero guarde el resultado. Si 50 requests llegan en el mismo milisegundo de expiración, los 50 ejecutan las 5 queries = 250 queries simultáneas para un solo endpoint.

```
Thundering herd en ranking con 1.000 usuarios activos:
= Asumiendo Poisson con λ = 667/20 = 33 req/s
= Probabilidad de k requests en la ventana de ~1ms de expiración ≈ múltiple

→ Estimado: 5-15 requests concurrentes en el momento de expiración del caché
→ = 25-75 queries simultáneas al expirar el caché de ranking
→ Con 20 ligas activas = potencialmente 500-1.500 queries en el mismo instante
```

---

### 2.3 Cuello de botella #3 — Cron de sincronización bloquea la cuota de API

**Archivo**: `apps/api/src/matches/match-sync.service.ts:24-84`

```typescript
@Cron('*/5 * * * *')  // Cada 5 minutos
async syncLiveMatches() {
  const activeMatches = await this.matchesRepository.find({
    where: { status: Not('FINISHED'), externalId: Not(IsNull()) }
    // ← sin filtro de ventana temporal
  });

  for (const match of activeMatches) {
    await axios.request({ url: 'api-sports.io/fixtures', params: { id: match.externalId } });
    await new Promise(resolve => setTimeout(resolve, 2000)); // throttle 2s
  }
}
```

**Análisis del costo de cuota por fase:**

| Fase | Partidos en estado != FINISHED | Tiempo del cron | Requests a API-SPORTS/día |
|------|-------------------------------|-----------------|--------------------------|
| Fase de grupos (inicio) | ~60 | 120s | 60×288 = **17.280** |
| Fase de grupos (fin) | ~30 (ya terminados) | 60s | 30×288 = **8.640** |
| Octavos | ~50 | 100s | 50×288 = **14.400** |
| Final (solo 1 activo) | ~10 (prev. no eliminados) | 20s | 10×288 = **2.880** |

La API-SPORTS en plan básico tiene un límite de ~100-1.000 requests/día dependiendo del plan. **Con la configuración actual, el sistema excede este límite desde el primer día de la fase de grupos**, aunque la mayoría de partidos aún no han comenzado.

**Solapamiento del cron**: Si el cron dura 120s y se dispara cada 300s, hay margen. Pero si hay 90 partidos activos (inicio del torneo + UCL simultáneo): 90 × 2s = 180s, y con latencia de red podría superar los 300s, causando solapamiento.

---

### 2.4 Cuello de botella #4 — Pool de conexiones: 50 pero con un proceso Node.js

**Archivo**: `apps/api/src/app.module.ts:117`

```typescript
extra: { max: 50 }
```

Node.js es single-threaded. NestJS procesa requests de forma asíncrona pero las operaciones de CPU (como la iteración del `calculatePointsForMatch`) no liberan el event loop. Sin embargo, las queries a PostgreSQL sí son asíncronas vía `pg` driver.

**Modelo de concurrencia efectiva:**

```
Capacidad teórica del pool:
= 50 conexiones × (1000ms / latencia_promedio_query)
= 50 × (1000 / 50ms) = 1.000 queries/segundo (teórico)

Capacidad real con NestJS (single process):
= Limitado por event loop en operaciones mixtas
= ~200-400 queries/segundo en condiciones reales
```

**El throttler es global a nivel de módulo pero POR IP, no total**:

```typescript
ThrottlerModule.forRoot([{ ttl: 60000, limit: 500 }])
```

Esto significa que 500 usuarios pueden enviar 500 req/min cada uno = **250.000 req/min globales** sin activar el throttler. El throttler solo protege contra un único usuario agresivo, no contra carga agregada.

---

### 2.5 Cuello de botella #5 — `getAllLeagues` sin paginación

**Archivo**: `apps/api/src/leagues/leagues.service.ts:516-554`

```typescript
const leagues = await this.leaguesRepository.find({
  relations: ['creator', 'participants'], // carga TODOS los participantes
});
```

**Crecimiento de memoria por número de ligas:**

| Ligas | Participantes promedio | Filas `LeagueParticipant` cargadas | Memoria estimada |
|-------|----------------------|-----------------------------------|-----------------|
| 100 | 15 | 1.500 | ~5 MB |
| 500 | 20 | 10.000 | ~30 MB |
| 1.000 | 25 | 25.000 | ~75 MB |
| 5.000 | 30 | 150.000 | ~450 MB |
| 10.000 | 30 | 300.000 | **~900 MB** → OOM en Railway |

Railway en plan básico tiene **512 MB a 1 GB de RAM**. Con 5.000+ ligas, una sola llamada a `getAllLeagues` puede causar un Out-of-Memory y reiniciar el proceso.

---

### 2.6 Cuello de botella #6 — Predicciones: write storm pre-partido

**Archivo**: `apps/api/src/predictions/predictions.service.ts:130-198`

Cada `upsertPrediction` ejecuta para un usuario con liga específica:

```
1. SELECT LeagueParticipant (verificar bloqueo)    ~10ms
2. SELECT Match (verificar fecha y lock)            ~5ms
3. SELECT previous jokers (queryBuilder)            ~20ms
4. Para cada joker anterior: SELECT + UPDATE        ~15ms cada uno
5. SELECT predicción existente                      ~10ms
6. INSERT/UPDATE predicción                         ~15ms
7. SELECT predicción global (sync)                  ~10ms
8. INSERT/UPDATE predicción global                  ~15ms
──────────────────────────────────────────────────────
Total por predicción: ~100-150ms (sin jokers activos)
                      ~130-200ms (con 1 joker a desactivar)
```

**30 minutos antes del partido — pico de predicciones:**

| Usuarios totales | Usuarios que predicen en últimos 5 min | Requests/seg | Queries/seg | Conexiones necesarias |
|-----------------|----------------------------------------|-------------|------------|----------------------|
| 500 | 250 | 0.83/s | ~8/s | ~1-2 |
| 2.000 | 1.000 | 3.3/s | ~33/s | ~5 |
| 10.000 | 5.000 | 16.7/s | ~167/s | ~25 |
| 25.000 | 12.500 | 41.7/s | ~417/s | **>50 → pool saturado** |

Con **~25.000 usuarios**, el pool de 50 conexiones empieza a saturarse en el pico de predicciones. Con la race condition del joker no resuelta, la situación es peor porque pueden quedar queries colgadas esperando.

---

## 3. Capacidad por escenario

### 3.1 Estado actual (sin ningún cambio)

#### Escenario A: Partido normal — Fase de grupos

```
Condiciones: 1 partido, usuarios prediciend durante el día, ranking durante el partido

                 ┌────────────────────────────────────────────────────────┐
                 │           CAPACIDAD CON ARQUITECTURA ACTUAL             │
                 │                                                         │
 Usuarios        │   Comportamiento esperado                               │
 ───────────     │   ──────────────────────────────────────────────────── │
 < 1.000         │   ✅ Funciona correctamente                             │
   1.000-3.000   │   ⚠️  Lentitud al terminar partido (13-51s de scoring) │
   3.000-8.000   │   ❌ Timeouts en ranking post-partido                   │
   8.000-15.000  │   ❌ Pool saturado, errores en masa                     │
   > 15.000      │   💀 Crash del servicio o reinicio por OOM              │
                 └────────────────────────────────────────────────────────┘
```

**Límite práctico actual**: ~2.000-3.000 usuarios registrados activos

#### Escenario B: Última jornada de grupos (16 partidos simultáneos)

```
Evento: 16 partidos terminan en el mismo margen de ~15 minutos
Efecto: 16 disparos concurrentes de calculatePointsForMatch

Con 2.000 usuarios (caso conservador):
= 16 partidos × 1.600 predicciones × 17ms
= 16 cálculos en paralelo, cada uno ~27 segundos
= 16 conexiones del pool ocupadas por 27 segundos cada una
= Pool de 50 con 16 ocupadas → 34 disponibles para usuarios

Resultado: Sistema degradado pero funcional (si no hay más de 1.000 usuarios activos simultáneos)

Con 5.000 usuarios:
= 16 partidos × 4.000 predicciones × 17ms
= 16 cálculos × 68 segundos
= Pool completamente saturado por 68 segundos
= TODO el tráfico de usuarios hace timeout

→ Límite para este evento: ~1.500 usuarios registrados
```

#### Escenario C: Pico absoluto — Final del Mundial

```
Condiciones: 1 partido, máxima audiencia, usuarios revisando predicciones constantemente

Supuesto: 50% de usuarios activos simultáneamente (máximo histórico en apps de fútbol)
Con 10.000 registrados → 5.000 activos simultáneos

Requests estimados (10 min antes del partido):
= 5.000 usuarios × 5 requests/10min = 2.500 req/min = 41 req/seg

Queries por segundo:
= 41 req/s × promedio 8 queries/request = 328 queries/seg

Pool de 50 conexiones @ 50ms promedio:
= 50 / 0.050 = 1.000 queries/seg teórico
= En la práctica: ~400 queries/seg (event loop overhead)

→ 328 < 400: Sistema sobrevive en el pico pre-partido

Al terminar el partido (scoring de 5.000 usuarios):
= 4.000 predicciones × 17ms = 68 segundos de scoring
= Durante esos 68 segundos: 1 conexión ocupada en scoring
= Resto de usuarios siguen siendo atendidos
= PERO: si hay thundering herd en ranking → 75 queries simultáneas adicionales

→ La Final del Mundial sería el punto de quiebre entre 3.000-5.000 usuarios
```

### 3.2 Tabla resumen de capacidad

| Contexto | Usuarios máximos antes de degradación | Usuarios máximos antes de falla total |
|----------|--------------------------------------|--------------------------------------|
| Día sin partidos | **~15.000** (getAllLeagues como límite) | ~25.000 |
| Partido normal (1 a la vez) | **~3.000** | ~8.000 |
| Última jornada grupos (16 simultáneos) | **~1.500** | ~3.000 |
| Final del Mundial (máximo engagement) | **~3.000-5.000** | ~10.000 |

---

## 4. Proyección de volumen de datos

### 4.1 Crecimiento de tablas críticas

#### Tabla `predictions` (la más grande)

Cada usuario genera predicciones en dos contextos (global + liga específica):

```
Predicciones por usuario por torneo:
= partidos_torneo × (1 global + N_ligas)

Mundial 2026: 64 partidos
Si promedio de usuario está en 2 ligas:
= 64 × (1 + 2) = 192 predicciones/usuario
```

| Usuarios registrados | Predicciones total (1 liga promedio) | Predicciones (3 ligas promedio) | Tamaño estimado |
|---------------------|--------------------------------------|--------------------------------|-----------------|
| 1.000 | 128.000 | 256.000 | ~15-30 MB |
| 5.000 | 640.000 | 1.280.000 | ~75-150 MB |
| 10.000 | 1.280.000 | 2.560.000 | ~150-300 MB |
| 50.000 | 6.400.000 | 12.800.000 | ~750 MB - 1.5 GB |
| 100.000 | 12.800.000 | 25.600.000 | **~1.5-3 GB** |

#### Tabla `league_participants`

```
Participantes = usuarios × ligas_promedio
Con 5.000 usuarios en 2 ligas promedio = 10.000 filas → insignificante
Con 50.000 usuarios en 2 ligas = 100.000 filas → ~10MB
```

#### Impacto en la query de ranking

La query de ranking hace `JOIN` de `predictions` por `userId IN (:...userIds)` y `tournamentId`:

```sql
-- getLeagueRanking — consulta de predicciones
SELECT p.userId, p.matchId, p.points, p.leagueId, p.isJoker
FROM predictions p
INNER JOIN matches m ON m.id = p.matchId
WHERE p.userId IN (:...userIds)       -- 100 usuarios de la liga
  AND (p.leagueId = $1 OR p.leagueId IS NULL)
  AND m.tournamentId = $2
  AND m.status IN ('FINISHED', 'COMPLETED')
```

**Sin índice en `tournamentId` de `matches`**: la query hace full scan de matches en el `JOIN`. La entidad `Match` no tiene `@Index` en `tournamentId`, `status`, ni `date`. Con 128 partidos (WC2026 + UCL) el full scan es trivial, pero demuestra que la query no está optimizada para escalar.

**Índices existentes en `predictions`**:
```typescript
@Index(['match'])                               // ✅ útil para scoring
@Index(['user', 'leagueId'])                    // ✅ útil para pantalla de predicciones
@Index(['user', 'match', 'leagueId'], { unique: true })  // ✅ constraint correcto
```

Falta un índice compuesto por `(tournamentId, leagueId, userId)` que sería el óptimo para las queries de ranking.

### 4.2 Velocidad de crecimiento durante el torneo

```
Mundial 2026: 64 partidos en 34 días (11 junio - 19 julio)
Promedio: ~2 partidos/día

Con 10.000 usuarios activos:
= 10.000 usuarios × 2 partidos/día × 2 contextos = 40.000 nuevas predicciones/día
= 40.000 × 34 días = 1.360.000 predicciones al final del torneo

Velocidad de inserción: 40.000 / 86.400 = ~0.46 predicciones/segundo promedio
→ Completamente manejable para PostgreSQL
```

---

## 5. Límites de la infraestructura actual

### 5.1 Stack de despliegue

```
Internet
  │
  ▼
Vercel (Next.js)
  │ REST HTTP
  ▼
Railway — NestJS
  │ pool máx 50 conexiones
  ▼
Railway — PostgreSQL
  │
Railway — Redis (rankings)
```

### 5.2 Restricciones por capa

#### Railway — NestJS (proceso único)

| Recurso | Configuración actual | Límite práctico |
|---------|---------------------|----------------|
| Instancias | 1 | 1 (sin clustering configurado) |
| CPU | 1 vCPU (plan básico) | ~400-800 req/seg en I/O bound |
| RAM | 512 MB - 1 GB | OOM a ~5.000 ligas (`getAllLeagues`) |
| Conexiones DB salientes | pool max 50 | 50 concurrentes |
| Proceso Node.js | Single-threaded | CPU-bound bloquea event loop |

#### Railway — PostgreSQL

| Recurso | Límite Railway Hobby | Límite Railway Pro |
|---------|---------------------|-------------------|
| RAM | 512 MB | 2-8 GB |
| Conexiones máximas | ~100 | ~500 |
| Storage | 1 GB | ilimitado |
| CPU | Compartida | Dedicada |

El pool de 50 conexiones desde NestJS + las queries del seeder CLI + posibles herramientas de administración pueden llegar a las 100 conexiones del plan Hobby.

#### Redis (caché de rankings)

| Recurso | Estado actual |
|---------|-------------|
| TTL ranking liga | 20 segundos |
| TTL ranking global | 30 segundos |
| Thundering herd protection | ❌ no implementado |
| Invalidación proactiva | ❌ no implementada |
| Datos en caché | Solo rankings (oportunidad para más) |

#### API-SPORTS (datos en vivo)

| Métrica | Situación actual |
|---------|-----------------|
| Requests/día (fase de grupos) | ~17.280 estimados |
| Límite plan básico | ~100-1.000/día |
| Estrategia de batching | ❌ no implementada (1 request por partido) |
| Protocolo ante rate limit | Solo log de warning |

### 5.3 Throttler como falsa protección

```typescript
ThrottlerModule.forRoot([{ ttl: 60000, limit: 500 }])
```

Este throttler funciona **por IP**. Protege contra un solo usuario agresivo, pero no limita la carga agregada. Con 2.000 usuarios enviando 10 requests en 60 segundos cada uno (comportamiento normal), el throttler no se activa para nadie, pero el sistema recibe 20.000 requests por minuto.

---

## 6. Mapa de escalabilidad

### 6.1 Umbral por cantidad de usuarios

```
USUARIOS REGISTRADOS
     │
     │  0 ──── 500      ✅ ZONA VERDE
     │                   Sistema sin estrés perceptible.
     │                   Todos los endpoints responden <200ms.
     │                   El cron de scoring tarda <10s.
     │
     │  500 ─── 2.000   ⚡ ZONA AMARILLA
     │                   Lentitud perceptible al terminar partidos.
     │                   Ranking tarda 1-2s sin caché.
     │                   El cron de scoring puede tardar 10-30s.
     │                   Sistema estable pero con UX degradada.
     │
     │  2.000 ── 5.000  🟠 ZONA NARANJA
     │                   Timeouts esporádicos en picos de partido.
     │                   Última jornada grupos: fallas en cascada.
     │                   El scoring de un partido puede tardar >1 min.
     │                   Pool de conexiones presionado.
     │
     │  5.000 ── 10.000 🔴 ZONA ROJA
     │                   Fallas frecuentes en eventos de alto tráfico.
     │                   OOM posible con muchas ligas activas.
     │                   El cron superpuesto causa datos inconsistentes.
     │                   Requiere corrección antes de escalar.
     │
     │  > 10.000        💀 ZONA CRÍTICA
     │                   La arquitectura actual no soporta este volumen.
     │                   Reinicio por OOM, pool saturado permanentemente.
     │                   Datos inconsistentes por race conditions.
```

### 6.2 Cuello de botella dominante por fase de crecimiento

```
  Usuarios   │  Cuello de botella dominante
─────────────┼─────────────────────────────────────────────────────
  0 - 500    │  Ninguno perceptible
  500 - 2k   │  Scoring al final de partido (N × 17ms secuencial)
  2k - 5k    │  Pool de 50 conexiones bajo carga simultánea
  5k - 10k   │  getAllLeagues sin paginación → OOM
              │  Thundering herd en caché de rankings
  10k - 50k  │  Single-instance NestJS (CPU bound)
              │  No horizontal scaling
  50k - 100k │  PostgreSQL sin read replicas
              │  Redis como single point of failure
  > 100k     │  Arquitectura requiere rediseño completo
```

---

## 7. Hoja de ruta de escalado

### Fase 1 — De ~500 a ~5.000 usuarios (2-3 semanas)

Estas correcciones eliminan los cuellos de botella actuales sin cambiar la infraestructura.

#### 7.1.1 Bulk update de scoring (impacto: x10 en velocidad de scoring)

**Archivo**: `scoring.service.ts`

Reemplazar el loop secuencial con un único bulk update:

```typescript
// Antes: N queries
for (const prediction of predictions) {
  await this.predictionsRepository.save(prediction); // 1 query × N
}

// Después: 1 query
const updates = predictions.map(p => ({
  id: p.id,
  points: this.calculatePoints(match, p)
}));
await this.predictionsRepository.save(updates); // 1 query total (o chunks)
```

**Resultado**: 4.000 predicciones → de 68s a ~500ms (x136 más rápido).

#### 7.1.2 Lock de ejecución única en el cron (impacto: eliminar duplicación y race condition)

```typescript
private isSyncing = false;

@Cron('*/5 * * * *')
async syncLiveMatches() {
  if (this.isSyncing) return; // lock simple
  this.isSyncing = true;
  try {
    // ... lógica
  } finally {
    this.isSyncing = false;
  }
}
```

#### 7.1.3 Filtro de ventana temporal en el cron (impacto: reducción del 95% en llamadas a API)

```typescript
const activeMatches = await this.matchesRepository.find({
  where: {
    status: Not('FINISHED'),
    externalId: Not(IsNull()),
    date: Between(
      new Date(Date.now() - 3 * 60 * 60 * 1000),  // -3 horas
      new Date(Date.now() + 30 * 60 * 1000)         // +30 minutos
    )
  }
});
```

**Resultado**: De ~17.280 a ~500-1.000 requests/día a API-SPORTS durante la fase de grupos.

#### 7.1.4 Paginación en `getAllLeagues` (impacto: elimina riesgo de OOM)

```typescript
async getAllLeagues(tournamentId?: string, page = 1, limit = 50) {
  const [leagues, total] = await this.leaguesRepository.findAndCount({
    take: limit,
    skip: (page - 1) * limit,
    ...
  });
  return { data: leagues, total, page, limit };
}
```

#### 7.1.5 Cache con invalidación proactiva (impacto: elimina thundering herd)

```typescript
// Invalidar caché cuando termina un partido
async calculatePointsForMatch(matchId: string) {
  // ... cálculo ...
  await this.cacheManager.del(`ranking:league:${leagueId}`);
  await this.cacheManager.del(`ranking:global:${tournamentId}`);
}

// TTL más largo con invalidación explícita
await this.cacheManager.set(cacheKey, result, 10 * 60 * 1000); // 10 minutos
```

#### 7.1.6 Índices faltantes en base de datos

```sql
-- Para las queries de ranking (matches)
CREATE INDEX idx_matches_tournament_status ON matches("tournamentId", status);
CREATE INDEX idx_matches_tournament_phase ON matches("tournamentId", phase);

-- Para las queries de predicciones en ranking
CREATE INDEX idx_predictions_tournament_league ON predictions("tournamentId", "league_id");

-- Para el cron (filtro de ventana temporal)
CREATE INDEX idx_matches_date_status ON matches(date, status);
```

**Resultado Fase 1**: Sistema capaz de manejar **5.000-8.000 usuarios** sin degradación en condiciones normales.

---

### Fase 2 — De ~5.000 a ~25.000 usuarios (1-2 meses)

#### 7.2.1 Cola de trabajos con BullMQ para scoring

Mover el cálculo de puntos a un worker asíncrono. Al terminar un partido, se encola un job en vez de calcular síncronamente:

```typescript
// Cuando el partido termina
await this.scoringQueue.add('calculate-match-points', { matchId });

// Worker separado (puede escalar independientemente)
@Processor('scoring')
class ScoringWorker {
  @Process('calculate-match-points')
  async handle(job: Job) {
    await this.scoringService.calculatePointsForMatch(job.data.matchId);
  }
}
```

**Beneficio**: El cron responde inmediatamente, el scoring ocurre en background sin bloquear el API. Múltiples workers pueden procesar partidos en paralelo.

#### 7.2.2 Query optimizada de ranking con una sola SQL

Reemplazar las 5 queries secuenciales con una sola query SQL con CTEs (similar a la ya existente en `getGlobalRanking`):

```sql
WITH
  pred_points AS (
    SELECT userId, SUM(points) as total, ...
    FROM predictions p JOIN matches m ON ...
    WHERE p.userId IN (...) AND m.tournamentId = $1
    GROUP BY userId
  ),
  bracket_points AS (...),
  bonus_points AS (...)
SELECT u.*, COALESCE(pp.total, 0) + COALESCE(bp.total, 0) + COALESCE(bonp.total, 0) as total
FROM users u
LEFT JOIN pred_points pp ON pp.userId = u.id
...
```

**Resultado**: Ranking de 200 participantes en una sola query (~30-80ms vs 190ms actual).

#### 7.2.3 Clustering de Node.js

```typescript
// main.ts — activar clustering
import cluster from 'cluster';
import os from 'os';

if (cluster.isPrimary) {
  const workers = os.cpus().length; // 2-4 en Railway Pro
  for (let i = 0; i < workers; i++) cluster.fork();
} else {
  bootstrap();
}
```

**Con 2-4 workers en Railway Pro**: capacidad de CPU multiplicada, el event loop de un worker no bloquea los demás.

#### 7.2.4 Reducir pool a un tamaño sostenible

Con clustering y múltiples workers, cada uno tiene su propio pool. Con 4 workers × 50 conexiones = 200 conexiones → excede el límite de PostgreSQL en plan básico.

**Corrección**: Reducir pool por proceso a 12-15 conexiones, o usar PgBouncer como pooler externo.

```typescript
extra: {
  max: 12, // 4 workers × 12 = 48 conexiones totales
}
```

**Resultado Fase 2**: Sistema capaz de manejar **20.000-30.000 usuarios**.

---

### Fase 3 — De ~25.000 a ~100.000+ usuarios (3-6 meses)

#### 7.3.1 Read Replica de PostgreSQL

Las queries de ranking y estadísticas son de solo lectura. Dirigirlas a una réplica elimina la presión en la instancia primaria:

```typescript
// Configurar read replica en TypeORM
TypeOrmModule.forRoot({
  replication: {
    master: { host: process.env.DB_MASTER_HOST, ... },
    slaves: [{ host: process.env.DB_REPLICA_HOST, ... }]
  }
})
```

#### 7.3.2 Materializar rankings en base de datos

En vez de calcular el ranking en tiempo real, mantener una tabla `league_rankings` que se actualiza al terminar cada partido. El endpoint de ranking hace `SELECT * FROM league_rankings WHERE leagueId = $1 ORDER BY rank` — una query trivial.

```sql
CREATE TABLE league_rankings (
  leagueId UUID,
  userId UUID,
  rank INT,
  totalPoints INT,
  updatedAt TIMESTAMP,
  PRIMARY KEY (leagueId, userId)
);
CREATE INDEX idx_rankings_league_rank ON league_rankings(leagueId, rank);
```

**Resultado**: Ranking en <5ms independientemente del número de participantes o predicciones.

#### 7.3.3 WebSockets para actualizaciones en vivo

Reemplazar el polling de ranking (cada 30s) con push via WebSockets. El servidor notifica a los clientes conectados cuando cambia el ranking. Reduce ~90% del tráfico de polling durante partidos en vivo.

#### 7.3.4 Separar el sync service en un microservicio independiente

El cron de sincronización con API-SPORTS no tiene por qué estar en el mismo proceso que el API. Un servicio dedicado (con su propio pool de conexiones) puede manejar el sync sin competir por recursos con las peticiones de usuarios.

**Resultado Fase 3**: Sistema capaz de manejar **100.000+ usuarios** con arquitectura distribuida.

---

## Resumen ejecutivo de escalabilidad

### Capacidad actual

| Métrica | Valor |
|---------|-------|
| **Usuarios cómodos** (sin degradación perceptible) | **~1.000** |
| **Usuarios máximos** (con degradación aceptable) | **~3.000** |
| **Punto de falla** (timeouts y errores en masa) | **~5.000-8.000** |
| **Cuello de botella #1** | Scoring secuencial (N × 17ms por partido) |
| **Cuello de botella #2** | Cron sin ventana temporal (agota cuota API) |
| **Cuello de botella #3** | `getAllLeagues` sin paginación (OOM) |
| **Tiempo de scoring con 5.000 usuarios** | ~68 segundos por partido |
| **Tiempo de scoring con 50.000 usuarios** | ~11 minutos por partido |

### Capacidad proyectada con mejoras

| Fase | Esfuerzo | Capacidad resultante | Cambio de infraestructura |
|------|----------|---------------------|--------------------------|
| **Actual** (sin cambios) | — | ~1.000-3.000 usuarios | Railway Hobby |
| **Fase 1** (2-3 semanas) | Bulk scoring, caché mejorado, paginación, índices | ~5.000-8.000 usuarios | Railway Hobby (igual) |
| **Fase 2** (1-2 meses) | BullMQ, ranking en 1 SQL, clustering | ~20.000-30.000 usuarios | Railway Pro ($20-50/mes) |
| **Fase 3** (3-6 meses) | Read replica, rankings materializados, WebSockets | ~100.000+ usuarios | Railway Pro + extras (~$100-300/mes) |

### Veredicto

La aplicación está bien dimensionada para un torneo de comunidad pequeña (**hasta ~1.000 usuarios**). Para el Mundial 2026 con expectativas de crecimiento orgánico:

- **Si se esperan hasta 3.000 usuarios**: el sistema aguanta, con momentos de lentitud en el pico de partidos simultáneos.
- **Si se esperan 3.000-10.000 usuarios**: la **Fase 1** es obligatoria antes del inicio del torneo. Son cambios de código, sin costo adicional de infraestructura.
- **Si se esperan más de 10.000 usuarios**: la **Fase 2** es necesaria. Requiere Railway Pro (~$20-50/mes adicionales) y 4-6 semanas de desarrollo.

El cambio de mayor impacto con menor esfuerzo es el **bulk update de scoring** (`scoring.service.ts:76-80`): 5 líneas de código que multiplican por 100 la velocidad del evento más crítico del sistema.
