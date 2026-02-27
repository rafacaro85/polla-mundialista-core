# Progreso de Escalabilidad — Polla Mundialista Core

**Referencia**: `escalabilidad.md` (análisis original, commit `b3b636c`)
**Revisión**: Febrero 2026 — rama `feat/claude-docs`

---

## Resumen ejecutivo

| Fase | Cambios | Estado |
|------|---------|--------|
| Fase 1 (código, sin infra adicional) | 6 puntos | 3 ✅ resueltos · 1 ⚠️ mitigado · 2 ❌ pendientes |
| Fase 2 (BullMQ + clustering) | 3 puntos | ❌ pendiente |
| Fase 3 (réplicas, rankings materializados) | 4 puntos | ❌ pendiente |

**Capacidad estimada actual**: ~3.000–5.000 usuarios (subió desde ~1.000–3.000).

---

## Cuellos de botella — Estado individual

### ✅ C#1 — Scoring secuencial → RESUELTO

**Archivo**: `apps/api/src/scoring/scoring.service.ts:84-103`

**Antes**: N `await save()` individuales — cada uno con un SELECT + UPDATE + latencia de red (~17ms/predicción). Con 4.000 predicciones → **68 segundos** bloqueando el pool.

**Ahora**:
- Los puntos se calculan en memoria primero (loop sin I/O).
- Un único `manager.save(Prediction, predictions)` dentro de una `transaction` persiste todos los resultados. La latencia de red se paga una sola vez al inicio/commit en lugar de por fila.
- Invalidación proactiva de caché de rankings tras el cálculo:

```typescript
// scoring.service.ts:98-102
const leagueIds = [...new Set(predictions.filter(p => p.leagueId).map(p => p.leagueId))];
for (const leagueId of leagueIds) {
  await this.cacheManager.del(`ranking:league:${leagueId}`);
}
await this.cacheManager.del(`ranking:global:${match.tournamentId}`);
```

**Ganancia estimada**: De ~68s a ~1–3s con 4.000 predicciones (~20–50x más rápido).

> **Límite**: No es un `UPDATE ... CASE WHEN` puro (una sola sentencia SQL). TypeORM ejecuta N UPDATEs dentro de la transacción. Para Fase 2, un bulk update con `createQueryBuilder` daría otro 2–5x de mejora adicional.

---

### ⚠️ C#2 — Thundering herd en caché de ranking → MITIGADO

**Archivo**: `apps/api/src/leagues/leagues.service.ts:940-1149`

**Antes**: TTL de 20 segundos. Al expirar, decenas de requests concurrentes ejecutaban las 5 queries simultáneamente (estimado: 500–1.500 queries al mismo instante con 20 ligas activas).

**Mejoras implementadas**:
- TTL aumentado de **20s → 10 minutos** (línea 1149).
- Invalidación proactiva tras el scoring en lugar de esperar que expire el TTL.

**Sin cambios**: Las 5 queries secuenciales del ranking no fueron consolidadas ni paralelizadas:

| Query | Latencia estimada |
|-------|------------------|
| SELECT participants | 10–30ms |
| SELECT SUM goals reales (tiebreaker) | 5–10ms |
| SELECT predictions con puntos | 20–100ms |
| SELECT bracket points | 10–30ms |
| SELECT bonus points | 10–20ms |
| **Total sin caché** | **55–190ms** |

**Estado**: Con 10 min de TTL e invalidación proactiva, el thundering herd es poco probable en uso normal. Pero sigue sin protección técnica (mutex/single-flight) en el momento exacto de expiración o invalidación simultánea.

**Pendiente para Fase 2**: Consolidar en una SQL con CTEs, o implementar un lock de reconstrucción.

---

### ✅ C#3 — Cron sin ventana temporal ni lock → RESUELTO

**Archivo**: `apps/api/src/matches/match-sync.service.ts:14,27-57`

**Antes**: El cron sincronizaba todos los partidos con `status != FINISHED` sin filtro temporal. Estimado: ~17.280 requests/día a API-SPORTS durante la fase de grupos (límite del plan básico: ~100–1.000/día). Sin lock, podía solaparse con sí mismo.

**Ahora**:
```typescript
// Lock de ejecución única
private isSyncing = false;
if (this.isSyncing) { this.logger.warn('⏭️ Sync already in progress'); return; }

// Ventana temporal -3h a +1h
const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
const oneHourFromNow = new Date(now.getTime() + 1 * 60 * 60 * 1000);
const filteredMatches = activeMatches.filter(m =>
  new Date(m.date) >= threeHoursAgo && new Date(m.date) <= oneHourFromNow
);
```

**Ganancia estimada**: Reducción del ~95% en llamadas a API-SPORTS (de ~17.280 a ~500–1.000/día).

> **Observación menor**: El filtro se aplica en memoria tras traer todos los partidos `!= FINISHED` desde la BD. Para el volumen esperado (~200 partidos total) es equivalente, pero la recomendación original era usar `Between()` directamente en la query TypeORM para evitar el fetch innecesario. Cambio de 2 líneas.

---

### ✅ C#5 — `getAllLeagues` sin paginación → RESUELTO

**Archivo**: `apps/api/src/leagues/leagues.service.ts:547-559`

**Antes**: Cargaba todas las ligas con todos sus participantes. Con 10.000 ligas → ~900 MB → OOM en Railway.

**Ahora**:
```typescript
async getAllLeagues(tournamentId?: string, page: number = 1, limit: number = 20) {
  const [leagues, total] = await this.leaguesRepository.findAndCount({
    take: limitNum,  // máximo 100
    skip: skip,
    ...
  });
  return { data: leagues, total, page, limit };
}
```

**Ganancia**: Elimina el riesgo de OOM. Memoria por request: O(página) en lugar de O(total ligas).

---

### ❌ C#4 — Pool de conexiones / single process → PENDIENTE (Fase 2)

**Archivo**: `apps/api/src/app.module.ts`

Pool sigue en `max: 50`. Proceso Node.js único sin clustering. Este es el límite estructural a ~5.000–8.000 usuarios concurrentes en eventos de alto tráfico.

**Plan Fase 2**:
- BullMQ para scoring asíncrono (scoring no bloquea el API).
- Clustering con 4 workers (Railway Pro).
- Reducir pool por worker a 12 conexiones (4 × 12 = 48 total, dentro del límite PostgreSQL).

---

### ❌ C#6 — Write storm pre-partido → SIN CAMBIOS

**Archivo**: `apps/api/src/predictions/predictions.service.ts`

El `upsertPrediction` sigue ejecutando ~6–8 queries secuenciales (~100–150ms por predicción). Con 25.000 usuarios, el pool se satura en el pico de los últimos 5 minutos antes del partido.

---

### ❌ Índices faltantes en base de datos → PENDIENTE

**Archivos**: `apps/api/src/database/entities/match.entity.ts`, `prediction.entity.ts`

La entidad `Match` no tiene ningún `@Index`. Las queries de ranking hacen full scan en los filtros de `tournamentId` y `status`. Con 128 partidos el impacto es bajo hoy, pero los índices son el cambio de mayor impacto/esfuerzo pendiente de Fase 1.

**Índices recomendados sin implementar**:

```sql
-- Para las queries de ranking
CREATE INDEX idx_matches_tournament_status ON matches("tournamentId", status);
CREATE INDEX idx_matches_tournament_phase  ON matches("tournamentId", phase);

-- Para el cron (filtro de ventana temporal en SQL en lugar de en memoria)
CREATE INDEX idx_matches_date_status ON matches(date, status);

-- Para las queries de predicciones en ranking
CREATE INDEX idx_predictions_tournament_league ON predictions("tournamentId", "league_id");
```

**Esfuerzo**: Generar una migración TypeORM con estos índices, ~30 minutos.

---

## Tabla resumen

| Cuello de botella | Fase | Prioridad | Estado |
|-------------------|------|-----------|--------|
| C#1 — Scoring N saves individuales | 1 | CRÍTICO | ✅ Resuelto |
| C#2 — Thundering herd en caché ranking | 1 | ALTO | ⚠️ Mitigado |
| C#3 — Cron sin ventana temporal ni lock | 1 | ALTO | ✅ Resuelto |
| C#4 — Pool / single process | 2 | MEDIO | ❌ Pendiente |
| C#5 — `getAllLeagues` sin paginación | 1 | ALTO | ✅ Resuelto |
| C#6 — Write storm predicciones | 1 | MEDIO | ❌ Sin cambios |
| Índices faltantes en BD | 1 | MEDIO | ❌ Pendiente |

---

## Capacidad estimada por escenario

| Contexto | Antes de cambios | Después de cambios |
|----------|------------------|--------------------|
| Usuarios sin degradación perceptible | ~1.000 | ~2.000–3.000 |
| Usuarios máximos (degradación aceptable) | ~3.000 | ~5.000–6.000 |
| Punto de falla (timeouts en masa) | ~5.000–8.000 | ~8.000–12.000 |
| Última jornada grupos (16 simultáneos) | ~1.500 | ~3.000–4.000 |

---

## Próximos pasos recomendados (orden impacto/esfuerzo)

| # | Acción | Archivo | Esfuerzo | Ganancia |
|---|--------|---------|----------|---------|
| 1 | Agregar índices en BD (migración) | `match.entity.ts` + nueva migración | ~30 min | Queries de ranking 2–10x más rápidas |
| 2 | Filtro temporal en SQL (no en memoria) | `match-sync.service.ts:44-49` | ~15 min | Elimina fetch innecesario de partidos |
| 3 | Single-flight para caché ranking | `leagues.service.ts:940-944` | ~2h | Elimina thundering herd residual |
| 4 | BullMQ + clustering | `scoring`, `app.module.ts`, `main.ts` | ~2 semanas | Sube límite a ~20.000–30.000 usuarios |
