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
        const isSelected = winner && String(winner).trim() === String(team).trim();
        if (!isSelected) return 'bg-[var(--brand-secondary,#1E293B)]/80 text-slate-300';
        if (isFinished && correctWinner) {
            return correctWinner === team
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                : 'bg-red-500/20 text-red-400 border-red-500/50';
        }
        return 'bg-[var(--brand-primary,#00E676)]/20 text-[var(--brand-primary,#00E676)]';
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

    const [winners, setWinners] = useState<Record<string, string>>({});
    const [bracketPoints, setBracketPoints] = useState(0);
    const [loading, setLoading] = useState(true);

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

    const effectiveMatches = allBracketMatches.length > 0 ? allBracketMatches : matches;

    useEffect(() => {
        if (!tournamentId) return;

        const loadBracket = async () => {
            try {
                let url = leagueId ? `/brackets/me?leagueId=${leagueId}` : '/brackets/me';
                const separator = url.includes('?') ? '&' : '?';
                url += `${separator}tournamentId=${tournamentId}`;

                const { data } = await api.get(url);

                if (data && data.picks) {
                    const pickKeys = Object.keys(data.picks);
                    const normalizedPicks: Record<string, string> = {};
                    pickKeys.forEach(key => {
                        normalizedPicks[String(key)] = data.picks[key];
                    });
                    setWinners(normalizedPicks);
                    setBracketPoints(data.points || 0);
                } else {
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

    const lockDate = useMemo(() => {
        const r32 = effectiveMatches.filter(m => m.phase === 'ROUND_32');
        const r16 = effectiveMatches.filter(m => m.phase === 'ROUND_16');
        const relevantMatches = r32.length > 0 ? r32 : r16;
        if (relevantMatches.length === 0) return null;
        const dates = relevantMatches.map(m => new Date(m.date).getTime()).filter(d => !isNaN(d));
        if (dates.length === 0) return null;
        return new Date(Math.min(...dates) - (30 * 60 * 1000));
    }, [effectiveMatches]);

    const isLocked = useMemo(() => {
        if (!lockDate) return false;
        return new Date() > lockDate;
    }, [lockDate]);

    const getMatchesByPhase = (phase: string) => {
        return effectiveMatches
            .filter(m => {
                const isPhaseMatch = m.phase === phase;
                if (!isPhaseMatch) return false;
                const group = (m as any).group || '';
                if (group.startsWith('LEG_') && group !== 'LEG_1') return false;
                return true;
            })
            .sort((a, b) => (a.bracketId || 0) - (b.bracketId || 0));
    };

    const r32Matches = useMemo(() => getMatchesByPhase('ROUND_32'), [effectiveMatches]);
    const r16Matches = useMemo(() => getMatchesByPhase('ROUND_16'), [effectiveMatches]);
    const quarterMatches = useMemo(() => [
        ...getMatchesByPhase('QUARTER'),
        ...getMatchesByPhase('QUARTER_FINAL'),
    ].sort((a, b) => (a.bracketId || 0) - (b.bracketId || 0)), [effectiveMatches]);
    const semiMatches = useMemo(() => [
        ...getMatchesByPhase('SEMI'),
        ...getMatchesByPhase('SEMI_FINAL'),
    ].sort((a, b) => (a.bracketId || 0) - (b.bracketId || 0)), [effectiveMatches]);
    const finalMatches = useMemo(() => getMatchesByPhase('FINAL'), [effectiveMatches]);
    const thirdPlaceMatches = useMemo(() => getMatchesByPhase('3RD_PLACE'), [effectiveMatches]);

    const getActualWinner = (match: Match) => {
        if ((match as any).group === 'LEG_1') {
            const leg2 = effectiveMatches.find(m =>
                (m as any).group === 'LEG_2' &&
                m.phase === match.phase &&
                m.bracketId === match.bracketId
            );
            if (!leg2 || (leg2.status !== 'FINISHED' && leg2.status !== 'COMPLETED')) return null;
            if (leg2.homeScore === null || leg2.awayScore === null) return null;
            if (match.homeScore === null || match.awayScore === null) return null;
            const teamAGoals = (match.homeScore ?? 0) + (leg2.awayScore ?? 0);
            const teamBGoals = (match.awayScore ?? 0) + (leg2.homeScore ?? 0);
            if (teamAGoals > teamBGoals) return match.homeTeam;
            if (teamBGoals > teamAGoals) return match.awayTeam;
            return null;
        }
        if (match.status !== 'FINISHED' && match.status !== 'COMPLETED') return null;
        if (typeof match.homeScore === 'number' && typeof match.awayScore === 'number') {
            if (match.homeScore > match.awayScore) return match.homeTeam;
            if (match.awayScore > match.homeScore) return match.awayTeam;
        }
        return null;
    };

    const phasesStatus = useMemo(() => {
        const isPhaseFinished = (phaseNames: string[]) => {
            const matchesOfPhase = effectiveMatches.filter(m => phaseNames.includes(m.phase || ''));
            return matchesOfPhase.length > 0 && matchesOfPhase.every(m => m.status === 'FINISHED' || m.status === 'COMPLETED');
        };

        const r32Finished = isPhaseFinished(['ROUND_32']);
        const r16Finished = isPhaseFinished(['ROUND_16']);
        const quarterFinished = isPhaseFinished(['QUARTER', 'QUARTER_FINAL']);
        const semiFinished = isPhaseFinished(['SEMI', 'SEMI_FINAL']);

        const hasR32 = effectiveMatches.some(m => m.phase === 'ROUND_32');
        
        return {
            ROUND_32: true,
            ROUND_16: !hasR32 || r32Finished,
            QUARTER: r16Finished,
            QUARTER_FINAL: r16Finished,
            SEMI: quarterFinished,
            SEMI_FINAL: quarterFinished,
            FINAL: semiFinished,
            '3RD_PLACE': semiFinished
        };
    }, [effectiveMatches]);

    const isMatchLocked = (match: Match) => {
        if (isLocked) return true;
        if (match.phase && phasesStatus[match.phase as keyof typeof phasesStatus] === false) return true;
        return false;
    };

    const getTeamForSlot = (match: Match, side: 'home' | 'away') => {
        const realTeam = side === 'home' ? match.homeTeam : match.awayTeam;
        if (realTeam && realTeam.trim() !== '' && realTeam !== 'LOC' && realTeam !== 'VIS' && realTeam !== 'TBD' && realTeam !== 'Por definir' && !realTeam.match(/^W\d+$/)) {
            return realTeam;
        }
        const sourceMatch = effectiveMatches.find(m =>
            (m as any).nextMatchId === match.id &&
            (side === 'home' ? (m.bracketId || 0) % 2 !== 0 : (m.bracketId || 0) % 2 === 0)
        );
        if (sourceMatch && winners[sourceMatch.id]) {
            return winners[sourceMatch.id];
        }
        return undefined;
    };

    const pickWinner = (matchId: string, teamCode: string) => {
        if (isLocked) return;
        setWinners(prev => ({ ...prev, [matchId]: teamCode }));
    };

    const handleSaveBracket = async () => {
        if (isLocked) {
            toast.error("El tiempo para guardar tu bracket ha expirado");
            return;
        }
        try {
            const { data } = await api.post('/brackets', {
                picks: winners,
                tournamentId: tournamentId,
                leagueId: leagueId
            });
            setBracketPoints(data.points || 0);
            toast.success('Bracket guardado exitosamente! 🏆');
        } catch (e: any) {
            console.error('Error saving bracket:', e);
            toast.error(e.response?.data?.message || 'Error al guardar bracket');
        }
    };

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
            {/* HEADER */}
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
                    <div className="bg-slate-800/50 border border-slate-700 px-3 py-2 rounded-lg text-center">
                        <span className="text-[9px] text-[#94A3B8] block font-bold uppercase tracking-widest">Puntos</span>
                        <span className="font-russo text-lg" style={{ color: 'var(--brand-primary, #00E676)' }}>{bracketPoints}</span>
                    </div>
                </div>

                {isLocked && (
                    <div className="mb-4 p-2 bg-red-500/10 border border-red-500/30 rounded text-[10px] text-red-400 font-bold uppercase text-center">
                        🔒 Pronósticos cerrados desde {lockDate?.toLocaleString()}
                    </div>
                )}

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
              {(() => {
                // ── Build rounds ──
                const rounds: { label: string; matches: Match[]; isFinal?: boolean }[] = [];
                if (r32Matches.length > 0)      rounds.push({ label: 'Dieciseisavos', matches: r32Matches });
                if (r16Matches.length > 0)      rounds.push({ label: 'Octavos',       matches: r16Matches });
                if (quarterMatches.length > 0)  rounds.push({ label: 'Cuartos',       matches: quarterMatches });
                if (semiMatches.length > 0)     rounds.push({ label: 'Semis',         matches: semiMatches });
                if (finalMatches.length > 0)    rounds.push({ label: 'Final',         matches: finalMatches, isFinal: true });

                if (rounds.length === 0) return null;

                // ── Layout constants ──────────────────────────────────────────
                const CARD_W    = 128;  // px - width of each match card
                const CARD_H    = 62;   // px - height of each match card
                const MATCH_GAP = 24;   // px - vertical gap between consecutive matches in first round
                const COL_GAP   = 48;   // px - horizontal space between columns (connectors live here)
                const HEADER_H  = 36;   // px - column header height
                const LC        = 'rgba(148,163,184,0.35)'; // connector line colour

                // Number of matches in the FIRST round (determines total height)
                const n0 = rounds[0].matches.length;

                // Total bracket height (content area, below headers)
                // Each match in the first round occupies CARD_H + MATCH_GAP pixels
                const UNIT   = CARD_H + MATCH_GAP; // 86px per first-round match slot
                const totalH = n0 * UNIT;

                // Column X positions
                const colSlotW = CARD_W + COL_GAP;
                const totalW   = rounds.length * CARD_W + (rounds.length - 1) * COL_GAP;

                // Y-center of match `mi` in round `ri`
                // Tournament tree formula: centers are equally distributed so that
                // each round's match center is always the midpoint of the two matches it came from.
                // For round ri with nRound = n0/2^ri matches:
                //   centerY(ri, mi) = (2*mi + 1) * totalH / (2 * nRound)
                const getCY = (ri: number, mi: number): number => {
                  const nRound = n0 / Math.pow(2, ri);
                  return (2 * mi + 1) * totalH / (2 * nRound);
                };

                // X start of round column `ri`
                const getColX = (ri: number) => ri * colSlotW;

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

                return (
                  <div style={{ position: 'relative', width: totalW, height: totalH + HEADER_H + 80, minWidth: totalW }}>

                    {/* ── Column Headers ── */}
                    {rounds.map((round, ri) => (
                      <div
                        key={`hdr-${ri}`}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: getColX(ri),
                          width: CARD_W,
                          textAlign: 'center',
                        }}
                      >
                        <span style={{
                          fontSize: 9,
                          fontWeight: 900,
                          color: round.isFinal ? '#FACC15' : '#94A3B8',
                          textTransform: 'uppercase',
                          letterSpacing: 3,
                          background: round.isFinal ? 'rgba(250,204,21,0.1)' : '#0F172A',
                          padding: '2px 8px',
                          borderRadius: 4,
                          border: round.isFinal ? '1px solid rgba(250,204,21,0.3)' : 'none',
                          display: 'inline-block',
                        }}>
                          {round.label}
                        </span>
                      </div>
                    ))}

                    {/* ── Match Cards (absolutely positioned using tournament tree formula) ── */}
                    {rounds.map((round, ri) =>
                      round.matches.map((m, mi) => {
                        const cy = getCY(ri, mi);
                        const cardTop  = HEADER_H + cy - CARD_H / 2;
                        const cardLeft = getColX(ri);
                        return (
                          <div
                            key={m.id}
                            style={{
                              position: 'absolute',
                              top: cardTop,
                              left: cardLeft,
                              width: CARD_W,
                              zIndex: 1,
                            }}
                          >
                            {makeNode(m)}
                          </div>
                        );
                      })
                    )}

                    {/* ── Final: Trophy icon above the final card ── */}
                    {finalMatches.length > 0 && (() => {
                      const ri  = rounds.length - 1;
                      const cy  = getCY(ri, 0);
                      const top = HEADER_H + cy - CARD_H / 2 - 42;
                      return (
                        <div style={{ position: 'absolute', top: Math.max(HEADER_H + 2, top), left: getColX(ri), width: CARD_W, display: 'flex', justifyContent: 'center', zIndex: 1 }}>
                          <div className={`transition-all duration-500 ${winners[finalMatches[0]?.id || ''] ? 'scale-110 drop-shadow-[0_0_20px_#FACC15]' : 'opacity-30'}`}>
                            <Trophy size={28} className={winners[finalMatches[0]?.id || ''] ? 'text-[#FACC15]' : 'text-slate-600'} />
                          </div>
                        </div>
                      );
                    })()}

                    {/* ── Champion card (below final card) ── */}
                    {winners[finalMatches[0]?.id || ''] && (() => {
                      const ri       = rounds.length - 1;
                      const cy       = getCY(ri, 0);
                      const champTop = HEADER_H + cy + CARD_H / 2 + 12;
                      return (
                        <div style={{ position: 'absolute', top: champTop, left: getColX(ri), width: CARD_W, zIndex: 1 }} className="animate-in zoom-in duration-500">
                          <div className="bg-gradient-to-b from-[#FACC15] to-[#B45309] p-[1px] rounded-lg shadow-[0_0_20px_rgba(250,204,21,0.3)]">
                            <div className="bg-[#0F172A] rounded-lg p-3 text-center">
                              <p className="text-[8px] text-[#FACC15] font-bold uppercase tracking-widest mb-1">Campeón</p>
                              <img src={getTeamFlag(winners[finalMatches[0]?.id || ''])} alt="Champ" className="w-10 h-auto mx-auto rounded shadow-sm mb-1" />
                              <p className="font-russo text-sm text-white truncate">{winners[finalMatches[0]?.id || '']}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* ── SINGLE SVG for ALL connector lines ────────────────────
                         The key insight: all Y coordinates use the SAME getCY() formula,
                         so connector endpoints and card centers are mathematically guaranteed
                         to align - no CSS coordinate system confusion.
                    ── */}
                    <svg
                      style={{
                        position: 'absolute',
                        top: HEADER_H,
                        left: 0,
                        width: totalW,
                        height: totalH,
                        pointerEvents: 'none',
                        overflow: 'visible',
                        zIndex: 0,
                      }}
                    >
                      {rounds.slice(0, rounds.length - 1).map((round, ri) => {
                        const nRound = round.matches.length;
                        const xRight = getColX(ri) + CARD_W;   // right edge of this round's cards
                        const xLeft  = getColX(ri + 1);         // left edge of next round's cards
                        const xMid   = xRight + COL_GAP / 2;    // midpoint in the connector zone

                        const lineElems: React.ReactNode[] = [];

                        // For each PAIR of consecutive matches (k, k+1) that feed match k/2 in next round
                        for (let k = 0; k < nRound; k += 2) {
                          const y1   = getCY(ri, k);       // center of upper match
                          const y2   = getCY(ri, k + 1);   // center of lower match
                          const ymid = (y1 + y2) / 2;      // guaranteed = getCY(ri+1, k/2)

                          // Horizontal stub rightward from upper match center
                          lineElems.push(<line key={`h1-${ri}-${k}`} x1={xRight} y1={y1}   x2={xMid}  y2={y1}   stroke={LC} strokeWidth="1.5" />);
                          // Horizontal stub rightward from lower match center
                          lineElems.push(<line key={`h2-${ri}-${k}`} x1={xRight} y1={y2}   x2={xMid}  y2={y2}   stroke={LC} strokeWidth="1.5" />);
                          // Vertical bar connecting both stubs
                          lineElems.push(<line key={`v-${ri}-${k}`}  x1={xMid}   y1={y1}   x2={xMid}  y2={y2}   stroke={LC} strokeWidth="1.5" />);
                          // Horizontal exit from midpoint to next round's card
                          lineElems.push(<line key={`o-${ri}-${k}`}  x1={xMid}   y1={ymid} x2={xLeft} y2={ymid} stroke={LC} strokeWidth="1.5" />);
                        }

                        return lineElems;
                      })}
                    </svg>

                  </div>
                );
              })()}
            </div>

            {/* PODIUM */}
            <TournamentPodium matches={effectiveMatches} />

        </div>
    );
};
