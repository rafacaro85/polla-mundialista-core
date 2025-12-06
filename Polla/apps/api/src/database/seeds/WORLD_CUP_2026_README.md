# 🌍 Seeder de Partidos del Mundial 2026

Este documento explica cómo usar el seeder para cargar los partidos del Mundial 2026 en la base de datos.

## 📋 Archivo del Seeder

**Ubicación:** `src/database/seeds/world-cup-2026-matches.seeder.ts`

## 🚀 Cómo Usar

### 1. Llenar los Datos de los Partidos

Abre el archivo `world-cup-2026-matches.seeder.ts` y llena el array `matchesData` con los partidos reales del Mundial 2026.

**Ejemplo de un partido:**

```typescript
{
  group: 'A',
  date: '2026-06-11T18:00:00.000Z', // Fecha en UTC (ISO 8601)
  homeTeam: 'México',
  awayTeam: 'Canadá',
  homeFlag: 'mx', // Código ISO del país (minúsculas)
  awayFlag: 'ca',
  stadium: 'Estadio Azteca, Ciudad de México',
  phase: 'GROUP', // Opciones: GROUP, ROUND_16, QUARTER, SEMI, FINAL, 3RD_PLACE
}
```

### 2. Ejecutar el Seeder

Desde la carpeta `apps/api`, ejecuta:

```bash
npm run seed:wc2026
```

### 3. Verificar

El script mostrará el progreso de la inserción:

```
🌍 Iniciando carga de partidos del Mundial 2026...

✅ Conexión a la base de datos establecida

🗑️  Limpiando partidos existentes...
✅ Partidos eliminados

📝 Insertando 104 partidos...

✅ [1/104] México vs Canadá - Grupo A
✅ [2/104] Estados Unidos vs TBD - Grupo A
...

============================================================
✅ Partidos insertados: 104
❌ Errores: 0
============================================================

🎉 ¡Carga de partidos completada!
```

## 📊 Estructura del Mundial 2026

### Fase de Grupos

- **12 Grupos** (A-L)
- **4 equipos** por grupo
- **48 equipos** en total
- **3 partidos** por equipo (todos contra todos)
- **Total:** 48 partidos de fase de grupos

### Clasificación

- **2 primeros** de cada grupo = 24 equipos
- **8 mejores terceros** = 8 equipos
- **Total clasificados:** 32 equipos

### Fase Eliminatoria

- **Octavos de Final:** 16 partidos
- **Cuartos de Final:** 8 partidos
- **Semifinales:** 4 partidos
- **Tercer Puesto:** 1 partido
- **Final:** 1 partido
- **Total:** 30 partidos

### Total de Partidos del Mundial 2026

**104 partidos** en total (48 grupos + 56 eliminatorias)

## 🗓️ Fechas Importantes

- **Partido Inaugural:** 11 de junio de 2026
- **Fase de Grupos:** 11-26 de junio de 2026
- **Octavos de Final:** 28 de junio - 2 de julio de 2026
- **Cuartos de Final:** 4-5 de julio de 2026
- **Semifinales:** 7-8 de julio de 2026
- **Tercer Puesto:** 11 de julio de 2026
- **Final:** 19 de julio de 2026

## 🏟️ Sedes

### Estados Unidos (11 ciudades)
- Atlanta, Boston, Dallas, Houston, Kansas City, Los Ángeles, Miami, Nueva York/Nueva Jersey, Filadelfia, San Francisco, Seattle

### México (3 ciudades)
- Ciudad de México, Guadalajara, Monterrey

### Canadá (2 ciudades)
- Toronto, Vancouver

## 📝 Notas Importantes

1. **Fechas en UTC:** Todas las fechas deben estar en formato UTC (ISO 8601)
2. **Códigos ISO:** Los códigos de banderas deben ser ISO 3166-1 alpha-2 (minúsculas)
3. **TBD:** Usa "TBD" (To Be Determined) para equipos que aún no se conocen
4. **Limpieza:** El script borra todos los partidos existentes antes de insertar los nuevos

## 🔧 Personalización

Si quieres **NO borrar** los partidos existentes, comenta estas líneas en el seeder:

```typescript
// console.log('🗑️  Limpiando partidos existentes...');
// await matchRepository.delete({});
// console.log('✅ Partidos eliminados\n');
```

## 📚 Recursos

- [FIFA World Cup 2026 Official](https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026)
- [Calendario Oficial](https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/match-schedule)
- [Grupos y Equipos](https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026/teams-groups)

## ❓ Ayuda

Si tienes problemas:

1. Verifica que las variables de entorno estén configuradas (`.env`)
2. Asegúrate de que la base de datos esté corriendo
3. Revisa que los datos en `matchesData` estén en el formato correcto
4. Verifica los logs del seeder para identificar errores específicos
