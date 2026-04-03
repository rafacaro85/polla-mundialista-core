"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Settings, Trash2, Loader2, Copy, Share2,
    AlertTriangle, Save, Gem, Check,
    Edit, Gift, Trophy, Users, BarChart3,
    Palette, Shield, Lock, Eye, X,
    ArrowUpCircle, Upload
} from 'lucide-react';
import api from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/hooks/use-toast';
import { Progress } from "@/components/ui/progress";
import LeagueBrandingForm from '@/components/LeagueBrandingForm';
import { LeagueBonusQuestions } from '@/components/LeagueBonusQuestions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from 'next/navigation';
import { EnterpriseLock } from '@/components/admin/EnterpriseLock';
import LeagueAnalyticsPanel from '@/components/admin/LeagueAnalyticsPanel';
import { UserPredictionsDialog } from '@/components/UserPredictionsDialog';
import { useTournament } from '@/hooks/useTournament';

// ── PLAN_CONFIG (frontend mirror) ──────────────────────────────────────────
const PLAN_CONFIG: Record<string, { maxParticipants: number; price: number; type: string; label: string; color: string }> = {
    'familia':    { maxParticipants: 5,   price: 0,       type: 'SOCIAL',      label: 'Familia',    color: '#94A3B8' },
    'parche':     { maxParticipants: 15,  price: 30000,   type: 'SOCIAL',      label: 'Parche',     color: '#38BDF8' },
    'amigos':     { maxParticipants: 50,  price: 80000,   type: 'SOCIAL',      label: 'Amigos',     color: '#A78BFA' },
    'lider':      { maxParticipants: 100, price: 180000,  type: 'SOCIAL',      label: 'Líder',      color: '#FBBF24' },
    'influencer': { maxParticipants: 200, price: 350000,  type: 'SOCIAL',      label: 'Influencer', color: '#F472B6' },
    'bronce':     { maxParticipants: 25,  price: 100000,  type: 'ENTERPRISE',  label: 'Bronce',     color: '#CD7F32' },
    'plata':      { maxParticipants: 50,  price: 175000,  type: 'ENTERPRISE',  label: 'Plata',      color: '#C0C0C0' },
    'oro':        { maxParticipants: 150, price: 450000,  type: 'ENTERPRISE',  label: 'Oro',        color: '#FFD700' },
    'platino':    { maxParticipants: 300, price: 750000,  type: 'ENTERPRISE',  label: 'Platino',    color: '#E5E4E2' },
    'diamante':   { maxParticipants: 500, price: 1000000, type: 'ENTERPRISE',  label: 'Diamante',   color: '#B9F2FF' },
};
const FREE_PLAN_KEYS = ['familia', 'starter', 'free', 'launch_promo', 'enterprise_launch'];
const fmtCOP = (n: number) => `$ ${n.toLocaleString('es-CO')}`;

function getPlanInfo(key: string | undefined) {
    if (!key) return PLAN_CONFIG['familia'];
    const k = key.trim().toLowerCase();
    return PLAN_CONFIG[k] || PLAN_CONFIG['familia'];
}

// ── PlanUpgradeSection ─────────────────────────────────────────────────────
function PlanUpgradeSection({ league, participantCount, onUpgradeComplete }: {
    league: any; participantCount: number; onUpgradeComplete: () => void;
}) {
    const { toast } = useToast();
    const [showModal, setShowModal] = useState(false);
    const [step, setStep] = useState<'select' | 'pay' | 'done'>('select');
    const [upgradeOptions, setUpgradeOptions] = useState<any>(null);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [loadingOptions, setLoadingOptions] = useState(false);

    const currentKey = (league.packageType || 'familia').trim().toLowerCase();
    const currentInfo = getPlanInfo(currentKey);
    const isFree = FREE_PLAN_KEYS.includes(currentKey);
    const isMaxPlan = currentKey === 'influencer' || currentKey === 'diamante';

    const openUpgradeModal = async () => {
        setShowModal(true);
        setStep('select');
        setSelectedPlan(null);
        setFile(null);
        setLoadingOptions(true);
        try {
            const { data } = await api.get(`/leagues/${league.id}/upgrade-options`);
            setUpgradeOptions(data);
        } catch {
            toast({ title: 'Error', description: 'No se pudieron cargar las opciones de plan', variant: 'destructive' });
        } finally {
            setLoadingOptions(false);
        }
    };

    const handleSelectPlan = (plan: any) => {
        setSelectedPlan(plan);
        setStep('pay');
    };

    const handleUpload = async () => {
        if (!file || !selectedPlan) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('amount', String(selectedPlan.priceToPay));
            formData.append('leagueId', league.id);
<<<<<<< HEAD
            const { data: txData } = await api.post('/transactions/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            // Mark as upgrade
            await api.patch(`/transactions/${txData.id}/status`, {
                status: 'PENDING',
                adminNotes: `⬆️ UPGRADE: ${currentInfo.label} → ${selectedPlan.planLabel}`,
            });
=======
            formData.append('isUpgrade', 'true');
            formData.append('upgradePlan', selectedPlan.planKey);
            formData.append('currentPlan', currentKey);
            const { data: txData } = await api.post('/transactions/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
>>>>>>> develop
            setStep('done');
            toast({ title: '✅ Solicitud enviada', description: 'Tu comprobante fue recibido. En menos de 2 horas tu plan será actualizado.' });
        } catch (err: any) {
            toast({ title: 'Error', description: err?.response?.data?.message || 'Error al enviar comprobante', variant: 'destructive' });
        } finally {
            setUploading(false);
        }
    };

    return (
        <>
            {/* Current Plan Card */}
            <div className="bg-[#1E293B] border border-slate-700 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase">Tu Plan Actual</h3>
                    <span className="text-[10px] font-bold px-3 py-1 rounded-full border" style={{ color: currentInfo.color, borderColor: currentInfo.color + '44', backgroundColor: currentInfo.color + '11' }}>
                        {currentInfo.label}
                    </span>
                </div>
                <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1">
                        <div className="text-2xl font-bold text-white">{participantCount} <span className="text-sm text-slate-400">/ {league.maxParticipants}</span></div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold">Participantes</div>
                    </div>
                    <div className="text-right">
                        <div className="text-lg font-bold" style={{ color: currentInfo.color }}>{isFree ? 'Gratis' : fmtCOP(currentInfo.price)}</div>
                        <div className="text-[10px] text-slate-500">{isFree ? 'Plan gratuito' : 'Plan de pago'}</div>
                    </div>
                </div>
                <Progress value={(participantCount / league.maxParticipants) * 100} className="h-2 bg-slate-700" />
            </div>

            {/* Upgrade Button */}
            {!isMaxPlan && (
                <button
                    onClick={openUpgradeModal}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold rounded-xl py-4 px-6 flex items-center justify-center gap-3 transition-all duration-300 shadow-lg hover:shadow-orange-500/20"
                >
                    <ArrowUpCircle className="w-5 h-5" />
                    <span>⬆️ Mejorar Plan</span>
                </button>
            )}

            {/* Upgrade Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-[#0F172A] border border-slate-700 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-slate-700 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Gem className="w-5 h-5 text-amber-400" />
                                {step === 'select' && 'Elige tu nuevo plan'}
                                {step === 'pay' && `Pagar upgrade a ${selectedPlan?.planLabel}`}
                                {step === 'done' && '✅ Solicitud enviada'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="p-5">
                            {/* STEP 1: Select Plan */}
                            {step === 'select' && (
                                <>
                                    {/* Current plan badge */}
                                    <div className="bg-slate-800 rounded-xl p-3 mb-4 flex items-center gap-3">
                                        <span className="text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: currentInfo.color + '22', color: currentInfo.color }}>ACTUAL</span>
                                        <span className="text-sm font-bold text-white">{currentInfo.label}</span>
                                        <span className="text-xs text-slate-400 ml-auto">{league.maxParticipants} cupos</span>
                                    </div>

                                    {loadingOptions ? (
                                        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-amber-400" /></div>
                                    ) : upgradeOptions?.availablePlans?.length === 0 ? (
                                        <p className="text-center text-slate-400 py-6">Ya tienes el plan máximo disponible.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {upgradeOptions?.availablePlans?.map((plan: any) => {
                                                const info = PLAN_CONFIG[plan.planKey];
                                                return (
                                                    <button key={plan.planKey} onClick={() => handleSelectPlan(plan)}
                                                        className="w-full bg-[#1E293B] hover:bg-[#2a3a54] border border-slate-600 hover:border-amber-500/50 rounded-xl p-4 transition-all text-left"
                                                    >
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="font-bold text-white flex items-center gap-2">
                                                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: info?.color || '#FFF' }} />
                                                                {plan.planLabel}
                                                            </span>
                                                            <span className="text-xs text-slate-400">{plan.maxParticipants} cupos</span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-slate-500">Precio total: {fmtCOP(plan.price)}</span>
                                                            <span className="text-sm font-bold text-amber-400">
                                                                {plan.isCurrentPlanFree ? fmtCOP(plan.priceToPay) : `${fmtCOP(plan.priceToPay)}`}
                                                            </span>
                                                        </div>
                                                        {!plan.isCurrentPlanFree && plan.priceToPay < plan.price && (
                                                            <div className="text-[10px] text-emerald-400 mt-1">💡 Solo pagas la diferencia</div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </>
                            )}

                            {/* STEP 2: Payment */}
                            {step === 'pay' && selectedPlan && (
                                <div className="space-y-4">
                                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center">
                                        <p className="text-xs text-amber-300 mb-1">Monto a pagar</p>
                                        <p className="text-3xl font-bold text-amber-400">{fmtCOP(selectedPlan.priceToPay)} <span className="text-xs text-slate-400">COP</span></p>
                                    </div>

                                    <div className="bg-slate-800 rounded-xl p-4 space-y-3">
                                        <p className="text-xs font-bold text-slate-300 uppercase">Datos de pago</p>
                                        <div className="flex items-center gap-2 text-sm text-white">
                                            <span>📱</span><span className="font-bold">Nequi/Daviplata:</span><span className="text-emerald-400">3105973421</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-white">
                                            <span>🏦</span><span className="font-bold">Bancolombia Ahorros:</span><span className="text-emerald-400">27228258721</span>
                                        </div>
                                        <p className="text-xs text-slate-400">A nombre de: <span className="text-white font-bold">Rafael Caro</span></p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Subir comprobante</label>
                                        <div className="border-2 border-dashed border-slate-600 hover:border-amber-500/50 rounded-xl p-4 text-center cursor-pointer transition-colors"
                                            onClick={() => document.getElementById('upgrade-file')?.click()}
                                        >
                                            {file ? (
                                                <p className="text-sm text-emerald-400 font-bold">📎 {file.name}</p>
                                            ) : (
                                                <>
                                                    <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                                                    <p className="text-xs text-slate-400">Toca para subir tu comprobante</p>
                                                </>
                                            )}
                                        </div>
                                        <input id="upgrade-file" type="file" accept="image/*,.pdf" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
                                    </div>

                                    <div className="flex gap-3">
                                        <Button variant="outline" className="flex-1 border-slate-600 text-slate-300" onClick={() => { setStep('select'); setFile(null); }}>
                                            ← Atrás
                                        </Button>
                                        <Button disabled={!file || uploading} onClick={handleUpload}
                                            className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-bold disabled:opacity-50"
                                        >
                                            {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                            Enviar comprobante
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: Done */}
                            {step === 'done' && (
                                <div className="text-center py-6 space-y-4">
                                    <div className="text-5xl">🎉</div>
                                    <h3 className="text-xl font-bold text-white">¡Solicitud recibida!</h3>
                                    <p className="text-sm text-slate-300">En menos de 2 horas tu plan será actualizado a <span className="font-bold text-amber-400">{selectedPlan?.planLabel}</span>.</p>
                                    <p className="text-xs text-slate-400">Te notificaremos cuando esté listo.</p>
                                    <Button onClick={() => { setShowModal(false); onUpgradeComplete(); }}
                                        className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-8"
                                    >
                                        Entendido
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

interface Participant {
    user: {
        id: string;
        nickname: string;
        avatarUrl?: string;
    };
    isBlocked?: boolean;
    predictionPoints?: number;
    bracketPoints?: number;
    bonusPoints?: number;
    totalPoints?: number;
}

interface League {
    id: string;
    name: string;
    code: string;
    isAdmin: boolean;
    maxParticipants: number;
    participantCount?: number;
    status?: 'ACTIVE' | 'LOCKED' | 'FINISHED';
    isPaid?: boolean;
    brandingLogoUrl?: string;
    prizeImageUrl?: string;
    prizeType?: string;
    prizeAmount?: number;
    prizeDetails?: string;
    welcomeMessage?: string;
    isEnterprise?: boolean;
    isEnterpriseActive?: boolean;
    companyName?: string;
    brandColorPrimary?: string;
    brandColorSecondary?: string;
    type?: string;
    packageType?: string;
    socialInstagram?: string;
    socialFacebook?: string;
    socialWhatsapp?: string;
    socialYoutube?: string;
    socialTiktok?: string;
    socialLinkedin?: string;
    socialWebsite?: string;
    showAds?: boolean;
    adImages?: string[];
    enableDepartmentWar?: boolean;
    tournamentId?: string;
}

export function LeagueSettingsPanel({ leagueId, defaultTab = "editar", hideTabs = false }: { leagueId: string, defaultTab?: string, hideTabs?: boolean }) {
    const { user } = useAppStore();
    const { toast } = useToast();
    const router = useRouter();
    const { tournamentId } = useTournament();


    const [currentLeague, setCurrentLeague] = useState<League | null>(null);
    const [editedName, setEditedName] = useState('');
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingParticipants, setLoadingParticipants] = useState(false);
    const [copied, setCopied] = useState(false);
    const [selectedUser, setSelectedUser] = useState<{ id: string, name: string, avatar?: string } | null>(null);

    useEffect(() => {
        if (leagueId && leagueId !== 'global') {
            loadLeagueData();
        }
    }, [leagueId]);

    const loadLeagueData = async () => {
        try {
            setLoadingParticipants(true);

            // Cargar datos de la liga directamente
            const { data: fetchedLeague } = await api.get(`/leagues/${leagueId}`);

            if (!fetchedLeague) {
                toast({ title: 'Error', description: 'No se pudo cargar la información de la liga', variant: 'destructive', });
                return;
            }

            setCurrentLeague(fetchedLeague);
            setEditedName(fetchedLeague.name);

            const { data: ranking } = await api.get(`/leagues/${leagueId}/ranking`);

            // Map ranking data
            const participantsData = ranking.map((u: any) => ({
                user: {
                    id: u.id,
                    nickname: u.nickname,
                    avatarUrl: u.avatarUrl,
                },
                isBlocked: u.isBlocked,
                predictionPoints: Number(u.predictionPoints || 0),
                bracketPoints: Number(u.bracketPoints || 0),
                bonusPoints: Number(u.bonusPoints || 0),
                totalPoints: Number(u.totalPoints || 0)
            }));
            setParticipants(participantsData);
        } catch (error) {
            console.error('Error cargando datos de la liga:', error);
            toast({ title: 'Error', description: 'No se pudo cargar la información', variant: 'destructive', });
        } finally {
            setLoadingParticipants(false);
        }
    };

    const handleUpdateName = async () => {
        if (!editedName.trim() || !currentLeague) return;
        setLoading(true);
        try {
            await api.patch(`/leagues/${currentLeague.id}`, { name: editedName });
            toast({ title: 'Liga actualizada', description: `Nombre cambiado a "${editedName}"` });
            setCurrentLeague({ ...currentLeague, name: editedName });
        } catch (error: any) {
            toast({ title: 'Error', description: 'No se pudo actualizar', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteLeague = async () => {
        if (!currentLeague) return;
        if (!confirm('¿ESTÁS SEGURO? Esta acción es irreversible y eliminará TODOS los datos de la liga.')) return;
        setLoading(true);
        try {
            const { data } = await api.delete(`/leagues/${currentLeague.id}`);
            if (data.success) {
                toast({
                    title: 'Liga eliminada',
                    description: data.message || 'La liga ha sido eliminada correctamente.'
                });
                const targetPath = currentLeague.isEnterprise ? '/empresa/mis-pollas' : '/social/mis-pollas';
                router.push(targetPath);
            } else {
                toast({
                    title: 'Error',
                    description: data.error || 'No se pudo eliminar la liga',
                    variant: 'destructive'
                });
            }
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Error al eliminar la liga.';
            toast({
                title: 'Error',
                description: msg,
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleTransferOwner = async (newOwnerId: string) => {
        if (!currentLeague || !confirm(`¿Transferir propiedad? Perderás acceso admin.`)) return;
        setLoading(true);
        try {
            await api.patch(`/leagues/${currentLeague.id}/transfer-owner`, { newAdminId: newOwnerId });
            toast({ title: 'Propiedad transferida', description: 'Has cedido la administración.' });
            router.push(`/leagues/${currentLeague.id}`);
        } catch (error) {
            toast({ title: 'Error', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleBlockParticipant = async (userId: string, nickname: string, isBlocked: boolean) => {
        if (!currentLeague) return;
        const action = isBlocked ? 'desbloquear' : 'bloquear';
        if (!confirm(`¿${action.toUpperCase()} a ${nickname}?`)) return;
        setLoading(true);
        try {
            const { data } = await api.patch(`/leagues/${currentLeague.id}/participants/${userId}/toggle-block`);
            setParticipants(participants.map(p => p.user.id === userId ? { ...p, isBlocked: data.isBlocked } : p));
            toast({ title: 'Actualizado', description: `${nickname} ha sido ${action}do.` });
        } catch (error) {
            toast({ title: 'Error', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveParticipant = async (userId: string, nickname: string) => {
        if (!currentLeague || !confirm(`¿Expulsar a ${nickname}?`)) return;
        setLoading(true);
        try {
            await api.delete(`/leagues/${currentLeague.id}/participants/${userId}`);
            setParticipants(participants.filter(p => p.user.id !== userId));
            toast({ title: 'Expulsado', description: `${nickname} fuera de la liga.` });
        } catch (error) {
            toast({ title: 'Error', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleCopyCode = () => {
        if (!currentLeague) return;
        navigator.clipboard.writeText(currentLeague.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // STYLES
    const STYLES = {
        card: { backgroundColor: 'var(--brand-secondary, #1E293B)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }
    };

    if (!leagueId || leagueId === 'global') return null;

    return (
        <div className="flex flex-col min-h-screen text-[var(--brand-text,white)]" style={{ backgroundColor: 'var(--brand-bg, #0F172A)' }}>

            {loadingParticipants && !currentLeague ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500" /></div>
            ) : currentLeague ? (
                <div className="flex-1 overflow-visible flex flex-col w-full max-w-4xl mx-auto p-4 sm:p-6 mb-20">
                    <Tabs defaultValue={defaultTab} className="flex-1">
                        {!hideTabs && (
                            <div className="sticky top-0 z-10 pb-4" style={{ backgroundColor: 'var(--brand-bg, #0F172A)' }}>
                                <TabsList className="w-full p-1 rounded-full border" style={{ backgroundColor: 'var(--brand-secondary, #1E293B)', borderColor: 'rgba(255,255,255,0.05)' }}>
                                    <TabsTrigger value="editar" className="flex-1 rounded-full text-[10px] sm:text-xs font-bold uppercase py-2 data-[state=active]:bg-[var(--brand-primary,#00E676)] data-[state=active]:text-[var(--brand-bg,#0F1729)]">
                                        <Edit className="w-3 h-3 mr-1 inline-block" /> Editar
                                    </TabsTrigger>
                                    <TabsTrigger value="bonus" className="flex-1 rounded-full text-[10px] sm:text-xs font-bold uppercase py-2 data-[state=active]:bg-[var(--brand-primary,#00E676)] data-[state=active]:text-[var(--brand-bg,#0F1729)]">
                                        <Trophy className="w-3 h-3 mr-1 inline-block" /> Bonus
                                    </TabsTrigger>
                                    <TabsTrigger value="usuarios" className="flex-1 rounded-full text-[10px] sm:text-xs font-bold uppercase py-2 data-[state=active]:bg-[var(--brand-primary,#00E676)] data-[state=active]:text-[var(--brand-bg,#0F1729)]">
                                        <Users className="w-3 h-3 mr-1 inline-block" /> Usuarios
                                    </TabsTrigger>
                                    <TabsTrigger value="plan" className="flex-1 rounded-full text-[10px] sm:text-xs font-bold uppercase py-2 data-[state=active]:bg-[var(--brand-primary,#00E676)] data-[state=active]:text-[var(--brand-bg,#0F1729)]">
                                        <Gem className="w-3 h-3 mr-1 inline-block" /> Plan
                                    </TabsTrigger>
                                    <TabsTrigger value="analytics" className="flex-1 rounded-full text-[10px] sm:text-xs font-bold uppercase py-2 data-[state=active]:bg-[var(--brand-primary,#00E676)] data-[state=active]:text-[var(--brand-bg,#0F1729)]">
                                        <BarChart3 className="w-3 h-3 mr-1 inline-block" /> Data
                                    </TabsTrigger>
                                </TabsList>
                            </div>
                        )}

                        <div className="flex-1">
                            {/* --- EDITAR --- */}
                            <TabsContent value="editar" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                                {/* 1. Nombre de la Polla */}
                                <div style={STYLES.card}>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">Nombre de la Polla</h3>
                                    <div className="flex gap-2">
                                        <input
                                            value={editedName}
                                            onChange={e => setEditedName(e.target.value)}
                                            className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white font-bold"
                                        />
                                        <Button onClick={handleUpdateName} disabled={loading || editedName === currentLeague.name} className="text-[var(--brand-bg,#0F1729)] hover:opacity-90 transition-opacity" style={{ backgroundColor: 'var(--brand-primary, #00E676)' }}>
                                            <Save className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* 2. Personalización (SOLO LIGAS SOCIALES - Enterprise usa Studio) */}
                                {!currentLeague.isEnterprise && (
                                    <div style={STYLES.card}>
                                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">Personalización de Polla</h3>
                                        <LeagueBrandingForm
                                            leagueId={currentLeague.id}
                                            showEnterpriseFields={!!currentLeague.isEnterpriseActive}
                                            packageType={currentLeague.packageType}
                                            initialData={{
                                                brandingLogoUrl: currentLeague.brandingLogoUrl,
                                                prizeImageUrl: currentLeague.prizeImageUrl,
                                                prizeType: currentLeague.prizeType,
                                                prizeAmount: currentLeague.prizeAmount,
                                                prizeDetails: currentLeague.prizeDetails,
                                                welcomeMessage: currentLeague.welcomeMessage,
                                                isEnterprise: currentLeague.isEnterprise,
                                                companyName: currentLeague.companyName,
                                                brandColorPrimary: currentLeague.brandColorPrimary,
                                                brandColorSecondary: currentLeague.brandColorSecondary,
                                                socialInstagram: currentLeague.socialInstagram,
                                                socialFacebook: currentLeague.socialFacebook,
                                                socialWhatsapp: currentLeague.socialWhatsapp,
                                                socialYoutube: currentLeague.socialYoutube,
                                                socialTiktok: currentLeague.socialTiktok,
                                                socialLinkedin: currentLeague.socialLinkedin,
                                                socialWebsite: currentLeague.socialWebsite,
                                            }}
                                            onSuccess={() => {
                                                toast({ title: 'Guardado', description: 'Personalización actualizada.' });
                                                loadLeagueData();
                                            }}
                                        />
                                    </div>
                                )}

                                {hideTabs && (
                                    <div className="border-t border-slate-700 pt-8 mt-8 space-y-6">
                                        <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                            <Gem className="w-4 h-4" /> Cambio de Plan
                                        </h3>
                                        <PlanUpgradeSection league={currentLeague} participantCount={participants.length} onUpgradeComplete={loadLeagueData} />
                                    </div>
                                )}

                                {/* Danger Zone */}
                                <div className="border border-red-900/50 bg-red-900/10 rounded-xl p-5 mt-12">
                                    <h3 className="text-xs font-bold text-red-500 uppercase flex items-center gap-2 mb-4">
                                        <AlertTriangle className="w-4 h-4" /> Zona de Peligro
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] text-red-300 font-bold uppercase mb-2 block">Transferir Propiedad</label>
                                            <select
                                                className="w-full bg-slate-900 border border-red-900/50 rounded-lg px-3 py-2 text-xs text-white"
                                                onChange={(e) => {
                                                    if (e.target.value) handleTransferOwner(e.target.value);
                                                }}
                                                value=""
                                            >
                                                <option value="" disabled>Seleccionar nuevo admin...</option>
                                                {participants.filter(p => p.user.id !== user?.id).map(p => (
                                                    <option key={p.user.id} value={p.user.id}>{p.user.nickname}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <Button variant="destructive" className="w-full mt-2" onClick={handleDeleteLeague} disabled={loading}>
                                            <Trash2 className="w-4 h-4 mr-2" /> Eliminar Polla Definitivamente
                                        </Button>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* --- BONUS --- */}
                            <TabsContent value="bonus" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <LeagueBonusQuestions leagueId={currentLeague.id} tournamentId={currentLeague.tournamentId} />

                                <div className="border-t border-slate-700 pt-6">
                                    <h3 className="text-sm font-bold text-white uppercase mb-4 flex items-center gap-2">
                                        <BarChart3 className="w-4 h-4 text-[var(--brand-primary,#00E676)]" /> Consolidado de Puntos
                                    </h3>
                                    <div className="overflow-hidden rounded-xl border border-white/10 bg-black/10">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs text-left">
                                                <thead className="text-slate-400 font-bold uppercase" style={{ backgroundColor: 'var(--brand-secondary, #1E293B)' }}>
                                                    <tr>
                                                        <th className="p-3">Usuario</th>
                                                        <th className="p-3 text-right">Partidos</th>
                                                        <th className="p-3 text-right">Bonus</th>
                                                        <th className="p-3 text-right text-white">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {participants.map((p) => (
                                                        <tr key={p.user.id} className="hover:bg-white/5">
                                                            <td className="p-3 font-medium text-slate-300">{p.user.nickname}</td>
                                                            <td className="p-3 text-right text-slate-400">{p.predictionPoints}</td>
                                                            <td className="p-3 text-right text-[var(--brand-primary,#00E676)] font-bold">{p.bonusPoints}</td>
                                                            <td className="p-3 text-right font-bold text-white">{p.totalPoints}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* --- USUARIOS --- */}
                            <TabsContent value="usuarios" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase">Lista de Participantes</h3>
                                    <span className="text-xs text-slate-500">{participants.length} usuarios</span>
                                </div>

                                <div className="space-y-2">
                                    {participants.map((p) => (
                                        <div key={p.user.id} className="bg-[#1E293B] border border-slate-700 rounded-xl p-3 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10 border border-slate-600">
                                                    <AvatarImage src={p.user.avatarUrl} />
                                                    <AvatarFallback>{p.user.nickname?.charAt(0) || 'U'}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-bold text-sm text-white flex items-center gap-2">
                                                        {p.user.nickname}
                                                        {p.user.id === user?.id && <span className="bg-amber-500 text-black text-[9px] px-1 rounded font-bold">TU</span>}
                                                        {p.isBlocked && <span className="text-red-500 text-[9px] border border-red-500 px-1 rounded uppercase">Bloqueado</span>}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400">ID: {p.user.id.substring(0, 8)}...</div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--brand-primary,#00E676)] hover:bg-[var(--brand-primary,#00E676)]/10"
                                                    onClick={() => setSelectedUser({ id: p.user.id, name: p.user.nickname, avatar: p.user.avatarUrl })}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>

                                                {p.user.id !== user?.id && (
                                                    <>
                                                        <Button variant="ghost" size="icon"
                                                            className={`h-8 w-8 ${p.isBlocked ? 'text-green-500' : 'text-amber-500'} hover:bg-slate-800`}
                                                            onClick={() => handleBlockParticipant(p.user.id, p.user.nickname, !!p.isBlocked)}
                                                        >
                                                            {p.isBlocked ? <Shield className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                                                        </Button>

                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-500/10"
                                                            onClick={() => handleRemoveParticipant(p.user.id, p.user.nickname)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </TabsContent>

                            {/* --- PLAN --- */}
                            <TabsContent value="plan" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <PlanUpgradeSection league={currentLeague} participantCount={participants.length} onUpgradeComplete={loadLeagueData} />
                            </TabsContent>

                            {/* --- ANALYTICS --- */}
                            <TabsContent value="analytics" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {!currentLeague.isEnterpriseActive ? (
                                    <EnterpriseLock featureName="Analítica Avanzada" />
                                ) : (
                                    <LeagueAnalyticsPanel leagueId={currentLeague.id} />
                                )}
                            </TabsContent>
                        </div>
                    </Tabs>

                    {/* MODAL DETALLE USUARIO */}
                    {selectedUser && (
                        <UserPredictionsDialog
                            open={!!selectedUser}
                            onOpenChange={(val) => !val && setSelectedUser(null)}
                            leagueId={currentLeague?.id || ''}
                            userId={selectedUser.id}
                            userName={selectedUser.name}
                            userAvatar={selectedUser.avatar}
                        />
                    )}
                </div>
            ) : null}
        </div>
    );
}