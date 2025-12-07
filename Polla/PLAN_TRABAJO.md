# Plan de Trabajo - Polla Mundialista

## ✅ COMPLETADO
1. Equipos TBD corregidos en el seeder
2. 72 partidos cargados correctamente en la base de datos

## 🚧 EN PROGRESO - Menú de Fechas y Tarjetas

### Cambios necesarios en DashboardClient.tsx:

1. **Cambiar formato de fechas:**
   - DE: "LUNES", "MARTES", "MIÉRCOLES"
   - A: "JUNIO 11", "JUNIO 12", "JUNIO 13"

2. **Líneas a modificar (112-145):**
   ```typescript
   // Reemplazar la lógica de dateStr y displayDate
   const monthNames = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 
                      'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
   const month = monthNames[date.getMonth()];
   const day = date.getDate();
   const dateStr = `${month} ${day}`;
   const displayDate = dateStr;
   ```

### Cambios necesarios en MatchCard.tsx:

1. **Agregar en la esquina superior derecha:**
   - Grupo (ej: "GRUPO A")
   - Hora de inicio (ej: "14:00")
   - Estadio (ej: "Estadio Ciudad de México")

2. **Quitar:**
   - La fecha (ya está en el menú)

3. **Cuando el partido esté en vivo:**
   - Reemplazar hora por "EN VIVO"
   - Mostrar cronómetro en tiempo real

## 📝 PENDIENTE

### 2. Renombrar "Ligas" a "Pollas"
- Buscar y reemplazar en toda la aplicación
- Frontend y Backend

### 3. Guardar Predicción
- Agregar mensaje "Guardado con éxito" al hacer click afuera

### 4. Panel de Control (Super Admin)
- Usuarios: Mostrar lista completa
- Partidos: Mostrar lista completa con opciones de edición
- Ventas: Mostrar consolidado

### 5. Ranking
- Mostrar participantes de pollas

### 6. Simulador
- Tabla completa con PJ, G, E, P, GF, GC, DG, PTS

### 7. Bonus
- Admins de pollas crear preguntas
