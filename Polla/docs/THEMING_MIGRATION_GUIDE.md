# Guía de Migración: Sistema de Temas Dinámicos

## 📋 Resumen

El sistema de temas dinámicos permite que las pollas empresariales apliquen sus colores corporativos en toda la interfaz automáticamente.

## ✅ Implementación Completada

### 1. Tailwind Config (`tailwind.config.js`)
```javascript
colors: {
  brand: {
    primary: 'var(--brand-primary)',       // Color principal empresa
    secondary: 'var(--brand-secondary)',   // Color secundario/superficies
    bg: 'var(--brand-bg)',                 // Fondo principal
    text: 'var(--brand-text)',             // Color de texto
    accent: 'var(--brand-accent)',         // Acento (auto-calculado)
    DEFAULT: 'var(--brand-primary)',
  },
}
```

### 2. BrandThemeProvider (`src/components/providers/BrandThemeProvider.tsx`)
- Inyecta colores corporativos via CSS Variables
- Calcula color de acento automáticamente
- Limpia variables al desmontar

### 3. League Layout (`src/app/leagues/[id]/layout.tsx`)
- Envuelve contenido con `<BrandThemeProvider>`
- Pasa colores de la empresa desde la BD
- Aplica tema automáticamente a todas las páginas hijas

## 🔄 Cómo Actualizar Componentes Existentes

### PASO 4: Migrar Colores Estáticos a Dinámicos

#### ❌ ANTES (Colores fijos):
```tsx
<button className="bg-blue-600 text-white hover:bg-blue-700">
  Guardar
</button>

<div className="border-green-500 bg-green-50">
  Éxito
</div>
```

#### ✅ DESPUÉS (Colores dinámicos):
```tsx
<button className="bg-brand-primary text-white hover:bg-brand-accent">
  Guardar
</button>

<div className="border-brand-primary bg-brand-primary/10">
  Éxito
</div>
```

### Tabla de Conversión Rápida

| Antes (Fijo) | Después (Dinámico) | Uso |
|--------------|-------------------|-----|
| `bg-blue-600` | `bg-brand-primary` | Botones principales |
| `text-blue-600` | `text-brand-primary` | Texto de acento |
| `border-blue-600` | `border-brand-primary` | Bordes destacados |
| `bg-gray-900` | `bg-brand-bg` | Fondo de página |
| `bg-gray-800` | `bg-brand-secondary` | Tarjetas/superficies |
| `text-white` | `text-brand-text` | Texto principal |
| `bg-green-500` | `bg-brand-accent` | Hover states |

### Ejemplos de Componentes a Actualizar

#### 1. Botones
```tsx
// ❌ Antes
<Button className="bg-[#00E676] hover:bg-[#00D066]">
  Publicar
</Button>

// ✅ Después
<Button className="bg-brand-primary hover:bg-brand-accent">
  Publicar
</Button>
```

#### 2. Navegación
```tsx
// ❌ Antes
<nav className="bg-[#1E293B] border-[#334155]">
  <a className="text-[#00E676] hover:bg-[#00E676]/10">
    Ranking
  </a>
</nav>

// ✅ Después
<nav className="bg-brand-secondary border-brand-secondary">
  <a className="text-brand-primary hover:bg-brand-primary/10">
    Ranking
  </a>
</nav>
```

#### 3. Tarjetas
```tsx
// ❌ Antes
<div className="bg-[#1E293B] border-[#334155]">
  <h3 className="text-[#00E676]">Título</h3>
  <p className="text-white">Contenido</p>
</div>

// ✅ Después
<div className="bg-brand-secondary border-brand-secondary">
  <h3 className="text-brand-primary">Título</h3>
  <p className="text-brand-text">Contenido</p>
</div>
```

#### 4. Badges/Pills
```tsx
// ❌ Antes
<span className="bg-green-500/10 text-green-500 border-green-500">
  Activo
</span>

// ✅ Después
<span className="bg-brand-primary/10 text-brand-primary border-brand-primary">
  Activo
</span>
```

## 🎯 Componentes Prioritarios a Actualizar

1. **LeagueNavigation** - Sidebar/Bottom nav
2. **RankingView** - Tabla de posiciones
3. **MatchCard** - Tarjetas de partidos
4. **BracketView** - Vista de eliminatorias
5. **BonusView** - Preguntas bonus
6. **Header** - Encabezado de páginas

## 🧪 Cómo Probar

1. Ir a Studio de una polla empresarial
2. Cambiar colores (ej: Rojo #FF0000)
3. Guardar y publicar
4. Navegar a Ranking/Pronósticos
5. **Verificar:** Todos los botones/acentos deben ser rojos

## 📝 Notas Importantes

- **NO eliminar** clases de espaciado (`p-4`, `m-2`, etc.)
- **NO cambiar** clases de layout (`flex`, `grid`, etc.)
- **SOLO cambiar** clases de color (`bg-*`, `text-*`, `border-*`)
- **Usar opacidades** con `/10`, `/20` para fondos sutiles

## 🚀 Resultado Final

Cuando una empresa configure su polla con:
- **Primario:** Rojo Coca-Cola (#FF0000)
- **Secundario:** Negro (#000000)
- **Fondo:** Gris oscuro (#1A1A1A)

**Toda la interfaz** (botones, links, badges, bordes) se volverá roja automáticamente. ✨

---

**Deploy:** Los cambios están en producción. Ahora solo falta actualizar los componentes individuales para usar las clases `brand-*`.
