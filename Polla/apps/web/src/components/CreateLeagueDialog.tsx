"use client";

import React, { useState } from 'react';
import { X, Shield, Zap, Crown, Check, Plus, Trophy, Copy, Loader2, Star, Gem, Medal } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { PaymentMethods } from './dashboard/PaymentMethods';
import { useTournament } from '@/hooks/useTournament';

/* =============================================================================
   DATOS MOCK (PLANES)
   ============================================================================= */
const PLANS = [
    {
        id: 'familia',
        name: 'Familia',
        price: 'GRATIS',
        members: 5,
        icon: < Shield size={20} />,
        color: '#94A3B8', // Slate
        features: ['Hasta 5 jugadores', 'Texto del premio']
    },
    {
        id: 'parche',
        name: 'Parche',
        price: '$30.000',
        members: 15,
        icon: < Star size={20} />,
        color: '#CD7F32', // Bronze
        features: ['Hasta 15 jugadores', 'Imagen y texto del premio']
    },
    {
        id: 'amigos',
        name: 'Amigos',
        price: '$80.000',
        members: 50,
        icon: < Zap size={20} />,
        color: '#C0C0C0', // Silver
        features: ['Hasta 50 jugadores', 'Logo, imagen y texto'],
        recommended: true
    },
    {
        id: 'lider',
        name: 'Líder',
        price: '$180.000',
        members: 100,
        icon: < Trophy size={20} />,
        color: '#FFD700', // Gold
        features: ['Hasta 100 jugadores', 'Muro de comentarios']
    },
    {
        id: 'influencer',
        name: 'Influencer',
        price: '$350.000',
        members: 200,
        icon: < Crown size={20} />,
        color: '#B9F2FF', // Diamond
        features: ['Hasta 200 jugadores', 'Redes Sociales']
    }
];

interface CreateLeagueDialogProps {
    onLeagueCreated: () => void;
    children?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

/* =============================================================================
   COMPONENTE: CREAR LIGA (TACTICAL STYLE)
   ============================================================================= */
export const CreateLeagueDialog: React.FC<CreateLeagueDialogProps> = ({ 
    onLeagueCreated, 
    children,
    open: controlledOpen,
    onOpenChange
}) => {
    const { tournamentId } = useTournament();
    
    const [internalOpen, setInternalOpen] = useState(false);
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setOpen = (val: boolean) => {
        if (onOpenChange) onOpenChange(val);
        setInternalOpen(val);
    };
    const [step, setStep] = useState(1); // Paso actual (1: Torneo, 2: Info, 3: Plan, 4: Pago/Exito)
    const [selectedTournamentId, setSelectedTournamentId] = useState<string>(tournamentId || 'WC2026');
    const [leagueName, setLeagueName] = useState('');
    const [adminName, setAdminName] = useState('');
    const [countryCode, setCountryCode] = useState('+57');
    const [adminPhone, setAdminPhone] = useState('');
    const [selectedPlan, setSelectedPlan] = useState('amigos');
    const [loading, setLoading] = useState(false);
    const [createdLeagueId, setCreatedLeagueId] = useState<string | null>(null);
    const [createdCode, setCreatedCode] = useState<string | null>(null);
    const [createdLeagueName, setCreatedLeagueName] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [processingPayment, setProcessingPayment] = useState(false);

    // Dynamic Plans based on SELECTED Tournament
    const availablePlans = React.useMemo(() => {
        const basePlans = [...PLANS];
        if (selectedTournamentId === 'UCL2526') {
            basePlans.unshift({
                id: 'launch_promo',
                name: 'Cortesía Lanzamiento',
                price: 'GRATIS',
                members: 15,
                icon: <Gem size={20} />,
                color: '#6366F1',
                features: ['Hasta 15 jugadores', 'Imagen del premio', 'Solo Champions League'],
                recommended: true
            });
        }
        return basePlans;
    }, [selectedTournamentId]);

    // Update selectedPlan when tournament changes if current plan not available
    React.useEffect(() => {
        if (selectedTournamentId === 'UCL2526' && selectedPlan === 'amigos') {
            setSelectedPlan('launch_promo');
        } else if (selectedTournamentId === 'WC2026' && selectedPlan === 'launch_promo') {
            setSelectedPlan('amigos');
        }
    }, [selectedTournamentId, selectedPlan]);


    const handleCreate = async () => {
        if (!leagueName.trim() || !adminName.trim() || !adminPhone.trim() || !countryCode.trim()) {
            toast.error('Por favor completa todos los campos, incluyendo el indicativo (+57)');
            return;
        }

        // 1. Validar Indicativo
        if (!/^\+\d+$/.test(countryCode.trim())) {
            toast.error('El indicativo debe empezar con + y tener números');
            return;
        }

        // 2. Validar Número Local
        const cleanNumber = adminPhone.replace(/[\s-]/g, '');
        if (!/^\d+$/.test(cleanNumber)) {
            toast.error('El número de teléfono solo puede contener números');
            return;
        }

        if (countryCode.trim().length > 5) {
            toast.error('El indicativo no puede tener más de 5 caracteres');
            return;
        }

        if (cleanNumber.length !== 10) {
            toast.error('El número celular debe tener exactamente 10 dígitos');
            return;
        }

        const fullPhone = `${countryCode.trim()} ${cleanNumber}`;

        const plan = availablePlans.find(p => p.id === selectedPlan);
        if (!plan) return;

        setLoading(true);
        console.log('🚀 [CreateLeague] Iniciando creación:', {
            name: leagueName.trim(),
            planId: selectedPlan,
            planName: plan.name
        });
        try {
            const response = await api.post('/leagues', {
                name: leagueName.trim(),
                type: 'LIBRE',
                maxParticipants: plan.members,
                packageType: selectedPlan,
                isEnterprise: false,
                adminName: adminName.trim(),
                adminPhone: fullPhone,
                tournamentId: selectedTournamentId,
            });

            console.log('✅ [CreateLeague] Respuesta servidor:', response.data);
            setCreatedCode(response.data.accessCodePrefix);
            setCreatedLeagueName(leagueName.trim());
            setCreatedLeagueId(response.data.id);
            setStep(4); // Move to final step (Success/Payment)
            toast.success('¡Polla creada exitosamente!');
            // DO NOT call onLeagueCreated() here. It triggers a re-render in parent that unmounts this dialog!
            // await onLeagueCreated(); 
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
        if (createdLeagueId && onLeagueCreated) {
            onLeagueCreated();
        }
        
        setOpen(false);
        setStep(1);
        setLeagueName('');
        setAdminName('');
        setAdminPhone('');
        setCreatedCode(null);
        setCreatedLeagueName(null);
        setCreatedLeagueId(null);
        setCopied(false);
        setSelectedPlan('amigos');
        setSelectedTournamentId(tournamentId || 'WC2026');
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
            maxHeight: '80vh', // REDUCIDO: Antes 90vh, para dar más margen en móviles
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
            padding: '20px', // REDUCIDO: Antes 24px
            borderBottom: '1px solid #334155',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(180deg, rgba(15, 23, 42, 1) 0%, rgba(30, 41, 59, 1) 100%)',
            flexShrink: 0 // Don't shrink
        },
        titleGroup: {
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '8px',
            flex: 1
        },
        progressContainer: {
            width: '100%',
            height: '4px',
            backgroundColor: '#0F172A',
            borderRadius: '2px',
            overflow: 'hidden',
            marginTop: '8px'
        },
        progressBar: (currentStep: number) => ({
            width: `${(currentStep / 4) * 100}%`,
            height: '100%',
            backgroundColor: '#00E676',
            transition: 'width 0.3s ease'
        }),
        iconBox: {
            width: '40px', // REDUCIDO: Antes 44px
            height: '40px', // REDUCIDO: Antes 44px
            borderRadius: '12px',
            backgroundColor: '#0F172A',
            border: '1px solid #00E676',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#00E676',
            boxShadow: '0 0 15px rgba(0, 230, 118, 0.2)'
        },
        titleText: {
            fontFamily: "'Russo One', sans-serif",
            fontSize: '18px', // REDUCIDO: Antes 20px
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
            padding: '20px', // REDUCIDO: Antes 24px
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '20px', // REDUCIDO: Antes 32px
            overflowY: 'auto' as const, // Scrollable body
            flex: 1 // Take remaining space
        },

        // TOURNAMENT SELECTOR (Step 1)
        tournamentGrid: {
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '12px'
        },
        tournamentCard: (isSelected: boolean, color: string) => ({
            backgroundColor: isSelected ? `${color}10` : '#0F172A',
            border: `2px solid ${isSelected ? color : '#334155'}`,
            borderRadius: '20px',
            padding: '20px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            position: 'relative' as const,
            boxShadow: isSelected ? `0 0 20px ${color}20` : 'none'
        }),

        // INPUT NOMBRE
        inputSection: {
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '6px' // REDUCIDO: Antes 8px
        },
        label: {
            fontSize: '10px', // REDUCIDO: Antes 11px
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
            padding: '12px', // REDUCIDO: Antes 16px
            color: 'white',
            fontSize: '16px', // REDUCIDO: Antes 18px
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
            marginBottom: '8px' // REDUCIDO: Antes 12px
        },
        plansGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)', // Force 2 columns
            gap: '8px' // REDUCIDO: Antes 12px
        },
        // Tarjeta de Plan Individual
        planCard: {
            backgroundColor: '#0F172A',
            borderRadius: '16px',
            border: '1px solid #334155',
            padding: '10px', // REDUCIDO: Antes 12px
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
            marginBottom: '6px', // REDUCIDO
            padding: '6px', // REDUCIDO
            borderRadius: '50%',
            backgroundColor: '#1E293B'
        },
        planName: {
            fontSize: '13px', // REDUCIDO
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '2px', // REDUCIDO
            fontFamily: "'Russo One', sans-serif"
        },
        planPrice: {
            fontSize: '11px', // REDUCIDO
            color: '#94A3B8',
            marginBottom: '8px' // REDUCIDO
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
            padding: '20px', // REDUCIDO: Antes 24px
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
            padding: '14px', // REDUCIDO: Antes 16px
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
            padding: '14px', // REDUCIDO: Antes 16px
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
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={STYLES.iconBox}>
                                        <Trophy size={24} />
                                    </div>
                                    <div>
                                        <div style={STYLES.titleText}>
                                            {step === 4 ? (createdCode ? '¡Polla Creada!' : 'Activación') : 'Nueva Polla'}
                                        </div>
                                        <div style={STYLES.subtitleText}>
                                            {step === 4 ? 'Resumen y Activación' : `Paso ${step} de 4 - ${step === 1 ? 'Selecciona Torneo' : step === 2 ? 'Información' : 'Elige Plan'}`}
                                        </div>
                                    </div>
                                </div>
                                {!createdCode && step < 4 && (
                                    <div style={STYLES.progressContainer}>
                                        <div style={STYLES.progressBar(step)} />
                                    </div>
                                )}
                            </div>
                            <button onClick={handleClose} style={STYLES.closeBtn}>
                                <X size={24} />
                            </button>
                        </div>

                        {/* 2. BODY */}
                        <div style={STYLES.body}>

                            {step === 1 && (
                                <div style={STYLES.tournamentGrid}>
                                    <label style={STYLES.label}>¿En qué torneo quieres tu polla?</label>
                                    
                                    {/* MUNDIAL */}
                                    <div 
                                        style={STYLES.tournamentCard(selectedTournamentId === 'WC2026', '#00E676')}
                                        onClick={() => setSelectedTournamentId('WC2026')}
                                    >
                                        <div style={{ ...STYLES.iconBox, borderColor: '#00E676', backgroundColor: '#00E67610' }}>
                                            <Trophy size={20} className="text-[#00E676]" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-white font-russo text-sm uppercase">Mundial 2026</h4>
                                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">La máxima cita del fútbol</p>
                                        </div>
                                        <div className="bg-[#00E676] text-[#0F172A] px-2 py-0.5 rounded text-[8px] font-black uppercase">OFICIAL</div>
                                    </div>

                                    {/* CHAMPIONS */}
                                    <div 
                                        style={STYLES.tournamentCard(selectedTournamentId === 'UCL2526', '#6366F1')}
                                        onClick={() => setSelectedTournamentId('UCL2526')}
                                    >
                                        <div style={{ ...STYLES.iconBox, borderColor: '#6366F1', backgroundColor: '#6366F110' }}>
                                            <Star size={20} className="text-[#6366F1]" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-white font-russo text-sm uppercase">Champions 25/26</h4>
                                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">La orejona espera por ti</p>
                                        </div>
                                        <div className="bg-[#6366F1] text-white px-2 py-0.5 rounded text-[8px] font-black uppercase">BETA</div>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
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

                                    {/* Input Admin Name */}
                                    <div style={STYLES.inputSection}>
                                        <label style={STYLES.label}>Nombre del Administrador</label>
                                        <input
                                            type="text"
                                            placeholder="Tu Nombre"
                                            value={adminName}
                                            onChange={(e) => setAdminName(e.target.value)}
                                            style={STYLES.input}
                                            onFocus={(e) => e.target.style.borderColor = '#00E676'}
                                            onBlur={(e) => e.target.style.borderColor = '#334155'}
                                            disabled={loading}
                                        />
                                    </div>

                                    {/* Input Admin Phone */}
                                    <div style={STYLES.inputSection}>
                                        <label style={STYLES.label}>WhatsApp de Contacto</label>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <input
                                                type="text"
                                                placeholder="+57"
                                                value={countryCode}
                                                maxLength={5}
                                                onChange={(e) => setCountryCode(e.target.value)}
                                                style={{ ...STYLES.input, width: '80px', textAlign: 'center', padding: '12px 8px' }}
                                                onFocus={(e) => e.target.style.borderColor = '#00E676'}
                                                onBlur={(e) => e.target.style.borderColor = '#334155'}
                                                disabled={loading}
                                            />
                                            <input
                                                type="tel"
                                                placeholder="310 123 4567"
                                                value={adminPhone}
                                                maxLength={10}
                                                onChange={(e) => setAdminPhone(e.target.value)}
                                                style={{ ...STYLES.input, flex: 1 }}
                                                onFocus={(e) => e.target.style.borderColor = '#00E676'}
                                                onBlur={(e) => e.target.style.borderColor = '#334155'}
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {step === 3 && (
                                <div>
                                    <div style={STYLES.plansLabel}>
                                        <span style={STYLES.label}>Selecciona un Plan</span>
                                        <span style={{ fontSize: '10px', color: '#00E676', fontWeight: 'bold' }}>Precios en Pesos</span>
                                    </div>

                                    <div style={STYLES.plansGrid}>
                                        {availablePlans.map(plan => {
                                            const isSelected = selectedPlan === plan.id;
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
                                                    {plan.recommended && <div style={STYLES.recommendedBadge}>Recomendado</div>}
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
                            )}

                            {step === 4 && (
                                <div style={STYLES.successBox}>
                                    {(() => {
                                        const selectedPlanDetails = availablePlans.find(p => p.id === selectedPlan);
                                        const isFreePlan = selectedPlanDetails?.price === 'GRATIS';
                                        
                                        return isFreePlan ? (
                                        <>
                                            <p className="text-tactical text-center text-sm mb-4">Comparte este código con tus amigos para que se unan:</p>
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

                                            <button
                                                onClick={() => {
                                                    const appUrl = window.location.origin;
                                                    const inviteUrl = `${appUrl}/invite/${createdCode}`;
                                                    const isUCL = tournamentId === 'UCL2526';
                                                    const message = `¡Hola! Te invito a mi Polla ${isUCL ? 'Champions' : 'del Mundial'}. 🏆\n\n` +
                                                        `Polla: *${createdLeagueName}*\n\n` +
                                                        `Únete fácil dando clic aquí:\n👉 ${inviteUrl}\n\n` +
                                                        `O ingresa el código: *${createdCode}*`;

                                                    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                                                    window.open(whatsappUrl, '_blank');
                                                }}
                                                style={{
                                                    ...STYLES.cancelBtn,
                                                    width: '100%',
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    backgroundColor: '#25D366',
                                                    color: '#0F172A',
                                                    borderColor: '#25D366',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                <Shield size={16} />
                                                Compartir por WhatsApp
                                            </button>
                                        </>
                                    ) : (
                                        // Mensaje para ligas de pago
                                        <>
                                            <div className="text-center space-y-4 mb-4 w-full">
                                                <p className="text-white text-lg font-bold">¡Tu polla ha sido reservada!</p>

                                                <p className="text-yellow-500 text-xs italic border border-yellow-500/30 bg-yellow-500/10 p-2 rounded-lg">
                                                    ⚠️ Tu polla está PENDIENTE de activación. Realiza el pago para desbloquearla.
                                                </p>
                                            </div>

                                            {createdLeagueId && (
                                                <div style={{ width: '100%', marginTop: '16px', borderTop: '1px solid #334155', paddingTop: '16px' }}>
                                                    <PaymentMethods
                                                        leagueId={createdLeagueId}
                                                        amount={parseInt(selectedPlanDetails?.price.replace(/\D/g, '') || '0')}
                                                        tournamentId={selectedTournamentId}
                                                        onSuccess={() => {
                                                            toast.success('Pago enviado. Espera la confirmación del administrador.');
                                                            handleClose();
                                                            onLeagueCreated();
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </>
                                    );
                                    })()}
                                </div>
                            )}

                        </div>

                        {/* 3. FOOTER */}
                        {step < 4 && (
                            <div style={STYLES.footer}>
                                {step > 1 ? (
                                    <button 
                                        onClick={() => setStep(step - 1)} 
                                        style={STYLES.cancelBtn} 
                                        disabled={loading}
                                    >
                                        Anterior
                                    </button>
                                ) : (
                                    <button onClick={handleClose} style={STYLES.cancelBtn} disabled={loading}>
                                        Cancelar
                                    </button>
                                )}

                                {step < 3 ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (step === 2) {
                                                if (!leagueName.trim() || !adminName.trim() || !adminPhone.trim() || !countryCode.trim()) {
                                                    toast.error('Por favor completa todos los campos');
                                                    return;
                                                }
                                                // Phone validation simplified for step transition, full validation in handleCreate
                                                const cleanNumber = adminPhone.replace(/[\s-]/g, '');
                                                if (cleanNumber.length !== 10) {
                                                    toast.error('El número celular debe tener 10 dígitos');
                                                    return;
                                                }
                                            }
                                            setStep(step + 1);
                                        }}
                                        style={{
                                            ...STYLES.createBtn,
                                            backgroundColor: (step === 1 || (leagueName.trim() && adminName.trim() && adminPhone.trim() && countryCode.trim())) ? '#00E676' : '#334155',
                                            color: (step === 1 || (leagueName.trim() && adminName.trim() && adminPhone.trim() && countryCode.trim())) ? '#0F172A' : '#94A3B8',
                                            boxShadow: (step === 1 || (leagueName.trim() && adminName.trim() && adminPhone.trim() && countryCode.trim())) ? '0 0 20px rgba(0, 230, 118, 0.4)' : 'none'
                                        }}
                                    >
                                        Siguiente
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleCreate}
                                        style={{
                                            ...STYLES.createBtn,
                                            backgroundColor: '#00E676',
                                            color: '#0F172A',
                                            cursor: !loading ? 'pointer' : 'not-allowed',
                                            boxShadow: '0 0 20px rgba(0, 230, 118, 0.4)'
                                        }}
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} strokeWidth={3} />}
                                        {loading ? 'CREANDO...' : 'CREAR POLLA'}
                                    </button>
                                )}
                            </div>
                        )}

                    </div>
                </div>
            )}
        </>
    );
};
