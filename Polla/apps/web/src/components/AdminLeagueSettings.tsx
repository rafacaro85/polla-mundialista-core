"use client";

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Settings, Trash2, Loader2, Copy, Share2, Users,
    AlertTriangle, RefreshCw, Save, Gem, Check, Shield, Lock,
    Edit, Trophy, Eye, BarChart3, Gift, Menu, X, Palette, Crown
} from 'lucide-react';
import api from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/hooks/use-toast';
import { Progress } from "@/components/ui/progress";
import LeagueBrandingForm from '@/components/LeagueBrandingForm';
import { LeagueBonusQuestions } from '@/components/LeagueBonusQuestions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPredictionsDialog } from '@/components/UserPredictionsDialog';
import LeagueAnalyticsPanel from '@/components/admin/LeagueAnalyticsPanel';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { EnterpriseLock } from '@/components/admin/EnterpriseLock';
import { useTournament } from '@/hooks/useTournament';


interface Participant {
    user: {
        id: string;
        nickname: string;
        avatarUrl?: string;
    };
    isBlocked?: boolean;
    // Data for consolidation table
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
    prizeDetails?: string;
    welcomeMessage?: string;
    isEnterprise?: boolean;
    companyName?: string;
    brandColorPrimary?: string;
    brandColorSecondary?: string;
    type?: string;
    isEnterpriseActive?: boolean;
}

export function LeagueSettings({ league, onUpdate, trigger, mode = 'modal' }: { league?: League; onUpdate?: () => void; trigger?: React.ReactNode; mode?: 'modal' | 'page' }) {
    const { user } = useAppStore();
    const { toast } = useToast();
    const { tournamentId } = useTournament();


    const [open, setOpen] = useState(false);
    const [currentLeague, setCurrentLeague] = useState<League | null>(null);
    const brandColor = currentLeague?.brandColorPrimary || '#10B981';
    const [activeTab, setActiveTab] = useState('branding');
    const [editedName, setEditedName] = useState('');
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingParticipants, setLoadingParticipants] = useState(false);
    const [copied, setCopied] = useState(false);

    // State for viewing user details
    const [selectedUser, setSelectedUser] = useState<{ id: string, name: string, avatar?: string } | null>(null);

    useEffect(() => {
        if ((open || mode === 'page') && league && league.id !== 'global') {
            loadLeagueData();
        }
    }, [open, league?.id, mode]);

    if (!league || league.id === 'global') return null;

    const loadLeagueData = async () => {
        try {
            setLoadingParticipants(true);

            // Cargar datos de la liga desde "my leagues"
            const { data: myLeagues } = await api.get('/leagues/my');
            const fetchedLeague = myLeagues.find((l: any) => l.id === league.id);

            if (!fetchedLeague) {
                toast({ title: 'Error', description: 'No se pudo cargar la información de la liga', variant: 'destructive', });
                return;
            }

            setCurrentLeague(fetchedLeague);
            setEditedName(fetchedLeague.name);

            const { data: ranking } = await api.get(`/leagues/${league.id}/ranking`);

            // Map ranking data for participants table and bonus consolidation
            const participantsData = ranking.map((u: any) => ({
                user: {
                    id: u.id,
                    nickname: u.nickname,
                    avatarUrl: u.avatarUrl,
                },
                isBlocked: u.isBlocked,
                predictionPoints: Number(u.predictionPoints || 0),
                bracketPoints: Number(u.bracketPoints || 0),
                bonusPoints: Number(u.bonusPoints || 0), // Assuming API returns 'bonusPoints' now
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
            if (onUpdate) onUpdate();
        } catch (error: any) {
            toast({ title: 'Error', description: 'No se pudo actualizar', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteLeague = async () => {
        if (!currentLeague) return;
        if (!confirm('¿ESTÁS SEGURO? Esta acción es irreversible.')) return;
        setLoading(true);
        try {
            await api.delete(`/leagues/${currentLeague.id}`);
            toast({ title: 'Liga eliminada', description: 'La liga ha sido eliminada.' });
            setOpen(false);
            if (onUpdate) onUpdate();
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Error al eliminar la liga';
            toast({ title: 'Error', description: msg, variant: 'destructive' });
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
            if (onUpdate) onUpdate();
        } catch (error) {
            toast({ title: 'Error', variant: 'destructive' });
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
            setOpen(false);
            onUpdate?.();
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
        container: { padding: '16px', backgroundColor: '#0F172A', minHeight: '100%', color: 'white' },
        input: { backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '8px', padding: '10px', color: 'white', width: '100%' },
        card: { backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '12px', padding: '16px', marginBottom: '16px' }
    };

    // Helper NAV Item
    const NavItem = ({ value, icon: Icon, label }: any) => {
        const isActive = activeTab === value;
        return (
            <button
                onClick={() => setActiveTab(value)}
                className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-xs font-bold transition-all rounded-r-full mr-4 mb-1 uppercase tracking-wider",
                    isActive
                        ? "bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500"
                        : "text-slate-400 hover:text-white hover:bg-slate-800 border-l-2 border-transparent"
                )}
            >
                <Icon size={16} />
                <span>{label}</span>
            </button>
        );
    };

    const NavigationList = () => (
        <nav className="flex-1 py-6 space-y-1">
            {currentLeague?.isAdmin && (
                <>
                    <NavItem value="branding" icon={Edit} label="EDITAR" />
                    <NavItem value="plan" icon={Gem} label="PLAN" />
                    <NavItem value="analytics" icon={BarChart3} label="DATA" />
                </>
            )}
            <NavItem value="bonus" icon={Trophy} label="BONUS" />
            <NavItem value="usuarios" icon={Users} label="USUARIOS" />
        </nav>
    );

    const MobileNavItem = ({ value, icon: Icon, label }: any) => {
        const isActive = activeTab === value;
        return (
            <button
                onClick={() => setActiveTab(value)}
                className={cn(
                    "flex flex-col items-center justify-center min-w-[80px] h-full px-2 text-[10px] font-bold transition-all border-b-2 shrink-0 italic tracking-tighter",
                    isActive
                        ? "text-emerald-400 border-emerald-500 bg-slate-800/50"
                        : "text-slate-400 hover:text-white border-transparent"
                )}
            >
                <Icon size={18} className="mb-1" />
                <span>{label}</span>
            </button>
        );
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ? trigger : (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                        <Settings className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent showCloseButton={false} className="max-w-none w-screen h-screen p-0 bg-[#0F172A] border-none flex overflow-hidden sm:rounded-none z-[60]">
                <DialogTitle className="sr-only">Configuración</DialogTitle>
                <DialogDescription className="sr-only">Panel de administración</DialogDescription>
                {/* 1. SIDEBAR (Desktop) */}
                <aside className="hidden md:flex flex-col w-64 bg-[#1E293B] border-r border-slate-800 shrink-0">
                    <div className="p-6 border-b border-slate-800 bg-[#0F172A]/50">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded flex items-center justify-center font-russo text-[#0F172A]" style={{ backgroundColor: brandColor }}>P</div>
                            <h2 className="text-sm font-russo text-white uppercase tracking-wider">
                                POLA 2026
                            </h2>
                        </div>
                        <p className="text-[10px] font-bold uppercase mt-1 truncate pl-1" style={{ color: brandColor }}>
                            {currentLeague?.name}
                        </p>
                    </div>
                    <NavigationList />
                    {/* User Info Footer */}
                    <div className="p-4 border-t border-slate-800 bg-[#0F172A]/30">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 border border-white/10">
                                <AvatarImage src={(user as any)?.avatar || (user as any)?.photoURL || ''} />
                                <AvatarFallback>{(user as any)?.name?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            <div className="overflow-hidden">
                                <p className="text-xs font-bold text-white truncate">{(user as any)?.name || (user as any)?.displayName}</p>
                                <p className="text-[10px] text-slate-500 truncate">Admin</p>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* 2. AREA PRINCIPAL */}
                <div className="flex-1 flex flex-col h-full bg-[#0F172A] relative min-w-0">

                    {/* MOBILE HEADER */}
                    <header className="md:hidden h-14 border-b border-slate-800 bg-[#1E293B] flex items-center justify-between px-4 shrink-0 z-50">
                        <div className="flex items-center gap-2 overflow-hidden flex-1">
                            <div className="w-6 h-6 rounded flex items-center justify-center font-russo text-[#0F172A] text-xs shrink-0" style={{ backgroundColor: brandColor }}>P</div>
                            <span className="font-russo uppercase text-sm truncate text-white" style={{ color: brandColor }}>{currentLeague?.name}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-slate-700 shrink-0" onClick={() => setOpen(false)}>
                            <X className="w-6 h-6" />
                        </Button>
                    </header>

                    {/* MOBILE NAVIGATION BAR */}
                    {currentLeague && (
                        <div className="md:hidden h-14 bg-[#1E293B] border-b border-slate-800 flex overflow-x-auto items-center no-scrollbar sticky top-0 z-40">
                            {currentLeague?.isAdmin && (
                                <>
                                    <MobileNavItem value="branding" icon={Palette} label="Marca" />
                                    <MobileNavItem value="plan" icon={Gem} label="Plan" />
                                    <MobileNavItem value="analytics" icon={BarChart3} label="Data" />
                                </>
                            )}
                            <MobileNavItem value="bonus" icon={Trophy} label="Bonus" />
                            <MobileNavItem value="usuarios" icon={Users} label="Usuarios" />
                        </div>
                    )}

                    {/* LOADING STATE - Ajustado para ocupar full height */}
                    {loadingParticipants && !currentLeague ? (
                        <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500 w-8 h-8" /></div>
                    ) : currentLeague ? (
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                            {/* Scrollable Content Container */}
                            <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:px-12 bg-[#0F172A]">
                                <div className="max-w-4xl mx-auto space-y-6 pb-20">
                                    <div className="flex items-center justify-between mb-2 md:mb-6">
                                        <h1 className="text-2xl font-russo uppercase text-white hidden md:block">{
                                            activeTab === 'branding' ? 'Personalización' :
                                                activeTab === 'plan' ? 'Mi Plan' :
                                                    activeTab === 'analytics' ? 'Analítica' :
                                                        activeTab === 'bonus' ? 'Desafíos Bonus' :
                                                            'Participantes'
                                        }</h1>
                                        {/* Mobile Close is in Header */}
                                        <Button variant="outline" className="hidden md:flex gap-2 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800" onClick={() => setOpen(false)}>
                                            <X size={16} /> Cerrar Panel
                                        </Button>
                                    </div>


                                    {/* --- PESTAÑA BRANDING --- */}
                                    <TabsContent value="branding" className="mt-0 space-y-6">

                                        {/* 1. Nombre de la Polla (Movido desde Configuración) */}
                                        <div style={STYLES.card}>
                                            <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">Nombre de la Polla</h3>
                                            <div className="flex gap-2">
                                                <input
                                                    value={editedName}
                                                    onChange={e => setEditedName(e.target.value)}
                                                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white font-bold"
                                                />
                                                <Button onClick={handleUpdateName} disabled={loading || editedName === currentLeague.name} className="text-slate-900 hover:opacity-90 transition-opacity" style={{ backgroundColor: brandColor }}>
                                                    <Save className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div style={STYLES.card}>
                                            <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">Personalización de Polla</h3>
                                            <LeagueBrandingForm
                                                leagueId={currentLeague.id}
                                                showEnterpriseFields={!!currentLeague.isEnterpriseActive}
                                                initialData={{
                                                    brandingLogoUrl: currentLeague.brandingLogoUrl,
                                                    prizeImageUrl: currentLeague.prizeImageUrl,
                                                    prizeDetails: currentLeague.prizeDetails,
                                                    welcomeMessage: currentLeague.welcomeMessage,
                                                    isEnterprise: currentLeague.isEnterprise,
                                                    companyName: currentLeague.companyName,
                                                    brandColorPrimary: currentLeague.brandColorPrimary,
                                                    brandColorSecondary: currentLeague.brandColorSecondary
                                                }}
                                                onSuccess={() => {
                                                    toast({ title: 'Guardado', description: 'Personalización actualizada.' });
                                                    loadLeagueData();
                                                }}
                                            />
                                        </div>

                                        {/* ZONA DE PELIGRO (Movida a EDITAR) */}
                                        <div className="border border-red-900/50 bg-red-900/10 rounded-xl p-5 mt-8">
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

                                    {/* --- PESTAÑA PLAN --- */}
                                    <TabsContent value="plan" className="mt-0 space-y-6">
                                        <div style={STYLES.card}>
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-xs font-bold text-slate-400 uppercase">Estado del Plan</h3>
                                                <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-bold px-2 py-1 rounded border border-emerald-500/20">
                                                    {participants.length} / {currentLeague.maxParticipants} Cupos
                                                </span>
                                            </div>
                                            <Progress value={(participants.length / currentLeague.maxParticipants) * 100} className="h-2 bg-slate-700 mb-4" />

                                            <div className="bg-slate-900 rounded-lg p-4 border border-dashed border-slate-700 text-center">
                                                <p className="text-xs text-slate-400 mb-1">CÓDIGO DE INVITACIÓN</p>
                                                <p className="text-2xl font-mono text-emerald-400 font-bold tracking-widest my-2">{currentLeague.code}</p>
                                                <div className="flex gap-2 justify-center mt-3">
                                                    <Button size="sm" variant="outline" onClick={handleCopyCode} className="border-slate-600 hover:bg-slate-800 text-white">
                                                        {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />} Copiar
                                                    </Button>
                                                    <Button size="sm" className="bg-[#25D366] hover:bg-[#128C7E] text-white border-none"
                                                        onClick={() => {
                                                            const appUrl = window.location.origin;
                                                            const isUCL = tournamentId === 'UCL2526';
                                                            const text = `¡Únete a mi polla ${isUCL ? 'Champions' : 'Mundialista'} "${currentLeague.name}"! 🏆\n` +
                                                                `Link: ${appUrl}/invite/${currentLeague.code}\n` +
                                                                `Código: *${currentLeague.code}*`;
                                                            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                                                        }}
                                                    >
                                                        <Share2 className="w-3 h-3 mr-1" /> WhatsApp
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-br from-emerald-900/20 to-slate-900 rounded-xl p-5 border border-emerald-500/30">
                                            <h3 className="text-emerald-400 font-bold uppercase text-sm mb-2 flex items-center gap-2">
                                                <Gift className="w-4 h-4" /> ¿Necesitas más cupos?
                                            </h3>
                                            <p className="text-xs text-slate-300 mb-4">
                                                Solicita una ampliación de tu plan actual para invitar a más amigos.
                                            </p>
                                            <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                                                onClick={() => {
                                                    const text = `Hola, quiero aumentar el cupo de mi liga "${currentLeague.name}" (Código: ${currentLeague.code}).`;
                                                    window.open(`https://wa.me/573105973421?text=${encodeURIComponent(text)}`, '_blank');
                                                }}
                                            >
                                                Solicitar Ampliación de Cupo
                                            </Button>
                                        </div>


                                        {/* PROMO BANNER (Solo si es Admin, Empresa y NO Activa) */}
                                        {currentLeague.isAdmin && currentLeague.type === 'COMPANY' && !currentLeague.isEnterpriseActive && (
                                            <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-amber-500/30 rounded-xl p-4 mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                                                <div>
                                                    <p className="text-xs font-bold text-amber-500 uppercase mb-1 flex items-center gap-2">
                                                        <Crown size={14} /> ¿Eres una empresa?
                                                    </p>
                                                    <p className="text-[10px] text-slate-400">
                                                        Personaliza tu marca, logos y obtén analítica avanzada.
                                                    </p>
                                                </div>
                                                <Button size="sm" className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs"
                                                    onClick={() => {
                                                        const text = `Hola, quiero pasar mi liga "${currentLeague.name}" a PRO (Enterprise).`;
                                                        window.open(`https://wa.me/573105973421?text=${encodeURIComponent(text)}`, '_blank');
                                                    }}
                                                >
                                                    Pásate a PRO
                                                </Button>
                                            </div>
                                        )}

                                    </TabsContent>

                                    {/* --- PESTAÑA BONUS --- */}
                                    <TabsContent value="bonus" className="mt-0 space-y-8">
                                        {currentLeague?.isAdmin && (
                                            <div className="space-y-4">
                                                <LeagueBonusQuestions leagueId={currentLeague.id} />
                                            </div>
                                        )}

                                        <div className="border-t border-slate-700 pt-6">
                                            <h3 className="text-sm font-bold text-white uppercase mb-4 flex items-center gap-2">
                                                <BarChart3 className="w-4 h-4 text-emerald-500" /> Consolidado de Puntos
                                            </h3>
                                            <div className="overflow-hidden rounded-lg border border-slate-700">
                                                <table className="w-full text-xs text-left">
                                                    <thead className="bg-[#1E293B] text-slate-400 font-bold uppercase">
                                                        <tr>
                                                            <th className="p-3">Usuario</th>
                                                            <th className="p-3 text-right">Partidos</th>
                                                            <th className="p-3 text-right">Bonus</th>
                                                            <th className="p-3 text-right text-white">Total</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-700 bg-slate-900/50">
                                                        {participants.map((p) => (
                                                            <tr key={p.user.id} className="hover:bg-slate-800/50">
                                                                <td className="p-3 font-medium text-slate-300">{p.user.nickname}</td>
                                                                <td className="p-3 text-right text-slate-400">{p.predictionPoints}</td>
                                                                <td className="p-3 text-right text-emerald-400 font-bold">{p.bonusPoints}</td>
                                                                <td className="p-3 text-right font-bold text-white">{p.totalPoints}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* --- PESTAÑA USUARIOS --- */}
                                    <TabsContent value="usuarios" className="mt-0 space-y-4">
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
                                                            <AvatarFallback>{p.user.nickname.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="font-bold text-sm text-white flex items-center gap-2">
                                                                {p.user.nickname}
                                                                {p.user.id === user?.id && <span className="bg-amber-500 text-black text-[9px] px-1 rounded font-bold">TU</span>}
                                                                {p.isBlocked && <span className="text-red-500 text-[9px] border border-red-500 px-1 rounded uppercase">Bloqueado</span>}
                                                            </div>
                                                            <div className="text-[10px] text-slate-400">ID: {p.user.id.substring(0, 6)}...</div>
                                                        </div>
                                                    </div>

                                                    {/* Acciones solo si soy admin y no soy yo mismo */}
                                                    {currentLeague?.isAdmin && p.user.id !== user?.id && (
                                                        <div className="flex items-center gap-1">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                                                                title="Ver Detalle"
                                                                onClick={() => setSelectedUser({ id: p.user.id, name: p.user.nickname, avatar: p.user.avatarUrl })}
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>

                                                            <Button variant="ghost" size="icon"
                                                                className={`h-8 w-8 ${p.isBlocked ? 'text-green-500' : 'text-amber-500'} hover:bg-slate-800`}
                                                                title={p.isBlocked ? "Desbloquear" : "Bloquear"}
                                                                onClick={() => handleBlockParticipant(p.user.id, p.user.nickname, !!p.isBlocked)}
                                                            >
                                                                {p.isBlocked ? <Shield className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                                                            </Button>

                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-500/10 hover:text-red-400"
                                                                title="Expulsar"
                                                                onClick={() => handleRemoveParticipant(p.user.id, p.user.nickname)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="analytics" className="mt-0 space-y-4">
                                        {!currentLeague.isEnterpriseActive ? (
                                            <EnterpriseLock featureName="Analítica Avanzada" />
                                        ) : (
                                            <LeagueAnalyticsPanel leagueId={currentLeague.id} />
                                        )}
                                    </TabsContent>

                                </div>
                            </div>
                        </Tabs>
                    ) : null}
                </div>
            </DialogContent>

            {/* MODAL DETALLE USUARIO */}
            {
                selectedUser && (
                    <UserPredictionsDialog
                        open={!!selectedUser}
                        onOpenChange={(val) => !val && setSelectedUser(null)}
                        leagueId={currentLeague?.id || ''}
                        userId={selectedUser.id}
                        userName={selectedUser.name}
                        userAvatar={selectedUser.avatar}
                    />
                )
            }
        </Dialog >
    );
}