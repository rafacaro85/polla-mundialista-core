# Implementación de Lógica Centralizada de Predicciones - Polla Mundialista

## Objetivo Completado
Se ha unificado la lógica de gestión de predicciones en un "Cerebro" centralizado (Hook) para garantizar que los datos sean consistentes entre los módulos Social y Enterprise. Se cumple el principio de "Single Source of Truth".

## Componentes Implementados

### 1. `src/shared/hooks/useMyPredictions.ts` (El Cerebro)
Este Custom Hook encapsula toda la complejidad de:
*   **Fetching**: Usa `useSWR` para obtener `/predictions/me` con caché y deduplicación.
*   **Transformación**: Convierte el array de la API en un Mapa `Record<string, Prediction>` para acceso O(1) instantáneo.
*   **Optimistic UI**: La función `savePrediction` actualiza la caché local INMEDIATAMENTE antes de enviar la petición al servidor, ofreciendo una experiencia de usuario "snappy".
*   **Sincronización**: Al usar `useSWR`, cualquier componente que use este hook recibirá actualizaciones automáticas si los datos cambian en otro lugar.

### 2. `src/modules/social-league/components/SocialFixture.tsx` (Nuevo)
*   Se extrajo la lógica de la pestaña "Juego" de `DashboardClient`.
*   Implementa el patrón "Raw Matches + Predictions Hook + Local Drafts".
*   Permite a los usuarios recibir sugerencias de IA (Drafts) sin guardar, y luego guardar explícitamente, integrándose con el Hook.

### 3. `src/modules/enterprise-league/components/EnterpriseFixture.tsx` (Refactorizado)
*   Se eliminó la lógica manual de fetch de predicciones y merging.
*   Ahora consume `useMyPredictions`.
*   Mantiene su propia gestión de "AI Suggestions" locales sobre los datos del hook.
*   Garantiza que si editas un marcador en Social, aparezca reflejado en Enterprise al cambiar de vista.

### 4. `src/components/DashboardClient.tsx` (Limpieza)
*   Se eliminó cientos de líneas de código relacionadas con la gestión de predicciones y renderizado de tarjetas de partido.
*   Ahora actúa como un contenedor ligero que delega la vista de juego a `SocialFixture`.
*   Usa el hook `useMyPredictions` para alimentar vistas secundarias (como el Bracket) si es necesario.

## Flujo de Datos
1.  **Lectura**: `API` -> `useSWR (Cache)` -> `useMyPredictions (Map)` -> `Component (Merge con Matches)`.
2.  **Escritura**: `Component (Input)` -> `savePrediction` -> `Mutate Cache (Optimistic)` -> `API POST` -> `Revalidate (Confirm)`.

El sistema es ahora robusto, modular y rápido.
