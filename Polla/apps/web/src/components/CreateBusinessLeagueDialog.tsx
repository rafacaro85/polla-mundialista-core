"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
    X, Building2, Zap, Trophy, Check, Plus, 
    Loader2, Phone, Briefcase, ChevronRight, 
    ChevronLeft, FileText, Star, Gem, Medal, 
    CreditCard, ShieldCheck, LayoutDashboard, Store 
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useTournament } from '@/hooks/useTournament';
import { PaymentMethods } from './dashboard/PaymentMethods';

/* =============================================================================
   DATOS BUSINESS (PLANES)
   ============================================================================= */
const BUSINESS_PLANS = [
    {
        id: 'bronce',
        name: 'Bronce',
        price: '$100.000',
        capacity: '25 Jugadores',
        icon: <Zap size={20} />,
        color: '#CD7F32',
        features: [
            'Branding Básico',
            'Logo de Empresa',
            'Imagen de Premios'
        ],
        packageType: 'bronce',
        description: 'Pago Único'
    },
    {
        id: 'plata',
        name: 'Plata',
        price: '$175.000',
        capacity: '50 Jugadores',
        icon: <Medal size={20} />,
        color: '#94A3B8',
        features: [
            'Personalización Colores Marca',
            'Logo de la Empresa',
            'Imágenes de los premios',
            'Redes Sociales Corporativas'
        ],
        packageType: 'plata',
        description: 'Pago Único'
    },
    {
        id: 'oro',
        name: 'Oro',
        price: '$450.000',
        capacity: '150 Jugadores',
        icon: <Trophy size={20} />,
        color: '#FACC15',
        features: [
            'Todo lo del plan Plata',
            'Muro Social Interno'
        ],
        packageType: 'oro',
        description: 'Pago Único'
    },
    {
        id: 'platino',
        name: 'Platino',
        price: '$750.000',
        capacity: '300 Jugadores',
        icon: <Star size={20} />,
        color: '#E2E8F0',
        features: [
            'Todo lo del plan Oro',
            'Guerra de Áreas (RRHH)'
        ],
        packageType: 'platino',
        description: 'Pago Único'
    },
    {
        id: 'diamante',
        name: 'Diamante',
        price: '$1.000.000',
        capacity: '500 Jugadores',
        icon: <Gem size={20} />,
        color: '#00E676',
        features: [
            'Todo lo del plan Platino',
            'Banners Publicidad (Home)'
        ],
        packageType: 'diamante',
        description: 'Pago Único'
    }
];

interface CreateBusinessLeagueDialogProps {
    children?: React.ReactNode;
    onLeagueCreated?: () => void;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export const CreateBusinessLeagueDialog = ({ 
    onLeagueCreated, 
    children, 
    open: externalOpen, 
    onOpenChange 
}: CreateBusinessLeagueDialogProps) => {
    const { tournamentId: hookTournamentId } = useTournament();
    const router = useRouter();
    const [internalOpen, setInternalOpen] = useState(false);
    const [step, setStep] = useState(1); // 1: Torneo, 2: Datos, 3: Planes, 4: Pago
    const [loading, setLoading] = useState(false);
    const [createdLeagueId, setCreatedLeagueId] = useState<string | null>(null);
    const [selectedTournamentId, setSelectedTournamentId] = useState<string>(hookTournamentId || 'WC2026');

    // Form State
    const [companyName, setCompanyName] = useState('');
    const [leagueName, setLeagueName] = useState('');
    const [nit, setNit] = useState('');
    const [adminName, setAdminName] = useState('');
    const [countryCode, setCountryCode] = useState('+57');
    const [adminPhone, setAdminPhone] = useState('');
    const [selectedPlanId, setSelectedPlanId] = useState('bronce');
    const [matchEventType, setMatchEventType] = useState<string | null>(null); // null = Enterprise, 'BAR' | 'ENTERPRISE' = Match Mode

    // Business Plans Logic (Champions specific promo)
    const availableBusinessPlans = React.useMemo(() => {
        const basePlans = [...BUSINESS_PLANS];
        if (selectedTournamentId === 'UCL2526') {
            basePlans.unshift({
                id: 'launch_business',
                name: 'Inauguración',
                price: 'GRATIS',
                capacity: '15 Jugadores',
                icon: <Zap size={20} />, 
                color: '#00E676',
                features: ['Muro Social Interno', 'Predicciones por IA', 'Sin Publicidad'],
                packageType: 'ENTERPRISE_LAUNCH'
            });
        }
        return basePlans;
    }, [selectedTournamentId]);

    // Initial plan check when tournament changes
    React.useEffect(() => {
        if (selectedTournamentId === 'UCL2526') {
            setSelectedPlanId('launch_business');
        } else {
            setSelectedPlanId('bronce');
        }
    }, [selectedTournamentId]);

    const [isPaymentSubmitted, setIsPaymentSubmitted] = useState(false);

    const isControlled = externalOpen !== undefined;
    const isOpen = isControlled ? externalOpen : internalOpen;
    
    const setIsOpen = (val: boolean) => {
        if (isControlled && onOpenChange) {
            onOpenChange(val);
        } else {
            setInternalOpen(val);
        }
    };

    const closeDialog = () => {
        setIsOpen(false);
        // Reset state after closing
        setTimeout(() => {
            setStep(1);
            setLoading(false);
            setLeagueName('');
            setNit('');
            setAdminName('');
            setAdminPhone('');
            setCreatedLeagueId(null);
            setIsPaymentSubmitted(false);
            setSelectedTournamentId(hookTournamentId || 'WC2026');
            setMatchEventType(null);
        }, 300);
    };

    // ... handleNext and other logic ...

    const handleNext = () => {
        if (step === 1) {
            setStep(2);
        } else if (step === 2) {
            if (!leagueName.trim() || !adminPhone.trim()) {
                toast.error('Nombre y Teléfono son obligatorios');
                return;
            }
            // If Match mode, skip plan selection and create directly
            if (matchEventType) {
                handleCreateLeague();
            } else {
                setStep(3);
            }
        } else if (step === 3) {
            handleCreateLeague();
        }
    };

    const handleCreateLeague = async () => {
        const selectedPlan = availableBusinessPlans.find(p => p.id === selectedPlanId);
        if (!selectedPlan) return;

        setLoading(true);
        try {
            const finalPhone = adminPhone.trim();

            // Match mode: create without plan/payment
            const isMatchMode = !!matchEventType;

            const payload = {
                name: leagueName,
                adminName: adminName || 'Admin',
                adminPhone: finalPhone,
                type: 'COMPANY',
                isEnterprise: true,
                packageType: isMatchMode ? 'MATCH' : selectedPlan.packageType,
                maxParticipants: isMatchMode ? 500 : (parseInt(selectedPlan.capacity) || 25),
                tournamentId: selectedTournamentId,
                companyName: companyName || leagueName,
                ...(matchEventType && { matchEventType }),
            };

            const { data } = await api.post('/leagues', payload);
            setCreatedLeagueId(data.id);
            
            // Match mode OR free plan: redirect immediately
            if (matchEventType || selectedPlan.price === 'GRATIS') {
                const successMsg = matchEventType 
                    ? '¡Polla Match Creada!' 
                    : '¡Polla Creada!';
                const successDesc = matchEventType
                    ? 'Ve al panel de admin para comprar y activar partidos.'
                    : 'Redirigiendo al Studio...';
                toast.success(successMsg, { description: successDesc });
                setTimeout(() => {
                    router.push(`/leagues/${data.id}/studio`);
                    closeDialog();
                }, 1500);
            } else {
                setStep(4); // A pagar
            }
        } catch (error: any) {
            let errorMsg = 'Error al crear la polla corporativa';
            if (error.response?.data?.message) {
                const msg = error.response.data.message;
                errorMsg = Array.isArray(msg) ? msg.join(' | ') : msg;
            }
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const STYLES = {
        overlay: "fixed inset-0 bg-[#0F172A]/90 backdrop-blur-md z-[100] flex items-center justify-center p-4",
        modal: "bg-[#1E293B] border border-[#334155] rounded-[32px] w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative",
        header: "p-6 border-b border-[#334155] flex justify-between items-center bg-[#1E293B] sticky top-0 z-10",
        body: "p-6 overflow-y-auto flex-1 custom-scrollbar",
        footer: "p-6 border-t border-[#334155] flex gap-4 bg-[#1E293B] sticky bottom-0 z-10",
        input: "w-full bg-[#0F172A] border-[#334155] focus:border-[#00E676] rounded-xl px-4 py-3 text-white placeholder:text-[#64748B] outline-none transition-all font-medium",
        label: "block text-[#94A3B8] text-[10px] font-bold uppercase tracking-wider mb-2 ml-1",
        planCard: (isSelected: boolean, color: string) => `
            relative p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-3 group
            ${isSelected 
                ? `bg-[${color}10] border-[${color}] shadow-[0_0_20px_rvba(0,230,118,0.1)]` 
                : 'bg-[#0F172A] border-[#334155] hover:border-[#475569]'}
        `,
        btnPrimary: "flex-1 bg-[#00E676] hover:bg-[#00C853] text-[#0F172A] font-black uppercase py-4 rounded-xl shadow-lg shadow-[#00E676]/20 transition-all flex items-center justify-center gap-2 relative overflow-hidden",
        btnSecondary: "px-6 py-4 rounded-xl border border-[#334155] text-[#94A3B8] hover:text-white transition-all uppercase font-bold text-xs"
    };

    if (!isOpen) {
        return <div onClick={() => setIsOpen(true)}>{children}</div>;
    }

    const selectedPlan = availableBusinessPlans.find(p => p.id === selectedPlanId);

    return (
        <div className={STYLES.overlay}>
            <div className={STYLES.modal}>
                {/* Progress Bar Top */}
                <div className="absolute top-0 left-0 w-full h-1 bg-[#0F172A]">
                    <div 
                        className="h-full bg-[#00E676] transition-all duration-500"
                        style={{ width: `${(step / (matchEventType ? 2 : 4)) * 100}%` }}
                    />
                </div>

                <div className={STYLES.header}>
                    <div className="flex items-center gap-4">
                        <div className="bg-[#00E676]/10 p-2 rounded-xl text-[#00E676]">
                            {step === 1 && <Trophy size={24} />}
                            {step === 2 && <Building2 size={24} />}
                            {step === 3 && <LayoutDashboard size={24} />}
                            {step === 4 && <CreditCard size={24} />}
                        </div>
                        <div>
                            <h2 className="text-white font-russo text-xl uppercase leading-none">
                                {isPaymentSubmitted ? "Solicitud Recibida" : (
                                    <>
                                        {step === 1 && "Torneo"}
                                        {step === 2 && "Datos de Empresa"}
                                        {step === 3 && "Selección de Plan"}
                                        {step === 4 && "Activación y Pago"}
                                    </>
                                )}
                            </h2>
                            <p className="text-[#94A3B8] text-[10px] font-bold uppercase tracking-widest mt-1">
                                {isPaymentSubmitted ? "Procesando Activación" : matchEventType ? `Paso ${step} de 2` : `Paso ${step} de 4`}
                            </p>
                        </div>
                    </div>
                    <button onClick={closeDialog} className="text-[#64748B] hover:text-white p-2">
                        <X size={20} />
                    </button>
                </div>

                <div className={STYLES.body}>
                    {/* PASO 1: TORNEO */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <label className={STYLES.label}>¿En qué torneo quieres tu polla corporativa?</label>
                            
                            {/* MUNDIAL */}
                            <div 
                                onClick={() => setSelectedTournamentId('WC2026')}
                                className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 overflow-hidden ${
                                    selectedTournamentId === 'WC2026' ? 'bg-[#00E676]/5 border-[#00E676]' : 'bg-[#0F172A] border-[#334155] hover:border-[#475569]'
                                }`}
                            >
                                <div className="bg-[#00E676]/10 rounded-xl text-[#00E676] w-12 h-12 flex items-center justify-center overflow-hidden">
                                     <img src="/images/wc-logo.png" alt="Mundial" style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(1.4)' }} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-white font-russo uppercase">Mundial 2026</h4>
                                    <p className="text-[#94A3B8] text-[10px] font-bold uppercase tracking-widest mt-1">Sede: USA, México y Canadá</p>
                                </div>
                                {selectedTournamentId === 'WC2026' && (
                                    <div className="bg-[#00E676] text-[#0F172A] p-1 rounded-full">
                                        <Check size={14} strokeWidth={4} />
                                    </div>
                                )}
                            </div>

                            {/* CHAMPIONS */}
                            <div 
                                onClick={() => setSelectedTournamentId('UCL2526')}
                                className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 overflow-hidden ${
                                    selectedTournamentId === 'UCL2526' ? 'bg-[#6366F1]/5 border-[#6366F1]' : 'bg-[#0F172A] border-[#334155] hover:border-[#475569]'
                                }`}
                            >
                                <div className="bg-[#6366F1]/10 p-2 rounded-xl text-[#6366F1] w-12 h-12 flex items-center justify-center overflow-hidden">
                                    <img src="/images/ucl-logo.png" alt="Champions" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-white font-russo uppercase">Champions 25/26</h4>
                                    <p className="text-[#94A3B8] text-[10px] font-bold uppercase tracking-widest mt-1">La orejona espera por ti</p>
                                </div>
                                {selectedTournamentId === 'UCL2526' && (
                                    <div className="bg-[#6366F1] text-white p-1 rounded-full">
                                        <Check size={14} strokeWidth={4} />
                                    </div>
                                )}
                            </div>

                            {/* SEPARATOR */}
                            <div className="border-t border-[#334155] my-2" />
                            <label className={STYLES.label}>¿Qué tipo de evento es?</label>

                            {/* BAR / RESTAURANTE */}
                            <div 
                                onClick={() => setMatchEventType(matchEventType === 'BAR' ? null : 'BAR')}
                                className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 overflow-hidden ${
                                    matchEventType === 'BAR' ? 'bg-[#FACC15]/5 border-[#FACC15]' : 'bg-[#0F172A] border-[#334155] hover:border-[#475569]'
                                }`}
                            >
                                <div className="text-3xl">🍺</div>
                                <div className="flex-1">
                                    <h4 className="text-white font-russo uppercase text-sm">Bar / Restaurante</h4>
                                    <p className="text-[#94A3B8] text-[10px] font-bold uppercase tracking-widest mt-1">Polla Match — Un partido a la vez con QR</p>
                                </div>
                                {matchEventType === 'BAR' && (
                                    <div className="bg-[#FACC15] text-[#0F172A] p-1 rounded-full">
                                        <Check size={14} strokeWidth={4} />
                                    </div>
                                )}
                            </div>

                            {/* EVENTO EMPRESARIAL */}
                            <div 
                                onClick={() => setMatchEventType(matchEventType === 'ENTERPRISE' ? null : 'ENTERPRISE')}
                                className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 overflow-hidden ${
                                    matchEventType === 'ENTERPRISE' ? 'bg-[#38BDF8]/5 border-[#38BDF8]' : 'bg-[#0F172A] border-[#334155] hover:border-[#475569]'
                                }`}
                            >
                                <div className="text-3xl">🏢</div>
                                <div className="flex-1">
                                    <h4 className="text-white font-russo uppercase text-sm">Evento Empresarial</h4>
                                    <p className="text-[#94A3B8] text-[10px] font-bold uppercase tracking-widest mt-1">Polla Match empresarial — Sin mesas</p>
                                </div>
                                {matchEventType === 'ENTERPRISE' && (
                                    <div className="bg-[#38BDF8] text-[#0F172A] p-1 rounded-full">
                                        <Check size={14} strokeWidth={4} />
                                    </div>
                                )}
                            </div>

                            {matchEventType && (
                                <div className="bg-[#00E676]/5 border border-[#00E676]/20 p-4 rounded-2xl text-center">
                                    <p className="text-[#00E676] text-xs font-bold">✅ Polla Match seleccionada</p>
                                    <p className="text-[#94A3B8] text-[10px] mt-1">Se creará sin costo inicial. Compra partidos después en el panel de admin.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* PASO 2: DATOS */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="bg-[#0F172A]/50 border border-[#334155] p-4 rounded-2xl">
                                <p className="text-[#94A3B8] text-xs leading-relaxed">
                                    Configura el espacio donde tus empleados participarán. Podrás personalizar el logo y colores en el siguiente paso.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={STYLES.label}>Nombre de la Empresa</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-[#475569] h-5 w-5" />
                                        <input 
                                            className={`${STYLES.input} pl-12`}
                                            placeholder="Ej: TechCorp S.A.S"
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className={STYLES.label}>Nombre de esta Polla</label>
                                    <div className="relative">
                                        <Trophy className="absolute left-4 top-1/2 -translate-y-1/2 text-[#475569] h-5 w-5" />
                                        <input 
                                            className={`${STYLES.input} pl-12`}
                                            placeholder="Ej: Torneo RRHH 2026"
                                            value={leagueName}
                                            onChange={(e) => setLeagueName(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={STYLES.label}>NIT / ID Tributario (Opcional)</label>
                                    <div className="relative">
                                        <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-[#475569] h-5 w-5" />
                                        <input 
                                            className={`${STYLES.input} pl-12`}
                                            placeholder="900.xxx.xxx-x"
                                            value={nit}
                                            onChange={(e) => setNit(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className={STYLES.label}>WhatsApp de Contacto</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#475569] h-5 w-5" />
                                        <input 
                                            className={`${STYLES.input} pl-12`}
                                            placeholder="Ej: +57 310 123 4567"
                                            type="tel"
                                            value={adminPhone}
                                            onChange={(e) => setAdminPhone(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PASO 3: PLANES */}
                    {step === 3 && (
                        <div className="space-y-4">
                            {availableBusinessPlans.map((plan) => {
                                const isSelected = selectedPlanId === plan.id;
                                return (
                                    <div 
                                        key={plan.id}
                                        onClick={() => setSelectedPlanId(plan.id)}
                                        className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-3 group ${
                                            isSelected ? 'bg-[#00E676]/5 border-[#00E676]' : 'bg-[#0F172A] border-[#334155] hover:border-[#475569]'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-xl bg-[#1E293B]" style={{ color: plan.color }}>
                                                    {plan.icon}
                                                </div>
                                                <div>
                                                    <h3 className="text-white font-black uppercase text-sm">{plan.name}</h3>
                                                    <span className="text-[#94A3B8] text-[10px] font-bold uppercase tracking-wider">{plan.capacity}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-white font-black text-lg leading-none">{plan.price}</div>
                                                {plan.price !== 'GRATIS' && <div className="text-[#94A3B8] text-[8px] font-bold uppercase mt-1">{plan.description || 'Pago Único'}</div>}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-1">
                                            {plan.features.map((feat, i) => (
                                                <div key={i} className="flex items-center gap-2 text-[10px] text-[#A1A1AA]">
                                                    <Check size={12} className="text-[#00E676] shrink-0" />
                                                    <span className="truncate">{feat}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {isSelected && (
                                            <div className="absolute -top-2 -right-2 bg-[#00E676] text-[#0F172A] p-1 rounded-full shadow-lg">
                                                <Check size={14} strokeWidth={4} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* PASO 4: PAGO */}
                    {step === 4 && (
                        <div className="space-y-6">
                            {isPaymentSubmitted ? (
                                <div className="flex flex-col items-center justify-center py-10 text-center space-y-4 animate-in zoom-in duration-300">
                                    <div className="h-20 w-20 bg-[#00E676]/10 rounded-full flex items-center justify-center text-[#00E676] mb-2">
                                        <ShieldCheck size={48} />
                                    </div>
                                    <h3 className="text-white font-russo text-2xl uppercase">¡Pago en Revisión!</h3>
                                    <p className="text-[#94A3B8] text-sm max-w-xs mx-auto">
                                        Hemos recibido tu comprobante correctamente. En breve un asesor activará tu Polla y el acceso al <strong>Studio</strong>.
                                    </p>
                                    <div className="bg-[#0F172A] border border-[#334155] p-3 rounded-xl inline-flex items-center gap-2 text-xs text-[#00E676] font-bold">
                                        <Loader2 size={16} className="animate-spin" />
                                        TIEMPO ESTIMADO: MENOS DE 2 HORAS
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="bg-[#00E676]/5 border border-[#00E676]/20 p-5 rounded-2xl text-center">
                                        <h4 className="text-[#00E676] font-russo text-lg uppercase mb-1">Resumen del Plan</h4>
                                        <p className="text-white font-black text-2xl uppercase">{selectedPlan?.name}</p>
                                        <div className="flex justify-center gap-4 mt-3">
                                            <div className="text-center">
                                                <div className="text-[#94A3B8] text-[10px] font-bold uppercase">Total a Pagar</div>
                                                <div className="text-white font-bold">{selectedPlan?.price}</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-[#94A3B8] text-[10px] font-bold uppercase">Capacidad</div>
                                                <div className="text-white font-bold">{selectedPlan?.capacity}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {createdLeagueId && (
                                        <PaymentMethods 
                                            leagueId={createdLeagueId}
                                            amount={parseInt(selectedPlan?.price.replace(/\D/g, '') || '0')}
                                            packageId={selectedPlan?.packageType}
                                            onSuccess={() => {
                                                setIsPaymentSubmitted(true);
                                                toast.success('Pago enviado para revisión');
                                            }}
                                        />
                                    )}

                                    <div className="flex items-center gap-3 p-4 bg-[#0F172A] rounded-xl border border-[#334155]">
                                        <ShieldCheck className="text-[#00E676] shrink-0" />
                                        <p className="text-[10px] text-[#94A3B8] leading-tight">
                                            Al subir tu comprobante, un asesor activará las funciones premium de tu Studio de marca en menos de 2 horas.
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div className={STYLES.footer}>
                    {step > 1 && step < 4 && (
                        <button 
                            onClick={() => setStep(step - 1)}
                            className={STYLES.btnSecondary}
                            disabled={loading}
                        >
                            <ChevronLeft size={16} />
                        </button>
                    )}
                    
                    {step < 4 && (
                        <button 
                            onClick={handleNext}
                            className={STYLES.btnPrimary}
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                {step === 3 ? "Confirmar Plan" : matchEventType && step === 2 ? "Crear Polla Match" : "Continuar"}
                                    <ChevronRight size={18} />
                                </>
                            )}
                        </button>
                    )}

                    {step === 4 && (
                        <button 
                            onClick={() => {
                                router.push('/empresa/mis-pollas');
                                closeDialog();
                            }}
                            className={`${isPaymentSubmitted ? STYLES.btnPrimary : STYLES.btnSecondary} flex-1`}
                        >
                            {isPaymentSubmitted ? "Ir a Mis Pollas" : "Cerrar y pagar después"}
                        </button>
                    )}
                </div>
            </div>
            
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #334155;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #475569;
                }
            `}</style>
        </div>
    );
};
