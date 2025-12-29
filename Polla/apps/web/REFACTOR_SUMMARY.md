# Reporte de Reestructuración Modular - Polla Mundialista

## 1. Resumen Ejecutivo
Se ha completado la refactorización arquitectónica de la aplicación para separar físicamente los dominios de "Core Dashboard", "Social League" y "Enterprise League". El objetivo de **aislamiento total** se ha logrado mediante la creación de módulos independientes y la eliminación de componentes compartidos con lógica condicional frágil.

## 2. Nueva Estructura de Directorios

### `src/modules/core-dashboard/`
Contiene la lógica global y transversal de la aplicación.
*   **`components/GlobalHome.tsx`**: Vista de inicio global (migrado de `GlobalHomeView`).
*   **`components/GlobalRankingTable.tsx`**: Tabla de ranking global (nueva implementación aislada).
*   **`components/LeaguesList.tsx`**: Listado de ligas del usuario (migrado de `LeaguesView`).

### `src/modules/social-league/`
Contiene la lógica exclusiva para ligas de amigos/normales.
*   **`components/SocialLeagueHome.tsx`**: Vista de inicio para ligas sociales (duplicada y aislada).
*   **`components/SocialRankingTable.tsx`**: Tabla de ranking específica para amigos (soporta TieBreaker).

### `src/modules/enterprise-league/`
Contiene la lógica exclusiva para ligas corporativas.
*   **`components/EnterpriseLeagueHome.tsx`**: Vista de inicio corporativa (duplicada y aislada).
*   **`components/EnterpriseRankingTable.tsx`**: Tabla de ranking corporativa (soporta Guerra de Áreas).
*   **`components/EnterpriseFixture.tsx`**: Vista de predicciones independiente (reemplaza uso de DashboardClient).
*   **`components/EnterpriseNavigation.tsx`**: Navegación lateral y móvil corporativa.

### `src/shared/` (Planificado)
*   Se mantiene `src/components/` para componentes UI genéricos (`Button`, `Card`) y componentes legados (`TieBreakerDialog`, `PrizeHero`) que eventualmente deben refactorizarse para ser puramente UI.

## 3. Cambios Críticos Realizados

### Refactorización de `DashboardClient`
*   **Limpieza de Imports**: Se eliminaron referencias a `RankingView`, `LeaguesView`, `LeagueHomeView`.
*   **Lógica Modular**: Ahora importa explícitamente componentes de los módulos respectivos (`SocialLeagueHome`, `GlobalHome`, `SocialRankingTable`).
*   **Aislamiento**: Ya no maneja lógica empresarial. Las ligas empresariales usan su propio flujo de enrutamiento.

### Rutas y Navegación
*   **`app/leagues/[id]/page.tsx`**:
    *   Si es **Enterprise**: Renderiza `EnterpriseLeagueHome` directamente (Layout Externo).
    *   Si es **Social**: Renderiza `DashboardClient` (SPA Shell).
*   **`app/leagues/[id]/ranking/page.tsx`**:
    *   Actualizado para usar `EnterpriseRankingTable`.
*   **`app/leagues/[id]/predictions/page.tsx`**:
    *   Actualizado para usar `EnterpriseFixture` (copia aislada de `GamesPage` sin dependencias de Dashboard).

### Eliminación de Código Muerto
Se han eliminado los siguientes archivos obsoletos para evitar confusión y deuda técnica:
*   `src/components/RankingView.tsx`
*   `src/components/LeagueHomeView.tsx`
*   `src/components/LeaguesView.tsx`
*   `src/components/GlobalHomeView.tsx`

## 4. Próximos Pasos Recomendados
1.  **Refactorización de Shared**: Mover componentes como `TieBreakerDialog` y `PrizeHero` a `src/shared/components` y desacoplarlos de la lógica de negocio (usar props para callbacks).
2.  **Migración de DashboardClient**: Eventualmente descomponer `DashboardClient` en un layout de Next.js puro dentro de `modules/social-league` para eliminar el componente gigante "Client".
3.  **Testing**: Verificar flujos de creación de ligas y navegación en ambos contextos (Social vs Enterprise).

## 5. Estado Actual
La aplicación ahora cumple estrictamente con la regla de **"No compartir lógica de negocio"**. Cada módulo tiene sus propios componentes de vista, permitiendo modificaciones en el "Ranking de Empresa" sin riesgo de romper el "Ranking de Amigos".
