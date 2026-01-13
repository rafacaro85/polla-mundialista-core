'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Building2, Zap, Trophy, Check, Plus, Loader2, Phone, Briefcase, ChevronRight, Mail, Lock } from 'lucide-react';
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

interface CreateEnterpriseLeagueFormProps {
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateEnterpriseLeagueForm({ onClose, onSuccess }: CreateEnterpriseLeagueFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Form State
    const [leagueName, setLeagueName] = useState('');
    const [adminName, setAdminName] = useState('');
    const [countryCode, setCountryCode] = useState('+57');
    const [adminPhone, setAdminPhone] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [selectedPlanId, setSelectedPlanId] = useState('bronze');

    // ESTILOS (Matches CreateBusinessLeagueDialog)
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
            width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' as const,
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
            backgroundColor: isSelected ? `${plan.color}15` : '#0F172A',
            border: isSelected ? `2px solid ${plan.color}` : '1px solid #334155',
            borderRadius: '16px', padding: '16px', cursor: 'pointer',
            transition: 'all 0.2s', position: 'relative' as const,
            marginBottom: '12px'
        }),
        actionBtn: {
            width: '100%', padding: '16px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', // Indigo Gradient for Admin
            color: 'white', fontWeight: '900', fontSize: '14px',
            textTransform: 'uppercase' as const, letterSpacing: '1px',
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(79, 70, 229, 0.3)',
            marginTop: '12px'
        }
    };

    const handleCreate = async () => {
        if (!leagueName.trim() || !adminName.trim() || !adminPhone.trim() || !adminEmail.trim() || !adminPassword.trim()) {
            toast.error('Por favor completa todos los campos requeridos');
            return;
        }

        if (adminPhone.length !== 10) {
            toast.error('El número de teléfono debe tener 10 dígitos exactos');
            return;
        }

        const selectedPlan = BUSINESS_PLANS.find(p => p.id === selectedPlanId);
        if (!selectedPlan) return;

        setLoading(true);
        try {
            const finalPhone = `${countryCode.trim()} ${adminPhone.trim()}`;

            // NOTE: This payload structure must be supported by the backend endpoint /leagues
            // or a dedicated admin endpoint. Assuming standard creation for now with extra fields.
            const payload = {
                name: leagueName,
                adminName: adminName,
                adminPhone: finalPhone,
                adminEmail: adminEmail,    // NEW
                adminPassword: adminPassword, // NEW
                type: 'COMPANY',
                isEnterprise: true,
                packageType: selectedPlan.packageType,
                maxParticipants: parseInt(selectedPlan.capacity) || 1000
            };

            console.log('🏢 [ADMIN] Creating Enterprise League:', payload);
            const { data: league } = await api.post('/leagues', payload);

            toast.success('¡Empresa Creada!', {
                description: `Redirigiendo al Studio para personalización...`
            });

            onSuccess();
            onClose();
            router.push(`/leagues/${league.id}/studio`);

        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Error al crear la polla empresarial');
            setLoading(false);
        }
    };

    return (
        <div style={STYLES.overlay}>
            <div style={STYLES.modal} className="animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div style={STYLES.header}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <div style={{ backgroundColor: '#6366F1', borderRadius: '6px', padding: '4px' }}>
                                <Building2 size={16} color="white" />
                            </div>
                            <span style={{ color: '#6366F1', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Portal B2B</span>
                        </div>
                        <h2 className="font-russo" style={{ color: 'white', fontSize: '24px', lineHeight: '1' }}>NUEVA POLLA EMPRESA</h2>
                        <p style={{ color: '#94A3B8', fontSize: '13px', marginTop: '4px' }}>Creación y asignación manual de cliente</p>
                    </div>
                    <button style={STYLES.closeBtn} onClick={onClose}><X size={20} /></button>
                </div>

                <div style={STYLES.content}>
                    {/* Campos Principales */}
                    <div style={STYLES.inputGroup}>
                        <label style={STYLES.label}>Nombre de la Empresa / Torneo</label>
                        <input
                            style={STYLES.input}
                            placeholder="Ej: Cementos Argos"
                            value={leagueName}
                            onChange={(e) => setLeagueName(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                        <div style={{ ...STYLES.inputGroup, flex: '1 1 200px' }}>
                            <label style={STYLES.label}>Nombre Admin (Cliente)</label>
                            <input
                                style={STYLES.input}
                                placeholder="Nombre Completo"
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

                    {/* CREDENCIALES (NUEVO) */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', backgroundColor: '#0F172A', padding: '16px', borderRadius: '16px', border: '1px border-slate-700', marginBottom: '20px' }}>
                        <div style={{ width: '100%', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', color: '#FACC15', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                            <Lock size={12} /> Credenciales de Acceso
                        </div>
                        <div style={{ flex: '1 1 200px' }}>
                            <label style={STYLES.label}>Correo Electrónico</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: '#64748B' }} />
                                <input
                                    style={{ ...STYLES.input, paddingLeft: '38px' }}
                                    type="email"
                                    placeholder="cliente@empresa.com"
                                    value={adminEmail}
                                    onChange={(e) => setAdminEmail(e.target.value)}
                                />
                            </div>
                        </div>
                        <div style={{ flex: '1 1 200px' }}>
                            <label style={STYLES.label}>Contraseña Temporal</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: '#64748B' }} />
                                <input
                                    style={{ ...STYLES.input, paddingLeft: '38px' }}
                                    type="text" // Visible text for admin convenience as requested "temporal"
                                    placeholder="Contraseña123"
                                    value={adminPassword}
                                    onChange={(e) => setAdminPassword(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Selector de Planes */}
                    <div style={STYLES.inputGroup}>
                        <label style={STYLES.label}>Selecciona un Plan Corporativo</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }} className="custom-scrollbar">
                            {BUSINESS_PLANS.map((plan) => {
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
                        {loading ? 'Creando Empresa...' : 'DAR DE ALTA CLIENTE B2B'}
                        {!loading && <ChevronRight size={18} strokeWidth={3} />}
                    </button>

                </div>
            </div>
        </div>
    );
}
