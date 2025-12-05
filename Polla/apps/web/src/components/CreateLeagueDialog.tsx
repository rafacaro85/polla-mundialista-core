"use client";

import React, { useState } from 'react';
import { X, Shield, Zap, Crown, Check, Plus, Trophy, Copy, Loader2, Star, Gem, Medal } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

/* =============================================================================
   DATOS MOCK (PLANES)
   ============================================================================= */
const PLANS = [
    {
        id: 'starter',
        name: 'Bronce',
        price: 'GRATIS',
        members: 3,
        icon: <Shield size={20} />,
        color: '#CD7F32', // Bronze
        features: ['Ranking Básico', 'Hasta 3 amigos']
    },
    {
        id: 'amateur',
        name: 'Plata',
        price: '$60.000',
        members: 15,
        icon: <Star size={20} />,
        color: '#C0C0C0', // Silver
        features: ['Ranking en Vivo', 'Hasta 15 miembros']
    },
    {
        id: 'semi-pro',
        name: 'Oro',
        price: '$130.000',
        members: 35,
        icon: <Zap size={20} />,
        color: '#FFD700', // Gold
        features: ['Soporte Prioritario', 'Hasta 35 miembros']
    },
    {
        id: 'pro',
        name: 'Platino',
        price: '$220.000',
        members: 60,
        icon: <Trophy size={20} />,
        color: '#E5E4E2', // Platinum
        features: ['Gestor de Torneo', 'Hasta 60 miembros'],
        recommended: true
    },
    {
        id: 'elite',
        name: 'Diamante',
        price: '$520.000',
        members: 150,
        icon: <Crown size={20} />,
        color: '#B9F2FF', // Diamond
        features: ['Marca Blanca', 'Hasta 150 miembros']
    },
    {
        id: 'legend',
        name: 'Esmeralda',
        price: '$960.000',
        members: 300,
        icon: <Gem size={20} />,
        color: '#50C878', // Emerald
        features: ['Soporte 24/7', 'Hasta 300 miembros']
    }
];

interface CreateLeagueDialogProps {
    onLeagueCreated: () => void;
    children?: React.ReactNode;
}

/* =============================================================================
   COMPONENTE: CREAR LIGA (TACTICAL STYLE)
   ============================================================================= */
export const CreateLeagueDialog: React.FC<CreateLeagueDialogProps> = ({ onLeagueCreated, children }) => {
    const [open, setOpen] = useState(false);
    const [leagueName, setLeagueName] = useState('');
    const [selectedPlan, setSelectedPlan] = useState('pro'); // Por defecto el Pro
    const [loading, setLoading] = useState(false);
    const [createdLeagueId, setCreatedLeagueId] = useState<string | null>(null);
    const [createdCode, setCreatedCode] = useState<string | null>(null);
    const [createdLeagueName, setCreatedLeagueName] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [processingPayment, setProcessingPayment] = useState(false);

    const handleCreate = async () => {
        if (!leagueName.trim()) {
            toast.error('Por favor ingresa un nombre para la liga');
            return;
        }

        const plan = PLANS.find(p => p.id === selectedPlan);
        if (!plan) return;

        setLoading(true);
        try {
            const response = await api.post('/leagues', {
                name: leagueName.trim(),
                type: 'LIBRE',
                maxParticipants: plan.members,
                packageType: selectedPlan
            });

            setCreatedCode(response.data.accessCodePrefix);
            setCreatedLeagueName(leagueName.trim());
            setCreatedLeagueId(response.data.id);
            toast.success('¡Liga creada exitosamente!');
            await onLeagueCreated();
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

    const handleWhatsAppPayment = async () => {
        if (!createdCode || !createdLeagueName || !createdLeagueId) return;

        const plan = PLANS.find(p => p.id === selectedPlan);
        if (!plan) return;

        setProcessingPayment(true);
        try {
            // 1. Create Transaction
            const priceNumber = parseInt(plan.price.replace(/\D/g, '')) || 0;

            const response = await api.post('/transactions', {
                packageType: plan.id,
                amount: priceNumber,
                leagueId: createdLeagueId
            });

            const { referenceCode } = response.data;

            // 2. Redirect to WhatsApp
            const text = `Hola, quiero activar el plan ${plan.name} para la liga "${createdLeagueName}" (Ref: ${referenceCode}). Adjunto mi comprobante de pago.`;
            const url = `https://wa.me/573105973421?text=${encodeURIComponent(text)}`;
            window.open(url, '_blank');

        } catch (error) {
            console.error("Error creating transaction:", error);
            toast.error("Error al iniciar el pago. Intenta nuevamente.");
        } finally {
            setProcessingPayment(false);
        }
    };

    const handleClose = () => {
        setOpen(false);
        setLeagueName('');
        setCreatedCode(null);
        setCreatedLeagueName(null);
        setCreatedLeagueId(null);
        setCopied(false);
        setSelectedPlan('pro');
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
            overflow: 'hidden' // Prevent card from scrolling, inner body will scroll
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
            flexShrink: 0 // Don't shrink
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
            overflowY: 'auto' as const, // Scrollable body
            flex: 1 // Take remaining space
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
            fontSize: '18px', // Letra grande
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
            gridTemplateColumns: 'repeat(2, 1fr)', // Force 2 columns
            gap: '12px'
        },
        // Tarjeta de Plan Individual
        planCard: {
            backgroundColor: '#0F172A',
            borderRadius: '16px',
            border: '1px solid #334155',
            padding: '12px', // Reduced padding
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
            flexShrink: 0 // Don't shrink
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
            type: 'button'
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
        },
        whatsappBtn: {
            width: '100%',
            backgroundColor: '#25D366',
            color: '#0F172A',
            border: 'none',
            padding: '16px',
            borderRadius: '12px',
            fontWeight: '900',
            fontFamily: "'Russo One', sans-serif",
            fontSize: '14px',
            textTransform: 'uppercase' as const,
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            marginTop: '8px'
        }
    };

    return (
        <>
            <div onClick={() => setOpen(true)}>
                {children}
            </div>

            {open && (
                <div style={STYLES.overlay}>
                    <div style={STYLES.card}>

                        {/* 1. HEADER */}
                        <div style={STYLES.header}>
                            <div style={STYLES.titleGroup}>
                                <div style={STYLES.iconBox}>
                                    <Trophy size={24} />
                                </div>
                                <div>
                                    <div style={STYLES.titleText}>{createdCode ? '¡Liga Creada!' : 'Nueva Liga'}</div>
                                    <div style={STYLES.subtitleText}>{createdCode ? 'Tu torneo está listo' : 'Configura tu torneo privado'}</div>
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
                                        <label style={STYLES.label}>Nombre de la Liga</label>
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
                                            <span style={{ fontSize: '10px', color: '#00E676', fontWeight: 'bold', cursor: 'pointer' }}>Ver detalles completos</span>
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
                                                        <div style={{ ...STYLES.planPrice, color: isSelected ? 'white' : '#94A3B8' }}>{plan.price}</div>

                                                        <div style={STYLES.featureList}>
                                                            <span style={{ color: 'white', fontWeight: 'bold' }}>{plan.members}</span> Miembros
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div style={STYLES.successBox}>
                                    <p className="text-tactical text-center text-sm">Comparte este código con tus amigos para que se unan:</p>

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

                                    {selectedPlan !== 'starter' && (
                                        <div style={{ width: '100%', marginTop: '16px', borderTop: '1px solid #334155', paddingTop: '16px' }}>
                                            <p style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '8px' }}>
                                                Para activar tu plan <strong>{PLANS.find(p => p.id === selectedPlan)?.name}</strong>, envía el comprobante de pago:
                                            </p>
                                            <button
                                                onClick={handleWhatsAppPayment}
                                                style={{ ...STYLES.whatsappBtn, opacity: processingPayment ? 0.7 : 1, cursor: processingPayment ? 'wait' : 'pointer' }}
                                                disabled={processingPayment}
                                            >
                                                {processingPayment ? <Loader2 className="animate-spin" size={18} /> : <Shield size={18} />}
                                                {processingPayment ? 'Procesando...' : 'Enviar Comprobante'}
                                            </button>
                                        </div>
                                    )}
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
                                    {loading ? 'CREANDO...' : 'CREAR LIGA'}
                                </button>
                            </div>
                        )}

                    </div>
                </div>
            )}
        </>
    );
};
