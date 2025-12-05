'use client';

import React, { useState } from 'react';
import { X, Save, Clock, Play, Check, Hash } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface Match {
    id: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: number | null;
    awayScore: number | null;
    status: string;
    date: string;
    // Optional fields for flexibility
    homeFlag?: string;
    awayFlag?: string;
}

interface EditMatchDialogProps {
    match: Match;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onMatchUpdated: () => void;
}

export function EditMatchDialog({ match, open, onOpenChange, onMatchUpdated }: EditMatchDialogProps) {
    if (!open || !match) return null;

    // ESTADOS LOCALES (Restored Logic)
    const [homeScore, setHomeScore] = useState<string>(match.homeScore?.toString() || '');
    const [awayScore, setAwayScore] = useState<string>(match.awayScore?.toString() || '');
    const [status, setStatus] = useState<string>(match.status);
    const [loading, setLoading] = useState(false);

    // LOGICA DE GUARDADO (Restored Logic)
    const handleSave = async () => {
        setLoading(true);
        try {
            const updateData: any = {
                status,
            };

            // Solo enviar scores si no están vacíos
            if (homeScore !== '') {
                updateData.homeScore = parseInt(homeScore);
            } else {
                updateData.homeScore = null;
            }

            if (awayScore !== '') {
                updateData.awayScore = parseInt(awayScore);
            } else {
                updateData.awayScore = null;
            }

            await api.patch(`/matches/${match.id}`, updateData);
            toast.success('Partido actualizado exitosamente');
            onMatchUpdated();
        } catch (error: any) {
            console.error('Error actualizando partido:', error);
            toast.error(error.response?.data?.message || 'Error al actualizar partido');
        } finally {
            setLoading(false);
        }
    };

    // SISTEMA DE DISEÑO BLINDADO (User's New Design)
    const STYLES = {
        overlay: {
            position: 'fixed' as const,
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px'
        },
        card: {
            backgroundColor: '#1E293B', // Carbon
            width: '100%',
            maxWidth: '400px',
            borderRadius: '24px',
            border: '1px solid #334155',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            overflow: 'hidden',
            fontFamily: 'sans-serif',
            animation: 'fadeIn 0.2s ease-out'
        },
        header: {
            padding: '20px',
            borderBottom: '1px solid #334155',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'rgba(15, 23, 42, 0.5)'
        },
        title: {
            fontFamily: "'Russo One', sans-serif",
            color: 'white',
            textTransform: 'uppercase' as const,
            fontSize: '18px',
            letterSpacing: '1px'
        },
        closeBtn: {
            background: 'transparent',
            border: 'none',
            color: '#94A3B8',
            cursor: 'pointer',
            padding: '4px'
        },

        // CUERPO DEL MODAL
        body: {
            padding: '24px'
        },

        // SECCIÓN EQUIPOS (VS)
        teamsSection: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
        },
        teamName: {
            fontFamily: "'Russo One', sans-serif",
            fontSize: '24px',
            color: 'white',
            textAlign: 'center' as const,
            textTransform: 'uppercase' as const
        },
        vsLabel: {
            fontSize: '12px',
            fontWeight: '900',
            color: '#475569',
            backgroundColor: '#0F172A',
            padding: '4px 8px',
            borderRadius: '4px'
        },

        // INPUTS DE MARCADOR
        scoreContainer: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '32px'
        },
        scoreInputWrapper: {
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            gap: '8px'
        },
        scoreInput: {
            width: '80px',
            height: '80px',
            backgroundColor: '#0F172A', // Obsidian
            border: '2px solid #334155',
            borderRadius: '16px',
            color: '#00E676', // Verde Neón
            fontFamily: "'Russo One', sans-serif",
            fontSize: '48px',
            textAlign: 'center' as const,
            outline: 'none',
            transition: 'all 0.2s',
            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)'
        },
        teamLabel: {
            fontSize: '10px',
            fontWeight: 'bold',
            color: '#94A3B8',
            textTransform: 'uppercase' as const
        },

        // SECCIÓN ESTADO
        statusSection: {
            marginBottom: '32px'
        },
        statusLabel: {
            fontSize: '11px',
            color: '#94A3B8',
            fontWeight: 'bold',
            marginBottom: '12px',
            textTransform: 'uppercase' as const,
            letterSpacing: '1px'
        },
        statusGrid: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '8px',
            backgroundColor: '#0F172A',
            padding: '4px',
            borderRadius: '12px'
        },
        statusBtn: {
            padding: '10px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '10px',
            fontWeight: 'bold',
            textTransform: 'uppercase' as const,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.2s'
        },

        // FOOTER ACCIONES
        footer: {
            padding: '20px',
            borderTop: '1px solid #334155',
            display: 'flex',
            gap: '12px'
        },
        saveBtn: {
            flex: 1,
            backgroundColor: '#00E676',
            color: '#0F172A',
            border: 'none',
            padding: '14px',
            borderRadius: '12px',
            fontFamily: "'Russo One', sans-serif",
            fontSize: '14px',
            textTransform: 'uppercase' as const,
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 0 15px rgba(0, 230, 118, 0.3)'
        },
        cancelBtn: {
            flex: 1,
            backgroundColor: 'transparent',
            color: '#EF4444',
            border: '1px solid #EF4444',
            padding: '14px',
            borderRadius: '12px',
            fontWeight: 'bold',
            fontSize: '13px',
            textTransform: 'uppercase' as const,
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px'
        }
    };

    // Helper para estilo de botón de estado
    const getStatusBtnStyle = (btnStatus: string) => {
        const isActive = status === btnStatus;
        let activeColor = '#94A3B8';
        if (isActive) {
            if (btnStatus === 'LIVE') activeColor = '#FF1744'; // Rojo
            if (btnStatus === 'FINISHED') activeColor = '#00E676'; // Verde
            if (btnStatus === 'SCHEDULED') activeColor = '#FACC15'; // Amarillo
        }

        return {
            ...STYLES.statusBtn,
            backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
            color: isActive ? activeColor : '#64748B',
            boxShadow: isActive ? `0 0 10px ${activeColor}40` : 'none'
        };
    };

    return (
        <div style={STYLES.overlay}>
            <div style={STYLES.card}>

                {/* 1. HEADER */}
                <div style={STYLES.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Hash size={18} color="#00E676" />
                        <span style={STYLES.title}>Editar Partido</span>
                    </div>
                    <button onClick={() => onOpenChange(false)} style={STYLES.closeBtn}>
                        <X size={24} />
                    </button>
                </div>

                {/* 2. BODY */}
                <div style={STYLES.body}>

                    {/* Nombres Equipos */}
                    <div style={STYLES.teamsSection}>
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <span style={{ ...STYLES.teamName, color: status === 'LIVE' ? '#00E676' : 'white' }}>
                                {match.homeTeam}
                            </span>
                        </div>
                        <span style={STYLES.vsLabel}>VS</span>
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <span style={{ ...STYLES.teamName, color: status === 'LIVE' ? '#00E676' : 'white' }}>
                                {match.awayTeam}
                            </span>
                        </div>
                    </div>

                    {/* Inputs Gigantes */}
                    <div style={STYLES.scoreContainer}>
                        <div style={STYLES.scoreInputWrapper}>
                            <input
                                type="tel"
                                value={homeScore}
                                onChange={(e) => setHomeScore(e.target.value)}
                                style={STYLES.scoreInput}
                                onFocus={(e) => e.target.style.borderColor = '#00E676'}
                                onBlur={(e) => e.target.style.borderColor = '#334155'}
                            />
                            <span style={STYLES.teamLabel}>Local</span>
                        </div>

                        <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#334155' }}>:</span>

                        <div style={STYLES.scoreInputWrapper}>
                            <input
                                type="tel"
                                value={awayScore}
                                onChange={(e) => setAwayScore(e.target.value)}
                                style={STYLES.scoreInput}
                                onFocus={(e) => e.target.style.borderColor = '#00E676'}
                                onBlur={(e) => e.target.style.borderColor = '#334155'}
                            />
                            <span style={STYLES.teamLabel}>Visitante</span>
                        </div>
                    </div>

                    {/* Selector de Estado */}
                    <div style={STYLES.statusSection}>
                        <div style={STYLES.statusLabel}>Estado del Partido</div>
                        <div style={STYLES.statusGrid}>
                            <button onClick={() => setStatus('SCHEDULED')} style={getStatusBtnStyle('SCHEDULED')}>
                                <Clock size={16} /> Programado
                            </button>
                            <button onClick={() => setStatus('LIVE')} style={getStatusBtnStyle('LIVE')}>
                                <Play size={16} /> En Vivo
                            </button>
                            <button onClick={() => setStatus('FINISHED')} style={getStatusBtnStyle('FINISHED')}>
                                <Check size={16} /> Finalizado
                            </button>
                        </div>
                    </div>

                </div>

                {/* 3. FOOTER (ACCIONES) */}
                <div style={STYLES.footer}>
                    <button onClick={() => onOpenChange(false)} style={STYLES.cancelBtn}>
                        <X size={16} /> Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        style={{ ...STYLES.saveBtn, opacity: loading ? 0.7 : 1 }}
                    >
                        <Save size={16} /> {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>

            </div>
        </div>
    );
};
