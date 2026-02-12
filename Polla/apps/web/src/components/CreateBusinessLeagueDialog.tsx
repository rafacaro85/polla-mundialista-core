"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Building2, Zap, Trophy, Check, Plus, Loader2, Phone, Briefcase, ChevronRight } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

/* =============================================================================
   DATOS BUSINESS (PLANES)
   ============================================================================= */
const BUSINESS_PLANS = [
    {
        id: 'bronze',
        name: 'Bronce',
        price: 'COP $100k',
        capacity: '25 Jugadores',
        description: 'Personalización básica de marca.',
        icon: <Zap size={20} />,
        color: '#CD7F32', // Bronze
        features: ['Hasta 25 participantes', 'Colores de Marca', 'Logo', 'Imagen del Premio'],
        packageType: 'ENTERPRISE_BRONZE'
    },
    {
        id: 'silver',
        name: 'Plata',
        price: 'COP $175k',
        capacity: '50 Jugadores',
        description: 'Incluye redes sociales corporativas.',
        icon: <Zap size={20} />,
        color: '#94A3B8', // Silver
        features: ['Hasta 50 participantes', 'Colores de Marca + Logo', 'Imagen del Premio', 'Redes Sociales Corporativas'],
        packageType: 'ENTERPRISE_SILVER'
    },
    {
        id: 'gold',
        name: 'Oro',
        price: 'COP $450k',
        capacity: '150 Jugadores',
        description: 'Añade Muro Social para interacción.',
        icon: <Trophy size={20} />,
        color: '#FACC15', // Gold
        features: ['Hasta 150 participantes', 'Identidad Visual Completa', 'Redes Sociales', 'Muro Social (Chat)'],
        packageType: 'ENTERPRISE_GOLD'
    },
    {
        id: 'platinum',
        name: 'Platino',
        price: 'COP $750k',
        capacity: '300 Jugadores',
        description: 'Guerra de Áreas para equipos.',
        icon: <Trophy size={20} />,
        color: '#E2E8F0', // Platinum
        features: ['Hasta 300 participantes', 'Branding Total + Muro', 'Guerra de Áreas (RRHH)'],
        packageType: 'ENTERPRISE_PLATINUM'
    },
    {
        id: 'diamond',
        name: 'Diamante',
        price: 'COP $1M',
        capacity: '500 Jugadores',
        description: 'Máxima visibilidad con Banners.',
        icon: <Building2 size={20} />,
        color: '#22d3ee', // Diamond
        features: ['Hasta 500 participantes', 'Suite Completa de Features', 'Guerra de Áreas', 'Banners Publicitarios'],
        packageType: 'ENTERPRISE_DIAMOND'
    }
];

interface CreateBusinessLeagueDialogProps {
    children?: React.ReactNode;
    onLeagueCreated?: () => void;
    // Permitir control externo del estado open si se desea (opcional)
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

import { useTournament } from '@/hooks/useTournament';

export const CreateBusinessLeagueDialog = ({ onLeagueCreated, children, open: externalOpen, onOpenChange }: CreateBusinessLeagueDialogProps) => {
    const { tournamentId } = useTournament();
    const router = useRouter();
    const [internalOpen, setInternalOpen] = useState(false);
    const [step, setStep] = useState(1); // 1: Form, 2: Loading/Redirecting
    const [loading, setLoading] = useState(false);

    // Business Plans Logic
    const availableBusinessPlans = React.useMemo(() => {
        const basePlans = [...BUSINESS_PLANS];
        
        if (tournamentId === 'UCL2526') {
            basePlans.unshift({
                id: 'launch_business',
                name: 'Cortesía Lanzamiento',
                price: 'GRATIS',
                capacity: '15 Jugadores',
                description: 'Plan gratuito limitado de introducción.',
                icon: <Zap size={20} />, 
                color: '#8B5CF6', // Violet
                features: ['Hasta 15 participantes', 'Colores de Marca + Logo', 'Imagen del Premio'],
                packageType: 'ENTERPRISE_LAUNCH'
            } as any);
        }
        return basePlans;
    }, [tournamentId]);

    // Controlled vs Uncontrolled logic
    const isControlled = externalOpen !== undefined;
    const isOpen = isControlled ? externalOpen : internalOpen;
    const setIsOpen = (val: boolean) => {
        if (isControlled && onOpenChange) {
            onOpenChange(val);
        } else {
            setInternalOpen(val);
        }
    };

    // Form State
    const [leagueName, setLeagueName] = useState('');
    const [adminName, setAdminName] = useState('');
    const [countryCode, setCountryCode] = useState('+57');
    const [adminPhone, setAdminPhone] = useState('');
    const [selectedPlanId, setSelectedPlanId] = useState(tournamentId === 'UCL2526' ? 'launch_business' : 'bronze');

    // ESTILOS
    const STYLES = {
        overlay: {
            position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 50, padding: '16px'
        },
        modal: {
            backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '24px',
            width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' as const,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', position: 'relative' as const
        },
        header: {
            padding: '24px 24px 0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
        },
        closeBtn: {
            color: '#94A3B8', cursor: 'pointer', padding: '4px', borderRadius: '50%',
            transition: 'all 0.2s', backgroundColor: 'rgba(255,255,255,0.05)'
        },
        content: { padding: '24px' },
        inputGroup: { marginBottom: '20px' },
        label: {
            display: 'block', color: '#94A3B8', fontSize: '11px', fontWeight: 'bold',
            textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '8px'
        },
        input: {
            width: '100%', backgroundColor: '#0F172A', border: '1px solid #334155',
            borderRadius: '12px', padding: '12px 16px', color: 'white', fontSize: '14px',
            fontWeight: '500', outline: 'none', transition: 'border-color 0.2s'
        },
        planCard: (plan: any, isSelected: boolean) => ({
            backgroundColor: isSelected ? `${plan.color}15` : '#0F172A', // 15 = 10% opacity hex
            border: isSelected ? `2px solid ${plan.color}` : '1px solid #334155',
            borderRadius: '16px', padding: '16px', cursor: 'pointer',
            transition: 'all 0.2s', position: 'relative' as const,
            marginBottom: '12px'
        }),
        actionBtn: {
            width: '100%', padding: '16px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #00C6FF 0%, #0072FF 100%)', // Enterprise Blue Gradient
            color: 'white', fontWeight: '900', fontSize: '14px',
            textTransform: 'uppercase' as const, letterSpacing: '1px',
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(0, 114, 255, 0.3)',
            marginTop: '12px'
        }
    };

    const handleCreate = async () => {
        if (!leagueName.trim() || !adminName.trim() || !adminPhone.trim()) {
            toast.error('Por favor completa todos los campos requeridos');
            return;
        }

        // Validación Teléfono básica
        if (adminPhone.length !== 10) {
            toast.error('El número de teléfono debe tener 10 dígitos exactos');
            return;
        }

        const selectedPlan = availableBusinessPlans.find(p => p.id === selectedPlanId);
        if (!selectedPlan) return;

        setLoading(true);
        try {
            const finalPhone = `${countryCode.trim()} ${adminPhone.trim()}`;

            const payload = {
                name: leagueName,
                adminName: adminName,
                adminPhone: finalPhone,
                type: 'COMPANY',
                isEnterprise: true,
                packageType: selectedPlan.packageType,
                maxParticipants: parseInt(selectedPlan.capacity) || 25, // Clean parse
                tournamentId, // Include tournament context
            };

            console.log('🏢 [BUSINESS] Creating League:', payload);
            const { data } = await api.post('/leagues', payload);

            toast.success('¡Espacio Empresarial Creado!', {
                description: 'Redirigiendo al Enterprise Studio...'
            });

            onLeagueCreated?.();

            // REDIRECCIÓN AL STUDIO
            setTimeout(() => {
                router.push(`/leagues/${data.id}/studio`);
                // No cerramos el modal inmediatamente para mantener el loading visible
            }, 1000);

        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Error al crear la polla');
            setLoading(false);
        }
    };

    // Render trigger wrapper
    if (!isOpen) {
        return <div onClick={() => setIsOpen(true)}>{children}</div>;
    }

    return (
        <div style={STYLES.overlay}>
            <div style={STYLES.modal} className="animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div style={STYLES.header}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <div style={{ backgroundColor: '#0072FF', borderRadius: '6px', padding: '4px' }}>
                                <Briefcase size={16} color="white" />
                            </div>
                            <span style={{ color: '#0072FF', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Enterprise</span>
                        </div>
                        <h2 className="font-russo" style={{ color: 'white', fontSize: '24px', lineHeight: '1' }}>NUEVA POLLA EMPRESA</h2>
                        <p style={{ color: '#94A3B8', fontSize: '13px', marginTop: '4px' }}>Configura tu torneo corporativo</p>
                    </div>
                    <button style={STYLES.closeBtn} onClick={() => setIsOpen(false)}><X size={20} /></button>
                </div>

                <div style={STYLES.content}>
                    {/* Campos Principales */}
                    <div style={STYLES.inputGroup}>
                        <label style={STYLES.label}>Nombre de la Empresa / Torneo</label>
                        <input
                            style={STYLES.input}
                            placeholder="Ej: TechSolutions World Cup"
                            value={leagueName}
                            onChange={(e) => setLeagueName(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                        <div style={{ ...STYLES.inputGroup, flex: '1 1 200px' }}>
                            <label style={STYLES.label}>Tu Nombre (Admin)</label>
                            <input
                                style={STYLES.input}
                                placeholder="Tu Nombre"
                                value={adminName}
                                onChange={(e) => setAdminName(e.target.value)}
                            />
                        </div>
                        <div style={{ ...STYLES.inputGroup, flex: '1 1 200px' }}>
                            <label style={STYLES.label}>Teléfono Admin</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    style={{ ...STYLES.input, width: '60px', textAlign: 'center', padding: '12px 4px' }}
                                    value={countryCode}
                                    maxLength={5}
                                    onChange={(e) => setCountryCode(e.target.value)}
                                />
                                <input
                                    style={{ ...STYLES.input, flex: 1, minWidth: '0' }}
                                    placeholder="300 123 4567"
                                    type="tel"
                                    value={adminPhone}
                                    onChange={(e) => {
                                        const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
                                        setAdminPhone(clean);
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Selector de Planes */}
                    <div style={STYLES.inputGroup}>
                        <label style={STYLES.label}>Selecciona un Plan Corporativo</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {availableBusinessPlans.map((plan) => {
                                const isSelected = selectedPlanId === plan.id;
                                return (
                                    <div
                                        key={plan.id}
                                        style={STYLES.planCard(plan, isSelected)} // @ts-ignore
                                        onClick={() => setSelectedPlanId(plan.id)}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ color: plan.color }}>{plan.icon}</div>
                                                <div>
                                                    <div style={{ color: 'white', fontWeight: 'bold', fontSize: '16px' }}>{plan.name}</div>
                                                    <div style={{ color: '#94A3B8', fontSize: '12px' }}>{plan.capacity}</div>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ color: 'white', fontWeight: '900', fontSize: '16px' }}>{plan.price}</div>
                                            </div>
                                        </div>
                                        {/* Features mini list */}
                                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                            {plan.features.slice(0, 2).map((feat, i) => (
                                                <div key={i} style={{ fontSize: '10px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Check size={10} color={plan.color} /> {feat}
                                                </div>
                                            ))}
                                        </div>

                                        {isSelected && (
                                            <div style={{
                                                position: 'absolute', top: '-1px', right: '-1px',
                                                backgroundColor: plan.color, borderRadius: '0 16px 0 16px',
                                                padding: '4px 8px'
                                            }}>
                                                <Check size={14} color="#0F172A" strokeWidth={4} />
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Botón Acción */}
                    <button
                        style={{ ...STYLES.actionBtn, opacity: loading ? 0.7 : 1 }}
                        disabled={loading}
                        onClick={handleCreate}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Briefcase size={18} />}
                        {loading ? 'Preparando Studio...' : 'CREAR Y DISEÑAR'}
                        {!loading && <ChevronRight size={18} strokeWidth={3} />}
                    </button>

                    <p style={{ textAlign: 'center', fontSize: '10px', color: '#64748B', marginTop: '12px' }}>
                        Al continuar aceptas nuestros términos para servicios corporativos.
                    </p>

                </div>
            </div>
        </div>
    );
};
