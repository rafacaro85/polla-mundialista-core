# CORRECCIONES URGENTES - Polla Mundialista

## Problemas Identificados y Soluciones

### 1. ❌ MENÚ MOBILE NO APARECE
**Problema:** El menú inferior no se muestra en mobile
**Causa:** Probablemente el z-index o el padding-bottom del layout
**Solución:** Verificar LeagueNavigation y asegurar que esté visible

### 2. ❌ COLORES NO SE ACTUALIZAN
**Problema:** Los cambios de colores en Studio no se reflejan en la página principal
**Causa:** El BrandThemeProvider no se está refrescando después de guardar
**Solución:** Forzar recarga de la página después de publicar

### 3. ❌ PESTAÑA "PREDICCIONES" MUESTRA TABLA DE POSICIONES
**Problema:** La pestaña "Predicciones" debería mostrar tarjetas de partidos para hacer predicciones, no la tabla de grupos
**Causa:** predictions/page.tsx está usando GroupStageView en lugar de un componente de predicciones
**Solución:** Crear/usar componente de predicciones con MatchCard

### 4. ✅ BOTÓN "GUARDAR" SEPARADO DE "PUBLICAR"
**Problema:** Solo hay un botón que hace todo
**Solución:** Separar en dos botones:
- "Guardar Cambios": Solo guarda sin redirigir
- "Publicar": Guarda + verifica activación + redirige

### 5. ❌ MURO SOCIAL DICE "EN CONSTRUCCIÓN"
**Estado:** Correcto, es un placeholder intencional

---

## PRIORIDAD 1: Menú Mobile

**Archivo:** `apps/web/src/app/leagues/[id]/layout.tsx`

**Verificar:**
- Que el padding-bottom del main no oculte el menú
- Que el z-index del nav sea suficientemente alto
- Que no haya conflictos de CSS

---

## PRIORIDAD 2: Predicciones vs Tabla de Posiciones

**Archivo:** `apps/web/src/app/leagues/[id]/predictions/page.tsx`

**Cambio necesario:**
```tsx
// ❌ ACTUAL (muestra tabla de grupos):
<GroupStageView matches={matches} />

// ✅ CORRECTO (debe mostrar tarjetas de partidos):
<PredictionsView matches={matches} />
// O usar MatchCard directamente
```

**Nota:** La tabla de posiciones (GroupStageView) debe estar en `/simulation` o en una pestaña separada

---

## PRIORIDAD 3: Botones Guardar y Publicar

**Archivo:** `apps/web/src/app/leagues/[id]/studio/page.tsx`

**Cambios necesarios:**

1. Separar `handleSave` en dos funciones:
```tsx
// Solo guardar (sin redirigir)
const handleSaveChanges = async () => {
  await api.patch(`/leagues/${params.id}`, { ...config });
  toast({ title: 'Cambios guardados' });
};

// Guardar + verificar + redirigir
const handlePublish = async () => {
  await handleSaveChanges();
  if (config.isEnterpriseActive) {
    // Forzar recarga completa para que se apliquen los colores
    window.location.href = `/leagues/${params.id}`;
  } else {
    showActivationModal();
  }
};
```

2. Agregar dos botones en la UI:
```tsx
<button onClick={handleSaveChanges}>
  <Save /> Guardar Cambios
</button>

<button onClick={handlePublish}>
  <Check /> Publicar
</button>
```

---

## PRIORIDAD 4: Actualización de Colores

**Problema:** Después de guardar en Studio, los colores no se reflejan en la página principal

**Solución:** Usar `window.location.href` en lugar de `router.push` para forzar recarga completa:

```tsx
// ❌ NO funciona (no recarga el BrandThemeProvider):
router.push(`/leagues/${params.id}`);

// ✅ SÍ funciona (recarga completa):
window.location.href = `/leagues/${params.id}`;
```

---

## NAVEGACIÓN CORRECTA

Las pestañas deben ser:

1. **Inicio** → `/leagues/[id]` (página principal con premios)
2. **Predicciones** → `/leagues/[id]/predictions` (MatchCards para hacer predicciones)
3. **Ranking** → `/leagues/[id]/ranking` (tabla de usuarios con puntos)
4. **Simulador** → `/leagues/[id]/simulation` (bracket/eliminatorias O tabla de grupos)
5. **Bonus** → `/leagues/[id]/bonus` (preguntas bonus)
6. **Muro** → `/leagues/[id]/wall` (muro social - en construcción)

---

## ORDEN DE IMPLEMENTACIÓN

1. ✅ Verificar menú mobile (layout.tsx)
2. ✅ Corregir predictions page (debe mostrar MatchCards, no GroupStageView)
3. ✅ Separar botones Guardar/Publicar en Studio
4. ✅ Forzar recarga completa al publicar (window.location.href)
5. ✅ Verificar que todos los colores se apliquen correctamente

---

**Fecha:** 2025-12-14
**Estado:** Pendiente de implementación
