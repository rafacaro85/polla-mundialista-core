"use client";

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Settings, Trash2, Loader2, Copy, Share2, Users, AlertTriangle, RefreshCw, Save, Gem, Check, RefreshCcw, Shield, Lock } from 'lucide-react';
import api from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/hooks/use-toast';
import { Progress } from "@/components/ui/progress";
import LeagueBrandingForm from '@/components/LeagueBrandingForm';

interface Participant {
    user: {
        id: string;
        nickname: string;
        avatarUrl?: string;
    };
    isBlocked?: boolean;
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
}

export function LeagueSettings({ league, onUpdate, trigger }: { league?: League; onUpdate?: () => void; trigger?: React.ReactNode }) {
    const { user } = useAppStore();
    const { toast } = useToast();

    const [open, setOpen] = useState(false);
    const [currentLeague, setCurrentLeague] = useState<League | null>(null);
    const [editedName, setEditedName] = useState('');
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingParticipants, setLoadingParticipants] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (open && league && league.id !== 'global') {
            loadLeagueData();
        }
    }, [open, league?.id]);

    // Renderizado condicional: solo mostrar si hay liga y no es global
    if (!league || league.id === 'global') return null;

    const loadLeagueData = async () => {
        try {
            setLoadingParticipants(true);

            // Cargar datos de la liga desde "my leagues"
            const { data: myLeagues } = await api.get('/leagues/my');
            const fetchedLeague = myLeagues.find((l: any) => l.id === league.id);

            if (!fetchedLeague) {
                toast({
                    title: 'Error',
                    description: 'No se pudo cargar la información de la liga',
                    variant: 'destructive',
                });
                return;
            }

            setCurrentLeague(fetchedLeague);
            setEditedName(fetchedLeague.name);

            const { data: ranking } = await api.get(`/leagues/${league.id}/ranking`);
            const participantsData = ranking.map((user: any) => ({
                user: {
                    id: user.id,
                    nickname: user.nickname,
                    avatarUrl: user.avatarUrl,
                },
                isBlocked: user.isBlocked,
            }));
            setParticipants(participantsData);
        } catch (error) {
            console.error('Error cargando datos de la liga:', error);
            toast({
                title: 'Error',
                description: 'No se pudo cargar la información de la liga',
                variant: 'destructive',
            });
        } finally {
            setLoadingParticipants(false);
        }
    };

    const handleUpdateName = async () => {
        if (!editedName.trim() || !currentLeague) {
            toast({
                title: 'Error',
                description: 'El nombre no puede estar vacío',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);
        try {
            await api.patch(`/leagues/${currentLeague.id}`, { name: editedName });
            toast({
                title: 'Liga actualizada',
                description: `El nombre se cambió a "${editedName}"`,
            });
            setCurrentLeague({ ...currentLeague, name: editedName });
            if (onUpdate) onUpdate();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'No se pudo actualizar la liga',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteLeague = async () => {
        if (!currentLeague) return;
        if (!confirm('¿ESTÁS SEGURO? Esta acción eliminará la liga y todos sus datos permanentemente.')) return;

        setLoading(true);
        try {
            await api.delete(`/leagues/${currentLeague.id}`);
            toast({
                title: 'Liga eliminada',
                description: 'La liga ha sido eliminada correctamente.',
            });
            setOpen(false);
            if (onUpdate) onUpdate();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: 'No se pudo eliminar la liga',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveParticipant = async (userId: string, nickname: string) => {
        if (!currentLeague) return;

        // Confirmar acción
        if (!confirm(`¿Estás seguro de expulsar a ${nickname} de la liga?`)) {
            return;
        }

        setLoading(true);
        try {
            await api.delete(`/leagues/${currentLeague.id}/participants/${userId}`);
            toast({
                title: 'Participante expulsado',
                description: `${nickname} ha sido expulsado de la liga`,
            });

            // Recargar participantes
            setParticipants(participants.filter(p => p.user.id !== userId));
            if (onUpdate) onUpdate();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'No se pudo expulsar al participante',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleBlockParticipant = async (userId: string, nickname: string, isBlocked: boolean) => {
        if (!currentLeague) return;

        const action = isBlocked ? 'desbloquear' : 'bloquear';
        if (!confirm(`¿Estás seguro de ${action} a ${nickname}?`)) return;

        setLoading(true);
        try {
            const { data } = await api.patch(`/leagues/${currentLeague.id}/participants/${userId}/toggle-block`);

            setParticipants(participants.map(p =>
                p.user.id === userId ? { ...p, isBlocked: data.isBlocked } : p
            ));

            toast({
                title: `Participante ${action === 'bloquear' ? 'bloqueado' : 'desbloqueado'}`,
                description: `${nickname} ha sido ${action === 'bloquear' ? 'bloqueado' : 'desbloqueado'} exitosamente.`,
            });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || `No se pudo ${action} al participante`,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCopyCode = () => {
        if (!currentLeague) return;
        navigator.clipboard.writeText(currentLeague.code);
        setCopied(true);
        toast({
            title: 'Código copiado',
            description: 'El código de la liga ha sido copiado al portapapeles.',
        });
        setTimeout(() => setCopied(false), 2000);
    };

    const handleGenerateNewCode = async () => {
        // Placeholder for generating new code if backend supports it
        toast({
            title: 'Funcionalidad en desarrollo',
            description: 'Pronto podrás generar nuevos códigos de invitación.',
        });
    };

    const handleShareWhatsApp = () => {
        if (!currentLeague) return;
        const text = `¡Únete a mi polla mundialista! 🏆\n\nEntra a la liga "${currentLeague.name}" usando este código:\n\n*${currentLeague.code}*\n\n¡Demuestra cuánto sabes de fútbol!`;
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    const handleTransferOwner = async (newOwnerId: string) => {
        if (!currentLeague) return;
        try {
            setLoading(true);
            await api.patch(`/leagues/${currentLeague.id}/transfer-owner`, {
                newAdminId: newOwnerId,
            });
            toast({
                title: 'Propiedad transferida',
                description: 'Has cedido la administración de la liga exitosamente.',
            });
            setOpen(false);
            onUpdate?.();
        } catch (error) {
            console.error('Error transfiriendo propiedad:', error);
            toast({
                title: 'Error',
                description: 'No se pudo transferir la propiedad de la liga.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    // SISTEMA DE DISEÑO BLINDADO
    const STYLES = {
        container: {
            padding: '16px',
            paddingBottom: '120px',
            backgroundColor: '#0F172A', // Obsidian
            minHeight: '100%',
            fontFamily: 'sans-serif',
            color: 'white'
        },
        // HEADER
        headerSection: {
            textAlign: 'center' as const,
            marginBottom: '24px',
            marginTop: '10px'
        },
        titleBox: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '4px'
        },
        title: {
            fontFamily: "'Russo One', sans-serif",
            fontSize: '24px',
            color: 'white',
            textTransform: 'uppercase' as const,
            letterSpacing: '1px'
        },
        subtitle: {
            fontSize: '11px',
            color: '#00E676', // Signal Green
            fontWeight: 'bold',
            letterSpacing: '1px',
            textTransform: 'uppercase' as const
        },

        // SECCIONES (TARJETAS)
        sectionCard: {
            backgroundColor: '#1E293B', // Carbon
            borderRadius: '16px',
            border: '1px solid #334155',
            padding: '20px',
            marginBottom: '16px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
        },
        sectionTitle: {
            fontSize: '12px',
            fontWeight: '900',
            color: '#94A3B8',
            textTransform: 'uppercase' as const,
            letterSpacing: '1px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        },

        // INPUT NOMBRE
        inputWrapper: {
            display: 'flex',
            gap: '8px'
        },
        input: {
            flex: 1,
            backgroundColor: '#0F172A',
            border: '1px solid #475569',
            borderRadius: '12px',
            padding: '14px',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            outline: 'none',
            fontFamily: "'Russo One', sans-serif"
        },
        saveBtn: {
            backgroundColor: '#00E676',
            color: '#0F172A',
            border: 'none',
            borderRadius: '12px',
            padding: '0 16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        },

        // CÓDIGO DE INVITACIÓN (Hero Section)
        codeBox: {
            backgroundColor: 'rgba(255,255,255,0.03)',
            borderRadius: '12px',
            border: '1px dashed #475569',
            padding: '16px',
            textAlign: 'center' as const
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
        actionGrid: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginTop: '16px'
        },
        actionBtn: {
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '10px',
            fontWeight: '900',
            textTransform: 'uppercase' as const,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            transition: 'all 0.2s'
        },

        // LISTA DE PARTICIPANTES
        memberRow: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 0',
            borderBottom: '1px solid #334155'
        },
        avatar: {
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#0F172A',
            border: '1px solid #475569',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: 'bold', color: 'white',
            marginRight: '12px',
            overflow: 'hidden'
        },
        adminBadge: {
            fontSize: '9px',
            backgroundColor: '#FACC15',
            color: '#0F172A',
            padding: '2px 6px',
            borderRadius: '4px',
            fontWeight: '900',
            marginLeft: '8px'
        },
        kickBtn: {
            backgroundColor: 'rgba(255, 23, 68, 0.1)',
            color: '#FF1744',
            border: 'none',
            padding: '8px',
            borderRadius: '8px',
            cursor: 'pointer'
        },
        blockBtn: {
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            color: '#F59E0B',
            border: 'none',
            padding: '8px',
            borderRadius: '8px',
            cursor: 'pointer',
            marginRight: '8px'
        },

        // ZONA DE PELIGRO
        dangerCard: {
            backgroundColor: 'rgba(255, 23, 68, 0.05)',
            border: '1px solid #FF1744',
            borderRadius: '16px',
            padding: '20px',
            marginTop: '24px'
        },
        dangerTitle: {
            color: '#FF1744',
            display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' as const, marginBottom: '16px'
        },
        dangerItem: {
            marginBottom: '16px',
            paddingBottom: '16px',
            borderBottom: '1px solid rgba(255, 23, 68, 0.2)'
        },
        dangerBtn: {
            width: '100%',
            backgroundColor: '#FF1744',
            color: 'white',
            border: 'none',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 'bold',
            textTransform: 'uppercase' as const,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ? trigger : (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10">
                        <Settings className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="!bg-[#0F172A] bg-[#0F172A] border-slate-700 text-white sm:max-w-[500px] max-h-[90vh] overflow-y-auto z-[100] p-0">
                <DialogTitle className="sr-only">Configuración de Liga</DialogTitle>
                <DialogDescription className="sr-only">Administra tu liga privada</DialogDescription>

                {loadingParticipants ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-signal" />
                    </div>
                ) : currentLeague ? (
                    <div style={STYLES.container}>

                        {/* 1. HEADER */}
                        <div style={STYLES.headerSection}>
                            <div style={STYLES.titleBox}>
                                <Settings size={28} color="#94A3B8" />
                                <h2 style={STYLES.title}>Configuración</h2>
                            </div>
                            <p style={STYLES.subtitle}>Administra tu liga privada</p>
                        </div>

                        {/* 2. NOMBRE DE LA LIGA */}
                        <div style={STYLES.sectionCard}>
                            <div style={STYLES.sectionTitle}>Nombre de la Liga</div>
                            <div style={STYLES.inputWrapper}>
                                <input
                                    type="text"
                                    value={editedName}
                                    onChange={(e) => setEditedName(e.target.value)}
                                    style={STYLES.input}
                                    readOnly={!currentLeague.isAdmin}
                                />
                                {currentLeague.isAdmin && (
                                    <button
                                        onClick={handleUpdateName}
                                        disabled={loading || editedName === currentLeague.name}
                                        style={{ ...STYLES.saveBtn, opacity: loading ? 0.7 : 1 }}
                                    >
                                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={20} />}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* 3. CÓDIGO DE INVITACIÓN */}
                        <div style={STYLES.sectionCard}>
                            <div style={STYLES.sectionTitle}><Share2 size={14} /> Código de Invitación</div>
                            <div style={STYLES.codeBox}>
                                <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 'bold' }}>COMPARTE ESTE CÓDIGO</div>
                                <div style={STYLES.codeDisplay}>{currentLeague.code}</div>

                                <div style={STYLES.actionGrid}>
                                    <button
                                        onClick={handleCopyCode}
                                        style={{ ...STYLES.actionBtn, backgroundColor: '#1E293B', border: '1px solid #475569', color: 'white' }}
                                        disabled={loading}
                                    >
                                        {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copiado!' : 'Copiar'}
                                    </button>
                                    <button
                                        onClick={handleShareWhatsApp}
                                        style={{ ...STYLES.actionBtn, backgroundColor: '#25D366', color: '#0F172A' }}
                                        disabled={loading}
                                    >
                                        <Share2 size={14} /> WhatsApp
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 4. PLAN Y CUPOS */}
                        <div style={STYLES.sectionCard}>
                            <div style={STYLES.sectionTitle}><Gem size={14} /> Plan y Cupos</div>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs text-slate-400 mb-2">
                                        <span>Uso de cupos</span>
                                        <span>{participants.length} / {currentLeague.maxParticipants || 50}</span>
                                    </div>
                                    <Progress value={(participants.length / (currentLeague.maxParticipants || 50)) * 100} className="h-2 bg-slate-700" />
                                </div>

                                {currentLeague.isPaid && (
                                    <button
                                        onClick={() => {
                                            window.open(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${currentLeague.id}/voucher`, '_blank');
                                        }}
                                        style={{ ...STYLES.actionBtn, backgroundColor: '#334155', color: 'white', width: '100%', marginBottom: '12px' }}
                                    >
                                        <Copy size={14} /> Descargar Comprobante de Pago
                                    </button>
                                )}

                                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                                    <p className="text-[10px] text-slate-400 mb-3">
                                        ¿Necesitas más cupos para tu liga? Solicita un aumento de plan enviando el comprobante de pago.
                                    </p>
                                    <button
                                        onClick={() => {
                                            const text = `Hola, quiero aumentar el cupo de mi liga "${currentLeague.name}" (Código: ${currentLeague.code}). Adjunto comprobante de pago.`;
                                            const url = `https://wa.me/573105973421?text=${encodeURIComponent(text)}`;
                                            window.open(url, '_blank');
                                        }}
                                        style={{ ...STYLES.actionBtn, backgroundColor: '#25D366', color: '#0F172A', width: '100%' }}
                                    >
                                        <Share2 size={14} /> Solicitar Aumento de Cupo
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 5. GESTIÓN DE PARTICIPANTES */}
                        <div style={STYLES.sectionCard}>
                            <div style={STYLES.sectionTitle}>
                                <Users size={14} /> Participantes ({participants.length})
                            </div>
                            <div>
                                {participants.map(participant => (
                                    <div key={participant.user.id} style={STYLES.memberRow}>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <div style={STYLES.avatar}>
                                                <Avatar className="w-full h-full">
                                                    {participant.user.avatarUrl ? (
                                                        <AvatarImage src={participant.user.avatarUrl} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <AvatarFallback className="bg-transparent text-white w-full h-full flex items-center justify-center">
                                                            {participant.user.nickname.charAt(0).toUpperCase()}
                                                        </AvatarFallback>
                                                    )}
                                                </Avatar>
                                            </div>
                                            <div>
                                                <div style={{ color: 'white', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center' }}>
                                                    {participant.user.nickname}
                                                    {participant.user.id === user?.id && <span style={STYLES.adminBadge}>TÚ</span>}
                                                </div>
                                                <div style={{ fontSize: '10px', color: '#64748B' }}>
                                                    Miembro
                                                </div>
                                            </div>
                                        </div>

                                        {/* Solo mostrar botones si es admin y no es uno mismo */}
                                        {currentLeague.isAdmin && participant.user.id !== user?.id && (
                                            <div className="flex items-center">
                                                <button
                                                    onClick={() => handleBlockParticipant(participant.user.id, participant.user.nickname, participant.isBlocked || false)}
                                                    style={{
                                                        ...STYLES.blockBtn,
                                                        backgroundColor: participant.isBlocked ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                        color: participant.isBlocked ? '#10B981' : '#F59E0B'
                                                    }}
                                                    disabled={loading}
                                                    title={participant.isBlocked ? "Desbloquear" : "Bloquear"}
                                                >
                                                    {participant.isBlocked ? <Shield size={16} /> : <Lock size={16} />}
                                                </button>
                                                <button
                                                    onClick={() => handleRemoveParticipant(participant.user.id, participant.user.nickname)}
                                                    style={STYLES.kickBtn}
                                                    disabled={loading}
                                                    title="Expulsar"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 6. ZONA DE PELIGRO (SOLO ADMIN) */}
                        {currentLeague.isAdmin && (
                            <div style={STYLES.dangerCard}>
                                <div style={STYLES.dangerTitle}>
                                    <AlertTriangle size={16} /> Zona de Peligro
                                </div>

                                <div style={STYLES.dangerItem}>
                                    <div style={{ color: 'white', fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}>Transferir Propiedad</div>
                                    <p style={{ color: '#EF4444', fontSize: '10px', marginBottom: '12px' }}>
                                        Cede el control total de la liga a otro participante. No podrás deshacerlo.
                                    </p>

                                    <div className="relative">
                                        <select
                                            className="w-full bg-transparent border border-red-500/50 text-red-500 rounded-lg px-3 py-2 text-xs font-bold uppercase cursor-pointer focus:outline-none hover:bg-red-500/10 transition-colors appearance-none"
                                            onChange={(e) => {
                                                if (e.target.value && confirm(`¿Estás seguro de transferir la liga a este usuario? Perderás el acceso de administrador.`)) {
                                                    handleTransferOwner(e.target.value);
                                                }
                                            }}
                                            defaultValue=""
                                        >
                                            <option value="" disabled>Seleccionar nuevo dueño...</option>
                                            {participants
                                                .filter(p => p.user.id !== user?.id)
                                                .map((p) => (
                                                    <option key={p.user.id} value={p.user.id} className="bg-slate-900 text-white">
                                                        {p.user.nickname}
                                                    </option>
                                                ))
                                            }
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-red-500">
                                            <RefreshCw size={14} />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div style={{ color: 'white', fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}>Eliminar Liga</div>
                                    <p style={{ color: '#EF4444', fontSize: '10px', marginBottom: '12px' }}>
                                        Esta acción borrará la liga y todos sus datos permanentemente.
                                    </p>
                                    <button
                                        onClick={handleDeleteLeague}
                                        disabled={loading}
                                        style={STYLES.dangerBtn}
                                    >
                                        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Trash2 size={14} /> Eliminar Definitivamente</>}
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                ) : (
                    <div className="py-8 text-center text-tactical">
                        No se encontró la información de la liga.
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}