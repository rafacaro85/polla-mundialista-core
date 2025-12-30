import React, { useState, useEffect } from 'react';
import { superAdminService } from '@/services/superAdminService';
import {
    Calendar, RefreshCw, Edit, Lock, Unlock, Save, X, Shield, Clock, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

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

export function MatchesList() {
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [editingMatch, setEditingMatch] = useState<any>(null);
    const [formData, setFormData] = useState({ homeScore: 0, awayScore: 0, isLocked: false, status: '' });

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
    }, []);

    const loadMatches = async () => {
        try {
            setLoading(true);
            const data = await superAdminService.getAllMatches();
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

    const openEditModal = (match: any) => {
        setEditingMatch(match);
        setFormData({
            homeScore: match.homeScore || 0,
            awayScore: match.awayScore || 0,
            isLocked: match.isLocked || false,
            status: match.status
        });
    };

    const handleSave = async () => {
        if (!editingMatch) return;
        try {
            await superAdminService.updateMatch(editingMatch.id, {
                homeScore: Number(formData.homeScore),
                awayScore: Number(formData.awayScore),
                isLocked: formData.isLocked,
                status: formData.status
            });
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
            isLocked: true // Auto-lock
        }));
    };

    if (loading) return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div></div>;

    return (
        <div style={STYLES.container}>
            {/* HEADER */}
            <div style={STYLES.header}>
                <div style={STYLES.title}>
                    <Shield size={20} color="#00E676" /> Gestión de Partidos
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <button
                        style={{ ...STYLES.syncBtn, backgroundColor: '#F59E0B', color: '#0F172A' }}
                        onClick={async () => {
                            if (confirm("¿Simular resultados aleatorios para todos los partidos pendientes?")) {
                                try {
                                    setSyncing(true);
                                    const res = await superAdminService.simulateMatches();
                                    toast.success(res.message);
                                    loadMatches();
                                } catch (e) {
                                    toast.error("Error al simular resultados");
                                } finally {
                                    setSyncing(false);
                                }
                            }
                        }}
                        disabled={syncing}
                    >
                        <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
                        Simular
                    </button>

                    <button
                        style={{ ...STYLES.syncBtn, backgroundColor: '#475569', color: 'white' }}
                        onClick={async () => {
                            if (confirm("¿Estás seguro de REINICIAR TODO el sistema? Se borrarán marcadores y puntos.")) {
                                try {
                                    setSyncing(true);
                                    const res = await superAdminService.resetAllMatches();
                                    toast.success(res.message);
                                    loadMatches();
                                } catch (e) {
                                    toast.error("Error al resetear sistema");
                                } finally {
                                    setSyncing(false);
                                }
                            }
                        }}
                        disabled={syncing}
                    >
                        <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
                        Limpiar
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

                    <button
                        style={{ ...STYLES.syncBtn, backgroundColor: '#00E676', color: '#0F172A' }}
                        onClick={() => setIsCreateModalOpen(true)}
                    >
                        ➕ Nuevo
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
            </div>

            {/* GRID DE TARJETAS */}
            <div style={STYLES.grid}>
                {matches.map(match => (
                    <div key={match.id} style={STYLES.card}>
                        {/* Header Tarjeta */}
                        <div style={STYLES.cardHeader}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Calendar size={12} />
                                {new Date(match.date).toLocaleDateString()}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={12} />
                                {new Date(match.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>

                        {/* Equipos y Marcador */}
                        <div style={STYLES.teamsRow}>
                            {/* Local */}
                            <div style={STYLES.team}>
                                <div style={STYLES.teamLogo}>
                                    {match.homeTeam ? match.homeTeam.charAt(0) : 'L'}
                                </div>
                                <div style={STYLES.teamName}>{match.homeTeam || 'Local'}</div>
                            </div>

                            {/* Marcador */}
                            <div style={STYLES.scoreBox}>
                                <div style={STYLES.score}>
                                    {match.homeScore ?? '-'} : {match.awayScore ?? '-'}
                                </div>
                                <div style={STYLES.statusBadge(match.status)}>
                                    {match.status}
                                </div>
                            </div>

                            {/* Visitante */}
                            <div style={STYLES.team}>
                                <div style={STYLES.teamLogo}>
                                    {match.awayTeam ? match.awayTeam.charAt(0) : 'V'}
                                </div>
                                <div style={STYLES.teamName}>{match.awayTeam || 'Visitante'}</div>
                            </div>
                        </div>

                        {/* Footer Acciones */}
                        <div style={STYLES.actionsFooter}>
                            <button
                                style={STYLES.actionBtn}
                                onClick={() => openEditModal(match)}
                            >
                                <Edit size={14} /> Editar Marcador
                            </button>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px',
                                color: match.isLocked ? '#F59E0B' : '#00E676', fontWeight: 'bold',
                                padding: '0 8px'
                            }}>
                                {match.isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                                {match.isLocked ? 'MANUAL' : 'AUTO'}
                            </div>
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

                        <div style={{ marginBottom: '20px' }}>
                            <label style={STYLES.label}>Estado del Partido</label>
                            <select
                                style={{ ...STYLES.input, textAlign: 'left' }}
                                value={formData.status}
                                onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                            >
                                <option value="SCHEDULED">📅 Programado (SCHEDULED)</option>
                                <option value="LIVE">🔴 En Vivo (LIVE)</option>
                                <option value="FINISHED">✅ Finalizado (FINISHED)</option>
                            </select>
                        </div>

                        <button style={STYLES.saveBtn} onClick={handleSave}><Save size={16} /> Guardar Cambios</button>
                    </div>
                </div>
            )}
        </div>
    );
}
