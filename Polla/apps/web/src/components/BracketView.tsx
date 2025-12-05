import React, { useState, useEffect, useMemo } from 'react';
import { Save, RefreshCw, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

/* =============================================================================
   1. HELPER: BANDERAS (FALLBACK)
   ============================================================================= */
const getFallbackFlagUrl = (teamCode: string) => {
    if (!teamCode) return "https://flagcdn.com/w40/un.png";
    const codeMap: { [key: string]: string } = {
        'COL': 'co', 'ARG': 'ar', 'BRA': 'br', 'USA': 'us', 'ESP': 'es', 'FRA': 'fr', 'GER': 'de', 'JPN': 'jp',
        'ENG': 'gb-eng', 'POR': 'pt', 'URU': 'uy', 'MEX': 'mx', 'CAN': 'ca', 'MAR': 'ma', 'SEN': 'sn', 'NED': 'nl',
        'ECU': 'ec', 'QAT': 'qa', 'IRN': 'ir', 'WAL': 'gb-wls', 'KOR': 'kr', 'AUS': 'au', 'CRC': 'cr', 'BEL': 'be',
        'CRO': 'hr', 'EGY': 'eg', 'SRB': 'rs', 'SCO': 'gb-sct', 'KSA': 'sa', 'POL': 'pl',
        'Netherlands': 'nl', 'United States': 'us', 'South Korea': 'kr' // Fix for full names
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
    homeScore?: number | null;
    awayScore?: number | null;
    phase?: string;
    bracketId?: number;
    status?: string;
    homeFlag?: string;
    awayFlag?: string;
}

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

    // Filtrar y ordenar partidos de Octavos
    const round16Matches = useMemo(() => {
        return matches
            .filter(m => m.phase === 'ROUND_16')
            .sort((a, b) => (a.bracketId || 0) - (b.bracketId || 0))
            .map((m, index) => {
                const logicalId = `m${index + 1}`;
                const nextMatchId = `q${Math.ceil((index + 1) / 2)}`;
                const slot = (index + 1) % 2 === 1 ? 0 : 1;

                return {
                    id: logicalId,
                    realId: m.id,
                    nextMatchId,
                    slot,
                    home: m.homeTeam,
                    away: m.awayTeam
                };
            });
    }, [matches]);

    // FUNCIÓN: Seleccionar Ganador
    const pickWinner = (matchId: string, teamCode: string, nextMatchId: string | null, nextMatchSlot: number | null) => {
        if (!teamCode) return;
        const newWinners = { ...winners, [matchId]: teamCode };
        setWinners(newWinners);
    };

    // FUNCIÓN: Guardar Bracket
    const handleSaveBracket = async () => {
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

    // --- RENDERIZADO DE PARTIDO (NODO DEL ÁRBOL) ---
    // --- RENDERIZADO DE PARTIDO (NODO DEL ÁRBOL) ---
    const MatchNode = ({ matchId, team1, team2, nextId, slot }: { matchId: string, team1: string, team2: string, nextId: string | null, slot: number | null }) => {
        const winner = winners[matchId];

        return (
            <div className="relative flex flex-col justify-center my-1 select-none">
                <div className="bg-transparent border border-slate-700 rounded-md overflow-hidden w-32 shadow-md z-10 backdrop-blur-sm">
                    {/* EQUIPO 1 */}
                    <button
                        onClick={() => pickWinner(matchId, team1, nextId, slot)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 border-b border-slate-700/50 hover:bg-slate-700/50 transition-colors ${winner === team1 ? 'bg-[#00E676]/20' : 'bg-[#1E293B]/80'}`}
                    >
                        <img src={getTeamFlag(team1)} alt={team1} className="w-4 h-3 object-cover rounded-[1px] opacity-90" />
                        <span className={`text-[9px] font-bold truncate text-left flex-1 ${winner === team1 ? 'text-[#00E676]' : 'text-slate-300'}`}>
                            {team1 || '-'}
                        </span>
                        {winner === team1 && <div className="w-1 h-1 rounded-full bg-[#00E676] shadow-[0_0_5px_#00E676]" />}
                    </button>

                    {/* EQUIPO 2 */}
                    <button
                        onClick={() => pickWinner(matchId, team2, nextId, slot)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 hover:bg-slate-700/50 transition-colors ${winner === team2 ? 'bg-[#00E676]/20' : 'bg-[#1E293B]/80'}`}
                    >
                        <img src={getTeamFlag(team2)} alt={team2} className="w-4 h-3 object-cover rounded-[1px] opacity-90" />
                        <span className={`text-[9px] font-bold truncate text-left flex-1 ${winner === team2 ? 'text-[#00E676]' : 'text-slate-300'}`}>
                            {team2 || '-'}
                        </span>
                        {winner === team2 && <div className="w-1 h-1 rounded-full bg-[#00E676] shadow-[0_0_5px_#00E676]" />}
                    </button>
                </div>

                {/* CONECTOR (Línea hacia la derecha) */}
                {nextId && (
                    <div className={`absolute top-1/2 -right-6 w-6 h-[1px] ${winner ? 'bg-[#00E676] shadow-[0_0_2px_rgba(0,230,118,0.5)]' : 'bg-slate-700'}`}></div>
                )}
            </div>
        );
    };

    // --- CONSTRUCCIÓN DE LAS RONDAS ---
    const q1 = { id: 'q1', nextId: 's1', team1: winners['m1'], team2: winners['m2'] };
    const q2 = { id: 'q2', nextId: 's1', team1: winners['m3'], team2: winners['m4'] };
    const q3 = { id: 'q3', nextId: 's2', team1: winners['m5'], team2: winners['m6'] };
    const q4 = { id: 'q4', nextId: 's2', team1: winners['m7'], team2: winners['m8'] };

    const s1 = { id: 's1', nextId: 'f1', team1: winners['q1'], team2: winners['q2'] };
    const s2 = { id: 's2', nextId: 'f1', team1: winners['q3'], team2: winners['q4'] };

    const f1 = { id: 'f1', nextId: null, team1: winners['s1'], team2: winners['s2'] };
    const champion = winners['f1'];

    if (loading) {
        return <div className="text-center p-8 text-white">Cargando bracket...</div>;
    }

    return (
        <div className="bg-[#0F172A] min-h-screen text-white font-sans pb-32">

            {/* HEADER INSTRUCCIONES & ACCIONES */}
            <div className="p-4 sticky top-0 bg-[#0F172A]/95 backdrop-blur z-30 border-b border-slate-800">
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <h2 className="font-russo text-xl uppercase text-white mb-1">Llaves del Torneo</h2>
                        <p className="text-[10px] text-[#94A3B8] max-w-[200px] leading-tight">
                            Haz clic en los equipos para avanzar de ronda.
                        </p>
                    </div>

                    {/* INFO PUNTOS BRACKET */}
                    <div className="bg-slate-800/50 border border-slate-700 px-3 py-2 rounded-lg text-center">
                        <span className="text-[9px] text-[#94A3B8] block font-bold uppercase tracking-widest">Puntos</span>
                        <span className="font-russo text-lg text-[#00E676]">{bracketPoints}</span>
                    </div>
                </div>

                {/* BOTONES DE ACCIÓN */}
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
            </div>

            {/* ZONA DE BRACKET (SCROLLABLE) */}
            <div className="overflow-x-auto p-4 custom-scrollbar">
                <div className="flex gap-8 min-w-max pb-10 pl-2">

                    {/* COLUMNA 1: OCTAVOS */}
                    <div className="flex flex-col justify-around gap-2">
                        <div className="text-center mb-1"><span className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest bg-slate-900 px-2 py-0.5 rounded">Octavos</span></div>
                        {round16Matches.length > 0 ? round16Matches.map((m) => (
                            <MatchNode key={m.id} matchId={m.id} team1={m.home} team2={m.away} nextId={m.nextMatchId} slot={m.slot} />
                        )) : (
                            <div className="text-gray-500 text-xs p-4">Sin partidos</div>
                        )}
                    </div>

                    {/* COLUMNA 2: CUARTOS */}
                    <div className="flex flex-col justify-around gap-8 pt-6">
                        <div className="text-center mb-1"><span className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest bg-slate-900 px-2 py-0.5 rounded">Cuartos</span></div>
                        <MatchNode matchId="q1" team1={q1.team1} team2={q1.team2} nextId="s1" slot={0} />
                        <MatchNode matchId="q2" team1={q2.team1} team2={q2.team2} nextId="s1" slot={1} />
                        <MatchNode matchId="q3" team1={q3.team1} team2={q3.team2} nextId="s2" slot={0} />
                        <MatchNode matchId="q4" team1={q4.team1} team2={q4.team2} nextId="s2" slot={1} />
                    </div>

                    {/* COLUMNA 3: SEMIFINALES */}
                    <div className="flex flex-col justify-around gap-16 pt-12">
                        <div className="text-center mb-1"><span className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest bg-slate-900 px-2 py-0.5 rounded">Semis</span></div>
                        <MatchNode matchId="s1" team1={s1.team1} team2={s1.team2} nextId="f1" slot={0} />
                        <MatchNode matchId="s2" team1={s2.team1} team2={s2.team2} nextId="f1" slot={1} />
                    </div>

                    {/* COLUMNA 4: FINAL & CAMPEÓN */}
                    <div className="flex flex-col justify-center items-center gap-6 pt-16 pr-4">

                        {/* COPA */}
                        <div className={`transition-all duration-500 ${champion ? 'scale-110 drop-shadow-[0_0_20px_#FACC15]' : 'opacity-30'}`}>
                            <Trophy size={32} className={champion ? 'text-[#FACC15]' : 'text-slate-600'} />
                        </div>

                        <div>
                            <div className="text-center mb-2"><span className="text-[9px] font-black text-[#FACC15] uppercase tracking-widest bg-[#FACC15]/10 px-2 py-0.5 rounded border border-[#FACC15]/30">Final</span></div>
                            <MatchNode matchId="f1" team1={f1.team1} team2={f1.team2} nextId={null} slot={null} />
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
