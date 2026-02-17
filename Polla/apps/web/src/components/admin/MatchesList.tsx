import React, { useState, useEffect } from 'react';
import { superAdminService } from '@/services/superAdminService';
import {
    Calendar, RefreshCw, Edit, Lock, Unlock, Save, X, Shield, Clock, CheckCircle, Trophy, Database, Users
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { PhaseLocksManager } from './PhaseLocksManager';

const STYLES = {
    container: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '16px',
        paddingBottom: '100px',
        fontFamily: 'sans-serif'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
    },
    title: {
        fontSize: '18px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: 'white'
    },
    syncBtn: {
        backgroundColor: '#3B82F6',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '8px 16px',
        fontWeight: 'bold',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '12px',
        transition: 'all 0.2s',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '16px'
    },
    card: {
        backgroundColor: '#1E293B',
        borderRadius: '16px',
        border: '1px solid #334155',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '12px',
        position: 'relative' as const,
    },
    cardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '11px',
        color: '#94A3B8',
        borderBottom: '1px solid #334155',
        paddingBottom: '8px',
        marginBottom: '4px'
    },
    teamsRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px'
    },
    team: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        gap: '8px',
        flex: 1,
        textAlign: 'center' as const
    },
    teamName: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: '13px',
        lineHeight: '1.2'
    },
    teamLogo: {
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        backgroundColor: '#0F172A',
        border: '2px solid #334155',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#64748B'
    },
    scoreBox: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        gap: '4px'
    },
    score: {
        fontFamily: "'Russo One', sans-serif",
        fontSize: '24px',
        color: '#FACC15',
        letterSpacing: '2px'
    },
    vs: {
        fontSize: '10px',
        color: '#64748B',
        fontWeight: 'bold'
    },
    statusBadge: (status: string) => ({
        fontSize: '10px',
        fontWeight: 'bold',
        padding: '4px 8px',
        borderRadius: '12px',
        backgroundColor: status === 'FINISHED' ? 'rgba(0, 230, 118, 0.1)' : 'rgba(59, 130, 246, 0.1)',
        color: status === 'FINISHED' ? '#00E676' : '#3B82F6',
        border: `1px solid ${status === 'FINISHED' ? '#00E676' : '#3B82F6'}`,
        textTransform: 'uppercase' as const
    }),
    actionsFooter: {
        display: 'flex',
        gap: '8px',
        marginTop: '8px',
        paddingTop: '12px',
        borderTop: '1px solid #334155'
    },
    actionBtn: {
        flex: 1,
        padding: '8px',
        borderRadius: '8px',
        border: '1px solid #475569',
        backgroundColor: 'transparent',
        color: '#F8FAFC',
        fontSize: '11px',
        fontWeight: 'bold',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        transition: 'all 0.2s'
    },
    // Modal Styles (Reused)
    modalOverlay: {
        position: 'fixed' as const,
        top: 0, left: 0, width: '100%', height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 1000,
    },
    modal: {
        backgroundColor: '#1E293B',
        borderRadius: '16px',
        padding: '24px',
        width: '100%',
        maxWidth: '400px',
        border: '1px solid #334155',
    },
    input: {
        width: '100%',
        padding: '12px',
        backgroundColor: '#0F172A',
        border: '1px solid #334155',
        borderRadius: '8px',
        color: 'white',
        fontSize: '14px',
        fontWeight: 'bold',
        textAlign: 'center' as const
    },
    label: {
        display: 'block',
        color: '#94A3B8',
        fontSize: '11px',
        fontWeight: 'bold',
        marginBottom: '8px',
        textTransform: 'uppercase' as const,
        textAlign: 'center' as const
    },
    saveBtn: {
        width: '100%',
        padding: '12px',
        backgroundColor: '#00E676',
        color: '#0F172A',
        border: 'none',
        borderRadius: '8px',
        fontWeight: 'bold',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        marginTop: '16px'
    }
};

export function MatchesList({ tournamentId }: { tournamentId: string }) {
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [editingMatch, setEditingMatch] = useState<any>(null);
    const [assignMatch, setAssignMatch] = useState<any>(null); // New State
    const [formData, setFormData] = useState({ homeScore: 0, awayScore: 0, isManuallyLocked: false, status: '', minute: '', isTimerActive: false });
    const [assignForm, setAssignForm] = useState({ homeCode: '', awayCode: '' }); // New State
    // Rename Team State
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [renameForm, setRenameForm] = useState({ oldName: '', newCode: '' });
    const [filterPhase, setFilterPhase] = useState<string>('ALL');

    // Create Match State

    // Create Match State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createForm, setCreateForm] = useState({
        homeTeam: '',
        awayTeam: '',
        date: (() => {
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            return now.toISOString().slice(0, 16);
        })(),
        externalId: ''
    });

    useEffect(() => {
        loadMatches();
        
        // Auto-refresh cada 10 segundos para ver el tiempo correr en vivo
        const interval = setInterval(loadMatches, 10000);
        return () => clearInterval(interval);
    }, [tournamentId]);

    const loadMatches = async () => {
        try {
            setLoading(true);
            const data = await superAdminService.getAllMatches(tournamentId);
            setMatches(data);
        } catch (error) {
            console.error("Error loading matches:", error);
            toast.error("Error al cargar partidos");
        } finally {
            setLoading(false);
        }
    };

    const handleForceSync = async () => {
        try {
            setSyncing(true);
            await superAdminService.forceSync();
            toast.success("Sincronización forzada iniciada");
            setTimeout(loadMatches, 2000);
        } catch (error) {
            console.error("Error syncing:", error);
            toast.error("Error al sincronizar");
        } finally {
            setSyncing(false);
        }
    };

    const handleCreateMatch = async () => {
        try {
            if (!createForm.homeTeam || !createForm.awayTeam || !createForm.date) {
                toast.error("Completa los campos obligatorios");
                return;
            }

            await superAdminService.createMatch({
                homeTeam: createForm.homeTeam,
                awayTeam: createForm.awayTeam,
                date: createForm.date,
                externalId: createForm.externalId ? Number(createForm.externalId) : undefined
            });

            toast.success("Partido creado correctamente");
            setIsCreateModalOpen(false);
            setCreateForm({ homeTeam: '', awayTeam: '', date: '', externalId: '' });
            loadMatches();
        } catch (error) {
            console.error("Error creating match:", error);
            toast.error("Error al crear el partido");
        }
    };

    const handleAssignSave = async () => {
        if (!assignMatch) return;
        try {
            if (!assignForm.homeCode && !assignForm.awayCode) {
                 toast.error("Ingresa al menos un código");
                 return;
            }
            await superAdminService.setTeams(assignMatch.id, assignForm.homeCode.toUpperCase(), assignForm.awayCode.toUpperCase());
            toast.success("Equipos asignados correctamente");
            setAssignMatch(null);
            setAssignForm({ homeCode: '', awayCode: '' });
            loadMatches();
        } catch (error) {
            console.error("Error assigning teams:", error);
            toast.error("Error al asignar equipos. Verifica los códigos.");
        }
    };

    const handleRenameTeam = async () => {
        if (!renameForm.oldName || !renameForm.newCode) {
             toast.error("Completa ambos campos");
             return;
        }
        try {
             const res = await superAdminService.renameTeam(renameForm.oldName, renameForm.newCode.toUpperCase());
             toast.success(`Equipo renombrado: ${res.oldName} -> ${res.newTeam?.name}`);
             setIsRenameModalOpen(false);
             setRenameForm({ oldName: '', newCode: '' });
             loadMatches();
        } catch (error) {
            console.error("Error renaming team:", error);
            toast.error("Error al renombrar equipo");
        }
    };

    /**
     * Toggle manual lock with optimistic UI update
     */
    const toggleLock = async (matchId: string, currentLockState: boolean) => {
        const newLockState = !currentLockState;
        
        // Optimistic UI update
        setMatches(prev => prev.map(m =>
            m.id === matchId ? { ...m, isManuallyLocked: newLockState } : m
        ));
        
        try {
            await superAdminService.updateMatch(matchId, { isManuallyLocked: newLockState });
            toast.success(newLockState ? '🔒 Partido bloqueado' : '🔓 Partido desbloqueado');
        } catch (error) {
            // Revert on error
            setMatches(prev => prev.map(m =>
                m.id === matchId ? { ...m, isManuallyLocked: currentLockState } : m
            ));
            console.error('Error toggling lock:', error);
            toast.error('Error al cambiar estado de bloqueo');
        }
    };

    const openEditModal = (match: any) => {
        setEditingMatch(match);
        setFormData({
            homeScore: match.homeScore || 0,
            awayScore: match.awayScore || 0,
            isManuallyLocked: match.isManuallyLocked || false,
            status: match.status,
            minute: match.minute || '',
            isTimerActive: match.isTimerActive || false // Init Timer State
        });
    };

    const handleSave = async () => {
        if (!editingMatch) return;
        try {
            const updatePayload: any = {
                homeScore: Number(formData.homeScore),
                awayScore: Number(formData.awayScore),
                isManuallyLocked: formData.isManuallyLocked,
                status: formData.status,
                isTimerActive: formData.isTimerActive
            };

            // 🔥 FIX: Solo enviamos el minuto si el usuario lo editó manualmente.
            // Si es igual al valor que cargó el modal inicialmente, lo omitimos
            // para no sobrescribir el progreso real que lleva el servidor.
            if (formData.minute !== (editingMatch.minute || '')) {
                updatePayload.minute = formData.minute || null;
            }

            await superAdminService.updateMatch(editingMatch.id, updatePayload);
            setEditingMatch(null);
            toast.success("Partido actualizado");
            loadMatches();
        } catch (error) {
            console.error("Error updating match:", error);
            toast.error("Error al actualizar");
        }
    };

    const handleScoreChange = (field: 'homeScore' | 'awayScore', value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
            isManuallyLocked: true // Auto-lock
        }));
    };

    const filteredMatches = matches
        .filter(m => filterPhase === 'ALL' || m.phase === filterPhase)
        .sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            if (dateA !== dateB) return dateA - dateB;
            return (a.bracketId || 0) - (b.bracketId || 0);
        });

    if (loading) return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div></div>;

    return (
        <div style={STYLES.container}>
            {/* HEADER */}
            <div style={STYLES.header}>
                <div style={STYLES.title}>
                    <Shield size={20} color="#00E676" /> Gestión de Partidos
                </div>
                {/* BUTTONS CONTAINER */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end', width: '100%' }}>
                    
                    {/* TOP ROW: MAIN ACTIONS (Always Visible) */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <button
                            style={{ ...STYLES.syncBtn, backgroundColor: '#F59E0B', color: '#0F172A' }}
                            onClick={async () => {
                                const confirmId = prompt(`⚠️ ACCIÓN CRÍTICA ⚠️\n\nEstás a punto de simular resultados para ${tournamentId}.\nEsta acción no se puede deshacer.\n\nPara confirmar, escribe: ${tournamentId}`);
                                if (confirmId === tournamentId) {
                                    try {
                                        setSyncing(true);
                                        const res = await superAdminService.simulateMatches(tournamentId);
                                        toast.success(res.message);
                                        loadMatches();
                                    } catch (e) {
                                        toast.error("Error al simular resultados");
                                    } finally {
                                        setSyncing(false);
                                    }
                                } else if (confirmId !== null) {
                                    toast.error("ID de torneo incorrecto. Acción cancelada.");
                                }
                            }}
                            disabled={syncing}
                        >
                            <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
                            Simular
                        </button>

                        <button
                            style={{ ...STYLES.syncBtn, backgroundColor: '#EF4444', color: 'white' }}
                            onClick={async () => {
                                const confirmId = prompt(`⛔ PELIGRO: RESET TOTAL ⛔\n\nEstás a punto de BORRAR TODOS los resultados y puntos de ${tournamentId}.\n\nPara confirmar, escribe bién clear y luego: ${tournamentId}`);
                                if (confirmId === `${tournamentId}`) {
                                    try {
                                        setSyncing(true);
                                        const res = await superAdminService.resetAllMatches(tournamentId);
                                        toast.success(res.message);
                                        loadMatches();
                                    } catch (e) {
                                        toast.error("Error al resetear sistema");
                                    } finally {
                                        setSyncing(false);
                                    }
                                } else if (confirmId !== null) {
                                    toast.error("Confirmación incorrecta.");
                                }
                            }}
                            disabled={syncing}
                        >
                            <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
                            Resetear TODO
                        </button>

                        <button
                            style={{ ...STYLES.syncBtn, backgroundColor: '#00E676', color: '#0F172A' }}
                            onClick={() => setIsCreateModalOpen(true)}
                        >
                            ➕ Nuevo
                        </button>

                        <button
                            style={{ ...STYLES.syncBtn, backgroundColor: '#3B82F6', color: 'white' }}
                            onClick={() => setIsRenameModalOpen(true)}
                        >
                            🔄 Revelar Equipo
                        </button>

                        <button
                            style={{ ...STYLES.syncBtn, opacity: syncing ? 0.7 : 1 }}
                            onClick={handleForceSync}
                            disabled={syncing}
                        >
                            <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
                            {syncing ? 'Sincronizando...' : 'Sync'}
                        </button>
                    </div>

                    {tournamentId === 'TEST_LIVE_MONDAY' && (
                         <button
                            style={{ ...STYLES.syncBtn, backgroundColor: '#F59E0B', color: '#0F172A', marginTop: '8px' }}
                            onClick={async () => {
                                try {
                                    await api.get('/matches/fix-test-matches');
                                    toast.success('Torneo de Pruebas Inicializado');
                                    loadMatches();
                                } catch (e: any) {
                                    toast.error('Error al inicializar');
                                }
                            }}
                        >
                            🧪 Inicializar Torneo Pruebas
                        </button>
                    )}

                    {/* SETUP INICIAL - Collapsible */}
                    <details style={{ width: '100%', textAlign: 'right' }}>
                        <summary style={{ 
                            cursor: 'pointer', 
                            padding: '6px 12px', 
                            backgroundColor: '#1E293B', 
                            borderRadius: '8px',
                            color: '#94A3B8',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            userSelect: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            listStyle: 'none'
                        }}>
                            <span>⚙️ Setup Inicial (Solo una vez) ▼</span>
                        </summary>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px', justifyContent: 'flex-end' }}>
                            <button
                                style={{ ...STYLES.syncBtn, backgroundColor: '#10B981', color: 'white' }}
                                onClick={async () => {
                                    try {
                                        setSyncing(true);
                                        await api.post('/matches/promote-groups');
                                        toast.success("Promoción verificada");
                                        loadMatches();
                                    } catch (e) {
                                        toast.error("Error al promover grupos");
                                    } finally {
                                        setSyncing(false);
                                    }
                                }}
                                disabled={syncing}
                            >
                                <Trophy size={14} />
                                Promover Grupos (Fix)
                            </button>

                            <button
                                style={{ ...STYLES.syncBtn, backgroundColor: '#0EA5E9', color: 'white' }}
                                onClick={async () => {
                                    try {
                                        setSyncing(true);
                                        const res = await superAdminService.fixUCLData();
                                        toast.success(res.message);
                                        loadMatches();
                                    } catch (e) {
                                        toast.error("Error al corregir datos");
                                    } finally {
                                        setSyncing(false);
                                    }
                                }}
                                disabled={syncing}
                            >
                                <Database size={14} />
                                Corregir Datos Champions
                            </button>

                            <button
                                style={{ ...STYLES.syncBtn, backgroundColor: '#6366F1', color: 'white' }}
                                onClick={async () => {
                                    if (confirm("¿Crear llaves de Dieciseisavos y Octavos para el Mundial 2026?")) {
                                        try {
                                            setSyncing(true);
                                            const res = await superAdminService.seedRound32();
                                            toast.success(res.message);
                                            loadMatches();
                                        } catch (e) {
                                            toast.error("Error al inicializar fase final");
                                        } finally {
                                            setSyncing(false);
                                        }
                                    }
                                }}
                                disabled={syncing}
                            >
                                <Trophy size={14} />
                                Llaves 2026
                            </button>
                        </div>
                    </details>

                    {/* DEBUG TOOLS - Collapsible */}
                    <details style={{ width: '100%', textAlign: 'right' }}>
                        <summary style={{ 
                            cursor: 'pointer', 
                            padding: '6px 12px', 
                            backgroundColor: '#1E293B', 
                            borderRadius: '8px',
                            color: '#94A3B8',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            userSelect: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            listStyle: 'none'
                        }}>
                            <span>🔧 Debug y Diagnóstico ▼</span>
                        </summary>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px', justifyContent: 'flex-end' }}>
                            <button
                                style={{ ...STYLES.syncBtn, backgroundColor: '#EF4444', color: 'white' }}
                                onClick={async () => {
                                    if (confirm("¿Intentar REPARAR y recargar llaves de Cuartos/Semis faltantes?")) {
                                        try {
                                            setSyncing(true);
                                            const res = await superAdminService.repairTournament();
                                            toast.success(res.message);
                                            loadMatches();
                                        } catch (e) {
                                            toast.error("Error en reparación");
                                        } finally {
                                            setSyncing(false);
                                        }
                                    }
                                }}
                                disabled={syncing}
                            >
                                    <Shield size={14} />
                                    Reparar
                            </button>

                            <button
                                style={{ ...STYLES.syncBtn, backgroundColor: '#D946EF', color: 'white' }}
                                onClick={async () => {
                                    if (confirm('¿Recalcular puntos de TODOS los brackets de usuarios? (Puede tardar unos segundos)')) {
                                        try {
                                            setSyncing(true);
                                            await api.post('/brackets/recalculate');
                                            toast.success("Puntos recalculados. Tus aciertos históricos ya cuentan.");
                                        } catch (e: any) {
                                            console.error("Recalculate error:", e);
                                            toast.error(`Error: ${e.response?.data?.message || e.message || "Error desconocido"}`);
                                        } finally {
                                            setSyncing(false);
                                        }
                                    }
                                }}
                                disabled={syncing}
                            >
                                <Database size={14} />
                                Recalcular Puntos
                            </button>

                            <button
                                style={{ ...STYLES.syncBtn, backgroundColor: '#8B5CF6', color: 'white' }}
                                onClick={async () => {
                                    try {
                                        setSyncing(true);
                                        const res = await superAdminService.diagnoseKnockout();
                                        console.log('🔍 DIAGNÓSTICO:', res);
                                        toast.success(`Diagnóstico completo. Ver consola del navegador.`);
                                        alert(JSON.stringify(res, null, 2));
                                    } catch (e) {
                                        toast.error("Error en diagnóstico");
                                    } finally {
                                        setSyncing(false);
                                    }
                                }}
                                disabled={syncing}
                            >
                                    <CheckCircle size={14} />
                                    Diagnosticar
                            </button>
                        </div>
                    </details>
                </div>
            </div>

            {/* PHASE LOCKS MANAGER */}
            <PhaseLocksManager tournamentId={tournamentId} />

            {/* FILTROS DE FASE */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                {(tournamentId === 'UCL2526'
                    ? ['ALL', 'PLAYOFF_1', 'PLAYOFF_2', 'ROUND_16', 'QUARTER', 'SEMI', 'FINAL'] // UCL
                    : ['ALL', 'GROUP', 'ROUND_32', 'ROUND_16', 'QUARTER', 'SEMI', '3RD_PLACE', 'FINAL'] // WC
                ).map(phase => (
                    <button
                        key={phase}
                        onClick={() => setFilterPhase(phase)}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            backgroundColor: filterPhase === phase ? '#3B82F6' : '#334155',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {phase === 'ALL' ? 'Todos' :
                            phase === 'GROUP' ? 'Grupos' :
                            phase === 'PLAYOFF_1' ? 'Play-off ida' :
                            phase === 'PLAYOFF_2' ? 'Play-off vuelta' :
                                phase === 'ROUND_32' ? '1/16' :
                                    phase === 'ROUND_16' ? 'Octavos' :
                                        phase === 'QUARTER' ? 'Cuartos' :
                                            phase === 'SEMI' ? 'Semis' :
                                                phase === '3RD_PLACE' ? '3er Puesto' :
                                                    'Final'}
                    </button>
                ))}
            </div>
            <div style={STYLES.grid}>
                {filteredMatches.map(match => (
                    <div key={match.id} style={STYLES.card}>
                        {/* Header Tarjeta */}
                        <div style={STYLES.cardHeader}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Calendar size={12} />
                                {new Date(match.date).toLocaleDateString()}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#334155', padding: '2px 6px', borderRadius: '4px' }}>
                                <Trophy size={10} />
                                {match.phase} {match.group ? `(${match.group})` : ''}
                            </div>
                        </div>

                        {/* Equipos y Marcador */}
                        <div style={STYLES.teamsRow}>
                            {/* Local */}
                            <div style={STYLES.team}>
                                <div style={STYLES.teamLogo}>
                                    {match.homeTeam ? match.homeTeam.charAt(0) : 'L'}
                                </div>
                                <div style={STYLES.teamName}>{match.homeTeam || match.homeTeamPlaceholder || 'Local'}</div>
                            </div>

                            {/* Marcador */}
                            <div style={STYLES.scoreBox}>
                                <div style={STYLES.score}>
                                    {match.homeScore ?? '-'} : {match.awayScore ?? '-'}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                    <div style={STYLES.statusBadge(match.status)}>
                                        {match.status}
                                    </div>
                                    {match.status === 'LIVE' && match.minute && (
                                        <span style={{ fontSize: '10px', color: '#F59E0B', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            {match.isTimerActive && <Clock size={10} className="animate-pulse" />}
                                            {match.minute}'
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Visitante */}
                            <div style={STYLES.team}>
                                <div style={STYLES.teamLogo}>
                                    {match.awayTeam ? match.awayTeam.charAt(0) : 'V'}
                                </div>
                                <div style={STYLES.teamName}>{match.awayTeam || match.awayTeamPlaceholder || 'Visitante'}</div>
                            </div>
                        </div>

                        {/* Footer Acciones */}
                        <div style={STYLES.actionsFooter}>
                            <button
                                style={STYLES.actionBtn}
                                onClick={() => openEditModal(match)}
                            >
                                <Edit size={14} /> Editar
                            </button>
                            <button
                                style={STYLES.actionBtn}
                                onClick={() => {
                                    setAssignMatch(match);
                                    setAssignForm({ homeCode: '', awayCode: '' });
                                }}
                            >
                                <Users size={14} /> Asignar
                            </button>
                            <button
                                style={{
                                    ...STYLES.actionBtn,
                                    backgroundColor: match.isManuallyLocked ? '#EF4444' : '#10B981',
                                    borderColor: match.isManuallyLocked ? '#EF4444' : '#10B981',
                                    color: 'white',
                                    fontWeight: 'bold'
                                }}
                                onClick={() => toggleLock(match.id, match.isManuallyLocked || false)}
                                title={match.isManuallyLocked ? 'Desbloquear partido' : 'Bloquear partido'}
                            >
                                <span style={{ fontSize: '16px' }}>
                                    {match.isManuallyLocked ? '🔒' : '🔓'}
                                </span>
                                {match.isManuallyLocked ? 'LOCKED' : 'OPEN'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* MODALES (Create & Edit) */}
            {isCreateModalOpen && (
                <div style={STYLES.modalOverlay}>
                    <div style={STYLES.modal}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: 'white' }}>Nuevo Partido</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        {/* Inputs... */}
                        <div style={{ marginBottom: '12px' }}>
                            <label style={STYLES.label}>Equipo Local</label>
                            <input type="text" style={STYLES.input} value={createForm.homeTeam} onChange={e => setCreateForm({ ...createForm, homeTeam: e.target.value })} />
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                            <label style={STYLES.label}>Equipo Visitante</label>
                            <input type="text" style={STYLES.input} value={createForm.awayTeam} onChange={e => setCreateForm({ ...createForm, awayTeam: e.target.value })} />
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                            <label style={STYLES.label}>Fecha</label>
                            <input type="datetime-local" style={STYLES.input} value={createForm.date} onChange={e => setCreateForm({ ...createForm, date: e.target.value })} />
                        </div>
                        <button style={STYLES.saveBtn} onClick={handleCreateMatch}><Save size={16} /> Guardar</button>
                    </div>
                </div>
            )}

            {editingMatch && (
                <div style={STYLES.modalOverlay}>
                    <div style={STYLES.modal}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: 'white' }}>Editar Marcador</h3>
                            <button onClick={() => setEditingMatch(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={STYLES.label}>{editingMatch.homeTeam}</label>
                                <input type="number" style={STYLES.input} value={formData.homeScore} onChange={e => handleScoreChange('homeScore', e.target.value)} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={STYLES.label}>{editingMatch.awayTeam}</label>
                                <input type="number" style={STYLES.input} value={formData.awayScore} onChange={e => handleScoreChange('awayScore', e.target.value)} />
                            </div>
                        </div>

                        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                            <label style={{ ...STYLES.label, color: '#60A5FA', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Clock size={16} /> CONTROL CRONÓMETRO AUTOMÁTICO
                            </label>
                            
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                <input 
                                    type="text" 
                                    style={{ ...STYLES.input, flex: 2, textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }} 
                                    value={formData.minute} 
                                    onChange={e => setFormData(prev => ({ ...prev, minute: e.target.value }))}
                                    placeholder="Minuto"
                                />
                                <div style={{ display: 'flex', gap: '5px', flex: 3 }}>
                                    <button 
                                        style={{ ...STYLES.saveBtn, backgroundColor: editingMatch.isTimerActive ? '#EF4444' : '#10B981', flex: 1, textTransform: 'uppercase', fontSize: '12px' }}
                                        onClick={() => setFormData(prev => ({ ...prev, isTimerActive: !prev.isTimerActive, status: 'LIVE' }))}
                                    >
                                        {/* Optimistic UI toggle logic handled in render by formData check if we want, but simpler to just toggle state */}
                                        {formData.isTimerActive ? '⏸ PAUSAR' : '▶️ INICIAR'}
                                    </button>
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                <button 
                                    style={{ ...STYLES.saveBtn, backgroundColor: '#3B82F6', flex: 1, fontSize: '11px', padding: '8px 4px' }}
                                    onClick={() => setFormData(prev => ({ ...prev, minute: 'HT', isTimerActive: false }))}
                                >
                                    ⏸ ENTRETIEMPO
                                </button>
                                <button 
                                    style={{ ...STYLES.saveBtn, backgroundColor: '#8B5CF6', flex: 1, fontSize: '11px', padding: '8px 4px' }}
                                    onClick={() => setFormData(prev => ({ ...prev, minute: '45', isTimerActive: true, status: 'LIVE' }))}
                                >
                                    ▶️ 2DO TIEMPO
                                </button>
                                <button 
                                    style={{ ...STYLES.saveBtn, backgroundColor: '#EF4444', flex: 1, fontSize: '11px', padding: '8px 4px' }}
                                    onClick={() => setFormData(prev => ({ ...prev, status: 'FINISHED', minute: 'FT', isTimerActive: false }))}
                                >
                                    🏁 FINALIZAR
                                </button>
                            </div>
                            <p style={{ fontSize: '10px', color: '#94A3B8', marginTop: '10px', fontStyle: 'italic' }}>
                                * AL INICIAR, el sistema sumará 1 minuto automáticamente cada 60 segundos.
                            </p>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={STYLES.label}>Estado del Partido</label>
                            <select
                                style={{ ...STYLES.input, textAlign: 'left' }}
                                value={formData.status}
                                onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                            >
                                <option value="SCHEDULED">📅 Programado (SCHEDULED)</option>
                                <option value="LIVE">🔴 En Vivo (LIVE)</option>
                                <option value="PENDING">🕒 Pendiente (PENDING)</option>
                                <option value="FINISHED">✅ Finalizado (FINISHED)</option>
                            </select>
                        </div>

                        <button style={STYLES.saveBtn} onClick={handleSave}><Save size={16} /> Guardar Cambios</button>
                    </div>
                </div>
            )}

            {/* RENAME MODAL */}
            {isRenameModalOpen && (
                <div style={STYLES.modalOverlay}>
                    <div style={STYLES.modal}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: 'white' }}>Revelar / Renombrar Equipo</h3>
                            <button onClick={() => setIsRenameModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        
                        <p style={{ color: '#94A3B8', fontSize: '12px', marginBottom: '16px' }}>
                            Esto cambiará el equipo en TODOS los partidos (Grupos y Playoffs). Útil para revelar repechajes.
                        </p>

                        <div style={{ marginBottom: '12px' }}>
                            <label style={STYLES.label}>Nombre ACTUAL (o Placeholder)</label>
                            <input 
                                type="text" 
                                style={STYLES.input} 
                                value={renameForm.oldName} 
                                onChange={e => setRenameForm({ ...renameForm, oldName: e.target.value })}
                                placeholder="Ej: Ganador Repechaje A"
                            />
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                            <label style={STYLES.label}>Nuevo CÓDIGO Real</label>
                            <input 
                                type="text" 
                                style={{ ...STYLES.input, textTransform: 'uppercase' }} 
                                value={renameForm.newCode} 
                                onChange={e => setRenameForm({ ...renameForm, newCode: e.target.value })}
                                placeholder="Ej: CRC" 
                            />
                        </div>

                        <button style={STYLES.saveBtn} onClick={handleRenameTeam}>
                            <Save size={16} /> Renombrar Globalmente
                        </button>
                    </div>
                </div>
            )}

            {/* ASSIGN MODAL */}
            {assignMatch && (
                <div style={STYLES.modalOverlay}>
                    <div style={STYLES.modal}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: 'white' }}>Asignar Equipos (Manual)</h3>
                            <button onClick={() => setAssignMatch(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        
                        <p style={{ color: '#94A3B8', fontSize: '12px', marginBottom: '16px' }}>
                            Ingresa los CÓDIGOS de los equipos (ej: BRA, MEX, USA, PLA_A).
                        </p>

                        <div style={{ marginBottom: '12px' }}>
                            <label style={STYLES.label}>Código Local (Home)</label>
                            <input 
                                type="text" 
                                style={{ ...STYLES.input, textTransform: 'uppercase' }} 
                                value={assignForm.homeCode} 
                                onChange={e => setAssignForm({ ...assignForm, homeCode: e.target.value })}
                                placeholder="Ej: BRA"
                            />
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                            <label style={STYLES.label}>Código Visitante (Away)</label>
                            <input 
                                type="text" 
                                style={{ ...STYLES.input, textTransform: 'uppercase' }} 
                                value={assignForm.awayCode} 
                                onChange={e => setAssignForm({ ...assignForm, awayCode: e.target.value })}
                                placeholder="Ej: PLA_A" 
                            />
                        </div>

                        <button style={STYLES.saveBtn} onClick={handleAssignSave}>
                            <Save size={16} /> Guardar Asignación
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
