# 🏆 Implementación Sistema Dinámico de Eliminatorias - Mundial 2026

## 📋 Resumen
Implementar sistema donde los usuarios predicen fase por fase, desbloqueando nuevas fases solo cuando la anterior ha terminado.

## 🎯 Fases del Mundial 2026 (48 equipos)

### Fase de Grupos
- 12 grupos de 4 equipos
- 2 equipos por grupo avanzan (24 equipos)
- 8 mejores terceros lugares avanzan (8 equipos)
- **Total clasificados: 32 equipos**

### Dieciseisavos de Final (ROUND_32)
- 32 equipos → 16 partidos
- **Clasifican: 16 equipos**

### Octavos de Final (ROUND_16)
- 16 equipos → 8 partidos
- **Clasifican: 8 equipos**

### Cuartos de Final (QUARTER)
- 8 equipos → 4 partidos
- **Clasifican: 4 equipos**

### Semifinales (SEMI)
- 4 equipos → 2 partidos
- **Clasifican: 2 equipos a final, 2 a tercer lugar**

### Final y Tercer Lugar
- FINAL: 2 equipos
- 3RD_PLACE: 2 equipos

## 🔧 Cambios Técnicos Necesarios

### 1. Backend - Nueva Tabla: `knockout_phase_status`
```sql
CREATE TABLE knockout_phase_status (
  id UUID PRIMARY KEY,
  phase VARCHAR(20) NOT NULL, -- ROUND_32, ROUND_16, QUARTER, SEMI, FINAL
  is_unlocked BOOLEAN DEFAULT FALSE,
  unlocked_at TIMESTAMP,
  all_matches_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Backend - Nuevo Servicio: `KnockoutPhaseService`
Responsabilidades:
- Verificar si una fase está desbloqueada
- Generar cruces automáticamente cuando se desbloquea una fase
- Marcar fase como completada
- Desbloquear siguiente fase

### 3. Backend - Modificar `BracketsService`
- Actualizar puntos por fase:
  ```typescript
  ROUND_32: 2 puntos
  ROUND_16: 3 puntos
  QUARTER: 6 puntos
  SEMI: 10 puntos
  FINAL: 20 puntos
  ```

### 4. Frontend - Componente: `DynamicKnockoutView`
- Mostrar solo fases desbloqueadas
- Indicador visual de "Esperando resultados" para fases bloqueadas
- Countdown hasta que se desbloquee siguiente fase

### 5. Frontend - Actualizar Dashboards
- Dashboard Principal: Mostrar progreso de fases
- Dashboard Empresarial: Mismo comportamiento

## 📅 Flujo de Usuario

### Fase 1: Grupos (Día 1-14)
```
✅ Usuario predice todos los partidos de grupos
⏳ Sistema espera a que terminen TODOS los grupos
🔓 Sistema desbloquea ROUND_32
```

### Fase 2: Dieciseisavos (Día 15-18)
```
🔓 Sistema genera 16 partidos con equipos REALES clasificados
✅ Usuario predice los 16 partidos
⏳ Sistema espera a que terminen TODOS los dieciseisavos
🔓 Sistema desbloquea ROUND_16
```

### Fase 3-6: Octavos, Cuartos, Semis, Final
```
(Mismo patrón que Fase 2)
```

## 🎨 Diseño UI

### Estado "Bloqueado"
```
┌─────────────────────────────────────┐
│  🔒 DIECISEISAVOS DE FINAL          │
│                                     │
│  Esta fase se desbloqueará cuando  │
│  todos los partidos de grupos      │
│  hayan finalizado.                 │
│                                     │
│  ⏱️ Estimado: 2 días 5 horas       │
└─────────────────────────────────────┘
```

### Estado "Desbloqueado"
```
┌─────────────────────────────────────┐
│  🔓 DIECISEISAVOS DE FINAL          │
│                                     │
│  ⚽ Partido 1: ARG vs FRA           │
│     [2] - [1]  💾 Guardar          │
│                                     │
│  ⚽ Partido 2: BRA vs GER           │
│     [ ] - [ ]  💾 Guardar          │
└─────────────────────────────────────┘
```

## 🚀 Plan de Implementación

### Sprint 1: Backend Core (2-3 horas)
1. ✅ Crear migración para `knockout_phase_status`
2. ✅ Crear entidad `KnockoutPhaseStatus`
3. ✅ Crear `KnockoutPhaseService`
4. ✅ Actualizar `MatchesService` para generación dinámica
5. ✅ Actualizar `BracketsService` con nuevos puntos

### Sprint 2: Backend API (1-2 horas)
1. ✅ Endpoint: `GET /knockout-phases/status` - Ver estado de fases
2. ✅ Endpoint: `POST /knockout-phases/:phase/unlock` - Desbloquear fase (ADMIN)
3. ✅ Endpoint: `GET /knockout-phases/:phase/matches` - Obtener partidos de fase
4. ✅ Modificar `POST /predictions` para validar fase desbloqueada

### Sprint 3: Frontend Core (2-3 horas)
1. ✅ Crear componente `PhaseStatusIndicator`
2. ✅ Crear componente `DynamicKnockoutView`
3. ✅ Actualizar `PredictionsPage` para usar sistema dinámico
4. ✅ Crear hook `useKnockoutPhases`

### Sprint 4: Frontend Dashboards (1-2 horas)
1. ✅ Actualizar Dashboard Principal
2. ✅ Actualizar Dashboard Empresarial
3. ✅ Agregar indicadores de progreso

### Sprint 5: Testing & Polish (1 hora)
1. ✅ Probar flujo completo
2. ✅ Ajustar estilos
3. ✅ Documentar

## 📝 Notas Importantes

- El sistema de Bracket EXISTENTE se mantiene para puntos extra
- Las predicciones dinámicas son ADICIONALES, no reemplazan el bracket
- Los usuarios pueden seguir llenando su bracket completo si quieren
- Pero las predicciones de partidos solo se habilitan fase por fase

## 🔄 Migración de Datos Existentes

Si ya hay datos:
1. Marcar fase GROUP como completada si todos los grupos terminaron
2. Desbloquear ROUND_32 si corresponde
3. No afectar predicciones existentes
