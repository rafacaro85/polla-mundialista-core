"use client";

import React, { useState } from 'react';
import { X, Shield, Zap, Crown, Check, Plus, Trophy, Copy, Loader2, Star } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useTournament } from '@/hooks/useTournament';

/* =============================================================================
   DATOS MOCK (PLANES - Sincronizados con CreateLeagueDialog público)
   ============================================================================= */
const PLANS = [
    {
        id: 'familia',
        name: 'Familia',
        price: 'GRATIS',
        numericPrice: 0,
        members: 5,
        icon: <Shield size={20} />,
        color: '#94A3B8', // Slate
        features: ['Hasta 5 jugadores', 'Texto del premio']
    },
    {
        id: 'parche',
        name: 'Parche',
        price: '$30.000',
        numericPrice: 30000,
        members: 15,
        icon: <Star size={20} />,
        color: '#CD7F32', // Bronze
        features: ['Hasta 15 jugadores', 'Imagen y texto del premio']
    },
    {
        id: 'amigos',
        name: 'Amigos',
        price: '$80.000',
        numericPrice: 80000,
        members: 50,
        icon: <Zap size={20} />,
        color: '#C0C0C0', // Silver
        features: ['Hasta 50 jugadores', 'Logo, imagen y texto'],
        recommended: true
    },
    {
        id: 'lider',
        name: 'Líder',
        price: '$180.000',
        numericPrice: 180000,
        members: 100,
        icon: <Trophy size={20} />,
        color: '#FFD700', // Gold
        features: ['Hasta 100 jugadores', 'Muro de comentarios']
    },
    {
        id: 'influencer',
        name: 'Influencer',
        price: '$350.000',
        numericPrice: 350000,
        members: 200,
        icon: <Crown size={20} />,
        color: '#B9F2FF', // Diamond
        features: ['Hasta 200 jugadores', 'Redes Sociales']
    }
];

interface CreateLeagueDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

/* =============================================================================
   COMPONENTE: CREAR LIGA (ADMIN VERSION)
   ============================================================================= */
export function CreateLeagueDialog({ open, onOpenChange, onSuccess }: CreateLeagueDialogProps) {
    const { tournamentId } = useTournament();
    const [leagueName, setLeagueName] = useState('');
    const [selectedPlan, setSelectedPlan] = useState('amigos'); // Por defecto el Amigos
    const [loading, setLoading] = useState(false);
    const [createdCode, setCreatedCode] = useState<string | null>(null);
    const [createdLeagueName, setCreatedLeagueName] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    if (!open) return null;

    const handleCreate = async () => {
        if (!leagueName.trim()) {
            toast.error('Por favor ingresa un nombre para la liga');
            return;
        }

        const plan = PLANS.find(p => p.id === selectedPlan);
        if (!plan) return;

        setLoading(true);
        try {
            // 1. Crear la liga
            const response = await api.post('/leagues', {
                name: leagueName.trim(),
                type: 'LIBRE',
                maxParticipants: plan.members,
                packageType: selectedPlan,
                isEnterprise: false,
                tournamentId,
            });

            const newLeagueId = response.data.id;
            setCreatedCode(response.data.accessCodePrefix);
            setCreatedLeagueName(leagueName.trim());

            // 2. CREAR Y ACTIVAR TRANSACCIÓN (Para registro en Ventas)
            try {
                // Crear transacción (Queda PENDING)
                const txResponse = await api.post('/transactions', {
                    packageType: selectedPlan,
                    amount: plan.numericPrice,
                    leagueId: newLeagueId
                });

                // Aprobar transacción (Esto activa la liga y establece límites)
                await api.patch(`/transactions/${txResponse.data.id}/approve`);

                toast.success('¡Polla creada y activada correctamente!');
            } catch (txError: any) {
                console.error("Error en proceso de transacción:", txError);
                toast.error(`Fallo Venta: ${txError.message}`);

                // Fallback: Activar liga manualmente si falla transacción
                try {
                    await api.patch(`/leagues/${newLeagueId}`, { isPaid: true });
                    toast.warning('Polla activada, pero sin registro de venta.');
                } catch (e) {
                    toast.error('Error crítico activando la polla.');
                }
            }

            // Notificamos éxito al padre para recargar la tabla
            await onSuccess();

        } catch (error: any) {
            console.error('Error creando liga:', error);
            toast.error(error.response?.data?.message || 'Error al crear la liga');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyCode = () => {
        if (createdCode) {
            navigator.clipboard.writeText(createdCode);
            setCopied(true);
            toast.success('Código copiado');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleClose = () => {
        onOpenChange(false);
        // Reset states
        setTimeout(() => {
            setLeagueName('');
            setCreatedCode(null);
            setCreatedLeagueName(null);
            setCopied(false);
            setSelectedPlan('amigos');
        }, 200);
    };

    // SISTEMA DE DISEÑO BLINDADO
    const STYLES = {
        overlay: {
            position: 'fixed' as const,
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)', // Fondo muy oscuro para inmersión
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
            maxWidth: '500px',
            borderRadius: '24px',
            border: '1px solid #334155',
            boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
            display: 'flex',
            flexDirection: 'column' as const,
            maxHeight: '90vh',
            fontFamily: 'sans-serif',
            position: 'relative' as const,
            overflow: 'hidden'
        },
        // Estilos dinámicos para plan seleccionado
        selectedPlanCard: (color: string) => ({
            borderColor: color,
            backgroundColor: `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, 0.1)`,
            transform: 'translateY(-4px)',
            boxShadow: `0 10px 20px -5px ${color}40`
        }),

        // HEADER
        header: {
            padding: '24px',
            borderBottom: '1px solid #334155',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(180deg, rgba(15, 23, 42, 1) 0%, rgba(30, 41, 59, 1) 100%)',
            flexShrink: 0
        },
        titleGroup: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
        },
        iconBox: {
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            backgroundColor: '#0F172A',
            border: '1px solid #00E676',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#00E676',
            boxShadow: '0 0 15px rgba(0, 230, 118, 0.2)'
        },
        titleText: {
            fontFamily: "'Russo One', sans-serif",
            fontSize: '20px',
            color: 'white',
            textTransform: 'uppercase' as const,
            lineHeight: '1'
        },
        subtitleText: {
            fontSize: '11px',
            color: '#94A3B8',
            marginTop: '4px'
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
            gap: '32px',
            overflowY: 'auto' as const,
            flex: 1
        },

        // INPUT NOMBRE
        inputSection: {
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '8px'
        },
        label: {
            fontSize: '11px',
            color: '#94A3B8',
            fontWeight: 'bold',
            textTransform: 'uppercase' as const,
            letterSpacing: '1px',
            marginLeft: '4px'
        },
        input: {
            width: '100%',
            backgroundColor: '#0F172A',
            border: '2px solid #334155',
            borderRadius: '12px',
            padding: '16px',
            color: 'white',
            fontSize: '18px',
            fontWeight: 'bold',
            outline: 'none',
            transition: 'border-color 0.2s',
            fontFamily: '"Russo One", sans-serif',
        },

        // SELECTOR DE PLANES (GRID)
        plansLabel: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
        },
        plansGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px'
        },
        planCard: {
            backgroundColor: '#0F172A',
            borderRadius: '16px',
            border: '1px solid #334155',
            padding: '12px',
            cursor: 'pointer',
            position: 'relative' as const,
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            textAlign: 'center' as const,
            overflow: 'hidden'
        },
        planIcon: {
            marginBottom: '8px',
            padding: '8px',
            borderRadius: '50%',
            backgroundColor: '#1E293B'
        },
        planName: {
            fontSize: '14px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '4px',
            fontFamily: "'Russo One', sans-serif"
        },
        planPrice: {
            fontSize: '12px',
            color: '#94A3B8',
            marginBottom: '12px'
        },
        featureList: {
            fontSize: '9px',
            color: '#64748B',
            lineHeight: '1.4'
        },
        recommendedBadge: {
            position: 'absolute' as const,
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#00E676',
            color: '#0F172A',
            fontSize: '8px',
            fontWeight: '900',
            padding: '2px 8px',
            borderRadius: '0 0 6px 6px',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.5px'
        },
        checkCircle: {
            position: 'absolute' as const,
            top: '8px',
            right: '8px',
            color: '#00E676'
        },

        // FOOTER
        footer: {
            padding: '24px',
            borderTop: '1px solid #334155',
            display: 'flex',
            gap: '12px',
            backgroundColor: '#1E293B',
            flexShrink: 0
        },
        cancelBtn: {
            flex: 1,
            backgroundColor: 'transparent',
            color: '#94A3B8',
            border: '1px solid #334155',
            padding: '16px',
            borderRadius: '12px',
            fontWeight: 'bold',
            fontSize: '12px',
            textTransform: 'uppercase' as const,
            cursor: 'pointer',
            type: 'button' as const
        },
        createBtn: {
            flex: 2,
            backgroundColor: '#00E676',
            color: '#0F172A',
            border: 'none',
            padding: '16px',
            borderRadius: '12px',
            fontWeight: '900',
            fontFamily: '"Russo One", sans-serif',
            fontSize: '14px',
            textTransform: 'uppercase' as const,
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 0 20px rgba(0, 230, 118, 0.4)',
            transition: 'all 0.2s',
            opacity: 1
        },
        // SUCCESS STATE
        successBox: {
            backgroundColor: '#0F172A',
            border: '1px solid #00E676',
            borderRadius: '16px',
            padding: '24px',
            textAlign: 'center' as const,
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            gap: '16px'
        },
        codeDisplay: {
            fontSize: '32px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            color: '#00E676',
            letterSpacing: '4px',
            margin: '8px 0',
            textShadow: '0 0 20px rgba(0, 230, 118, 0.3)'
        }
    };

    return (
        <div style={STYLES.overlay}>
            <div style={STYLES.card}>

                {/* 1. HEADER */}
                <div style={STYLES.header}>
                    <div style={STYLES.titleGroup}>
                        <div style={STYLES.iconBox}>
                            <Trophy size={24} />
                        </div>
                        <div>
                            <div style={STYLES.titleText}>{createdCode ? '¡Polla Creada!' : 'NUEVA POLLA'}</div>
                            <div style={STYLES.subtitleText}>{createdCode ? 'Lista para jugar' : 'Configura tu torneo (Modo Admin)'}</div>
                        </div>
                    </div>
                    <button onClick={handleClose} style={STYLES.closeBtn}>
                        <X size={24} />
                    </button>
                </div>

                {/* 2. BODY */}
                <div style={STYLES.body}>

                    {!createdCode ? (
                        <>
                            {/* Input Nombre */}
                            <div style={STYLES.inputSection}>
                                <label style={STYLES.label}>Nombre de la Polla</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Oficina 2026"
                                    value={leagueName}
                                    onChange={(e) => setLeagueName(e.target.value)}
                                    style={STYLES.input}
                                    onFocus={(e) => e.target.style.borderColor = '#00E676'}
                                    onBlur={(e) => e.target.style.borderColor = '#334155'}
                                    autoFocus
                                    disabled={loading}
                                />
                            </div>

                            {/* Selector de Planes */}
                            <div>
                                <div style={STYLES.plansLabel}>
                                    <span style={STYLES.label}>Selecciona un Plan</span>
                                    <span style={{ fontSize: '10px', color: '#00E676', fontWeight: 'bold' }}>Activación Automática</span>
                                </div>

                                <div style={STYLES.plansGrid}>
                                    {PLANS.map(plan => {
                                        const isSelected = selectedPlan === plan.id;
                                        // Combinar estilos base con seleccionados
                                        const cardStyle = {
                                            ...STYLES.planCard,
                                            ...(isSelected ? STYLES.selectedPlanCard(plan.color) : {})
                                        };

                                        return (
                                            <div
                                                key={plan.id}
                                                style={cardStyle}
                                                onClick={() => !loading && setSelectedPlan(plan.id)}
                                            >
                                                {/* Badge Recomendado */}
                                                {plan.recommended && <div style={STYLES.recommendedBadge}>Recomendado</div>}

                                                {/* Icono Check si seleccionado */}
                                                {isSelected && <Check size={16} style={{ ...STYLES.checkCircle, color: plan.color }} />}

                                                <div style={{ ...STYLES.planIcon, color: plan.color }}>
                                                    {plan.icon}
                                                </div>

                                                <div style={STYLES.planName}>{plan.name}</div>
                                                <div style={{ ...STYLES.planPrice, color: isSelected ? 'white' : '#94A3B8' }}>{plan.members} Cupos</div>

                                                <div style={STYLES.featureList}>
                                                    <span style={{ color: '#00E676', fontWeight: 'bold' }}>ACTIVADO</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={STYLES.successBox}>
                            <p style={{ color: 'white', fontSize: '14px' }}>¡Liga creada y activada correctamente!</p>
                            <p style={{ color: '#94A3B8', fontSize: '12px' }}>Código de acceso para compartir:</p>

                            <div style={STYLES.codeDisplay}>
                                {createdCode}
                            </div>

                            <button
                                onClick={handleCopyCode}
                                style={{ ...STYLES.cancelBtn, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', color: 'white', borderColor: '#475569' }}
                            >
                                {copied ? <Check size={16} color="#00E676" /> : <Copy size={16} />}
                                {copied ? '¡Copiado!' : 'Copiar Código'}
                            </button>
                        </div>
                    )}

                </div>

                {/* 3. FOOTER */}
                {!createdCode && (
                    <div style={STYLES.footer}>
                        <button onClick={handleClose} style={STYLES.cancelBtn} disabled={loading}>
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleCreate}
                            style={{
                                ...STYLES.createBtn,
                                backgroundColor: leagueName.trim() ? '#00E676' : '#334155',
                                color: leagueName.trim() ? '#0F172A' : '#94A3B8',
                                cursor: leagueName.trim() && !loading ? 'pointer' : 'not-allowed',
                                boxShadow: leagueName.trim() ? '0 0 20px rgba(0, 230, 118, 0.4)' : 'none'
                            }}
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} strokeWidth={3} />}
                            {loading ? 'CREANDO...' : 'CREAR POLLA'}
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}
