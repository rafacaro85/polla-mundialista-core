import React, { useState, useEffect, useMemo } from 'react';
import { Save, RefreshCw, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

/* =============================================================================
   1. HELPER: BANDERAS (FALLBACK)
   ============================================================================= */
const getFallbackFlagUrl = (teamCode: string) => {
    if (!teamCode || teamCode === '-' || teamCode.includes('W32') || teamCode.includes('W16') || teamCode === 'TBD') {
        return "https://flagcdn.com/h24/un.png";
    }
    const codeMap: { [key: string]: string } = {
        'COL': 'co', 'ARG': 'ar', 'BRA': 'br', 'USA': 'us', 'ESP': 'es', 'FRA': 'fr', 'GER': 'de', 'JPN': 'jp',
        'ENG': 'gb-eng', 'POR': 'pt', 'URU': 'uy', 'MEX': 'mx', 'CAN': 'ca', 'MAR': 'ma', 'SEN': 'sn', 'NED': 'nl',
        'ECU': 'ec', 'QAT': 'qa', 'IRN': 'ir', 'WAL': 'gb-wls', 'KOR': 'kr', 'AUS': 'au', 'CRC': 'cr', 'BEL': 'be',
        'CRO': 'hr', 'EGY': 'eg', 'SRB': 'rs', 'SCO': 'gb-sct', 'KSA': 'sa', 'POL': 'pl',
        'Netherlands': 'nl', 'United States': 'us', 'South Korea': 'kr'
    };
    const isoCode = codeMap[teamCode] || teamCode?.substring(0, 2).toLowerCase();
    return `https://flagcdn.com/h24/${isoCode}.png`;
};

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
    bracketId?: number;
    status?: string;
    homeFlag?: string;
    awayFlag?: string;
    nextMatchId?: string;
}

/* =============================================================================
   2. COMPONENTES DE APOYO
   ============================================================================= */

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
}

const MatchNode = ({
    matchId, team1, team2, placeholder1, placeholder2,
    winner, onPickWinner, getTeamFlag, nextId, isLocked
}: MatchNodeProps) => {
    const displayTeam1 = (team1 && team1 !== 'LOC') ? team1 : (placeholder1 || '-');
    const displayTeam2 = (team2 && team2 !== 'VIS') ? team2 : (placeholder2 || '-');

    const handlePick = (team: string) => {
        if (isLocked) {
            toast.error("El tiempo para pronosticar esta fase ha expirado");
            return;
        }
        onPickWinner(matchId, team);
    };

    return (
        <div className="relative flex flex-col justify-center my-1 select-none">
            <div className="bg-transparent border border-slate-700 rounded-md overflow-hidden w-32 shadow-md z-10 backdrop-blur-sm">
                {/* EQUIPO 1 */}
                <button
                    onClick={() => handlePick(displayTeam1)}
                    disabled={isLocked}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 border-b border-slate-700/50 transition-colors ${winner === displayTeam1 ? 'bg-[#00E676]/20' : 'bg-[#1E293B]/80'} ${isLocked ? 'cursor-not-allowed opacity-80' : 'hover:bg-slate-700/50'}`}
                >
                    <img src={getTeamFlag(displayTeam1)} alt={displayTeam1} className="w-4 h-3 object-cover rounded-[1px] opacity-90" />
                    <span className={`text-[9px] font-bold truncate text-left flex-1 ${winner === displayTeam1 ? 'text-[#00E676]' : 'text-slate-300'}`}>
                        {displayTeam1}
                    </span>
                    {winner === displayTeam1 && <div className="w-1 h-1 rounded-full bg-[#00E676] shadow-[0_0_5px_#00E676]" />}
                </button>

                {/* EQUIPO 2 */}
                <button
                    onClick={() => handlePick(displayTeam2)}
                    disabled={isLocked}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 transition-colors ${winner === displayTeam2 ? 'bg-[#00E676]/20' : 'bg-[#1E293B]/80'} ${isLocked ? 'cursor-not-allowed opacity-80' : 'hover:bg-slate-700/50'}`}
                >
                    <img src={getTeamFlag(displayTeam2)} alt={displayTeam2} className="w-4 h-3 object-cover rounded-[1px] opacity-90" />
                    <span className={`text-[9px] font-bold truncate text-left flex-1 ${winner === displayTeam2 ? 'text-[#00E676]' : 'text-slate-300'}`}>
                        {displayTeam2}
                    </span>
                    {winner === displayTeam2 && <div className="w-1 h-1 rounded-full bg-[#00E676] shadow-[0_0_5px_#00E676]" />}
                </button>
            </div>

            {/* CONECTOR (Línea hacia la derecha) */}
            {nextId && (
                <div className={`absolute top-1/2 -right-6 w-6 h-[1px] ${winner ? 'bg-[#00E676] shadow-[0_0_2px_rgba(0,230,118,0.5)]' : 'bg-slate-700'}`}></div>
            )}
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
export const BracketView: React.FC<BracketViewProps> = ({ matches, leagueId }) => {

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
        return teamFlags[teamName] || getFallbackFlagUrl(teamName);
    };

    // Cargar bracket guardado desde la API
    useEffect(() => {
        const loadBracket = async () => {
            try {
                const { data } = await api.get('/brackets/my');
                if (data) {
                    setWinners(data.picks || {});
                    setBracketPoints(data.points || 0);
                }
            } catch (e) {
                console.error('Error loading bracket:', e);
            } finally {
                setLoading(false);
            }
        };
        loadBracket();
    }, []);

    // --- LÓGICA DE BLOQUEO ---
    const lockDate = useMemo(() => {
        const r32 = matches.filter(m => m.phase === 'ROUND_32');
        if (r32.length === 0) return null;
        const dates = r32.map(m => new Date(m.date).getTime()).filter(d => !isNaN(d));
        if (dates.length === 0) return null;
        // El bloqueo ocurre 30 minutos antes del primer partido
        return new Date(Math.min(...dates) - (30 * 60 * 1000));
    }, [matches]);

    const isLocked = useMemo(() => {
        if (!lockDate) return false;
        return new Date() > lockDate;
    }, [lockDate]);

    // Filtrar partidos por ronda - Usando IDs reales para evitar desajustes
    const getMatchesByPhase = (phase: string) => {
        return matches
            .filter(m => m.phase === phase)
            .sort((a, b) => (a.bracketId || 0) - (b.bracketId || 0));
    };

    const r32Matches = useMemo(() => getMatchesByPhase('ROUND_32'), [matches]);
    const r16Matches = useMemo(() => getMatchesByPhase('ROUND_16'), [matches]);
    const quarterMatches = useMemo(() => getMatchesByPhase('QUARTER'), [matches]);
    const semiMatches = useMemo(() => getMatchesByPhase('SEMI'), [matches]);
    const finalMatches = useMemo(() => getMatchesByPhase('FINAL'), [matches]);

    // LÓGICA DE PROPAGACIÓN: Obtenemos el equipo que debe mostrarse en cada slot
    const getTeamForSlot = (match: Match, side: 'home' | 'away') => {
        // 1. Si el partido ya tiene equipos reales en la DB, los usamos
        if (side === 'home' && match.homeTeam && match.homeTeam !== 'LOC' && match.homeTeam !== 'TBD') return match.homeTeam;
        if (side === 'away' && match.awayTeam && match.awayTeam !== 'VIS' && match.awayTeam !== 'TBD') return match.awayTeam;

        // 2. Si no, buscamos el ganador del partido previo en nuestro bracket local
        // Buscamos partidos que apunten a este match
        const previousMatches = matches.filter(m => (m as any).nextMatchId === match.id);

        // El slot se determina por el bracketId: los nones son home del siguiente, pares son away
        // (O según la lógica de tu seeder, ajustamos si es necesario)
        let sourceMatch;
        if (side === 'home') {
            sourceMatch = previousMatches.find(m => (m.bracketId || 0) % 2 !== 0);
        } else {
            sourceMatch = previousMatches.find(m => (m.bracketId || 0) % 2 === 0);
        }

        return sourceMatch ? winners[sourceMatch.id] : undefined;
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
                leagueId: leagueId !== 'global' ? leagueId : undefined
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
                await api.delete('/brackets/me');
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
        <div className="bg-[#0F172A] min-h-screen text-white font-sans pb-32">

            {/* HEADER INSTRUCCIONES & ACCIONES */}
            <div className="p-4 sticky top-0 bg-[#0F172A]/95 backdrop-blur z-30 border-b border-slate-800">
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
                        <span className="font-russo text-lg text-[#00E676]">{bracketPoints}</span>
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
                            className="flex-1 bg-[#00E676] hover:bg-[#00C853] text-[#0F172A] py-2 rounded-lg font-black text-xs uppercase flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,230,118,0.2)] transition-all active:scale-95"
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
                <div className="flex gap-8 min-w-max pb-10 pl-2">

                    {/* COLUMNA 0: DIECISEISAVOS (ROUND_32) */}
                    {r32Matches.length > 0 && (
                        <div className="flex flex-col justify-around gap-1">
                            <div className="text-center mb-1"><span className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest bg-slate-900 px-2 py-0.5 rounded">Dieciseisavos</span></div>
                            {r32Matches.map((m) => (
                                <MatchNode
                                    key={m.id}
                                    matchId={m.id}
                                    team1={m.homeTeam}
                                    team2={m.awayTeam}
                                    placeholder1={m.homeTeamPlaceholder}
                                    placeholder2={m.awayTeamPlaceholder}
                                    winner={winners[m.id]}
                                    onPickWinner={pickWinner}
                                    getTeamFlag={getTeamFlag}
                                    nextId={(m as any).nextMatchId}
                                    isLocked={isLocked}
                                />
                            ))}
                        </div>
                    )}

                    {/* COLUMNA 1: OCTAVOS */}
                    <div className="flex flex-col justify-around gap-4 pt-4">
                        <div className="text-center mb-1"><span className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest bg-slate-900 px-2 py-0.5 rounded">Octavos</span></div>
                        {r16Matches.length > 0 ? r16Matches.map((m) => (
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
                                isLocked={isLocked}
                            />
                        )) : (
                            <div className="text-gray-500 text-xs p-4">Sin partidos</div>
                        )}
                    </div>

                    {/* COLUMNA 2: CUARTOS */}
                    <div className="flex flex-col justify-around gap-8 pt-8">
                        <div className="text-center mb-1"><span className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest bg-slate-900 px-2 py-0.5 rounded">Cuartos</span></div>
                        {quarterMatches.map(m => (
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
                                isLocked={isLocked}
                            />
                        ))}
                    </div>

                    {/* COLUMNA 3: SEMIFINALES */}
                    <div className="flex flex-col justify-around gap-16 pt-12">
                        <div className="text-center mb-1"><span className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest bg-slate-900 px-2 py-0.5 rounded">Semis</span></div>
                        {semiMatches.map(m => (
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
                                isLocked={isLocked}
                            />
                        ))}
                    </div>

                    {/* COLUMNA 4: FINAL & CAMPEÓN */}
                    <div className="flex flex-col justify-center items-center gap-6 pt-16 pr-4">
                        {/* COPA */}
                        <div className={`transition-all duration-500 ${champion ? 'scale-110 drop-shadow-[0_0_20px_#FACC15]' : 'opacity-30'}`}>
                            <Trophy size={32} className={champion ? 'text-[#FACC15]' : 'text-slate-600'} />
                        </div>

                        <div>
                            <div className="text-center mb-2"><span className="text-[9px] font-black text-[#FACC15] uppercase tracking-widest bg-[#FACC15]/10 px-2 py-0.5 rounded border border-[#FACC15]/30">Final</span></div>
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
                                    isLocked={isLocked}
                                />
                            ))}
                        </div>

                        {/* CAMPEÓN CARD */}
                        {champion && (
                            <div className="mt-2 animate-in zoom-in duration-500">
                                <div className="bg-gradient-to-b from-[#FACC15] to-[#B45309] p-[1px] rounded-lg shadow-[0_0_20px_rgba(250,204,21,0.3)]">
                                    <div className="bg-[#0F172A] rounded-lg p-3 text-center w-32">
                                        <p className="text-[8px] text-[#FACC15] font-bold uppercase tracking-widest mb-1">Campeón</p>
                                        <img src={getTeamFlag(champion)} alt="Champ" className="w-10 h-auto mx-auto rounded shadow-sm mb-1" />
                                        <p className="font-russo text-sm text-white truncate">{champion}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};
