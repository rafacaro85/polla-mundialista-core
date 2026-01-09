"use client";

import React, { useEffect, useState } from 'react';
import { Search, Shield, Users, Eye, Settings, Trash2, Copy, RefreshCw, CreditCard, Loader2, Plus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { EditLeagueDialog } from './EditLeagueDialog';
import { TransferOwnerDialog } from './TransferOwnerDialog';
import { ManageLeagueLimitDialog } from './ManageLeagueLimitDialog';
import { ViewLeagueDialog } from './ViewLeagueDialog';
import { CreateLeagueDialog } from './CreateLeagueDialog';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface League {
    id: string;
    name: string;
    code: string;
    type: string;
    maxParticipants: number;
    creator: {
        id: string;
        nickname: string;
        avatarUrl?: string;
    };
    participantCount: number;
    brandingLogoUrl?: string;
    prizeImageUrl?: string;
    prizeDetails?: string;
    welcomeMessage?: string;
    isEnterprise?: boolean;
    isEnterpriseActive?: boolean;
    isPaid?: boolean;
}

interface LeaguesTableProps {
    onDataUpdated?: () => void;
    filter?: 'ALL' | 'FREE';
}

export function LeaguesTable({ onDataUpdated, filter = 'ALL' }: LeaguesTableProps) {
    const router = useRouter();
    const [leagues, setLeagues] = useState<League[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Dialog States
    const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [transferDialogOpen, setTransferDialogOpen] = useState(false);
    const [limitDialogOpen, setLimitDialogOpen] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    useEffect(() => {
        loadLeagues();
    }, []);

    const loadLeagues = async () => {
        try {
            const { data } = await api.get('/leagues/all');
            setLeagues(data);
        } catch (error) {
            console.error('Error cargando ligas:', error);
            toast.error('Error al cargar ligas');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (league: League) => {
        setSelectedLeague(league);
        setEditDialogOpen(true);
    };

    const handleView = (league: League) => {
        setSelectedLeague(league);
        setViewDialogOpen(true);
    };

    const handleTransfer = (league: League) => {
        setSelectedLeague(league);
        setTransferDialogOpen(true);
    };

    const handleManageLimit = (league: League) => {
        setSelectedLeague(league);
        setLimitDialogOpen(true);
    };

    const handleDelete = async (league: League) => {
        if (!confirm(`¿Estás seguro de eliminar la liga "${league.name}"? Esta acción no se puede deshacer.`)) return;

        try {
            await api.delete(`/leagues/${league.id}`);
            toast.success('Liga eliminada correctamente');
            loadLeagues();
        } catch (error) {
            console.error('Error deleting league:', error);
            toast.error('Error al eliminar la liga');
        }
    };

    const handleSuccess = () => {
        loadLeagues();
        if (onDataUpdated) onDataUpdated();
        setEditDialogOpen(false);
        setTransferDialogOpen(false);
        setLimitDialogOpen(false);
        setViewDialogOpen(false);
        setSelectedLeague(null);
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        toast.success('Código copiado');
    };

    const handleToggleEnterprise = async (league: League) => {
        if (league.type !== 'COMPANY' && !league.isEnterprise) return;
        const newStatus = !league.isEnterpriseActive;
        if (!confirm(`¿${newStatus ? 'ACTIVAR' : 'DESACTIVAR'} modo Enterprise para ${league.name}?`)) return;

        try {
            await api.patch(`/leagues/${league.id}`, { isEnterpriseActive: newStatus });
            toast.success(`Modo Enterprise ${newStatus ? 'ACTIVADO' : 'DESACTIVADO'}`);
            loadLeagues();
        } catch (error) {
            console.error(error);
            toast.error('Error al actualizar estado Enterprise');
        }
    };

    const handleTogglePaid = async (league: League) => {
        const newState = !league.isPaid;
        const action = newState ? 'ACTIVAR' : 'DESACTIVAR';

        if (!confirm(`¿Estás seguro de ${action} el pago para la liga "${league.name}"? ${newState ? 'Se generará un registro de venta automáticamente.' : 'El acceso quedará restringido.'}`)) return;

        try {
            // 1. Update League Status
            await api.patch(`/leagues/${league.id}`, { isPaid: newState });

            // 2. Si estamos ACTIVANDO, generar transacción automátic si no existe ya una pagada reciente (Opcional, por ahora generamos siempre para asegurar registro)
            if (newState) {
                try {
                    // Precios Hardcodeados para matchear PLANES (debería venir de config)
                    const PRICES: Record<string, number> = {
                        'familia': 0, 'starter': 0,
                        'parche': 30000, 'amateur': 30000, // Legacy/New map
                        'amigos': 80000, 'semi-pro': 80000,
                        'lider': 180000, 'pro': 180000,
                        'influencer': 350000, 'elite': 350000
                    };

                    // Detect package type, default to parche if unknown or missing
                    const pkg = (league as any).packageType || 'parche';
                    const amount = PRICES[pkg] !== undefined ? PRICES[pkg] : 30000;

                    // Create & Approve
                    const txRes = await api.post('/transactions', {
                        packageType: pkg,
                        amount: amount,
                        leagueId: league.id
                    });
                    await api.patch(`/transactions/${txRes.data.id}/approve`);
                    toast.success('Venta registrada correctamente.');
                } catch (txErr) {
                    console.error("Error generando venta manual:", txErr);
                    toast.warning("Liga activada, pero falló el registro de venta.");
                }
            }

            toast.success(`Liga marcada como ${newState ? 'PAGADA' : 'PENDIENTE'}`);

            // Refrescar padre
            if (onDataUpdated) onDataUpdated();
            loadLeagues();
        } catch (error) {
            console.error(error);
            toast.error('Error al actualizar estado de pago');
        }
    };

    // Filtrado
    const filteredLeagues = leagues.filter(l => {
        const matchesSearch = l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            l.creator.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
            l.code.toLowerCase().includes(searchTerm.toLowerCase());

        if (filter === 'FREE') {
            // Consideramos GRATIS las del plan 'familia' (o null que asume gratis legacy)
            return matchesSearch && ((l as any).packageType === 'familia' || !(l as any).packageType);
        }

        return matchesSearch;
    });

    // SISTEMA DE DISEÑO
    const STYLES = {
        container: {
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '16px',
            paddingBottom: '100px',
            fontFamily: 'sans-serif'
        },
        headerRow: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
        },
        searchBox: {
            position: 'relative' as const,
            flex: 1,
            marginRight: '16px'
        },
        searchInput: {
            width: '100%',
            padding: '12px 16px 12px 44px',
            backgroundColor: '#1E293B',
            border: '1px solid #334155',
            borderRadius: '12px',
            color: 'white',
            outline: 'none',
            fontSize: '14px'
        },
        searchIcon: {
            position: 'absolute' as const,
            left: '14px', top: '14px', color: '#94A3B8'
        },
        createBtn: {
            backgroundColor: '#00E676',
            color: '#0F172A',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 20px',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(0, 230, 118, 0.2)'
        },

        // TARJETA DE LIGA
        card: {
            backgroundColor: '#1E293B', // Carbon
            borderRadius: '16px',
            border: '1px solid #334155',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '12px',
            position: 'relative' as const,
            overflow: 'hidden'
        },
        rowHeader: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
        },
        // Avatar del Dueño / Icono Liga
        iconBox: {
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: '#0F172A',
            border: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00E676', // Verde para el icono
            flexShrink: 0,
            overflow: 'hidden'
        },
        infoColumn: {
            flex: 1,
            minWidth: 0
        },
        leagueName: {
            color: 'white',
            fontWeight: 'bold',
            fontSize: '16px',
            marginBottom: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: "'Russo One', sans-serif"
        },
        metaRow: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11px',
            color: '#94A3B8'
        },
        // Chip de Código
        codeBadge: {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px dashed #475569',
            borderRadius: '4px',
            padding: '2px 6px',
            fontFamily: 'monospace',
            color: '#F8FAFC',
            letterSpacing: '1px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer'
        },
        // Footer de Acciones
        actionsFooter: {
            display: 'flex',
            gap: '8px',
            marginTop: '4px',
            paddingTop: '12px',
            borderTop: '1px solid #334155',
            flexWrap: 'wrap' as const
        },
        actionBtn: {
            flex: 1,
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid',
            fontSize: '10px',
            fontWeight: '900',
            textTransform: 'uppercase' as const,
            cursor: 'pointer',
            textAlign: 'center' as const,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s',
            minWidth: '80px'
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-signal" />
            </div>
        );
    }

    return (
        <div style={STYLES.container}>


            {/* HEADER: BUSCADOR + BOTÓN CREAR */}
            <div style={STYLES.headerRow}>
                <div style={STYLES.searchBox}>
                    <Search size={18} style={STYLES.searchIcon} />
                    <input
                        type="text"
                        placeholder="Buscar polla, código o dueño..."
                        style={STYLES.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => setCreateDialogOpen(true)}
                    style={STYLES.createBtn}
                >
                    <Plus size={18} /> Crear Polla
                </button>
            </div>

            {/* LISTA DE LIGAS */}
            {filteredLeagues.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#64748B', padding: '40px' }}>No se encontraron pollas.</div>
            ) : (
                filteredLeagues.map(league => (
                    <div key={league.id} style={STYLES.card}>

                        <div style={STYLES.rowHeader}>
                            {/* Icono Principal (Avatar del creador o inicial) */}
                            <div style={STYLES.iconBox}>
                                {league.creator.avatarUrl ? (
                                    <img src={league.creator.avatarUrl} alt={league.creator.nickname} className="w-full h-full object-cover" />
                                ) : (
                                    <span style={{ fontFamily: "'Russo One', sans-serif", fontSize: '20px' }}>
                                        {league.name.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>

                            {/* Info Principal */}
                            <div style={STYLES.infoColumn}>
                                <div style={STYLES.leagueName}>
                                    {league.name}
                                    {league.type === 'public' && <Shield size={14} fill="#FACC15" color="#FACC15" />}
                                </div>

                                <div style={STYLES.metaRow}>
                                    <span>Dueño: <strong style={{ color: 'white' }}>{league.creator.nickname}</strong></span>
                                    <span>•</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                        <Users size={12} />
                                        {league.participantCount} / {league.maxParticipants}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Código de la Liga (Destacado) */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', padding: '8px', backgroundColor: '#0F172A', borderRadius: '8px' }}>
                            <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 'bold' }}>CÓDIGO DE ACCESO</span>
                            <div style={STYLES.codeBadge} onClick={() => copyCode(league.code)}>
                                {league.code} <Copy size={10} style={{ opacity: 0.5 }} />
                            </div>
                        </div>

                        {/* PAYMENT STATUS TOGGLE (Para ligas NO Enterprise) */}
                        {(!league.isEnterprise && league.type !== 'COMPANY') && (
                            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', backgroundColor: league.isPaid ? 'rgba(0, 230, 118, 0.1)' : 'rgba(234, 179, 8, 0.1)', border: `1px solid ${league.isPaid ? 'rgba(0, 230, 118, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`, borderRadius: '8px' }}>
                                <div className="flex items-center gap-2">
                                    {league.isPaid ? <Shield size={12} className="text-[#00E676]" /> : <Loader2 size={12} className="text-yellow-500 animate-spin-slow" />}
                                    <span style={{ fontSize: '10px', color: league.isPaid ? '#00E676' : '#FACC15', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                        {league.isPaid ? 'PAGADO / ACTIVO' : 'PAGO PENDIENTE'}
                                    </span>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => handleTogglePaid(league)}
                                    style={{ backgroundColor: league.isPaid ? '#FACC15' : '#00E676', color: '#0F172A' }}
                                    className="h-6 text-[9px] px-2 font-bold border-none hover:opacity-90 transition-opacity"
                                >
                                    {league.isPaid ? 'MARCAR PENDIENTE' : 'ACTIVAR PAGO'}
                                </Button>
                            </div>
                        )}

                        {/* ENTERPRISE TOGGLE (Solo para COMPANY) */}
                        {(league.type === 'COMPANY' || league.isEnterprise) && (
                            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px border-blue-500/30', borderRadius: '8px' }}>
                                <div className="flex items-center gap-2">
                                    <Shield size={12} className="text-blue-400" />
                                    <span style={{ fontSize: '10px', color: '#60A5FA', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                        {league.isEnterpriseActive ? 'Enterprise ACTIVADO' : 'Enterprise INACTIVO'}
                                    </span>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => handleToggleEnterprise(league)}
                                    style={{ backgroundColor: league.isEnterpriseActive ? '#EF4444' : '#10B981', color: 'white' }}
                                    className="h-6 text-[9px] px-2 font-bold border-none hover:opacity-90 transition-opacity"
                                >
                                    {league.isEnterpriseActive ? 'DESACTIVAR' : 'ACTIVAR'}
                                </Button>
                            </div>
                        )}

                        {/* Botones de Acción */}
                        <div style={STYLES.actionsFooter}>
                            <button
                                onClick={() => handleEdit(league)}
                                style={{
                                    ...STYLES.actionBtn,
                                    backgroundColor: '#00E676',
                                    borderColor: '#00E676',
                                    color: '#0F172A',
                                    boxShadow: '0 0 10px rgba(0,230,118,0.2)'
                                }}
                            >
                                <Settings size={14} /> Editar
                            </button>

                            <button
                                onClick={() => handleView(league)}
                                style={{
                                    ...STYLES.actionBtn,
                                    backgroundColor: 'transparent',
                                    borderColor: '#475569',
                                    color: '#F8FAFC'
                                }}
                            >
                                <Eye size={14} /> Ver
                            </button>

                            {/* Botones Extra: Transferir y Límite */}
                            <button
                                onClick={() => handleTransfer(league)}
                                style={{
                                    ...STYLES.actionBtn,
                                    backgroundColor: 'transparent',
                                    borderColor: '#475569',
                                    color: '#F8FAFC'
                                }}
                                title="Transferir Propiedad"
                            >
                                <RefreshCw size={14} />
                            </button>

                            <button
                                onClick={() => handleManageLimit(league)}
                                style={{
                                    ...STYLES.actionBtn,
                                    backgroundColor: 'transparent',
                                    borderColor: '#FACC15',
                                    color: '#FACC15'
                                }}
                                title="Gestionar Cupos"
                            >
                                <CreditCard size={14} />
                            </button>

                            <button
                                onClick={() => handleDelete(league)}
                                style={{
                                    ...STYLES.actionBtn,
                                    backgroundColor: 'rgba(255,23,68,0.1)',
                                    borderColor: '#FF1744',
                                    color: '#FF1744',
                                    flex: 0.4
                                }}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>

                    </div>
                ))
            )}

            {selectedLeague && (
                <>
                    <EditLeagueDialog
                        league={selectedLeague}
                        open={editDialogOpen}
                        onOpenChange={setEditDialogOpen}
                        onSuccess={handleSuccess}
                    />
                    <ViewLeagueDialog
                        league={selectedLeague}
                        open={viewDialogOpen}
                        onOpenChange={setViewDialogOpen}
                    />
                    <TransferOwnerDialog
                        league={selectedLeague}
                        open={transferDialogOpen}
                        onOpenChange={setTransferDialogOpen}
                        onSuccess={handleSuccess}
                    />
                    <ManageLeagueLimitDialog
                        league={selectedLeague}
                        open={limitDialogOpen}
                        onOpenChange={setLimitDialogOpen}
                        onSuccess={handleSuccess}
                    />
                </>
            )}

            <CreateLeagueDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onSuccess={handleSuccess}
            />
        </div>
    );
}