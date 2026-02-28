import React, { useState, useEffect, useMemo } from 'react';
import { Save, RefreshCw, Trophy, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useTournament } from '@/hooks/useTournament';
import { getTeamFlagUrl } from '@/shared/utils/flags';
import { TournamentPodium } from './TournamentPodium';
import { TournamentPodium } from './TournamentPodium';

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
    date: string;
}

interface UCLBracketViewProps {
    matches: Match[];
    leagueId?: string;
}

// Inline MatchNode specially for UCL to support Dates and lock status
import { CheckCircle2, XCircle } from 'lucide-react';

const UCLMatchNode = ({
    match, winner, onPickWinner, getTeamFlag, isLocked, isFinished, correctWinner, label, align = 'left'
}: {
    match: Match; winner?: string; onPickWinner: (id: string, t: string) => void;
    getTeamFlag: (t: string) => string; isLocked?: boolean; isFinished?: boolean;
    correctWinner?: string | null; label?: string; align?: 'left' | 'right'
}) => {
    if (!match) return <div className="w-32 h-16 bg-slate-800/50 rounded-md border border-slate-700/50 flex items-center justify-center text-xs text-slate-500">TBD</div>;

    const team1 = match.homeTeam && match.homeTeam !== 'Por definir' ? match.homeTeam : '-';
    const team2 = match.awayTeam && match.awayTeam !== 'Por definir' ? match.awayTeam : '-';

    const handlePick = (team: string) => {
        if (isLocked) return;
        onPickWinner(match.id, team);
    };

    const getStatusColor = (team: string) => {
        const isSelected = winner && String(winner).trim() === String(team).trim();
        if (!isSelected) return 'bg-[#1E293B]/80 text-slate-300';
        if (isFinished && correctWinner) {
            return correctWinner === team ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400';
        }
        return 'bg-[#00E676]/20 text-[#00E676]';
    };

    // Format Date: "10 Mar - 14:00"
    const formatDate = (dateString: string) => {
        const d = new Date(dateString);
        return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) + ' - ' +
               d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    return (
        <div className={`relative flex flex-col justify-center my-2 select-none ${align === 'right' ? 'items-end' : 'items-start'}`}>
            {label && (
                <div className={`text-[9px] font-black text-[#94A3B8] uppercase tracking-widest bg-slate-900 px-2 py-0.5 rounded border border-slate-700 mb-1 z-20`}>
                    {label} {match.phase === 'ROUND_16' && `• ${formatDate(match.date)}`}
                </div>
            )}
            <div className="bg-[#0F172A] border border-slate-700 rounded-md overflow-hidden w-36 shadow-[0_0_15px_rgba(0,0,0,0.5)] z-10 backdrop-blur-sm">
                {[team1, team2].map((team, idx) => (
                    <button
                        key={idx}
                        onClick={() => handlePick(team)}
                        disabled={isLocked || team === '-'}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 transition-colors border-b border-slate-700/50 ${getStatusColor(team)} ${isLocked ? 'cursor-not-allowed opacity-80' : 'hover:bg-slate-700/50'}`}
                    >
                        {align === 'right' && winner === team && <div className="w-1.5 h-1.5 rounded-full bg-current shadow-sm" />}
                        
                        {team !== '-' && align === 'left' && <img src={getTeamFlag(team)} alt={team} className="w-4 h-3 object-cover rounded-[1px] opacity-90" />}
                        
                        <span className={`text-[10px] font-bold truncate flex-1 uppercase ${align === 'right' ? 'text-right' : 'text-left'}`}>
                            {team}
                        </span>
                        
                        {team !== '-' && align === 'right' && <img src={getTeamFlag(team)} alt={team} className="w-4 h-3 object-cover rounded-[1px] opacity-90" />}
                        
                        {align === 'left' && winner === team && <div className="w-1.5 h-1.5 rounded-full bg-current shadow-sm" />}
                    </button>
                ))}
            </div>

            {/* CONECTORS */}
            {align === 'left' && (
                <div className={`absolute top-1/2 -right-4 w-4 h-[1px] ${winner ? 'bg-[#00E676] shadow-[0_0_2px_#00E676]' : 'bg-slate-700'}`}></div>
            )}
            {align === 'right' && (
                <div className={`absolute top-1/2 -left-4 w-4 h-[1px] ${winner ? 'bg-[#00E676] shadow-[0_0_2px_#00E676]' : 'bg-slate-700'}`}></div>
            )}
        </div>
    );
};

export const UCLBracketView: React.FC<UCLBracketViewProps> = ({ matches, leagueId }) => {
    const [winners, setWinners] = useState<Record<string, string>>({});
    const [bracketPoints, setBracketPoints] = useState(0);
    const [loading, setLoading] = useState(true);
    const { tournamentId } = useTournament();

    const getTeamFlag = (teamName: string) => getTeamFlagUrl(teamName);

    useEffect(() => {
        if (!tournamentId) return;
        const loadBracket = async () => {
            try {
                const url = `${leagueId ? `/brackets/me?leagueId=${leagueId}` : '/brackets/me'}&tournamentId=${tournamentId}`;
                const { data } = await api.get(url.replace('?&', '?'));
                if (data?.picks) setWinners(data.picks);
                if (data?.points) setBracketPoints(data.points);
            } catch (e) {
                console.error("Error loading UCL bracket", e);
            } finally {
                setLoading(false);
            }
        };
        loadBracket();
    }, [leagueId, tournamentId]);

    const lockDate = useMemo(() => {
        const r16 = matches.filter(m => m.phase === 'ROUND_16');
        if (!r16.length) return null;
        const dates = r16.map(m => new Date(m.date).getTime()).filter(d => !isNaN(d));
        return dates.length ? new Date(Math.min(...dates) - (30 * 60 * 1000)) : null;
    }, [matches]);

    const isLocked = useMemo(() => lockDate ? new Date() > lockDate : false, [lockDate]);

    // MAP BRACKETS
    // Only use LEG_1 for the bracket display to avoid duplicates
    const uclBracketMatches = matches.filter(m => 
        ((m as any).tournamentId === 'UCL2526' || (m as any).tournament_id === 'UCL2526') && 
        (m as any).group === 'LEG_1'
    );

    const r16Matches = uclBracketMatches.filter(m => m.phase === 'ROUND_16');
    const qfMatches = uclBracketMatches.filter(m => m.phase === 'QUARTER_FINAL');
    const sfMatches = uclBracketMatches.filter(m => m.phase === 'SEMI_FINAL');
    const fMatches = uclBracketMatches.filter(m => m.phase === 'FINAL');

    // LEFT ZONE: Brackets 1, 2, 3, 4 (Octavos) -> 9, 10 (Cuartos) -> 13 (Semis)
    const leftR16 = [
        r16Matches.find(m => m.bracketId === 1),
        r16Matches.find(m => m.bracketId === 2),
        r16Matches.find(m => m.bracketId === 3),
        r16Matches.find(m => m.bracketId === 4)
    ].filter(Boolean) as Match[];

    const leftQF = [
        qfMatches.find(m => m.bracketId === 9),
        qfMatches.find(m => m.bracketId === 10)
    ].filter(Boolean) as Match[];

    const leftSF = sfMatches.filter(m => m.bracketId === 13);

    // RIGHT ZONE: Brackets 5, 6, 7, 8 (Octavos) -> 11, 12 (Cuartos) -> 14 (Semis)
    const rightR16 = [
        r16Matches.find(m => m.bracketId === 5),
        r16Matches.find(m => m.bracketId === 6),
        r16Matches.find(m => m.bracketId === 7),
        r16Matches.find(m => m.bracketId === 8)
    ].filter(Boolean) as Match[];

    const rightQF = [
        qfMatches.find(m => m.bracketId === 11),
        qfMatches.find(m => m.bracketId === 12)
    ].filter(Boolean) as Match[];

    const rightSF = sfMatches.filter(m => m.bracketId === 14);

    // CENTER: Bracket 15 (Final)
    const finalMatch = fMatches.find(m => m.bracketId === 15) || fMatches[0];

    const pickWinner = (id: string, team: string) => {
        if (!isLocked) setWinners(prev => ({ ...prev, [id]: team }));
    };

    const handleSave = async () => {
        try {
            const { data } = await api.post('/brackets', { picks: winners, tournamentId, leagueId });
            setBracketPoints(data.points || 0);
            toast.success('Bracket UCL Guardado! 🌟');
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Error guardando bracket');
        }
    };

    const getActualWinner = (match: Match) => {
        if (match.status !== 'FINISHED' && match.status !== 'COMPLETED') return null;
        if ((match.homeScore || 0) > (match.awayScore || 0)) return match.homeTeam;
        if ((match.awayScore || 0) > (match.homeScore || 0)) return match.awayTeam;
        return null;
    };

    if (loading) return <div className="text-center p-8 text-white">Cargando la Orejona...</div>;
    const champion = finalMatch && winners[finalMatch.id];

    return (
        <div className="min-h-screen text-white font-sans pb-32" style={{ backgroundColor: '#020617' }}>
            {/* HERADER */}
            <div className="p-6 pt-24 sticky top-0 backdrop-blur z-30 border-b border-blue-900/50 bg-[#0F172A]/90">
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <h2 className="font-russo text-xl uppercase text-white mb-1">El Camino a Munich</h2>
                        <p className="text-[10px] text-blue-300">Completa tu árbol hacia la final (Solo Ida).</p>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700 px-3 py-2 rounded-lg text-center">
                        <span className="text-[9px] text-blue-300 block font-bold uppercase tracking-widest">Puntos</span>
                        <span className="font-russo text-lg text-[#00E676]">{bracketPoints}</span>
                    </div>
                </div>
                {!isLocked && (
                    <div className="flex gap-3">
                        <button onClick={handleSave} className="flex-1 py-2 rounded-lg font-black text-xs uppercase flex items-center justify-center gap-2 transition-all active:scale-95 bg-[#00E676] text-[#0F172A] shadow-[0_0_15px_rgba(0,230,118,0.2)]">
                            <Save size={14} /> Guardar ({Object.keys(winners).length})
                        </button>
                    </div>
                )}
            </div>

            {/* SYMMETRICAL BRACKET */}
            <div className="overflow-x-auto p-4 custom-scrollbar">
                <div className="flex justify-center min-w-[1200px] gap-8 py-8 items-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-[#020617] to-[#020617]">
                    
                    {/* LEFT ZONE */}
                    <div className="flex gap-4">
                        {/* OCTAVOS LEFT */}
                        <div className="flex flex-col justify-around gap-2">
                            {leftR16.map((m, i) => (
                                <UCLMatchNode key={i} match={m} winner={winners[m.id]} onPickWinner={pickWinner} getTeamFlag={getTeamFlag} isLocked={isLocked} isFinished={m.status === 'FINISHED'} correctWinner={getActualWinner(m)} label={i%2===0 ? "Octavos" : undefined} align="left" />
                            ))}
                        </div>
                        {/* CUARTOS LEFT */}
                        <div className="flex flex-col justify-around gap-16 py-8">
                            {leftQF.map((m, i) => (
                                <UCLMatchNode key={i} match={m} winner={winners[m?.id]} onPickWinner={pickWinner} getTeamFlag={getTeamFlag} isLocked={isLocked || !m} isFinished={m?.status === 'FINISHED'} correctWinner={m ? getActualWinner(m) : undefined} label={i===0 ? "Cuartos" : undefined} align="left" />
                            ))}
                        </div>
                        {/* SEMIS LEFT */}
                        <div className="flex flex-col justify-around gap-32 py-24">
                            {leftSF.map((m, i) => (
                                <UCLMatchNode key={i} match={m} winner={winners[m?.id]} onPickWinner={pickWinner} getTeamFlag={getTeamFlag} isLocked={isLocked || !m} isFinished={m?.status === 'FINISHED'} correctWinner={m ? getActualWinner(m) : undefined} label={i===0 ? "Semis" : undefined} align="left" />
                            ))}
                        </div>
                    </div>

                    {/* CENTER ZONE (FINAL) */}
                    <div className="flex flex-col items-center justify-center px-4 gap-8">
                        <Trophy size={64} className={champion ? 'text-[#FACC15] drop-shadow-[0_0_30px_#FACC15]' : 'text-slate-700 opacity-50'} />
                        <div className="w-px h-16 bg-gradient-to-b from-slate-700 to-transparent"></div>
                        <UCLMatchNode match={finalMatch} winner={winners[finalMatch?.id]} onPickWinner={pickWinner} getTeamFlag={getTeamFlag} isLocked={isLocked || !finalMatch} isFinished={finalMatch?.status === 'FINISHED'} correctWinner={finalMatch ? getActualWinner(finalMatch) : undefined} label="Gran Final" align="left" />
                        
                        {champion && (
                            <div className="mt-4 text-center animate-in zoom-in duration-500">
                                <div className="bg-gradient-to-b from-[#FACC15] to-[#B45309] p-[1px] rounded-lg shadow-[0_0_30px_rgba(250,204,21,0.4)]">
                                    <div className="bg-[#0F172A] rounded-lg p-4 w-40">
                                        <p className="text-[10px] text-[#FACC15] font-bold uppercase tracking-widest mb-2">Campeón de Europa</p>
                                        <img src={getTeamFlag(champion)} alt="Champ" className="w-16 h-auto mx-auto rounded mb-2 drop-shadow-lg" />
                                        <p className="font-russo text-lg text-white truncate">{champion}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT ZONE */}
                    <div className="flex gap-4 flex-row-reverse">
                        {/* OCTAVOS RIGHT */}
                        <div className="flex flex-col justify-around gap-2">
                            {rightR16.map((m, i) => (
                                <UCLMatchNode key={i} match={m} winner={winners[m.id]} onPickWinner={pickWinner} getTeamFlag={getTeamFlag} isLocked={isLocked} isFinished={m.status === 'FINISHED'} correctWinner={getActualWinner(m)} label={i%2===0 ? "Octavos" : undefined} align="right" />
                            ))}
                        </div>
                        {/* CUARTOS RIGHT */}
                        <div className="flex flex-col justify-around gap-16 py-8">
                            {rightQF.map((m, i) => (
                                <UCLMatchNode key={i} match={m} winner={winners[m?.id]} onPickWinner={pickWinner} getTeamFlag={getTeamFlag} isLocked={isLocked || !m} isFinished={m?.status === 'FINISHED'} correctWinner={m ? getActualWinner(m) : undefined} label={i===0 ? "Cuartos" : undefined} align="right" />
                            ))}
                        </div>
                        {/* SEMIS RIGHT */}
                        <div className="flex flex-col justify-around gap-32 py-24">
                            {rightSF.map((m, i) => (
                                <UCLMatchNode key={i} match={m} winner={winners[m?.id]} onPickWinner={pickWinner} getTeamFlag={getTeamFlag} isLocked={isLocked || !m} isFinished={m?.status === 'FINISHED'} correctWinner={m ? getActualWinner(m) : undefined} label={i===0 ? "Semis" : undefined} align="right" />
                            ))}
                        </div>
                    </div>

                </div>
            </div>
            <TournamentPodium matches={matches} />
        </div>
    );
};
