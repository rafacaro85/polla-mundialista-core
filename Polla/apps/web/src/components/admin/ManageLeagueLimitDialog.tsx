"use client";

import React, { useState, useEffect } from 'react';
import { BarChart3, Users, Save, X, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface League {
    id: string;
    name: string;
    maxParticipants: number;
    participantCount: number;
}

interface ManageLeagueLimitDialogProps {
    league: League;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function ManageLeagueLimitDialog({ league, open, onOpenChange, onSuccess }: ManageLeagueLimitDialogProps) {
    const [maxParticipants, setMaxParticipants] = useState<number | string>(league.maxParticipants);
    const [loading, setLoading] = useState(false);

    // Actualizar el valor cuando cambia la liga seleccionada
    useEffect(() => {
        if (league) {
            setMaxParticipants(league.maxParticipants);
        }
    }, [league, open]);

    if (!open || !league) return null;

    // Calcular porcentaje de ocupación
    const currentMembers = league.participantCount || 0;
    const occupancyPercent = Math.min(((typeof maxParticipants === 'number' ? maxParticipants : 0) > 0 ? currentMembers / (typeof maxParticipants === 'number' ? maxParticipants : 1) : 0) * 100, 100);

    // Planes predefinidos (Sincronizados con CreateLeagueDialog)
    const PRESET_PLANS = [5, 15, 50, 100, 200];

    const handleSubmit = async () => {
        const limit = typeof maxParticipants === 'string' ? parseInt(maxParticipants) : maxParticipants;

        if (!limit || isNaN(limit)) {
            toast.error('Ingresa un número válido');
            return;
        }

        if (limit < currentMembers) {
            toast.error(`El límite no puede ser menor al número actual de participantes (${currentMembers})`);
            return;
        }

        if (limit < 1) {
            toast.error('El límite debe ser al menos 1');
            return;
        }

        setLoading(true);
        try {
            await api.patch(`/leagues/${league.id}`, { maxParticipants: limit });
            toast.success(`Límite actualizado a ${limit} participantes`);
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || 'No se pudo actualizar el límite');
        } finally {
            setLoading(false);
        }
    };

    // SISTEMA DE DISEÑO BLINDADO
    const STYLES = {
        overlay: {
            position: 'fixed' as const,
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px'
        },
        card: {
            backgroundColor: '#1E293B', // Carbon
            width: '100%',
            maxWidth: '400px',
            borderRadius: '24px',
            border: '1px solid #334155',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column' as const,
            overflow: 'hidden',
            fontFamily: 'sans-serif',
            position: 'relative' as const
        },

        // HEADER
        header: {
            padding: '24px',
            borderBottom: '1px solid #334155',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
        },
        iconBox: {
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: '#0F172A',
            border: '1px solid #00E676',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00E676'
        },
        titleBox: {
            flex: 1
        },
        title: {
            fontFamily: "'Russo One', sans-serif",
            color: 'white',
            textTransform: 'uppercase' as const,
            fontSize: '18px',
            lineHeight: '1.2'
        },
        subtitle: {
            fontSize: '11px',
            color: '#94A3B8',
            marginTop: '2px'
        },
        closeBtn: {
            background: 'transparent',
            border: 'none',
            color: '#94A3B8',
            cursor: 'pointer',
            padding: '4px'
        },

        // BODY
        body: {
            padding: '24px',
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '24px'
        },

        // BARRA DE PROGRESO (OCUPACIÓN)
        progressSection: {
            backgroundColor: '#0F172A',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid #334155'
        },
        progressLabelRow: {
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
            fontSize: '11px',
            fontWeight: 'bold',
            color: '#94A3B8',
            textTransform: 'uppercase' as const,
            letterSpacing: '1px'
        },
        progressBarBg: {
            height: '8px',
            backgroundColor: '#1E293B',
            borderRadius: '4px',
            overflow: 'hidden'
        },
        progressBarFill: {
            height: '100%',
            backgroundColor: '#00E676',
            width: `${occupancyPercent}%`,
            borderRadius: '4px',
            transition: 'width 0.5s ease',
            boxShadow: '0 0 10px rgba(0, 230, 118, 0.5)'
        },
        occupancyText: {
            color: 'white',
            fontFamily: "'Russo One', sans-serif"
        },

        // PLANES PREDEFINIDOS
        plansGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '8px'
        },
        planBtn: {
            padding: '12px 0',
            borderRadius: '8px',
            border: '1px solid',
            cursor: 'pointer',
            textAlign: 'center' as const,
            transition: 'all 0.2s',
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
        },
        planNumber: {
            fontFamily: "'Russo One', sans-serif",
            fontSize: '16px'
        },
        planLabel: {
            fontSize: '9px',
            fontWeight: 'bold',
            textTransform: 'uppercase' as const
        },

        // INPUT PERSONALIZADO
        customInputGroup: {
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '8px'
        },
        inputLabel: {
            fontSize: '11px',
            fontWeight: 'bold',
            color: '#94A3B8',
            textTransform: 'uppercase' as const,
            letterSpacing: '1px'
        },
        inputWrapper: {
            position: 'relative' as const,
            display: 'flex',
            alignItems: 'center'
        },
        input: {
            width: '100%',
            backgroundColor: '#0F172A',
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '14px',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            outline: 'none',
            fontFamily: "'Russo One', sans-serif",
            textAlign: 'center' as const
        },
        inputIcon: {
            position: 'absolute' as const,
            right: '16px',
            color: '#64748B'
        },

        // FOOTER
        footer: {
            padding: '20px 24px',
            borderTop: '1px solid #334155',
            display: 'flex',
            gap: '12px',
            backgroundColor: '#1E293B'
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
            color: '#94A3B8',
            border: '1px solid #334155',
            padding: '14px',
            borderRadius: '12px',
            fontWeight: 'bold',
            fontSize: '12px',
            textTransform: 'uppercase' as const,
            cursor: 'pointer'
        }
    };

    // Helper para estilo de botón de plan
    const getPlanBtnStyle = (val: number) => {
        const isActive = maxParticipants === val;
        return {
            ...STYLES.planBtn,
            backgroundColor: isActive ? 'rgba(0, 230, 118, 0.1)' : 'transparent',
            borderColor: isActive ? '#00E676' : '#334155',
            color: isActive ? '#00E676' : '#94A3B8',
            transform: isActive ? 'scale(1.05)' : 'scale(1)',
            boxShadow: isActive ? '0 0 10px rgba(0,230,118,0.1)' : 'none'
        };
    };

    return (
        <div style={STYLES.overlay}>
            <div style={STYLES.card}>

                {/* 1. HEADER */}
                <div style={STYLES.header}>
                    <div style={STYLES.iconBox}>
                        <BarChart3 size={20} />
                    </div>
                    <div style={STYLES.titleBox}>
                        <div style={STYLES.title}>Plan de Liga</div>
                        <div style={STYLES.subtitle}>Ajusta la capacidad para "{league.name}"</div>
                    </div>
                    <button onClick={() => onOpenChange(false)} style={STYLES.closeBtn}>
                        <X size={20} />
                    </button>
                </div>

                {/* 2. BODY */}
                <div style={STYLES.body}>

                    {/* Visualizador de Ocupación */}
                    <div style={STYLES.progressSection}>
                        <div style={STYLES.progressLabelRow}>
                            <span>Ocupación Actual</span>
                            <span style={STYLES.occupancyText}>
                                {currentMembers} / <span style={{ color: '#00E676' }}>{maxParticipants}</span>
                            </span>
                        </div>
                        <div style={STYLES.progressBarBg}>
                            <div style={STYLES.progressBarFill} />
                        </div>
                        <div style={{ fontSize: '10px', color: '#64748B', marginTop: '8px', textAlign: 'right' }}>
                            {Math.round(occupancyPercent)}% LLENO
                        </div>
                    </div>

                    {/* Selector Rápido */}
                    <div>
                        <div style={{ ...STYLES.inputLabel, marginBottom: '8px' }}>Planes Predefinidos</div>
                        <div style={STYLES.plansGrid}>
                            {PRESET_PLANS.map(plan => (
                                <button
                                    key={plan}
                                    onClick={() => setMaxParticipants(plan)}
                                    style={getPlanBtnStyle(plan)}
                                >
                                    <span style={STYLES.planNumber}>{plan}</span>
                                    <span style={STYLES.planLabel}>Cupos</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Input Manual */}
                    <div style={STYLES.customInputGroup}>
                        <label style={STYLES.inputLabel}>Límite Personalizado</label>
                        <div style={STYLES.inputWrapper}>
                            <input
                                type="number"
                                value={maxParticipants}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setMaxParticipants(val === '' ? '' : parseInt(val));
                                }}
                                style={STYLES.input}
                                onFocus={(e) => e.target.style.borderColor = '#00E676'}
                                onBlur={(e) => e.target.style.borderColor = '#334155'}
                            />
                            <Users size={18} style={STYLES.inputIcon} />
                        </div>
                        <p style={{ fontSize: '10px', color: '#64748B' }}>
                            * El límite no puede ser menor a los miembros actuales ({currentMembers}).
                        </p>
                    </div>

                </div>

                {/* 3. FOOTER */}
                <div style={STYLES.footer}>
                    <button onClick={() => onOpenChange(false)} style={STYLES.cancelBtn}>
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        style={STYLES.saveBtn}
                    >
                        {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        Actualizar Límite
                    </button>
                </div>

            </div>
        </div>
    );
}