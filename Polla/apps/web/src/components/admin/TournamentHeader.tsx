import React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Trophy, Star, Shield, ArrowLeft } from 'lucide-react';

interface TournamentHeaderProps {
    tournamentId: string;
}

const TOURNAMENT_THEMES: Record<string, {
    name: string;
    bgColor: string;
    borderColor: string;
    icon: React.ReactNode;
    textColor: string;
    accentColor: string;
}> = {
    'WC2026': {
        name: 'Mundial 2026',
        bgColor: '#0F172A', // Obsidian (Default)
        borderColor: '#00E676', // Green
        icon: <Trophy size={24} color="#00E676" />,
        textColor: '#00E676',
        accentColor: '#00E676'
    },
    'UCL2526': {
        name: 'Champions League',
        bgColor: '#0B1120', // Darker Blue/Black
        borderColor: '#3B82F6', // Blue
        icon: <Star size={24} color="#3B82F6" />, // Star for Champions
        textColor: '#3B82F6',
        accentColor: '#3B82F6'
    },
    'TEST_LIVE_MONDAY': {
        name: 'Pruebas en Vivo',
        bgColor: '#1a1405', // Dark Amber
        borderColor: '#F59E0B', 
        icon: <Shield size={24} color="#F59E0B" />,
        textColor: '#F59E0B',
        accentColor: '#F59E0B'
    }
};

export function TournamentHeader({ tournamentId }: TournamentHeaderProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const theme = TOURNAMENT_THEMES[tournamentId] || TOURNAMENT_THEMES['WC2026'];

    const handleTournamentChange = (newTournamentId: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('tournamentId', newTournamentId);
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div style={{
            backgroundColor: theme.bgColor,
            borderBottom: `2px solid ${theme.borderColor}`,
            padding: '16px 24px',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap', // Allow wrapping on mobile
            gap: '16px', // Gap between wrapped rows
            transition: 'all 0.3s ease',
            boxShadow: `0 4px 20px -10px ${theme.borderColor}40`
        }}>
            {/* LEFT: TITLE & VISUAL ID */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexGrow: 1, minWidth: '240px' }}>
                <div style={{
                    backgroundColor: `${theme.accentColor}15`,
                    padding: '8px',
                    borderRadius: '8px',
                    border: `1px solid ${theme.accentColor}30`
                }}>
                    {theme.icon}
                </div>
                <div>
                    <h1 style={{
                        fontFamily: "'Russo One', sans-serif",
                        fontSize: '24px',
                        textTransform: 'uppercase',
                        lineHeight: '1',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexWrap: 'wrap' // Allow badge to wrap if title is long
                    }}>
                        Super Admin
                        <span style={{ 
                            fontSize: '12px', 
                            backgroundColor: theme.accentColor, 
                            color: '#0F172A',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            verticalAlign: 'middle',
                            whiteSpace: 'nowrap'
                        }}>
                            {tournamentId === 'UCL2526' ? 'UCL' : 'WC'}
                        </span>
                    </h1>
                    <span style={{
                        fontSize: '12px',
                        color: '#94A3B8',
                        fontWeight: 'bold',
                        letterSpacing: '1px',
                        textTransform: 'uppercase'
                    }}>
                        Panel de Control Central
                    </span>
                </div>
            </div>

            {/* RIGHT: SELECTOR */}
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                flexGrow: 1, 
                justifyContent: 'flex-end', // Right align on desktop
                flexWrap: 'wrap' // Wrap buttons on very small screens
            }}>
                <button
                    onClick={() => router.push('/social/mis-pollas')}
                    style={{
                        backgroundColor: 'transparent',
                        color: '#94A3B8',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexGrow: 1, // Expand on mobile
                        justifyContent: 'center', // Center content on mobile
                        maxWidth: '120px', // But don't get too huge
                        marginRight: '0', // Reset previously hardcoded margin
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = theme.borderColor;
                        e.currentTarget.style.color = 'white';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = '#334155';
                        e.currentTarget.style.color = '#94A3B8';
                    }}
                >
                    <ArrowLeft size={14} /> Volver
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexGrow: 10, justifyContent: 'flex-end' }}>
                     <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 'bold', whiteSpace: 'nowrap', display: 'none' /* Hide label on mobile to save space */ }}>
                        TORNEO:
                    </span>
                    <select
                        value={tournamentId}
                        onChange={(e) => handleTournamentChange(e.target.value)}
                        style={{
                            backgroundColor: '#1E293B',
                            color: 'white',
                            border: `1px solid ${theme.borderColor}`,
                            borderRadius: '8px',
                            padding: '8px 16px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            outline: 'none',
                            boxShadow: `0 0 10px ${theme.borderColor}20`,
                            transition: 'all 0.2s',
                            flexGrow: 1, // Full width on mobile
                            maxWidth: '220px' // But capped
                        }}
                    >
                        <option value="WC2026">🏆 Mundial</option>
                        <option value="UCL2526">⭐ Champions</option>
                        <option value="TEST_LIVE_MONDAY">🧪 Pruebas en Vivo</option>
                    </select>
                </div>
            </div>
        </div>
    );
}
