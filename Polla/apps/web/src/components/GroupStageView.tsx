import React, { useMemo } from 'react';
import { Users, ChevronRight, Calculator } from 'lucide-react';

/* =============================================================================
   HELPER: BANDERAS
   ============================================================================= */
const getFlagUrl = (teamCode: string) => {
    const codeMap: { [key: string]: string } = {
        'COL': 'co', 'ARG': 'ar', 'BRA': 'br', 'USA': 'us', 'ESP': 'es',
        'FRA': 'fr', 'GER': 'de', 'JPN': 'jp', 'ENG': 'gb-eng', 'POR': 'pt',
        'URU': 'uy', 'MEX': 'mx', 'CAN': 'ca', 'MAR': 'ma', 'SEN': 'sn',
        'NED': 'nl', 'ECU': 'ec', 'QAT': 'qa', 'IRN': 'ir', 'WAL': 'gb-wls',
        'KOR': 'kr', 'AUS': 'au', 'CRC': 'cr', 'BEL': 'be', 'CRO': 'hr',
        'EGY': 'eg', 'SRB': 'rs', 'SCO': 'gb-sct', 'KSA': 'sa', 'POL': 'pl'
    };
    const isoCode = codeMap[teamCode] || teamCode?.substring(0, 2).toLowerCase();
    return `https://flagcdn.com/h24/${isoCode}.png`;
};

/* =============================================================================
   INTERFACES
   ============================================================================= */
interface Match {
    id: string;
    homeTeam: string | { code: string; flag: string };
    awayTeam: string | { code: string; flag: string };
    homeScore?: number | null;
    awayScore?: number | null;
    prediction?: {
        homeScore?: number | null;
        awayScore?: number | null;
    };
    group?: string;
    phase?: string;
    status: string;
}

interface TeamStats {
    code: string;
    pj: number;
    pg: number;
    pe: number;
    pp: number;
    gf: number;
    gc: number;
    dg: number;
    pts: number;
}

interface GroupData {
    name: string;
    teams: (TeamStats & { pos: number })[];
}

interface GroupStageViewProps {
    matches: Match[];
}

/* =============================================================================
   COMPONENTE: GROUPS VIEW (TABLA DE POSICIONES COMPLETA)
   ============================================================================= */
export const GroupStageView: React.FC<GroupStageViewProps> = ({ matches }) => {

    const COLORS = {
        bg: '#0F172A',
        card: '#1E293B',
        signal: '#00E676',
        text: '#F8FAFC',
        dim: '#64748B',
        border: '#334155'
    };

    const STYLES = {
        container: {
            padding: '16px',
            paddingBottom: '100px',
            backgroundColor: COLORS.bg,
            minHeight: '100vh',
            fontFamily: 'sans-serif'
        },
        header: {
            textAlign: 'center' as const,
            marginBottom: '24px'
        },
        title: {
            fontFamily: "'Russo One', sans-serif",
            fontSize: '24px',
            color: 'white',
            textTransform: 'uppercase' as const,
            marginBottom: '4px'
        },
        subtitle: {
            fontSize: '11px',
            color: COLORS.signal,
            fontWeight: 'bold',
            letterSpacing: '2px',
            textTransform: 'uppercase' as const
        },
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '16px'
        },
        groupCard: {
            backgroundColor: COLORS.card,
            borderRadius: '16px',
            border: `1px solid ${COLORS.border}`,
            overflow: 'hidden',
            boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
        },
        groupHeader: {
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            padding: '12px 16px',
            borderBottom: `1px solid ${COLORS.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        },
        groupTitle: {
            fontFamily: "'Russo One', sans-serif",
            color: COLORS.signal,
            fontSize: '14px',
            letterSpacing: '1px'
        },
        table: {
            width: '100%',
            borderCollapse: 'collapse' as const
        },
        th: {
            textAlign: 'center' as const,
            color: COLORS.dim,
            fontSize: '9px',
            fontWeight: 'bold',
            padding: '8px 2px',
            borderBottom: `1px solid ${COLORS.border}50`
        },
        row: {
            borderBottom: `1px solid ${COLORS.border}30`,
            height: '44px',
            position: 'relative' as const
        },
        cell: {
            textAlign: 'center' as const,
            fontSize: '11px',
            color: COLORS.dim,
            fontWeight: '500',
            padding: '0 2px'
        },
        teamCell: {
            textAlign: 'left' as const,
            paddingLeft: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            height: '44px',
            color: 'white',
            fontWeight: 'bold',
            fontFamily: "'Russo One', sans-serif",
            letterSpacing: '0.5px',
            fontSize: '11px'
        },
        flag: {
            width: '18px',
            height: 'auto',
            borderRadius: '2px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
        },
        points: {
            color: 'white',
            fontWeight: '900',
            fontSize: '13px'
        },
        qualifiedIndicator: {
            position: 'absolute' as const,
            left: 0,
            top: 0,
            bottom: 0,
            width: '3px',
            backgroundColor: COLORS.signal,
            boxShadow: '0 0 8px rgba(0, 230, 118, 0.6)'
        }
    };

    const groups = useMemo(() => {
        const teamStats: { [key: string]: TeamStats } = {};
        const groupTeams: { [key: string]: Set<string> } = {};

        const initTeam = (code: string, group: string) => {
            if (!teamStats[code]) {
                teamStats[code] = { code, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0, pts: 0 };
            }
            if (!groupTeams[group]) {
                groupTeams[group] = new Set();
            }
            groupTeams[group].add(code);
        };

        matches.forEach(match => {
            if (match.phase !== 'group' && !match.group) return;
            // Solo procesar paridos finalizados
            if (match.status !== 'FINISHED' && match.status !== 'COMPLETED') return;

            const groupName = match.group || 'Desconocido';
            const homeCode = typeof match.homeTeam === 'object' ? match.homeTeam.code : match.homeTeam;
            const awayCode = typeof match.awayTeam === 'object' ? match.awayTeam.code : match.awayTeam;

            initTeam(homeCode, groupName);
            initTeam(awayCode, groupName);

            let homeScore = match.homeScore;
            let awayScore = match.awayScore;

            if (homeScore === null || homeScore === undefined) {
                if (match.prediction && match.prediction.homeScore !== null && match.prediction.homeScore !== undefined) {
                    homeScore = match.prediction.homeScore;
                    awayScore = match.prediction.awayScore;
                }
            }

            if (homeScore !== null && homeScore !== undefined && awayScore !== null && awayScore !== undefined) {
                const h = teamStats[homeCode];
                const a = teamStats[awayCode];

                h.pj++;
                a.pj++;
                h.gf += homeScore;
                a.gf += awayScore;
                h.gc += awayScore;
                a.gc += homeScore;
                h.dg = h.gf - h.gc;
                a.dg = a.gf - a.gc;

                if (homeScore > awayScore) {
                    h.pg++;
                    h.pts += 3;
                    a.pp++;
                } else if (homeScore < awayScore) {
                    a.pg++;
                    a.pts += 3;
                    h.pp++;
                } else {
                    h.pe++;
                    h.pts += 1;
                    a.pe++;
                    a.pts += 1;
                }
            }
        });

        const result: GroupData[] = Object.keys(groupTeams).sort().map(groupName => {
            const teams = Array.from(groupTeams[groupName]).map(code => teamStats[code]);

            teams.sort((a, b) => {
                if (b.pts !== a.pts) return b.pts - a.pts;
                if (b.dg !== a.dg) return b.dg - a.dg;
                return b.gf - a.gf;
            });

            return {
                name: `GRUPO ${groupName}`,
                teams: teams.map((t, index) => ({ ...t, pos: index + 1 }))
            };
        });

        return result;
    }, [matches]);

    return (
        <div style={STYLES.container}>
            <div style={STYLES.header}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                    <Calculator size={24} color={COLORS.signal} />
                    <h2 style={STYLES.title}>Tabla de Posiciones</h2>
                </div>
                <p style={STYLES.subtitle}>Fase de Grupos</p>
            </div>

            <div style={STYLES.grid}>
                {groups.length > 0 ? (
                    groups.map((group, idx) => (
                        <div key={idx} style={STYLES.groupCard}>
                            <div style={STYLES.groupHeader}>
                                <span style={STYLES.groupTitle}>{group.name}</span>
                                <ChevronRight size={16} color={COLORS.dim} />
                            </div>

                            <table style={STYLES.table}>
                                <thead>
                                    <tr>
                                        <th style={{ ...STYLES.th, textAlign: 'left', paddingLeft: '16px' }}>EQUIPO</th>
                                        <th style={STYLES.th}>PJ</th>
                                        <th style={STYLES.th}>G</th>
                                        <th style={STYLES.th}>E</th>
                                        <th style={STYLES.th}>P</th>
                                        <th style={STYLES.th}>GF</th>
                                        <th style={STYLES.th}>GC</th>
                                        <th style={STYLES.th}>DG</th>
                                        <th style={STYLES.th}>PTS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {group.teams.map((team, i) => {
                                        const isQualified = i < 2;

                                        return (
                                            <tr key={team.code} style={{
                                                ...STYLES.row,
                                                backgroundColor: isQualified ? 'rgba(0, 230, 118, 0.03)' : 'transparent'
                                            }}>
                                                <td style={STYLES.teamCell}>
                                                    {isQualified && <div style={STYLES.qualifiedIndicator} />}
                                                    <span style={{ color: COLORS.dim, fontSize: '10px', width: '10px' }}>
                                                        {team.pos}
                                                    </span>
                                                    <img src={getFlagUrl(team.code)} alt={team.code} style={STYLES.flag} />
                                                    <span>{team.code}</span>
                                                </td>
                                                <td style={STYLES.cell}>{team.pj}</td>
                                                <td style={STYLES.cell}>{team.pg}</td>
                                                <td style={STYLES.cell}>{team.pe}</td>
                                                <td style={STYLES.cell}>{team.pp}</td>
                                                <td style={STYLES.cell}>{team.gf}</td>
                                                <td style={STYLES.cell}>{team.gc}</td>
                                                <td style={STYLES.cell}>{team.dg > 0 ? `+${team.dg}` : team.dg}</td>
                                                <td style={{ ...STYLES.cell, ...STYLES.points }}>
                                                    {team.pts}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ))
                ) : (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: COLORS.dim }}>
                        <p>No hay partidos de fase de grupos disponibles.</p>
                    </div>
                )}
            </div>
        </div>
    );
};