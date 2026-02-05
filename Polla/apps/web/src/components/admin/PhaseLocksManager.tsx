import React, { useState, useEffect } from 'react';
import { Lock, Unlock, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { superAdminService } from '@/services/superAdminService';

interface PhaseStatus {
    phase: string;
    isManuallyLocked: boolean;
    isUnlocked: boolean;
    allMatchesCompleted: boolean;
}

const PHASE_LABELS: Record<string, string> = {
    'ROUND_32': '1/16 de Final (32 equipos)',
    'ROUND_16': 'Octavos de Final',
    'QUARTER': 'Cuartos de Final',
    'SEMI': 'Semifinales',
    '3RD_PLACE': 'Tercer Puesto',
    'FINAL': 'Final',
};

export function PhaseLocksManager() {
    const [phases, setPhases] = useState<PhaseStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState<string | null>(null);

    const loadPhases = async () => {
        try {
            setLoading(true);
            const tournamentId = process.env.NEXT_PUBLIC_APP_THEME === 'CHAMPIONS' ? 'UCL2526' : 'WC2026';
            const data = await superAdminService.getPhaseStatus(tournamentId);
            setPhases(data);
        } catch (error) {
            console.error('Error loading phases:', error);
            toast.error('Error al cargar fases');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPhases();
    }, []);

    const togglePhaseLock = async (phase: string, currentLockState: boolean) => {
        const newLockState = !currentLockState;
        setToggling(phase);

        // Optimistic UI update
        setPhases(prev => prev.map(p =>
            p.phase === phase ? { ...p, isManuallyLocked: newLockState } : p
        ));

        try {
            const tournamentId = process.env.NEXT_PUBLIC_APP_THEME === 'CHAMPIONS' ? 'UCL2526' : 'WC2026';
            await superAdminService.setPhaseLock(phase, newLockState, tournamentId);
            toast.success(newLockState ? `🔒 Fase ${PHASE_LABELS[phase]} bloqueada` : `🔓 Fase ${PHASE_LABELS[phase]} desbloqueada`);
        } catch (error) {
            // Revert on error
            setPhases(prev => prev.map(p =>
                p.phase === phase ? { ...p, isManuallyLocked: currentLockState } : p
            ));
            console.error('Error toggling phase lock:', error);
            toast.error('Error al cambiar estado de bloqueo');
        } finally {
            setToggling(null);
        }
    };

    if (loading) {
        return (
            <div style={STYLES.container}>
                <div style={STYLES.loadingText}>Cargando fases...</div>
            </div>
        );
    }

    return (
        <div style={STYLES.container}>
            <div style={STYLES.header}>
                <h2 style={STYLES.title}>🔒 Bloqueo de Fases (Brackets)</h2>
                <button style={STYLES.refreshBtn} onClick={loadPhases}>
                    <RefreshCw size={16} />
                    Actualizar
                </button>
            </div>

            <div style={STYLES.description}>
                Bloquea manualmente las predicciones de brackets para cada fase. 
                El bloqueo automático se activa 10 minutos antes del primer partido de cada fase.
            </div>

            <div style={STYLES.grid}>
                {phases.map(phase => (
                    <div key={phase.phase} style={STYLES.card}>
                        <div style={STYLES.cardHeader}>
                            <h3 style={STYLES.phaseName}>{PHASE_LABELS[phase.phase] || phase.phase}</h3>
                            <div style={{
                                ...STYLES.badge,
                                backgroundColor: phase.isManuallyLocked ? '#EF4444' : '#10B981'
                            }}>
                                {phase.isManuallyLocked ? '🔒 BLOQUEADA' : '🔓 ABIERTA'}
                            </div>
                        </div>

                        <div style={STYLES.cardBody}>
                            <div style={STYLES.statusRow}>
                                <span style={STYLES.statusLabel}>Bloqueo Manual:</span>
                                <span style={STYLES.statusValue}>
                                    {phase.isManuallyLocked ? 'Sí' : 'No'}
                                </span>
                            </div>
                            <div style={STYLES.statusRow}>
                                <span style={STYLES.statusLabel}>Fase Desbloqueada:</span>
                                <span style={STYLES.statusValue}>
                                    {phase.isUnlocked ? 'Sí' : 'No'}
                                </span>
                            </div>
                            <div style={STYLES.statusRow}>
                                <span style={STYLES.statusLabel}>Partidos Completados:</span>
                                <span style={STYLES.statusValue}>
                                    {phase.allMatchesCompleted ? 'Sí' : 'No'}
                                </span>
                            </div>
                        </div>

                        <button
                            style={{
                                ...STYLES.toggleBtn,
                                backgroundColor: phase.isManuallyLocked ? '#10B981' : '#EF4444',
                                opacity: toggling === phase.phase ? 0.6 : 1,
                            }}
                            onClick={() => togglePhaseLock(phase.phase, phase.isManuallyLocked)}
                            disabled={toggling === phase.phase}
                        >
                            {toggling === phase.phase ? (
                                <>
                                    <RefreshCw size={16} className="spin" />
                                    Procesando...
                                </>
                            ) : phase.isManuallyLocked ? (
                                <>
                                    <Unlock size={16} />
                                    Desbloquear Fase
                                </>
                            ) : (
                                <>
                                    <Lock size={16} />
                                    Bloquear Fase
                                </>
                            )}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

const STYLES = {
    container: {
        padding: '24px',
        maxWidth: '1200px',
        margin: '0 auto',
    } as React.CSSProperties,
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
    } as React.CSSProperties,
    title: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#F8FAFC',
        margin: 0,
    } as React.CSSProperties,
    refreshBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        backgroundColor: '#3B82F6',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s',
    } as React.CSSProperties,
    description: {
        fontSize: '14px',
        color: '#94A3B8',
        marginBottom: '24px',
        lineHeight: '1.6',
    } as React.CSSProperties,
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '16px',
    } as React.CSSProperties,
    card: {
        backgroundColor: '#1E293B',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #334155',
    } as React.CSSProperties,
    cardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
    } as React.CSSProperties,
    phaseName: {
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#F8FAFC',
        margin: 0,
    } as React.CSSProperties,
    badge: {
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: 'bold',
        color: 'white',
    } as React.CSSProperties,
    cardBody: {
        marginBottom: '16px',
    } as React.CSSProperties,
    statusRow: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px 0',
        borderBottom: '1px solid #334155',
    } as React.CSSProperties,
    statusLabel: {
        fontSize: '13px',
        color: '#94A3B8',
    } as React.CSSProperties,
    statusValue: {
        fontSize: '13px',
        color: '#F8FAFC',
        fontWeight: '600',
    } as React.CSSProperties,
    toggleBtn: {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '12px',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 'bold',
        color: 'white',
        cursor: 'pointer',
        transition: 'all 0.2s',
    } as React.CSSProperties,
    loadingText: {
        textAlign: 'center',
        color: '#94A3B8',
        fontSize: '16px',
        padding: '40px',
    } as React.CSSProperties,
};
