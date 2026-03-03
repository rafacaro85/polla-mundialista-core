import React, { useState, useEffect, useMemo } from 'react';
import { Save, RefreshCw, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useTournament } from '@/hooks/useTournament'; // Import hook
import { TournamentPodium } from './TournamentPodium';

import { getTeamFlagUrl } from '@/shared/utils/flags';

/* =============================================================================
   INTERFACES
   ============================================================================= */
interface Match {
    id: string;
    homeTeam: string;
    awayTeam: string;
    homeTeamPlaceholder?: string;
    awayTeamPlaceholder?: string;
    homeScore?: number | null;
    awayScore?: number | null;
    phase?: string;
    group?: string; // A,B,C para grupos; LEG_1, LEG_2 para Champions ida/vuelta
    bracketId?: number;
    status?: string;
    homeFlag?: string;
    awayFlag?: string;
    nextMatchId?: string;
    date: string;
}

/* =============================================================================
   2. COMPONENTES DE APOYO
   ============================================================================= */

import { CheckCircle2, XCircle } from 'lucide-react';

interface MatchNodeProps {
    matchId: string;
    team1: string;
    team2: string;
    placeholder1?: string;
    placeholder2?: string;
    winner?: string;
    onPickWinner: (matchId: string, team: string) => void;
    getTeamFlag: (team: string) => string;
    nextId?: string | null;
    isLocked?: boolean;
    isFinished?: boolean;
    correctWinner?: string | null;
}

const MatchNode = ({
    matchId, team1, team2, placeholder1, placeholder2,
    winner, onPickWinner, getTeamFlag, nextId, isLocked, isFinished, correctWinner
}: MatchNodeProps) => {
    const displayTeam1 = (team1 && team1 !== 'LOC' && team1 !== 'TBD') ? team1 : '-';
    const displayTeam2 = (team2 && team2 !== 'VIS' && team2 !== 'TBD') ? team2 : '-';

    const handlePick = (team: string) => {
        if (isLocked) {
            toast.error("El tiempo para pronosticar esta fase ha expirado");
            return;
        }
        onPickWinner(matchId, team);
    };

    const getStatusColor = (team: string) => {
        // Loose comparison: Ensure both are strings and trimmed
        const isSelected = winner && String(winner).trim() === String(team).trim();
        
        if (!isSelected) return 'bg-[var(--brand-secondary,#1E293B)]/80 text-slate-300'; // No selected or other team
        
        if (isFinished && correctWinner) {
            return correctWinner === team 
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' // WON
                : 'bg-red-500/20 text-red-400 border-red-500/50'; // LOST
        }
        
        return 'bg-[var(--brand-primary,#00E676)]/20 text-[var(--brand-primary,#00E676)]'; // Pending/Selected
    };

    return (
        <div className="relative flex flex-col justify-center my-1 select-none">
            <div className="bg-transparent border border-slate-700 rounded-md overflow-hidden w-32 shadow-md z-10 backdrop-blur-sm">
                {/* EQUIPO 1 */}
                <button
                    onClick={() => handlePick(displayTeam1)}
                    disabled={isLocked}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 border-b border-slate-700/50 transition-colors ${getStatusColor(displayTeam1)} ${isLocked ? 'cursor-not-allowed opacity-80' : 'hover:bg-slate-700/50'}`}
                >
                    {displayTeam1 !== '-' && <img src={getTeamFlag(displayTeam1)} alt={displayTeam1} className="w-4 h-3 object-cover rounded-[1px] opacity-90" />}
                    <span className="text-[9px] font-bold truncate text-left flex-1">
                        {displayTeam1}
                    </span>
                    {winner && String(winner).trim() === String(displayTeam1).trim() && (
                        isFinished && correctWinner ? (
                            correctWinner === displayTeam1 ? <CheckCircle2 size={12} /> : <XCircle size={12} />
                        ) : <div className="w-1.5 h-1.5 rounded-full bg-current shadow-sm" />
                    )}
                </button>

                {/* EQUIPO 2 */}
                <button
                    onClick={() => handlePick(displayTeam2)}
                    disabled={isLocked}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 transition-colors ${getStatusColor(displayTeam2)} ${isLocked ? 'cursor-not-allowed opacity-80' : 'hover:bg-slate-700/50'}`}
                >
                    {displayTeam2 !== '-' && <img src={getTeamFlag(displayTeam2)} alt={displayTeam2} className="w-4 h-3 object-cover rounded-[1px] opacity-90" />}
                    <span className="text-[9px] font-bold truncate text-left flex-1">
                        {displayTeam2}
                    </span>
                    {winner && String(winner).trim() === String(displayTeam2).trim() && (
                        isFinished && correctWinner ? (
                            correctWinner === displayTeam2 ? <CheckCircle2 size={12} /> : <XCircle size={12} />
                        ) : <div className="w-1.5 h-1.5 rounded-full bg-current shadow-sm" />
                    )}
                </button>
            </div>

        </div>
    );
};

interface BracketViewProps {
    matches: Match[];
    leagueId?: string;
}

/* =============================================================================
   3. COMPONENTE PRINCIPAL: KNOCKOUT VIEW
   ============================================================================= */
export const BracketView: React.FC<BracketViewProps> = (props) => {
    const { matches, leagueId } = props;
    const { tournamentId } = useTournament();

    // ESTADO: Guardamos quién ganó cada partido
    const [winners, setWinners] = useState<Record<string, string>>({});
    const [bracketPoints, setBracketPoints] = useState(0);
    const [loading, setLoading] = useState(true);

    // MAPA DE BANDERAS: Construimos un mapa de TeamName -> FlagURL basado en los partidos recibidos
    // Esto asegura que usemos las mismas banderas que en el resto de la app
    const teamFlags = useMemo(() => {
        const map: Record<string, string> = {};
        matches.forEach(m => {
            if (m.homeTeam && m.homeFlag) map[m.homeTeam] = m.homeFlag;
            if (m.awayTeam && m.awayFlag) map[m.awayTeam] = m.awayFlag;
        });
        return map;
    }, [matches]);

    const getTeamFlag = (teamName: string) => {
        return getTeamFlagUrl(teamName);
    };

    // FETCH PROPIO DEL BRACKET: Traer TODOS los partidos de la llave
    // (no depender de /matches/live que solo trae fases desbloqueadas)
    // Esto garantiza que CUARTOS/SEMI/FINAL aparezcan en el bracket 
    // aunque aún no estén desbloqueados para predicciones.
    const [allBracketMatches, setAllBracketMatches] = useState<Match[]>([]);

    useEffect(() => {
        if (!tournamentId) return;
        const fetchAllMatches = async () => {
            try {
                const { data } = await api.get(`/matches?tournamentId=${tournamentId}`);
                if (Array.isArray(data) && data.length > 0) {
                    setAllBracketMatches(data);
                }
            } catch (err) {
                console.error('[BracketView] Error fetching bracket matches:', err);
            }
        };
        fetchAllMatches();
    }, [tournamentId]);

    // Usar allBracketMatches si ya cargaron, si no usar el prop matches como fallback
    const effectiveMatches = allBracketMatches.length > 0 ? allBracketMatches : matches;

    // Cargar bracket guardado desde la API
    // Usamos useTournament para saber en qué contexto estamos (WC2026 o UCL2526)
    
    useEffect(() => {
        if (!tournamentId) return;

        const loadBracket = async () => {
            try {
                // Si estamos en una liga, intentamos cargar el bracket de esa liga (o el global como fallback)
                let url = leagueId ? `/brackets/me?leagueId=${leagueId}` : '/brackets/me';
                
                // CRITICAL: Append tournamentId to isolate data
                const separator = url.includes('?') ? '&' : '?';
                url += `${separator}tournamentId=${tournamentId}`;

                const { data } = await api.get(url);
                
                if (data && data.picks) {
                    const pickKeys = Object.keys(data.picks);
                    
                    // Force Keys to String to avoid Type Mismatch
                    const normalizedPicks: Record<string, string> = {};
                    pickKeys.forEach(key => {
                        normalizedPicks[String(key)] = data.picks[key];
                    });
                    
                    setWinners(normalizedPicks);
                    setBracketPoints(data.points || 0);
                } else {
                    // Reset if no data for this tournament
                    setWinners({});
                    setBracketPoints(0);
                }
            } catch (error) {
                console.error("Error loading bracket:", error);
                setWinners({});
                setBracketPoints(0);
            } finally {
                setLoading(false);
            }
        };

        loadBracket();
    }, [leagueId, tournamentId]);

    // --- LÓGICA DE BLOQUEO ---
    const lockDate = useMemo(() => {
        // En WC2026 el torneo inicia en ROUND_32. En UCL inicia en ROUND_16.
        // Buscamos el primer partido disponible para el bloqueo global.
        const r32 = effectiveMatches.filter(m => m.phase === 'ROUND_32');
        const r16 = effectiveMatches.filter(m => m.phase === 'ROUND_16');
        
        const relevantMatches = r32.length > 0 ? r32 : r16;
        if (relevantMatches.length === 0) return null;
        
        const dates = relevantMatches.map(m => new Date(m.date).getTime()).filter(d => !isNaN(d));
        if (dates.length === 0) return null;
        
        // El bloqueo ocurre 30 minutos antes del primer partido
        return new Date(Math.min(...dates) - (30 * 60 * 1000));
    }, [effectiveMatches]);

    const isLocked = useMemo(() => {
        if (!lockDate) return false;
        return new Date() > lockDate;
    }, [lockDate]);

    // Filtrar partidos por ronda - Usando IDs reales para evitar desajustes
    const getMatchesByPhase = (phase: string) => {
        return effectiveMatches
            .filter(m => {
                const isPhaseMatch = m.phase === phase;
                if (!isPhaseMatch) return false;

                // Si es UCL (o tiene LEG_1/LEG_2), solo mostrar LEG_1 en el bracket
                // para evitar duplicados en la visualización lineal.
                const group = (m as any).group || '';
                if (group.startsWith('LEG_') && group !== 'LEG_1') {
                    return false;
                }
                
                return true;
            })
            .sort((a, b) => (a.bracketId || 0) - (b.bracketId || 0));
    };

    const r32Matches = useMemo(() => getMatchesByPhase('ROUND_32'), [effectiveMatches]);
    const r16Matches = useMemo(() => getMatchesByPhase('ROUND_16'), [effectiveMatches]);
    // UCL usa 'QUARTER_FINAL', WC usa 'QUARTER' — incluimos ambos
    const quarterMatches = useMemo(() => [
        ...getMatchesByPhase('QUARTER'),
        ...getMatchesByPhase('QUARTER_FINAL'),
    ].sort((a, b) => (a.bracketId || 0) - (b.bracketId || 0)), [effectiveMatches]);
    // UCL usa 'SEMI_FINAL', WC usa 'SEMI' — incluimos ambos
    const semiMatches = useMemo(() => [
        ...getMatchesByPhase('SEMI'),
        ...getMatchesByPhase('SEMI_FINAL'),
    ].sort((a, b) => (a.bracketId || 0) - (b.bracketId || 0)), [effectiveMatches]);
    const finalMatches = useMemo(() => getMatchesByPhase('FINAL'), [effectiveMatches]);
    const thirdPlaceMatches = useMemo(() => getMatchesByPhase('3RD_PLACE'), [effectiveMatches]);

    const getActualWinner = (match: Match) => {
        // LEG_1: el ganador real es el del AGREGADO, no del partido único
        // Solo mostramos resultado cuando la VUELTA (LEG_2) también terminó
        if ((match as any).group === 'LEG_1') {
            // Buscar el partido de vuelta (mismo phase y bracketId, group=LEG_2)
            const leg2 = effectiveMatches.find(m =>
                (m as any).group === 'LEG_2' &&
                m.phase === match.phase &&
                m.bracketId === match.bracketId
            );
            // Si la vuelta no terminó, aún no sabemos el ganador
            if (!leg2 || (leg2.status !== 'FINISHED' && leg2.status !== 'COMPLETED')) return null;
            if (leg2.homeScore === null || leg2.awayScore === null) return null;
            if (match.homeScore === null || match.awayScore === null) return null;

            // Calcular goles totales de la IDA
            // LEG_1: TeamA(home) vs TeamB(away)
            // LEG_2: TeamB(home) vs TeamA(away)  ← equipos invertidos
            const teamAGoals = (match.homeScore ?? 0) + (leg2.awayScore ?? 0);
            const teamBGoals = (match.awayScore ?? 0) + (leg2.homeScore ?? 0);

            if (teamAGoals > teamBGoals) return match.homeTeam; // TeamA gana
            if (teamBGoals > teamAGoals) return match.awayTeam; // TeamB gana
            return null; // Empate total (penales)
        }

        if (match.status !== 'FINISHED' && match.status !== 'COMPLETED') return null;
        if (typeof match.homeScore === 'number' && typeof match.awayScore === 'number') {
            if (match.homeScore > match.awayScore) return match.homeTeam;
            if (match.awayScore > match.homeScore) return match.awayTeam;
        }
        return null; 
    };

    // LÓGICA DE FASES SECUENCIALES (PHASE BY PHASE)
    const phasesStatus = useMemo(() => {
        const isFinished = (list: Match[]) => list.length > 0 && list.every(m => m.status === 'FINISHED' || m.status === 'COMPLETED');
        
        const r32Finished = isFinished(r32Matches);
        const r16Finished = isFinished(r16Matches);
        const quarterFinished = isFinished(quarterMatches);
        const semiFinished = isFinished(semiMatches);

        // Si NO hay partidos de ROUND_32, ROUND_16 es la fase inicial y debe estar abierta.
        const hasR32 = r32Matches.length > 0;

        // Una fase está abierta SOLO si la anterior terminó.
        return {
            ROUND_32: true, 
            ROUND_16: !hasR32 || r32Finished,
            QUARTER: r16Finished,
            QUARTER_FINAL: r16Finished,  // UCL alias
            SEMI: quarterFinished,
            SEMI_FINAL: quarterFinished, // UCL alias
            FINAL: semiFinished,
            '3RD_PLACE': semiFinished
        };
    }, [r32Matches, r16Matches, quarterMatches, semiMatches]);

    const isMatchLocked = (match: Match) => {
        // 1. Bloqueo Global por Tiempo (30 min antes del primer partido del torneo)
        if (isLocked) return true;

        // 2. Bloqueo Secuencial (Fase por Fase)
        // Si la fase anterior NO ha terminado, esta fase está BLOQUEADA.
        if (match.phase && phasesStatus[match.phase as keyof typeof phasesStatus] === false) {
            return true;
        }

        return false;
    };

    // LÓGICA DE PROPAGACIÓN: Obtenemos el equipo que debe mostrarse en cada slot
    const getTeamForSlot = (match: Match, side: 'home' | 'away') => {
        // 1. PRIMERO: Si el backend ya promovió un equipo real a este slot, tiene prioridad absoluta.
        // Esto evita que la predicción del usuario sobreescriba al ganador real.
        const realTeam = side === 'home' ? match.homeTeam : match.awayTeam;
        if (realTeam && realTeam.trim() !== '' && realTeam !== 'LOC' && realTeam !== 'VIS' && realTeam !== 'TBD' && !realTeam.match(/^W\d+$/)) {
            return realTeam;
        }

        // 2. SÓLO si el slot está vacío (aún no se sabe el ganador), mostramos la
        // predicción visual del usuario como preview.
        const sourceMatch = effectiveMatches.find(m => 
            (m as any).nextMatchId === match.id && 
            (side === 'home' ? (m.bracketId || 0) % 2 !== 0 : (m.bracketId || 0) % 2 === 0)
        );
        if (sourceMatch && winners[sourceMatch.id]) {
            return winners[sourceMatch.id];
        }

        return undefined;
    };

    // FUNCIÓN: Seleccionar Ganador
    const pickWinner = (matchId: string, teamCode: string) => {
        if (isLocked) return;
        setWinners(prev => ({ ...prev, [matchId]: teamCode }));
    };

    // FUNCIÓN: Guardar Bracket
    const handleSaveBracket = async () => {
        if (isLocked) {
            toast.error("El tiempo para guardar tu bracket ha expirado");
            return;
        }
        try {
            const { data } = await api.post('/brackets', {
                picks: winners,
                tournamentId: tournamentId, // CRITICAL: Save to correct tournament
                leagueId: leagueId // Fix: Pass the current league context so we save to the correct bracket (league vs global)
            });
            setBracketPoints(data.points || 0);
            toast.success('Bracket guardado exitosamente! 🏆');
        } catch (e: any) {
            console.error('Error saving bracket:', e);
            toast.error(e.response?.data?.message || 'Error al guardar bracket');
        }
    };

    // FUNCIÓN: Limpiar Bracket
    const clearBracket = async () => {
        if (isLocked) return;
        if (confirm("¿Estás seguro de borrar todo tu bracket?")) {
            try {
                let url = leagueId ? `/brackets/me?leagueId=${leagueId}` : '/brackets/me';
                const separator = url.includes('?') ? '&' : '?';
                url += `${separator}tournamentId=${tournamentId}`;
                
                await api.delete(url);
                setWinners({});
                setBracketPoints(0);
                toast.info('Bracket reiniciado exitosamente');
            } catch (e) {
                console.error('Error clearing bracket:', e);
                toast.error('Error al limpiar bracket');
            }
        }
    };

    if (loading) {
        return <div className="text-center p-8 text-white">Cargando bracket...</div>;
    }

    const champion = winners[finalMatches[0]?.id || ''];

    return (
        <div 
            className="min-h-screen text-white font-sans pb-32"
            style={{ backgroundColor: 'var(--brand-bg, #0F172A)' }}
        >

            {/* HEADER INSTRUCCIONES & ACCIONES */}
            <div 
                className="p-6 pt-24 sticky top-0 backdrop-blur z-30 border-b"
                style={{ 
                    backgroundColor: 'color-mix(in srgb, var(--brand-bg, #0F172A), transparent 5%)',
                    borderColor: 'var(--brand-accent, #334155)'
                }}
            >
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <h2 className="font-russo text-xl uppercase text-white mb-1">Llaves del Torneo</h2>
                        <p className="text-[10px] text-[#94A3B8] max-w-[200px] leading-tight">
                            {isLocked
                                ? "El tiempo para pronosticar ha expirado."
                                : "Haz clic en los equipos para avanzar de ronda."}
                        </p>
                    </div>

                    {/* INFO PUNTOS BRACKET */}
                    <div className="bg-slate-800/50 border border-slate-700 px-3 py-2 rounded-lg text-center">
                        <span className="text-[9px] text-[#94A3B8] block font-bold uppercase tracking-widest">Puntos</span>
                        <span className="font-russo text-lg" style={{ color: 'var(--brand-primary, #00E676)' }}>{bracketPoints}</span>
                    </div>
                </div>

                {/* LOCK STATUS WARNING */}
                {isLocked && (
                    <div className="mb-4 p-2 bg-red-500/10 border border-red-500/30 rounded text-[10px] text-red-400 font-bold uppercase text-center">
                        🔒 Pronósticos cerrados desde {lockDate?.toLocaleString()}
                    </div>
                )}

                {/* BOTONES DE ACCIÓN */}
                {!isLocked && (
                    <div className="flex gap-3">
                        <button
                            onClick={handleSaveBracket}
                            className="flex-1 py-2 rounded-lg font-black text-xs uppercase flex items-center justify-center gap-2 transition-all active:scale-95"
                            style={{ 
                                backgroundColor: 'var(--brand-primary, #00E676)',
                                color: 'var(--brand-bg, #0F172A)',
                                boxShadow: '0 0 15px rgba(0,230,118,0.2)'
                            }}
                        >
                            <Save size={14} /> Guardar ({Object.keys(winners).length})
                        </button>
                        <button
                            onClick={clearBracket}
                            className="px-4 bg-transparent border border-slate-600 text-[#94A3B8] hover:text-white hover:border-slate-400 rounded-lg font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                            <RefreshCw size={14} /> Limpiar
                        </button>
                    </div>
                )}
            </div>

            {/* ZONA DE BRACKET (SCROLLABLE) */}
            <div className="overflow-x-auto p-4 custom-scrollbar">
                <div className="flex items-start gap-0 min-w-max pb-10 pl-2">

                    {(() => {
                        const cols: { label: string; matches: Match[] }[] = [];
                        if (r32Matches.length > 0) cols.push({ label: 'Dieciseisavos', matches: r32Matches });
                        if (r16Matches.length > 0) cols.push({ label: 'Octavos', matches: r16Matches });
                        if (quarterMatches.length > 0) cols.push({ label: 'Cuartos', matches: quarterMatches });
                        if (semiMatches.length > 0) cols.push({ label: 'Semis', matches: semiMatches });

                        // ── constantes de layout ────────────────────────────
                        const CARD_H   = 62;   // altura real del MatchNode (2 filas × ~31px)
                        const CARD_W   = 128;  // w-32
                        const PAIR_GAP = 16;   // px entre las dos tarjetas de una misma llave
                        const SLOT_GAP = 40;   // px entre slots de rondas anteriores q se unen
                        // altura de 1 slot en la columna 0 (ronda más a la izq)
                        // = 2 tarjetas + gap interno. Cada ronda siguiente merges 2 slots.
                        const BASE_SLOT = CARD_H * 2 + PAIR_GAP;
                        const LINE_W   = 28;   // ancho del conector horizontal inter-columnas
                        const LC       = 'rgba(148,163,184,0.35)'; // color línea

                        // Altura del slot para la columna colIdx
                        // Col 0 → BASE_SLOT, col 1 → (BASE_SLOT+SLOT_GAP)*2-SLOT_GAP, ...
                        const slotH = (colIdx: number): number => {
                            // col 0: el par vive en BASE_SLOT
                            // col 1: dos slots col0 + SLOT_GAP entre ellos
                            // col 2: dos slots col1 + SLOT_GAP entre ellos
                            if (colIdx === 0) return BASE_SLOT;
                            return slotH(colIdx - 1) * 2 + SLOT_GAP;
                        };

                        // total height of a column = numPairs × slotH + (numPairs-1) × SLOT_GAP
                        // like: pairs*slotH(c) + (pairs-1)*SLOT_GAP  but since slotH already
                        // nests SLOT_GAP the formula simplifies: total = numPairs × slotH(c) + (numPairs-1)*SLOT_GAP
                        // For col 0 with 8 pairs: 8*(62*2+16)+(7*40)= 8*140+280=1400
                        // For col 1 with 4 pairs: 4*(140*2+40)+(3*40)=4*320+120=1400 ✓

                        const makeNode = (m: Match) => (
                            <MatchNode
                                key={m.id}
                                matchId={m.id}
                                team1={getTeamForSlot(m, 'home') || ''}
                                team2={getTeamForSlot(m, 'away') || ''}
                                placeholder1={m.homeTeamPlaceholder}
                                placeholder2={m.awayTeamPlaceholder}
                                winner={winners[m.id]}
                                onPickWinner={pickWinner}
                                getTeamFlag={getTeamFlag}
                                nextId={(m as any).nextMatchId}
                                isLocked={isMatchLocked(m)}
                                isFinished={m.status === 'FINISHED' || m.status === 'COMPLETED'}
                                correctWinner={getActualWinner(m)}
                            />
                        );

                        const chunkPairs = (arr: Match[]) => {
                            const out: Match[][] = [];
                            for (let i = 0; i < arr.length; i += 2) out.push(arr.slice(i, i + 2));
                            return out;
                        };

                        return cols.map((col, colIdx) => {
                            const pairs = chunkPairs(col.matches);
                            const sh    = slotH(colIdx);          // px height of one slot
                            const isFirst = colIdx === 0;

                            return (
                                <div key={col.label} style={{ display: 'flex', flexDirection: 'column' }}>
                                    {/* Encabezado */}
                                    <div style={{ textAlign: 'center', marginBottom: 16, width: CARD_W + LINE_W }}>
                                        <span style={{ fontSize: 9, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 3, background: '#0F172A', padding: '2px 8px', borderRadius: 4 }}>
                                            {col.label}
                                        </span>
                                    </div>

                                    {pairs.map((pair, gi) => {
                                        const [mA, mB] = pair;

                                        // Y centre of top card inside this slot
                                        const topCardMidY  = CARD_H / 2;
                                        // Y centre of bottom card inside this slot
                                        const botCardMidY  = sh - CARD_H / 2;
                                        // midpoint between those two = where horizontal exits
                                        const exitY        = sh / 2;

                                        return (
                                            <div key={gi} style={{ display: 'flex', flexDirection: 'row', height: sh, marginBottom: gi < pairs.length - 1 ? SLOT_GAP : 0, position: 'relative' }}>

                                                {/* ── incoming horizontal connector ── */}
                                                {!isFirst && (
                                                    <div style={{
                                                        width: LINE_W,
                                                        height: 1.5,
                                                        background: LC,
                                                        alignSelf: 'center',   // centres in the sh height automatically
                                                        flexShrink: 0,
                                                    }} />
                                                )}

                                                {/* ── cards column ── */}
                                                <div style={{ position: 'relative', width: CARD_W, height: sh, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: `${(sh - CARD_H * 2 - PAIR_GAP) / 2}px 0` }}>
                                                    {/* Top card centred in upper half */}
                                                    <div style={{ height: CARD_H }}>
                                                        {makeNode(mA)}
                                                    </div>
                                                    {/* Bottom card */}
                                                    {mB && (
                                                        <div style={{ height: CARD_H }}>
                                                            {makeNode(mB)}
                                                        </div>
                                                    )}

                                                    {/* ── outgoing L connector (SVG) ── */}
                                                    {mB && (
                                                        <svg
                                                            style={{
                                                                position: 'absolute',
                                                                left: CARD_W,
                                                                top: 0,
                                                                width: LINE_W,
                                                                height: sh,
                                                                overflow: 'visible',
                                                                pointerEvents: 'none',
                                                                zIndex: 1,
                                                            }}
                                                        >
                                                            {/* vertical bar between the two card midpoints */}
                                                            <line x1={0} y1={topCardMidY} x2={0} y2={botCardMidY} stroke={LC} strokeWidth="1.5" />
                                                            {/* horizontal tick from top card */}
                                                            <line x1={0} y1={topCardMidY} x2={LINE_W / 2} y2={topCardMidY} stroke={LC} strokeWidth="1.5" />
                                                            {/* horizontal tick from bottom card */}
                                                            <line x1={0} y1={botCardMidY} x2={LINE_W / 2} y2={botCardMidY} stroke={LC} strokeWidth="1.5" />
                                                            {/* vertical join of ticks at half-width */}
                                                            <line x1={LINE_W / 2} y1={topCardMidY} x2={LINE_W / 2} y2={botCardMidY} stroke={LC} strokeWidth="1.5" />
                                                            {/* exit horizontal to right edge = where next column's incoming line starts */}
                                                            <line x1={LINE_W / 2} y1={exitY} x2={LINE_W} y2={exitY} stroke={LC} strokeWidth="1.5" />
                                                        </svg>
                                                    )}
                                                </div>

                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        });
                    })()}

                    {/* ═══════════════ FINAL ═══════════════ */}
                    {(() => {
                        const CARD_H   = 62;
                        const PAIR_GAP = 16;
                        const SLOT_GAP = 40;
                        const BASE_SLOT = CARD_H * 2 + PAIR_GAP;
                        const LINE_W   = 28;
                        const LC       = 'rgba(148,163,184,0.35)';

                        const slotH = (c: number): number => c === 0 ? BASE_SLOT : slotH(c - 1) * 2 + SLOT_GAP;

                        // The Final sits at the level of the Semis column.
                        // Semis has 1 pair → colIdx based on how many round cols exist
                        const numRoundCols = [r32Matches, r16Matches, quarterMatches, semiMatches].filter(a => a.length > 0).length;
                        // semis is the last round col (colIdx = numRoundCols - 1)
                        const semiColIdx = numRoundCols - 1; // e.g. 3 if octavos+cuartos+semis exist
                        const semiSlotH  = slotH(semiColIdx);

                        // Total height of the Semis column = 2 semi pairs × semiSlotH + 1 × SLOT_GAP
                        // (there are 2 semi matches → 1 pair → so 1 slot, no SLOT_GAP between pairs)
                        // Actually semis = 2 matches = 1 pair → height = semiSlotH (one slot, no gap)
                        // But there might be 2 semis pairs (4 teams, 2 matches)? No → 2 matches = 1 pair.
                        // The Final column total height = same as Semis column total
                        const finalColH = semiSlotH; // 1 semi pair

                        return (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {/* Header */}
                                <div style={{ textAlign: 'center', marginBottom: 16, width: 128 + LINE_W }}>
                                    <span style={{ fontSize: 9, fontWeight: 900, color: '#FACC15', textTransform: 'uppercase', letterSpacing: 3, background: 'rgba(250,204,21,0.1)', padding: '2px 8px', borderRadius: 4, border: '1px solid rgba(250,204,21,0.3)' }}>
                                        Final
                                    </span>
                                </div>

                                {/* One slot = same height as one Semis slot so the incoming connector lands at center */}
                                <div style={{ height: finalColH, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                                    {/* incoming from Semis */}
                                    {semiMatches.length > 0 && (
                                        <div style={{ width: LINE_W, height: 1.5, background: LC, flexShrink: 0 }} />
                                    )}

                                    {/* trophy + card */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, width: 128 }}>
                                        <div className={`transition-all duration-500 ${winners[finalMatches[0]?.id || ''] ? 'scale-110 drop-shadow-[0_0_20px_#FACC15]' : 'opacity-30'}`}>
                                            <Trophy size={28} className={winners[finalMatches[0]?.id || ''] ? 'text-[#FACC15]' : 'text-slate-600'} />
                                        </div>

                                        {finalMatches.map(m => (
                                            <MatchNode
                                                key={m.id}
                                                matchId={m.id}
                                                team1={getTeamForSlot(m, 'home') || ''}
                                                team2={getTeamForSlot(m, 'away') || ''}
                                                placeholder1={m.homeTeamPlaceholder}
                                                placeholder2={m.awayTeamPlaceholder}
                                                winner={winners[m.id]}
                                                onPickWinner={pickWinner}
                                                getTeamFlag={getTeamFlag}
                                                nextId={null}
                                                isLocked={isMatchLocked(m)}
                                                isFinished={m.status === 'FINISHED' || m.status === 'COMPLETED'}
                                                correctWinner={getActualWinner(m)}
                                            />
                                        ))}

                                        {winners[finalMatches[0]?.id || ''] && (
                                            <div className="animate-in zoom-in duration-500">
                                                <div className="bg-gradient-to-b from-[#FACC15] to-[#B45309] p-[1px] rounded-lg shadow-[0_0_20px_rgba(250,204,21,0.3)]">
                                                    <div className="bg-[#0F172A] rounded-lg p-3 text-center w-32">
                                                        <p className="text-[8px] text-[#FACC15] font-bold uppercase tracking-widest mb-1">Campeón</p>
                                                        <img src={getTeamFlag(winners[finalMatches[0]?.id || ''])} alt="Champ" className="w-10 h-auto mx-auto rounded shadow-sm mb-1" />
                                                        <p className="font-russo text-sm text-white truncate">{winners[finalMatches[0]?.id || '']}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                </div>
            </div>

            {/* PODIUM */}
            <TournamentPodium matches={effectiveMatches} />

        </div>
    );
};
