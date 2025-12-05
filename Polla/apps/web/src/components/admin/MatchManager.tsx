import React, { useState, useEffect } from 'react';
import { superAdminService } from '@/services/superAdminService';
import {
    Calendar, Clock, Shield, RefreshCw, Edit, Lock, Unlock, Save, X, CheckCircle
} from 'lucide-react';

const STYLES = {
    container: {
        backgroundColor: '#1E293B',
        borderRadius: '16px',
        border: '1px solid #334155',
        padding: '24px',
        color: 'white',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
    },
    title: {
        fontSize: '18px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
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
    tableContainer: {
        overflowX: 'auto' as const,
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse' as const,
        fontSize: '13px',
    },
    th: {
        textAlign: 'left' as const,
        padding: '12px',
        color: '#94A3B8',
        borderBottom: '1px solid #334155',
        textTransform: 'uppercase' as const,
        fontSize: '11px',
    },
    td: {
        padding: '12px',
        borderBottom: '1px solid #334155',
        verticalAlign: 'middle',
    },
    statusBadge: (isLocked: boolean) => ({
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '10px',
        fontWeight: 'bold',
        backgroundColor: isLocked ? 'rgba(245, 158, 11, 0.1)' : 'rgba(0, 230, 118, 0.1)',
        color: isLocked ? '#F59E0B' : '#00E676',
        border: `1px solid ${isLocked ? '#F59E0B' : '#00E676'}`,
    }),
    editBtn: {
        backgroundColor: '#334155',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        padding: '6px 10px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '11px',
    },
    modalOverlay: {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
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
    inputGroup: {
        marginBottom: '16px',
    },
    label: {
        display: 'block',
        color: '#94A3B8',
        fontSize: '11px',
        fontWeight: 'bold',
        marginBottom: '8px',
        textTransform: 'uppercase' as const,
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
    },
    toggleContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#0F172A',
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid #334155',
        marginBottom: '24px',
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
    },
};

export default function MatchManager() {
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
        } finally {
            setLoading(false);
        }
    };

    const handleForceSync = async () => {
        try {
            setSyncing(true);
            await superAdminService.forceSync();
            alert("Sincronización forzada iniciada. Los datos se actualizarán en breve.");
            setTimeout(loadMatches, 2000); // Wait a bit then reload
        } catch (error) {
            console.error("Error syncing:", error);
            alert("Error al forzar sincronización");
        } finally {
            setSyncing(false);
        }
    };

    const handleCreateMatch = async () => {
        try {
            if (!createForm.homeTeam || !createForm.awayTeam || !createForm.date) {
                const missing = [];
                if (!createForm.homeTeam) missing.push("Equipo Local");
                if (!createForm.awayTeam) missing.push("Equipo Visitante");
                if (!createForm.date) missing.push("Fecha");
                alert(`Por favor completa los campos obligatorios: ${missing.join(', ')}`);
                return;
            }

            await superAdminService.createMatch({
                homeTeam: createForm.homeTeam,
                awayTeam: createForm.awayTeam,
                date: createForm.date,
                externalId: createForm.externalId ? Number(createForm.externalId) : undefined
            });

            alert("Partido Creado Correctamente");
            setIsCreateModalOpen(false);
            setCreateForm({ homeTeam: '', awayTeam: '', date: '', externalId: '' });
            loadMatches();
        } catch (error) {
            console.error("Error creating match:", error);
            alert("Error al crear el partido");
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
                status: formData.status // Optional: allow updating status manually too if needed
            });
            setEditingMatch(null);
            loadMatches();
        } catch (error) {
            console.error("Error updating match:", error);
            alert("Error al actualizar el partido");
        }
    };

    // Auto-lock when score changes
    const handleScoreChange = (field: 'homeScore' | 'awayScore', value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
            isLocked: true // Auto-lock
        }));
    };

    if (loading) return <div style={{ color: 'white', textAlign: 'center', padding: '40px' }}>Cargando partidos...</div>;

    return (
        <div style={STYLES.container}>
            <div style={STYLES.header}>
                <div style={STYLES.title}>
                    <Shield size={20} color="#00E676" /> Gestión de Partidos
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        style={{ ...STYLES.syncBtn, backgroundColor: '#00E676', color: '#0F172A' }}
                        onClick={() => setIsCreateModalOpen(true)}
                    >
                        ➕ Nuevo Partido
                    </button>
                    <button
                        style={{ ...STYLES.syncBtn, opacity: syncing ? 0.7 : 1 }}
                        onClick={handleForceSync}
                        disabled={syncing}
                    >
                        <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
                        {syncing ? 'Sincronizando...' : 'Forzar Sincronización'}
                    </button>
                </div>
            </div>

            <div style={STYLES.tableContainer}>
                <table style={STYLES.table}>
                    <thead>
                        <tr>
                            <th style={STYLES.th}>Fecha</th>
                            <th style={STYLES.th}>Equipos</th>
                            <th style={STYLES.th}>Marcador</th>
                            <th style={STYLES.th}>Estado Sync</th>
                            <th style={STYLES.th}>Estado</th>
                            <th style={STYLES.th}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {matches.map(match => (
                            <tr key={match.id}>
                                <td style={STYLES.td}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Calendar size={12} color="#94A3B8" />
                                        {new Date(match.date).toLocaleDateString()}
                                        <span style={{ color: '#64748B', fontSize: '10px' }}>{new Date(match.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </td>
                                <td style={STYLES.td}>
                                    <div style={{ fontWeight: 'bold' }}>
                                        {match.homeTeam || match.homeTeamPlaceholder} vs {match.awayTeam || match.awayTeamPlaceholder}
                                    </div>
                                </td>
                                <td style={STYLES.td}>
                                    <div style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 'bold', color: '#FACC15' }}>
                                        {match.homeScore ?? '-'} : {match.awayScore ?? '-'}
                                    </div>
                                </td>
                                <td style={STYLES.td}>
                                    <div style={STYLES.statusBadge(match.isLocked)}>
                                        {match.isLocked ? <Lock size={10} /> : <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>}
                                        {match.isLocked ? 'MANUAL' : 'AUTO'}
                                    </div>
                                </td>
                                <td style={STYLES.td}>
                                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#94A3B8' }}>{match.status}</span>
                                </td>
                                <td style={STYLES.td}>
                                    <button style={STYLES.editBtn} onClick={() => openEditModal(match)}>
                                        <Edit size={12} /> Editar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* CREATE MODAL */}
            {isCreateModalOpen && (
                <div style={STYLES.modalOverlay}>
                    <div style={STYLES.modal}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>Nuevo Partido</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><X size={20} /></button>
                        </div>

                        <div style={STYLES.inputGroup}>
                            <label style={STYLES.label}>Equipo Local</label>
                            <input
                                type="text"
                                style={STYLES.input}
                                value={createForm.homeTeam}
                                onChange={(e) => setCreateForm({ ...createForm, homeTeam: e.target.value })}
                                placeholder="Ej: Atletico Nacional"
                            />
                        </div>

                        <div style={STYLES.inputGroup}>
                            <label style={STYLES.label}>Equipo Visitante</label>
                            <input
                                type="text"
                                style={STYLES.input}
                                value={createForm.awayTeam}
                                onChange={(e) => setCreateForm({ ...createForm, awayTeam: e.target.value })}
                                placeholder="Ej: Independiente Medellin"
                            />
                        </div>

                        <div style={STYLES.inputGroup}>
                            <label style={STYLES.label}>Fecha y Hora</label>
                            <input
                                type="datetime-local"
                                style={STYLES.input}
                                value={createForm.date}
                                onChange={(e) => setCreateForm({ ...createForm, date: e.target.value })}
                            />
                        </div>

                        <div style={STYLES.inputGroup}>
                            <label style={STYLES.label}>ID Externo (API-Football)</label>
                            <input
                                type="number"
                                style={STYLES.input}
                                value={createForm.externalId}
                                onChange={(e) => setCreateForm({ ...createForm, externalId: e.target.value })}
                                placeholder="Ej: 1487912"
                            />
                        </div>

                        <button style={STYLES.saveBtn} onClick={handleCreateMatch}>
                            <Save size={16} /> Guardar Partido
                        </button>
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}
            {editingMatch && (
                <div style={STYLES.modalOverlay}>
                    <div style={STYLES.modal}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>Editar Partido</h3>
                            <button onClick={() => setEditingMatch(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><X size={20} /></button>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={STYLES.label}>{editingMatch.homeTeam || 'Local'}</label>
                                <input
                                    type="number"
                                    style={STYLES.input}
                                    value={formData.homeScore}
                                    onChange={(e) => handleScoreChange('homeScore', e.target.value)}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={STYLES.label}>{editingMatch.awayTeam || 'Visitante'}</label>
                                <input
                                    type="number"
                                    style={STYLES.input}
                                    value={formData.awayScore}
                                    onChange={(e) => handleScoreChange('awayScore', e.target.value)}
                                />
                            </div>
                        </div>

                        <div style={STYLES.toggleContainer}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {formData.isLocked ? <Lock size={16} color="#F59E0B" /> : <Unlock size={16} color="#00E676" />}
                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: formData.isLocked ? '#F59E0B' : '#00E676' }}>
                                    {formData.isLocked ? 'Bloqueado (Manual)' : 'Sincronización Auto'}
                                </span>
                            </div>
                            <div
                                onClick={() => setFormData(prev => ({ ...prev, isLocked: !prev.isLocked }))}
                                style={{
                                    width: '40px', height: '20px', backgroundColor: formData.isLocked ? '#F59E0B' : '#334155',
                                    borderRadius: '10px', position: 'relative', cursor: 'pointer', transition: 'all 0.2s'
                                }}
                            >
                                <div style={{
                                    width: '16px', height: '16px', backgroundColor: 'white', borderRadius: '50%',
                                    position: 'absolute', top: '2px', left: formData.isLocked ? '22px' : '2px', transition: 'all 0.2s'
                                }} />
                            </div>
                        </div>

                        <button style={STYLES.saveBtn} onClick={handleSave}>
                            <Save size={16} /> Guardar Cambios
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
