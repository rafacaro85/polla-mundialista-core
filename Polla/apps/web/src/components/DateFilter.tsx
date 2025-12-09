```
import React from 'react';

interface DateFilterProps {
  dates: string[];
  selectedDate: string;
  onSelect: (date: string) => void;
}

/* =============================================================================
   COMPONENTE DATEFILTER "BLINDADO"
   - Estilos directos para forzar el look "Tactical" (Nike/Cyberpunk).
   - Scroll horizontal oculto pero funcional.
   ============================================================================= */

export default function DateFilter({ dates = [], selectedDate, onSelect }: DateFilterProps) {

  // ESTILOS MAESTROS
  const STYLES = {
    // Contenedor del scroll
    scrollContainer: {
      display: 'flex',
      width: '100%',
      overflowX: 'auto' as const,
      padding: '12px 16px', // Espacio para que se vea la sombra
      gap: '12px',
      scrollbarWidth: 'none' as const, // Firefox
      msOverflowStyle: 'none', // IE
      alignItems: 'center',
      background: 'rgba(15, 23, 42, 0.6)', // Un fondo sutil Obsidian
      backdropFilter: 'blur(4px)',
      borderBottom: '1px solid #1E293B',
      position: 'sticky' as const,
      top: '0',
      zIndex: 20,
      whiteSpace: 'nowrap' as const // Forzar que no haga wrap
    },
    // Estilo Base del Botón
    button: {
      flexShrink: 0,
      padding: '10px 20px',
      borderRadius: '12px', // Bordes redondeados modernos (no full)
      fontSize: '11px',
      fontWeight: 'bold',
      textTransform: 'uppercase' as const,
      letterSpacing: '1px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      border: '1px solid',
      outline: 'none',
      whiteSpace: 'nowrap' as const
    },
    // Estado ACTIVO (El seleccionado)
    active: {
      backgroundColor: '#00E676', // Signal Green
      color: '#0F172A',           // Obsidian Text
      borderColor: '#00E676',
      fontFamily: "'Russo One', sans-serif", // Fuente deportiva
      boxShadow: '0 0 15px rgba(0, 230, 118, 0.4)', // GLOW
      transform: 'scale(1.05)'
    },
    // Estado INACTIVO (Los demás)
    inactive: {
      backgroundColor: '#1E293B', // Carbon
      color: '#94A3B8',           // Tactical Grey
      borderColor: '#334155',     // Slate Border
      fontFamily: 'sans-serif',
      boxShadow: 'none',
      transform: 'scale(1)'
    }
  };

  // Validación de seguridad por si dates no es un array
  const safeDates = Array.isArray(dates) ? dates : [];

  return (
    <div style={STYLES.scrollContainer as React.CSSProperties} className="no-scrollbar">
      {/* Inyección de estilo para ocultar barra en Chrome/Safari */}
      <style>{`
  .no - scrollbar:: -webkit - scrollbar { display: none; }
`}</style>

      {safeDates.map((date) => {
        const isActive = selectedDate === date;

        // Fusionamos estilo base con el activo o inactivo
        const buttonStyle = {
          ...STYLES.button,
          ...(isActive ? STYLES.active : STYLES.inactive)
        };

        return (
          <button
            key={date}
            onClick={() => onSelectDate && onSelectDate(date)}
            style={buttonStyle}
            // Eventos para hover simple (opcional en JS puro)
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.borderColor = '#94A3B8';
                e.currentTarget.style.color = '#FFFFFF';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.borderColor = '#334155';
                e.currentTarget.style.color = '#94A3B8';
              }
            }}
          >
            {date}
          </button>
        );
      })}
    </div>
  );
}