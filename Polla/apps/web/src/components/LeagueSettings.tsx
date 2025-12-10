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
    Edit, Trophy, Eye, BarChart3, Gift
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
}

export function LeagueSettings({ league, onUpdate, trigger, mode = 'modal' }: { league?: League; onUpdate?: () => void; trigger?: React.ReactNode; mode?: 'modal' | 'page' }) {
    const { user } = useAppStore();
    const { toast } = useToast();

    const [open, setOpen] = useState(false);
    const [currentLeague, setCurrentLeague] = useState<League | null>(null);
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

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ? trigger : (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                        <Settings className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="!bg-[#0F172A] bg-[#0F172A] border-slate-700 text-white sm:max-w-[700px] max-h-[95vh] overflow-y-auto z-[50] p-0 flex flex-col">
                <DialogTitle className="sr-only">Gestión de Polla</DialogTitle>
                <DialogDescription className="sr-only">Panel de administración</DialogDescription>

                {/* HEADLINE */}
                <div className="p-6 pb-2 bg-[#1E293B] border-b border-slate-700">
                    <h2 className="text-xl font-russo uppercase text-white flex items-center gap-2">
                        <Settings className="text-emerald-500" /> Gestión de Polla
                    </h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1 ml-8">{currentLeague?.name}</p>
                </div>

                {loadingParticipants && !currentLeague ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500" /></div>
                ) : currentLeague ? (
                    <div className="flex-1 overflow-hidden flex flex-col">
                        <Tabs defaultValue={currentLeague?.isAdmin ? 'editar' : 'usuarios'} className="flex-1 flex flex-col">

                            <div className="px-6 pt-4 bg-[#1E293B]">
                                <TabsList className="flex bg-[#0F172A] p-1 rounded-full border border-slate-700 w-full mb-2 shadow-inner">
                                    {currentLeague?.isAdmin && (
                                        <>
                                            <TabsTrigger value="editar"
                                                className="flex-1 rounded-full text-[10px] font-bold uppercase py-2 data-[state=active]:bg-[#00E676] data-[state=active]:text-[#0F172A] data-[state=active]:shadow-lg transition-all duration-300 text-slate-400 hover:text-white"
                                            >
                                                <Edit className="w-3 h-3 mr-1 inline-block" /> Editar
                                            </TabsTrigger>
                                            <TabsTrigger value="plan"
                                                className="flex-1 rounded-full text-[10px] font-bold uppercase py-2 data-[state=active]:bg-[#00E676] data-[state=active]:text-[#0F172A] data-[state=active]:shadow-lg transition-all duration-300 text-slate-400 hover:text-white"
                                            >
                                                <Gem className="w-3 h-3 mr-1 inline-block" /> Plan
                                            </TabsTrigger>
                                            <TabsTrigger value="analytics"
                                                className="flex-1 rounded-full text-[10px] font-bold uppercase py-2 data-[state=active]:bg-[#00E676] data-[state=active]:text-[#0F172A] data-[state=active]:shadow-lg transition-all duration-300 text-slate-400 hover:text-white"
                                            >
                                                <BarChart3 className="w-3 h-3 mr-1 inline-block" /> Reportes
                                            </TabsTrigger>
                                        </>
                                    )}
                                    <TabsTrigger value="bonus"
                                        className="flex-1 rounded-full text-[10px] font-bold uppercase py-2 data-[state=active]:bg-[#00E676] data-[state=active]:text-[#0F172A] data-[state=active]:shadow-lg transition-all duration-300 text-slate-400 hover:text-white"
                                    >
                                        <Trophy className="w-3 h-3 mr-1 inline-block" /> Bonus
                                    </TabsTrigger>
                                    <TabsTrigger value="usuarios"
                                        className="flex-1 rounded-full text-[10px] font-bold uppercase py-2 data-[state=active]:bg-[#00E676] data-[state=active]:text-[#0F172A] data-[state=active]:shadow-lg transition-all duration-300 text-slate-400 hover:text-white"
                                    >
                                        <Users className="w-3 h-3 mr-1 inline-block" /> Usuarios
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 bg-[#0F172A]">
                                {/* --- PESTAÑA EDITAR --- */}
                                <TabsContent value="editar" className="mt-0 space-y-6">
                                    {/* 1. Nombre */}
                                    <div style={STYLES.card}>
                                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">Nombre de la Polla</h3>
                                        <div className="flex gap-2">
                                            <input
                                                value={editedName}
                                                onChange={e => setEditedName(e.target.value)}
                                                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white font-bold"
                                            />
                                            <Button onClick={handleUpdateName} disabled={loading || editedName === currentLeague.name} className="bg-emerald-500 text-slate-900 hover:bg-emerald-400">
                                                <Save className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* 2. Branding (Imágenes y Textos) */}
                                    <LeagueBrandingForm
                                        leagueId={currentLeague.id}
                                        initialData={{
                                            brandingLogoUrl: currentLeague.brandingLogoUrl,
                                            prizeImageUrl: currentLeague.prizeImageUrl,
                                            prizeDetails: currentLeague.prizeDetails,
                                            welcomeMessage: currentLeague.welcomeMessage,
                                        }}
                                        onSuccess={() => {
                                            toast({ title: 'Guardado', description: 'Personalización actualizada.' });
                                            loadLeagueData(); // Reload to see changes if needed
                                        }}
                                    />

                                    {/* 3. Zona de Peligro */}
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
                                                        const text = `¡Únete a mi polla "${currentLeague.name}"! 🏆\nCódigo: *${currentLeague.code}*`;
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
                                    {currentLeague.isPaid && (
                                        <Button variant="outline" className="w-full border-slate-700 text-slate-400 hover:text-white"
                                            onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${currentLeague.id}/voucher`, '_blank')}
                                        >
                                            <Copy className="w-3 h-3 mr-2" /> Descargar Comprobante de Pago
                                        </Button>
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
                            </div>
                            <TabsContent value="analytics" className="mt-0">
                                <LeagueAnalyticsPanel leagueId={currentLeague.id} />
                            </TabsContent>
                        </Tabs>
                    </div>
                ) : null}
            </DialogContent>

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
        </Dialog>
    );
}