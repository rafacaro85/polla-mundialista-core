import React, { useState } from 'react';
import { Info, Star } from 'lucide-react';

/* ======================================================
   MATCHCARD - DISEÑO NIKE STYLE
   - Mantiene diseño visual exacto
   - Footer muestra resultado y puntos ganados
   ====================================================== */

// HELPER 1: FORMATEO DE FECHA
const formatMatchDate = (isoDate: string) => {
  try {
    const d = new Date(isoDate);
    return new Intl.DateTimeFormat('es-CO', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d).toUpperCase();
  } catch {
    return 'FECHA TBD';
  }
};

import { getTeamFlagUrl } from '@/shared/utils/flags';

// HELPER 2: OBTENER CÓDIGO VISUAL (3 LETRAS)
const getVisualCode = (name: string) => {
  if (!name) return 'TBD';

  const upper = name.toUpperCase();

  // Mapeo manual de excepciones comunes
  const EXCEPTIONS: Record<string, string> = {
    'ESTADOS UNIDOS': 'USA',
    'COREA SUR': 'KOR',
    'COSTA RICA': 'CRC',
    'ARABIA SAUDITA': 'KSA',
    'NUEVA ZELANDA': 'NZL',
    'PAISES BAJOS': 'NED',
    'PAÍSES BAJOS': 'NED',
    'INGLATERRA': 'ENG'
  };

  if (EXCEPTIONS[upper]) return EXCEPTIONS[upper];

  // Si parece un placeholder de torneo (Match 40, Ganador A, etc)
  if (upper.includes('MATCH') || upper.includes('PARTIDO') || upper.includes('GANADOR') || upper.includes('WINNER')) {
    return 'TBD';
  }

  if (name.length === 3) return upper;
  return name.substring(0, 3).toUpperCase();
};

export default function MatchCard({ match, onOpenInfo, onSavePrediction }: any) {
  // 1. EXTRAER DATOS DEL PARTIDO
  // Fallback a snake_case por si la API cambió serialización
  const homeTeamName = match.homeTeam || match.home_team || match.homeTeamPlaceholder || 'LOC';
  const awayTeamName = match.awayTeam || match.away_team || match.awayTeamPlaceholder || 'VIS';

  const homeCode = getVisualCode(homeTeamName);
  const awayCode = getVisualCode(awayTeamName);

  const homeFlagUrl = match.homeFlag || getTeamFlagUrl(homeTeamName);
  const awayFlagUrl = match.awayFlag || getTeamFlagUrl(awayTeamName);

  const groupName = match.group || 'A';
  const stadium = match.stadium || 'Estadio TBD';

  // Formatear hora en zona horaria local del dispositivo
  const matchDate = new Date(match.date);
  const timeDisplay = matchDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const isLive = match.status === 'LIVE';
  const isFinished = match.status === 'FINISHED' || match.status === 'COMPLETED';
  
  // Check if match is within 5 minutes of starting (lockout period)
  const now = new Date();
  const minutesUntilKickoff = (matchDate.getTime() - now.getTime()) / (1000 * 60);
  const isLockedForKickoff = minutesUntilKickoff <= 5 && minutesUntilKickoff > 0 && !isLive && !isFinished;
  
  // Inputs should be read-only if: finished, live, or within 5 minutes of kickoff
  const isInputLocked = isFinished || isLive || isLockedForKickoff;

  // 2. ESTADO LOCAL PARA INPUTS
  // PRIORIDAD: 1. Sugerencia de IA (match.userH) | 2. Predicción Guardada | 3. Vacío
  const initialHome = (match.userH || match.prediction?.homeScore?.toString() || '');
  const initialAway = (match.userA || match.prediction?.awayScore?.toString() || '');
  
  const [homeScore, setHomeScore] = useState(initialHome);
  const [awayScore, setAwayScore] = useState(initialAway);

  // Sincronizar estado local si cambian las props DESDE AFUERA (IA o DB)
  React.useEffect(() => {
    const newHome = match.userH || (match.prediction?.homeScore !== undefined ? match.prediction.homeScore.toString() : '');
    const newAway = match.userA || (match.prediction?.awayScore !== undefined ? match.prediction.awayScore.toString() : '');
    const newJoker = !!(match.prediction?.isJoker || (match.prediction as any)?.isJoker || match.isJoker);

    const isIncomingEmpty = newHome === '' && newAway === '';
    
    // Sincronizar siempre si hay cambios, quitamos la guarda que bloqueaba el borrado
    if (newHome !== homeScore) setHomeScore(newHome);
    if (newAway !== awayScore) setAwayScore(newAway);
    
    if (newJoker !== isJoker) setIsJoker(newJoker);
  }, [match.prediction?.homeScore, match.prediction?.awayScore, match.prediction?.isJoker, match.userH, match.userA, match.isJoker]); // eslint-disable-line react-hooks/exhaustive-deps

  // Estado local Joker
  const [isJoker, setIsJoker] = useState(!!(match.prediction?.isJoker || (match.prediction as any)?.isJoker || match.isJoker));

  const handleInputChange = (value: any, setter: any) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 2);
    setter(cleaned);
  };

  const handleBlur = () => {
    // Solo actuamos si AMBOS campos están vacíos (Borrar)
    // O si AMBOS campos tienen valor (Guardar)
    const h = homeScore.trim();
    const a = awayScore.trim();

    if (h === '' && a === '') {
      // Intención de borrar: Mandamos nulls al padre
      if (onSavePrediction) onSavePrediction(match.id, null, null);
      return;
    }

    if (h !== '' && a !== '' && onSavePrediction) {
      // Guardar marcador completo
      onSavePrediction(match.id, h, a, isJoker);
    }
    
    // Si uno está lleno y otro vacío, no hacemos nada (marcadores incompletos no se guardan)
  };

  const toggleJoker = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isInputLocked) return;
    const newState = !isJoker;
    setIsJoker(newState);
    // Guardar el cambio del joker inmediatamente si hay marcador
    if (homeScore !== '' && awayScore !== '' && onSavePrediction) {
      onSavePrediction(match.id, homeScore, awayScore, newState);
    }
  };

  // 3. LÓGICA DE PUNTOS Y COLORES (OPTIMISTIC UI)
  const calculateOptimisticPoints = () => {
    // Si no está finalizado, mostramos lo que venga de BD (o 0)
    if (!isFinished) return match.prediction?.points ?? match.points ?? 0;

    // Si está finalizado, calculamos localmente para evitar lag visual
    // Usamos los valores de la predicción guardada vs el score del partido
    const mH = Number(match.scoreH);
    const mA = Number(match.scoreA);
    const pH = Number(match.prediction?.homeScore); 
    const pA = Number(match.prediction?.awayScore);

    // Validación de seguridad
    if (isNaN(pH) || isNaN(pA) || isNaN(mH) || isNaN(mA)) return 0;

    let pts = 0;
    
    // 1. Goles Individuales (+1 c/u)
    if (mH === pH) pts += 1;
    if (mA === pA) pts += 1;

    // 2. Resultado (+2)
    const signM = Math.sign(mH - mA);
    const signP = Math.sign(pH - pA);
    if (signM === signP) pts += 2;

    // 3. Marcador Exacto (+3)
    if (mH === pH && mA === pA) pts += 3;

    // Verificar Joker guardado
    const jokerActive = !!(match.prediction?.isJoker || (match.prediction as any)?.isJoker || match.isJoker || isJoker);
    if (jokerActive) pts *= 2;

    return pts;
  };

  const points = calculateOptimisticPoints();
  const hasWon = points > 0;

  const inputBorderColor = isFinished
    ? (hasWon ? '#00E676' : '#FF1744')
    : '#475569';

  const resultColor = hasWon ? '#00E676' : '#FF1744';

  // Calculo Desglose Simplificado (Frontend Visual)
  const getBreakdown = () => {
    if (!isFinished || points === 0) return '';
    const h = match.scoreH;
    const a = match.scoreA;
    const pH = match.prediction?.homeScore;
    const pA = match.prediction?.awayScore;

    // Si no tenemos todos los datos, retornamos vacío
    if (h == null || a == null || pH == null || pA == null) return '';

    let parts = [];
    // Exacto
    if (h === pH && a === pA) parts.push('Exacto +3');
    // Ganador
    if (Math.sign(h - a) === Math.sign(pH - pA)) parts.push('Resultado +2');

    // Goles
    if (h === pH) parts.push('Gol L +1');
    if (a === pA) parts.push('Gol V +1');

    // Joker
    if (match.prediction?.isJoker || isJoker) parts.push('Joker x2');

    return `(${parts.join(', ')})`;
  };
  const breakdownText = getBreakdown();

  // 4. ESTILOS BLINDADOS (CSS-IN-JS)
  const STYLES = {
    wrapper: {
      display: 'flex',
      justifyContent: 'center',
      width: '100%',
      marginBottom: '16px',
    },
    card: {
      backgroundColor: 'var(--brand-secondary, #1E293B)',
      borderRadius: '16px',
      border: '1px solid var(--brand-accent, #334155)',
      overflow: 'hidden',
      width: '100%',
      maxWidth: '340px',
      boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
      display: 'flex',
      flexDirection: 'column' as const,
      position: 'relative' as const
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      padding: '12px 16px 0 16px',
    },
    infoBtn: {
      color: 'var(--brand-text, #94A3B8)',
      cursor: 'pointer',
      padding: '4px',
      opacity: 0.6
    },
    metaData: {
      textAlign: 'right' as const,
      fontSize: '10px',
      fontWeight: 'bold',
      letterSpacing: '1px',
      lineHeight: '1.4'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1.2fr 1fr',
      alignItems: 'center',
      padding: '10px 12px 20px 12px',
    },
    teamCol: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
    },
    teamCode: {
      fontFamily: 'sans-serif',
      fontWeight: '900',
      fontSize: '22px',
      color: 'var(--brand-heading, #F8FAFC)',
      textShadow: '0 2px 4px rgba(0,0,0,0.5)',
    },
    flag: {
      height: '24px',
      width: 'auto',
      borderRadius: '3px',
      boxShadow: '0 2px 5px rgba(0,0,0,0.5)',
      objectFit: 'cover' as const
    },
    inputs: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '8px',
      flexDirection: 'column' as const,
    },
    inputRow: {
      display: 'flex',
      gap: '8px',
      alignItems: 'center',
    },
    inputBox: {
      width: '40px',
      height: '40px',
      backgroundColor: 'var(--brand-bg, #0F172A)',
      border: `2px solid ${inputBorderColor}`,
      borderRadius: '8px',
      color: 'var(--brand-text, white)',
      textAlign: 'center' as const,
      fontSize: '18px',
      fontWeight: 'bold',
      outline: 'none',
    },
    liveIndicator: {
      fontSize: '9px',
      color: '#FF1744',
      fontWeight: 'bold',
      letterSpacing: '1px',
      marginTop: '4px',
    },
    footerBar: {
      width: '100%',
      backgroundColor: resultColor,
      color: 'var(--brand-bg, #0F172A)',
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: 'center',
      alignItems: 'center',
      padding: '6px 0',
      marginTop: 'auto',
      minHeight: '40px'
    },
    scoreText: {
      fontSize: '14px',
      fontWeight: '900',
      lineHeight: '1',
      marginBottom: '2px',
      letterSpacing: '1px'
    },
    pointsText: {
      fontSize: '10px',
      fontWeight: '800',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
      opacity: 0.9
    },
    jokerBtn: {
      marginTop: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '5px 10px',
      borderRadius: '12px',
      backgroundColor: isJoker ? '#FFD700' : 'rgba(255, 255, 255, 0.05)',
      border: isJoker ? '1px solid #FFD700' : '1px solid var(--brand-accent, #334155)',
      color: isJoker ? '#0F172A' : 'var(--brand-text, #64748B)',
      fontSize: '10px',
      fontWeight: 'bold',
      cursor: isFinished ? 'default' : 'pointer',
      transition: 'all 0.2s',
      textTransform: 'uppercase' as const,
      boxShadow: isJoker ? '0 0 10px rgba(255, 215, 0, 0.4)' : 'none'
    }
  };

  return (
    <div style={STYLES.wrapper}>
      <div style={STYLES.card}>

        {/* HEADER */}
        <div style={STYLES.header}>
          <div style={STYLES.infoBtn} onClick={(e) => { e.stopPropagation(); onOpenInfo?.(); }}>
            <Info size={18} />
          </div>
          <div style={STYLES.metaData}>
            <div style={{ color: '#00E676' }}>
              {(() => {
                // Priority 1: Use group field if it's a custom label (not a single letter)
                if (groupName && groupName.length > 1 && !['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].includes(groupName)) {
                  // Extremely permissive check for UCL or any knockout match with LEG_1/LEG_2
                  const tid = (match.tournamentId || match.tournament_id || '').toString().toUpperCase();
                  const isUCL = tid.includes('UCL') || tid.includes('CHAMPIONS');
                  
                  if (isUCL || groupName.startsWith('LEG_')) {
                    if (groupName === 'LEG_1') return 'OCTAVOS - IDA';
                    if (groupName === 'LEG_2') return 'OCTAVOS - VUELTA';
                  }
                  return groupName;
                }

                const d = new Date(match.date);
                const month = d.getMonth(); // 0 = Jan, 1 = Feb, 2 = Mar
                const isUCL = match.tournamentId === 'UCL2526' || (d.getFullYear() === 2026 && (month === 1 || month === 2));

                // Lógica específica para UCL
                if (isUCL) {
                    if (month === 1) return "PLAY OFF IDA";
                    if (month === 2) return "PLAY OFF VUELTA";
                    if (match.phase === 'ROUND_16') return "OCTAVOS DE FINAL";
                }
                
                // Default
                return groupName.length > 4 ? groupName : `GRUPO ${groupName}`;
              })()}
            </div>
            {!isLive && (
            <div style={{ 
              color: '#94A3B8', 
              fontWeight: 'normal',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {formatMatchDate(match.date)}
            </div>
            )}
            {stadium && stadium !== 'Estadio TBD' && (
                <div style={{ color: '#64748B', fontSize: '9px', marginTop: '2px' }}>
                {stadium}
                </div>
            )}
          </div>
        </div>

        {/* ZONA DE JUEGO */}
        <div style={STYLES.grid}>

          {/* Local */}
          <div style={STYLES.teamCol}>
            <span style={STYLES.teamCode}>{homeCode}</span>
            <img
              src={homeFlagUrl}
              alt={homeCode}
              style={STYLES.flag}
              referrerPolicy="no-referrer"
              onError={(e: any) => { e.target.onerror = null; e.target.src = "https://flagcdn.com/w40/un.png"; }}
            />
            {/* Nombre Completo / Placeholder */}
            <span style={{ fontSize: '8px', color: '#94A3B8', marginTop: '4px', maxWidth: '70px', textAlign: 'center', lineHeight: '1.2', textTransform: 'uppercase', fontWeight: 'bold' }}>
              {homeTeamName}
            </span>
          </div>

          {/* Marcador / Inputs */}
          <div style={STYLES.inputs}>
            {isLive ? (
              <>
                <span style={{ fontSize: '32px', color: '#00E676', fontWeight: 'bold', letterSpacing: '-1px' }}>
                  {match.scoreH || 0}-{match.scoreA || 0}
                </span>
                <div style={STYLES.liveIndicator}>
                  🔴 {match.minute === 'HT' ? 'ENTRETIEMPO' : `EN VIVO ${match.minute ? `${match.minute}'` : ''}`}
                </div>
              </>
            ) : (
              <>
                <div style={STYLES.inputRow}>
                  <input
                    type="tel"
                    maxLength={2}
                    value={homeScore}
                    onChange={(e) => handleInputChange(e.target.value, setHomeScore)}
                    onBlur={handleBlur}
                    readOnly={isInputLocked}
                    style={STYLES.inputBox}
                  />
                  <span style={{ color: '#64748B', fontWeight: 'bold' }}>-</span>
                  <input
                    type="tel"
                    maxLength={2}
                    value={awayScore}
                    onChange={(e) => handleInputChange(e.target.value, setAwayScore)}
                    onBlur={handleBlur}
                    readOnly={isInputLocked}
                    style={STYLES.inputBox}
                  />
                </div>

                {/* JOKER BUTTON */}
                {!isInputLocked ? (
                  <button style={STYLES.jokerBtn} onClick={toggleJoker} title="Usar Comodín (x2 Puntos)">
                    <Star size={12} fill={isJoker ? "#0F172A" : "none"} strokeWidth={isJoker ? 0 : 2} />
                    {isJoker ? 'COMODÍN ACTIVO' : 'COMODÍN'}
                  </button>
                ) : (
                  isJoker && (
                    <div style={{ ...STYLES.jokerBtn, cursor: 'default', opacity: 1 }}>
                      <Star size={12} fill="#0F172A" strokeWidth={0} /> x2
                    </div>
                  )
                )}
              </>
            )}
          </div>

          {/* Visitante */}
          <div style={STYLES.teamCol}>
            <span style={STYLES.teamCode}>{awayCode}</span>
            <img
              src={awayFlagUrl}
              alt={awayCode}
              style={STYLES.flag}
              referrerPolicy="no-referrer"
              onError={(e: any) => { e.target.onerror = null; e.target.src = "https://flagcdn.com/w40/un.png"; }}
            />
            {/* Nombre Completo / Placeholder */}
            <span style={{ fontSize: '8px', color: '#94A3B8', marginTop: '4px', maxWidth: '70px', textAlign: 'center', lineHeight: '1.2', textTransform: 'uppercase', fontWeight: 'bold' }}>
              {awayTeamName}
            </span>
          </div>
        </div>

        {/* BARRA RESULTADO (Solo si terminó) - MUESTRA RESULTADO Y PUNTOS */}
        {isFinished && (
          <div style={STYLES.footerBar}>
            {/* Arriba: Marcador */}
            <div style={STYLES.scoreText}>
              {match.scoreH} - {match.scoreA}
            </div>

            {/* Abajo: Puntos obtenidos */}
            <div style={STYLES.pointsText}>
              {hasWon ? `+${points} PTS` : '0 PTS'} <span style={{ marginLeft: '4px', opacity: 0.7, fontWeight: 'normal', textTransform: 'none', fontSize: '9px' }}>{breakdownText}</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}