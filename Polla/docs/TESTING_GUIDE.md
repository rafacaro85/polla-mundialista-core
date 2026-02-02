# 🧪 Guía de Pruebas - Sistema Dinámico de Eliminatorias

## 📋 Preparación

### 1. Verificar que el Servidor Esté Corriendo

```bash
# En Railway, verifica que el despliegue haya terminado
# O en local:
cd apps/api
npm run start:dev
```

### 2. Verificar que la Tabla se Creó

Como tienes `synchronize: true`, la tabla `knockout_phase_status` se creó automáticamente.

**Verificar en logs de Railway:**
```
✅ Database connected
✅ TypeORM initialized
```

---

## 🎯 Prueba 1: Verificar Estado Inicial de Fases

### Opción A: Usando cURL (Terminal)

```bash
# Ver estado de todas las fases
curl https://polla.mundialista-2026-production.up.railway.app/api/knockout-phases/status

# Deberías ver:
[
  { "phase": "GROUP", "isUnlocked": true, "allMatchesCompleted": false },
  { "phase": "ROUND_32", "isUnlocked": false, "allMatchesCompleted": false },
  { "phase": "ROUND_16", "isUnlocked": false, "allMatchesCompleted": false },
  { "phase": "QUARTER", "isUnlocked": false, "allMatchesCompleted": false },
  { "phase": "SEMI", "isUnlocked": false, "allMatchesCompleted": false },
  { "phase": "FINAL", "isUnlocked": false, "allMatchesCompleted": false }
]
```

### Opción B: Usando el Navegador

1. Abre: `https://polla.mundialista-2026-production.up.railway.app/api/knockout-phases/status`
2. Deberías ver el JSON con las fases

### Opción C: Usando Postman/Insomnia

```
GET https://polla.mundialista-2026-production.up.railway.app/api/knockout-phases/status
```

---

## 🎯 Prueba 2: Ver el Dashboard con Progreso de Fases

### En el Frontend

1. **Inicia sesión** en tu aplicación
2. **Ve al Dashboard Principal**
3. **Verifica que veas el componente "Progreso del Torneo"**
   - Debería mostrar 6 fases
   - GROUP debería estar desbloqueada (verde)
   - Las demás deberían estar bloqueadas (gris)

**Captura esperada:**
```
┌─────────────────────────────────────┐
│  🏆 Progreso del Torneo             │
│                                     │
│  ✅ Fase de Grupos (Desbloqueada)  │
│  🔒 Dieciseisavos (Bloqueada)      │
│  🔒 Octavos (Bloqueada)            │
│  🔒 Cuartos (Bloqueada)            │
│  🔒 Semis (Bloqueada)              │
│  🔒 Final (Bloqueada)              │
└─────────────────────────────────────┘
```

---

## 🎯 Prueba 3: Intentar Acceder a Fase Bloqueada

### En Predicciones

1. **Ve a la página de predicciones** de una liga
2. **Intenta ver partidos de octavos** (si los hay creados)
3. **Deberías ver la vista bloqueada:**

```
┌─────────────────────────────────────┐
│         🔒                          │
│   OCTAVOS DE FINAL                  │
│                                     │
│   Esta fase se desbloqueará cuando │
│   todos los partidos de grupos     │
│   hayan finalizado.                │
│                                     │
│   ⏱️ Partidos pendientes: 48       │
└─────────────────────────────────────┘
```

---

## 🎯 Prueba 4: Desbloqueo Manual (Como SUPER_ADMIN)

### Paso 1: Obtener Token de Autenticación

1. **Inicia sesión** en tu app
2. **Abre DevTools** (F12)
3. **Ve a Application → Local Storage**
4. **Copia el token** (debería estar en `token` o similar)

### Paso 2: Desbloquear ROUND_32 Manualmente

```bash
# Reemplaza YOUR_TOKEN con tu token real
curl -X POST https://polla.mundialista-2026-production.up.railway.app/api/knockout-phases/ROUND_32/unlock \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Respuesta esperada:
{
  "id": "...",
  "phase": "ROUND_32",
  "isUnlocked": true,
  "unlockedAt": "2025-12-23T01:40:00.000Z",
  "allMatchesCompleted": false
}
```

### Paso 3: Verificar en el Dashboard

1. **Espera 30 segundos** (auto-actualización)
2. **O recarga la página**
3. **Verifica que ROUND_32 ahora aparece desbloqueada**

---

## 🎯 Prueba 5: Auto-Desbloqueo (Flujo Real)

### Escenario: Terminar Fase de Grupos

#### Paso 1: Ver Partidos de Grupos Pendientes

```bash
# Ver partidos de grupos
curl https://polla.mundialista-2026-production.up.railway.app/api/knockout-phases/GROUP/matches

# Cuenta cuántos están en status != 'FINISHED'
```

#### Paso 2: Marcar UN Partido como Terminado (Como ADMIN)

```bash
# Obtén el ID de un partido de grupo
# Luego actualízalo:

curl -X PATCH https://polla.mundialista-2026-production.up.railway.app/api/matches/{MATCH_ID} \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "FINISHED",
    "homeScore": 2,
    "awayScore": 1
  }'
```

#### Paso 3: Verificar Logs del Servidor

En los logs de Railway deberías ver:

```
✅ Recalculated points for X predictions in match {MATCH_ID}
🏆 Bracket points calculated for match {MATCH_ID}, winner: {TEAM}
🔍 Checking if GROUP is complete...
⏳ GROUP not yet complete
```

#### Paso 4: Marcar TODOS los Partidos de Grupos como Terminados

Repite el Paso 2 para **todos** los partidos de grupos.

#### Paso 5: Ver el Auto-Desbloqueo

Cuando marques el **último partido** de grupos, verás en los logs:

```
✅ Recalculated points for X predictions
🏆 Bracket points calculated
🔍 Checking if GROUP is complete...
✅ GROUP marked as completed
🔓 ROUND_32 has been unlocked!
```

#### Paso 6: Verificar en el Frontend

1. **Espera 30 segundos** (o recarga)
2. **Ve al dashboard**
3. **ROUND_32 debería aparecer desbloqueada**
4. **Ahora puedes hacer predicciones de dieciseisavos**

---

## 🎯 Prueba 6: Verificar Info de Próxima Fase

```bash
curl https://polla.mundialista-2026-production.up.railway.app/api/knockout-phases/next/info

# Respuesta esperada:
{
  "currentPhase": "GROUP",
  "nextPhase": "ROUND_32",
  "isComplete": false,
  "remainingMatches": 48
}
```

---

## 🧪 Pruebas Automatizadas (Opcional)

### Script de Prueba Rápida

Crea un archivo `test-knockout-phases.sh`:

```bash
#!/bin/bash

API_URL="https://polla.mundialista-2026-production.up.railway.app/api"
TOKEN="YOUR_ADMIN_TOKEN_HERE"

echo "🧪 Probando Sistema de Fases Dinámicas"
echo "========================================"

echo ""
echo "1️⃣ Estado de todas las fases:"
curl -s "$API_URL/knockout-phases/status" | jq '.'

echo ""
echo "2️⃣ Info de próxima fase:"
curl -s "$API_URL/knockout-phases/next/info" | jq '.'

echo ""
echo "3️⃣ Partidos de fase de grupos:"
curl -s "$API_URL/knockout-phases/GROUP/matches" -H "Authorization: Bearer $TOKEN" | jq 'length'

echo ""
echo "4️⃣ Intentar desbloquear ROUND_32:"
curl -s -X POST "$API_URL/knockout-phases/ROUND_32/unlock" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'

echo ""
echo "✅ Pruebas completadas"
```

Ejecutar:
```bash
chmod +x test-knockout-phases.sh
./test-knockout-phases.sh
```

---

## 🐛 Troubleshooting

### Problema: "No se ve el componente de progreso"

**Solución:**
1. Verifica que el despliegue en Railway haya terminado
2. Limpia caché del navegador (Ctrl+Shift+R)
3. Verifica la consola del navegador por errores

### Problema: "Fase no se desbloquea automáticamente"

**Verificar:**
1. ¿Todos los partidos están en status `FINISHED`?
2. ¿El campo `phase` del partido es correcto?
3. Revisa logs de Railway para ver mensajes de desbloqueo

**Comando para verificar:**
```bash
# Ver partidos de una fase
curl "$API_URL/knockout-phases/GROUP/matches" -H "Authorization: Bearer $TOKEN" | jq '[.[] | {id, status, phase}]'
```

### Problema: "Frontend no se actualiza"

**Solución:**
1. Espera 30 segundos (auto-actualización)
2. Recarga la página manualmente
3. Verifica que el hook `useKnockoutPhases` esté funcionando (consola del navegador)

---

## 📊 Checklist de Pruebas

- [ ] ✅ Servidor corriendo sin errores
- [ ] ✅ Tabla `knockout_phase_status` creada
- [ ] ✅ Endpoint `/status` responde correctamente
- [ ] ✅ Dashboard muestra componente de progreso
- [ ] ✅ GROUP aparece desbloqueada
- [ ] ✅ Otras fases aparecen bloqueadas
- [ ] ✅ Vista bloqueada funciona en predicciones
- [ ] ✅ Desbloqueo manual funciona (ADMIN)
- [ ] ✅ Auto-desbloqueo funciona al terminar fase
- [ ] ✅ Frontend se actualiza automáticamente
- [ ] ✅ Dashboard empresarial muestra progreso

---

## 🎬 Flujo de Prueba Completo (Paso a Paso)

### Escenario: Simular un Mundial Completo

1. **Inicio**: Todas las fases bloqueadas excepto GROUP
2. **Marcar 1 partido de grupos como terminado** → Ver logs
3. **Marcar TODOS los partidos de grupos** → ROUND_32 se desbloquea
4. **Verificar en dashboard** → ROUND_32 aparece verde
5. **Ir a predicciones** → Ahora puedes predecir dieciseisavos
6. **Marcar TODOS los dieciseisavos** → ROUND_16 se desbloquea
7. **Repetir** para cada fase hasta FINAL

---

## 🚀 Próximo Paso: API de Resultados en Tiempo Real

Cuando conectes la API externa:

```typescript
// La API actualiza resultados automáticamente
// El sistema hace el resto:
// 1. Calcula puntos ✅
// 2. Verifica fase completa ✅
// 3. Desbloquea siguiente fase ✅
// 4. Frontend se actualiza ✅
```

**No necesitas código adicional** - Todo está listo.

---

## 📝 Notas Importantes

- El sistema usa **polling cada 30 segundos** para actualizar el frontend
- Los logs del servidor son tu mejor amigo para debugging
- Puedes desbloquear fases manualmente como SUPER_ADMIN si es necesario
- El auto-desbloqueo solo funciona cuando **TODOS** los partidos de una fase están en `FINISHED`

---

¿Listo para probar? Empieza con la **Prueba 1** y avanza paso a paso. 🚀
