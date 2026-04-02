import React, { useEffect, useState, useMemo } from 'react';
import { Search, Shield, Users, Eye, Settings, Trash2, Copy, RefreshCw, CreditCard, Loader2, Plus, Building2, ArrowUpDown, Calendar, Crown, Tag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { EditLeagueDialog } from './EditLeagueDialog';
import { TransferOwnerDialog } from './TransferOwnerDialog';
import { ManageLeagueLimitDialog } from './ManageLeagueLimitDialog';
import { ViewLeagueDialog } from './ViewLeagueDialog';
import { CreateLeagueDialog } from './CreateLeagueDialog';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { superAdminService } from '@/services/superAdminService';

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
    packageType?: string;
    adminName?: string;
    adminPhone?: string;
    companyName?: string;
    createdAt?: string;
}

type FilterTab = 'ALL' | 'ACTIVE' | 'INACTIVE' | 'FREE';

interface LeaguesTableProps {
    onDataUpdated?: () => void;
    filter?: 'ALL' | 'FREE';
    onCreateEnterprise?: () => void;
    tournamentId: string;
}

// ── Helpers ──
const FREE_PLANS = ['starter', 'FREE', 'launch_promo', 'ENTERPRISE_LAUNCH'];

// Una liga es gratuita si su plan está en FREE_PLANS o si no tiene plan asignado
function isFreeLeague(l: League): boolean {
    return !l.packageType || FREE_PLANS.includes(l.packageType);
}
const PLAN_LABELS: Record<string, string> = {
    'starter': 'Familia', 'FREE': 'Familia', 'launch_promo': 'Promo',
    'ENTERPRISE_LAUNCH': 'Corp. Gratis',
    'parche': 'Parche', 'amateur': 'Parche',
    'amigos': 'Amigos', 'semi-pro': 'Amigos',
    'lider': 'Líder', 'pro': 'Líder',
    'influencer': 'Influencer', 'elite': 'Influencer',
};

function getStatusInfo(league: League): { label: string; color: string; bg: string; dot: string } {
    if (FREE_PLANS.includes(league.packageType || '')) {
        return { label: 'GRATUITA', color: '#94A3B8', bg: 'rgba(148,163,184,0.1)', dot: '⚫' };
    }
    if (league.isPaid) {
        return { label: 'ACTIVA', color: '#00E676', bg: 'rgba(0,230,118,0.1)', dot: '🟢' };
    }
    return { label: 'PAGO PENDIENTE', color: '#FB923C', bg: 'rgba(251,146,60,0.1)', dot: '🔴' };
}

function formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    try {
        return new Date(dateStr).toLocaleDateString('es-CO', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    } catch { return '—'; }
}

export function LeaguesTable({ onDataUpdated, filter = 'ALL', onCreateEnterprise, tournamentId }: LeaguesTableProps) {
    const router = useRouter();
    const [leagues, setLeagues] = useState<League[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterTab>('ALL');
    const [sortAsc, setSortAsc] = useState(false); // false = más reciente primero
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Dialog States
    const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [transferDialogOpen, setTransferDialogOpen] = useState(false);
    const [limitDialogOpen, setLimitDialogOpen] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    useEffect(() => {
        loadLeagues();
    }, [tournamentId]);

    const loadLeagues = async () => {
        try {
            const data = await superAdminService.getAllLeagues(tournamentId);
            setLeagues(data);
        } catch (error) {
            console.error('Error cargando ligas:', error);
            toast.error('Error al cargar ligas');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (league: League) => { setSelectedLeague(league); setEditDialogOpen(true); };
    const handleView = (league: League) => { setSelectedLeague(league); setViewDialogOpen(true); };
    const handleTransfer = (league: League) => { setSelectedLeague(league); setTransferDialogOpen(true); };
    const handleManageLimit = (league: League) => { setSelectedLeague(league); setLimitDialogOpen(true); };

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
            await api.patch(`/leagues/${league.id}`, { isPaid: newState });
            if (newState) {
                try {
                    const PRICES: Record<string, number> = {
                        'starter': 0, 'FREE': 0, 'launch_promo': 0,
                        'parche': 30000, 'amateur': 30000,
                        'amigos': 80000, 'semi-pro': 80000,
                        'lider': 180000, 'pro': 180000,
                        'influencer': 350000, 'elite': 350000
                    };
                    const pkg = league.packageType || 'parche';
                    const amount = PRICES[pkg] !== undefined ? PRICES[pkg] : 30000;
                    const txRes = await api.post('/transactions', { packageType: pkg, amount, leagueId: league.id, tournamentId });
                    await api.patch(`/transactions/${txRes.data.id}/approve`);
                    toast.success('Venta registrada correctamente.');
                } catch (txErr) {
                    console.error("Error generando venta manual:", txErr);
                    toast.warning("Liga activada, pero falló el registro de venta.");
                }
            }
            toast.success(`Liga marcada como ${newState ? 'PAGADA' : 'PENDIENTE'}`);
            if (onDataUpdated) onDataUpdated();
            loadLeagues();
        } catch (error) {
            console.error(error);
            toast.error('Error al actualizar estado de pago');
        }
    };

    // ── FILTRADO Y ORDENAMIENTO ──
    const filteredLeagues = useMemo(() => {
        let result = leagues.filter(l => {
            const matchesSearch = l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                l.creator.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
                l.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (l.adminName || '').toLowerCase().includes(searchTerm.toLowerCase());

            if (!matchesSearch) return false;

            // Filtro de tab activo
            switch (activeFilter) {
                case 'ACTIVE':
                    // Solo pollas DE PAGO que ya pagaron (excluye gratuitas)
                    if (isFreeLeague(l) || !l.isPaid) return false;
                    break;
                case 'INACTIVE':
                    // Solo pollas DE PAGO que NO han pagado (excluye gratuitas)
                    if (isFreeLeague(l) || l.isPaid) return false;
                    break;
                case 'FREE':
                    // Solo pollas gratuitas
                    if (!isFreeLeague(l)) return false;
                    break;
            }

            // Filtro de rango de fechas
            if (dateFrom || dateTo) {
                const leagueDate = l.createdAt ? new Date(l.createdAt) : null;
                if (!leagueDate) return false;
                if (dateFrom) {
                    const from = new Date(dateFrom);
                    from.setHours(0, 0, 0, 0);
                    if (leagueDate < from) return false;
                }
                if (dateTo) {
                    const to = new Date(dateTo);
                    to.setHours(23, 59, 59, 999);
                    if (leagueDate > to) return false;
                }
            }

            return true;
        });

        // Ordenar por fecha
        result.sort((a, b) => {
            const dA = new Date(a.createdAt || 0).getTime();
            const dB = new Date(b.createdAt || 0).getTime();
            return sortAsc ? dA - dB : dB - dA;
        });

        return result;
    }, [leagues, searchTerm, activeFilter, sortAsc, dateFrom, dateTo]);

    const hasDateFilter = dateFrom || dateTo;
    const clearDateFilter = () => { setDateFrom(''); setDateTo(''); };

    // Contadores por filtro
    const counts = useMemo(() => ({
        ALL: leagues.length,
        ACTIVE: leagues.filter(l => !isFreeLeague(l) && l.isPaid).length,
        INACTIVE: leagues.filter(l => !isFreeLeague(l) && !l.isPaid).length,
        FREE: leagues.filter(l => isFreeLeague(l)).length,
    }), [leagues]);

    // ── ESTILOS ──
    const S = {
        container: { display: 'flex', flexDirection: 'column' as const, gap: '12px', paddingBottom: '100px', fontFamily: 'sans-serif' },
        headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' as const },
        searchBox: { position: 'relative' as const, flex: 1, minWidth: '200px' },
        searchInput: { width: '100%', padding: '10px 14px 10px 40px', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '12px', color: 'white', outline: 'none', fontSize: '13px' },
        searchIcon: { position: 'absolute' as const, left: '12px', top: '11px', color: '#94A3B8' },
        createBtn: { backgroundColor: '#00E676', color: '#0F172A', border: 'none', borderRadius: '10px', padding: '10px 16px', fontWeight: 'bold' as const, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(0, 230, 118, 0.2)', whiteSpace: 'nowrap' as const },

        // Filter bar
        filterBar: { display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' as const },
        filterTab: (active: boolean) => ({
            padding: '7px 14px', borderRadius: '20px', border: active ? '1px solid #00E676' : '1px solid #334155',
            backgroundColor: active ? 'rgba(0,230,118,0.15)' : 'transparent', color: active ? '#00E676' : '#94A3B8',
            fontSize: '11px', fontWeight: '800' as const, cursor: 'pointer', transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', gap: '5px', textTransform: 'uppercase' as const,
        }),
        sortBtn: { padding: '7px 14px', borderRadius: '20px', border: '1px solid #334155', backgroundColor: 'transparent', color: '#94A3B8', fontSize: '11px', fontWeight: '800' as const, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', marginLeft: 'auto' },
        countBadge: (active: boolean) => ({
            backgroundColor: active ? 'rgba(0,230,118,0.3)' : '#334155', color: active ? '#00E676' : '#64748B',
            fontSize: '9px', fontWeight: '900' as const, padding: '1px 6px', borderRadius: '10px', minWidth: '18px', textAlign: 'center' as const,
        }),

        // Card
        card: { backgroundColor: '#1E293B', borderRadius: '14px', border: '1px solid #334155', padding: '14px', display: 'flex', flexDirection: 'column' as const, gap: '10px', position: 'relative' as const, overflow: 'hidden', transition: 'border-color 0.2s' },
        rowHeader: { display: 'flex', alignItems: 'center', gap: '10px' },
        iconBox: { width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#0F172A', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00E676', flexShrink: 0, overflow: 'hidden' },
        infoColumn: { flex: 1, minWidth: 0 },
        leagueName: { color: 'white', fontWeight: 'bold' as const, fontSize: '14px', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: "'Russo One', sans-serif" },

        // Meta badges row
        metaBadgesRow: { display: 'flex', flexWrap: 'wrap' as const, gap: '5px', marginTop: '4px' },
        metaBadge: (bg: string, color: string) => ({
            display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 8px', borderRadius: '6px',
            backgroundColor: bg, color: color, fontSize: '9px', fontWeight: '800' as const, textTransform: 'uppercase' as const, letterSpacing: '0.3px',
        }),

        // Code row
        codeRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', backgroundColor: '#0F172A', borderRadius: '8px' },
        codeBadge: { backgroundColor: 'rgba(255,255,255,0.05)', border: '1px dashed #475569', borderRadius: '4px', padding: '2px 6px', fontFamily: 'monospace', color: '#F8FAFC', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '11px' },

        // Actions
        actionsFooter: { display: 'flex', gap: '6px', paddingTop: '10px', borderTop: '1px solid #334155', flexWrap: 'wrap' as const },
        actionBtn: { flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid', fontSize: '9px', fontWeight: '900' as const, textTransform: 'uppercase' as const, cursor: 'pointer', textAlign: 'center' as const, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', transition: 'all 0.2s', minWidth: '70px' },
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-signal" />
            </div>
        );
    }

    const FILTER_TABS: { key: FilterTab; label: string }[] = [
        { key: 'ALL', label: 'Todas' },
        { key: 'ACTIVE', label: 'Activas' },
        { key: 'INACTIVE', label: 'Pendientes' },
        { key: 'FREE', label: 'Gratuitas' },
    ];

    return (
        <div style={S.container}>

            {/* HEADER: BUSCADOR + BOTONES CREAR */}
            <div style={S.headerRow}>
                <div style={S.searchBox}>
                    <Search size={16} style={S.searchIcon} />
                    <input
                        type="text"
                        placeholder="Buscar polla, código, dueño o admin..."
                        style={S.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {onCreateEnterprise && (
                        <button onClick={onCreateEnterprise} style={{ ...S.createBtn, backgroundColor: '#6366F1', color: 'white' }}>
                            <Building2 size={14} /> Corporativa
                        </button>
                    )}
                    <button onClick={() => setCreateDialogOpen(true)} style={S.createBtn}>
                        <Plus size={14} /> Crear Polla
                    </button>
                </div>
            </div>

            {/* FILTROS + ORDENAMIENTO */}
            <div style={S.filterBar}>
                {FILTER_TABS.map(tab => (
                    <button key={tab.key} onClick={() => setActiveFilter(tab.key)} style={S.filterTab(activeFilter === tab.key)}>
                        {tab.label}
                        <span style={S.countBadge(activeFilter === tab.key)}>{counts[tab.key]}</span>
                    </button>
                ))}
                <button onClick={() => setSortAsc(!sortAsc)} style={S.sortBtn} title="Cambiar orden">
                    <ArrowUpDown size={12} />
                    {sortAsc ? 'Más antigua ↑' : 'Más reciente ↓'}
                </button>
            </div>

            {/* FILTRO DE FECHAS */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', padding: '10px 14px', backgroundColor: '#152033', borderRadius: '12px', border: hasDateFilter ? '1px solid rgba(0,230,118,0.3)' : '1px solid #334155' }}>
                <Calendar size={14} style={{ color: '#64748B', flexShrink: 0 }} />
                <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '700', whiteSpace: 'nowrap' }}>Desde:</span>
                <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    style={{ backgroundColor: '#1E293B', border: '1px solid #334155', color: 'white', borderRadius: '8px', padding: '6px 10px', fontSize: '11px', outline: 'none', flex: 1, minWidth: '120px' }}
                />
                <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '700', whiteSpace: 'nowrap' }}>Hasta:</span>
                <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    style={{ backgroundColor: '#1E293B', border: '1px solid #334155', color: 'white', borderRadius: '8px', padding: '6px 10px', fontSize: '11px', outline: 'none', flex: 1, minWidth: '120px' }}
                />
                {hasDateFilter && (
                    <button onClick={clearDateFilter} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '8px', border: '1px solid #EF4444', backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444', fontSize: '10px', fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        <X size={10} /> Limpiar fechas
                    </button>
                )}
            </div>

            {/* CONTADOR DE RESULTADOS */}
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>
                Mostrando {filteredLeagues.length} de {leagues.length} pollas
                {hasDateFilter && <span style={{ color: '#00E676', marginLeft: '6px' }}>• Filtro de fechas activo</span>}
            </div>

            {/* LISTA DE LIGAS */}
            {filteredLeagues.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#64748B', padding: '40px' }}>No se encontraron pollas con este filtro.</div>
            ) : (
                filteredLeagues.map(league => {
                    const status = getStatusInfo(league);
                    const planLabel = PLAN_LABELS[league.packageType || ''] || league.packageType || 'Sin plan';
                    const isCompany = league.type === 'COMPANY' || league.isEnterprise;

                    return (
                        <div key={league.id} style={{ ...S.card, borderColor: league.isPaid ? '#334155' : (FREE_PLANS.includes(league.packageType || '') ? '#334155' : '#FB923C33') }}>

                            <div style={S.rowHeader}>
                                {/* Icono */}
                                <div style={S.iconBox}>
                                    {league.creator.avatarUrl ? (
                                        <img src={league.creator.avatarUrl} alt={league.creator.nickname} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <span style={{ fontFamily: "'Russo One', sans-serif", fontSize: '18px' }}>
                                            {league.name.charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>

                                {/* Info Principal */}
                                <div style={S.infoColumn}>
                                    <div style={S.leagueName}>
                                        {league.name}
                                    </div>

                                    {/* Meta Badges */}
                                    <div style={S.metaBadgesRow}>
                                        {/* Tipo */}
                                        <span style={S.metaBadge(isCompany ? 'rgba(99,102,241,0.15)' : 'rgba(59,130,246,0.15)', isCompany ? '#818CF8' : '#60A5FA')}>
                                            {isCompany ? '🏢 Empresa' : '👥 Social'}
                                        </span>
                                        {/* Plan */}
                                        <span style={S.metaBadge('rgba(148,163,184,0.1)', '#CBD5E1')}>
                                            <Tag size={8} /> {planLabel}
                                        </span>
                                        {/* Estado */}
                                        <span style={S.metaBadge(status.bg, status.color)}>
                                            {status.dot} {status.label}
                                        </span>
                                        {/* Participantes */}
                                        <span style={S.metaBadge('rgba(0,230,118,0.08)', '#94A3B8')}>
                                            <Users size={8} /> {league.participantCount}/{league.maxParticipants}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Info detallada */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', backgroundColor: '#0F172A', borderRadius: '8px', gap: '8px', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', gap: '12px', fontSize: '10px', color: '#94A3B8', flexWrap: 'wrap' }}>
                                    <span><Crown size={9} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />Admin: <strong style={{ color: '#CBD5E1' }}>{league.adminName || league.creator.nickname}</strong></span>
                                    <span><Calendar size={9} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />{formatDate(league.createdAt)}</span>
                                </div>
                                <div style={S.codeBadge} onClick={() => copyCode(league.code)}>
                                    {league.code} <Copy size={9} style={{ opacity: 0.5 }} />
                                </div>
                            </div>

                            {/* PAYMENT STATUS TOGGLE */}
                            {(!league.isEnterprise && league.type !== 'COMPANY') && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', backgroundColor: league.isPaid ? 'rgba(0, 230, 118, 0.08)' : 'rgba(234, 179, 8, 0.08)', border: `1px solid ${league.isPaid ? 'rgba(0, 230, 118, 0.2)' : 'rgba(234, 179, 8, 0.2)'}`, borderRadius: '8px' }}>
                                    <div className="flex items-center gap-2">
                                        {league.isPaid ? <Shield size={11} className="text-[#00E676]" /> : <Loader2 size={11} className="text-yellow-500 animate-spin-slow" />}
                                        <span style={{ fontSize: '9px', color: league.isPaid ? '#00E676' : '#FACC15', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                            {league.isPaid ? 'PAGADO / ACTIVO' : 'PAGO PENDIENTE'}
                                        </span>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => handleTogglePaid(league)}
                                        style={{ backgroundColor: league.isPaid ? '#FACC15' : '#00E676', color: '#0F172A' }}
                                        className="h-5 text-[8px] px-2 font-bold border-none hover:opacity-90 transition-opacity"
                                    >
                                        {league.isPaid ? 'MARCAR PENDIENTE' : 'ACTIVAR PAGO'}
                                    </Button>
                                </div>
                            )}

                            {/* ENTERPRISE TOGGLE */}
                            {(league.type === 'COMPANY' || league.isEnterprise) && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', backgroundColor: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px' }}>
                                    <div className="flex items-center gap-2">
                                        <Shield size={11} className="text-blue-400" />
                                        <span style={{ fontSize: '9px', color: '#60A5FA', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                            {league.isEnterpriseActive ? 'Enterprise ACTIVADO' : 'Enterprise INACTIVO'}
                                        </span>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => handleToggleEnterprise(league)}
                                        style={{ backgroundColor: league.isEnterpriseActive ? '#EF4444' : '#10B981', color: 'white' }}
                                        className="h-5 text-[8px] px-2 font-bold border-none hover:opacity-90 transition-opacity"
                                    >
                                        {league.isEnterpriseActive ? 'DESACTIVAR' : 'ACTIVAR'}
                                    </Button>
                                </div>
                            )}

                            {/* Botones de Acción */}
                            <div style={S.actionsFooter}>
                                <button onClick={() => handleEdit(league)} style={{ ...S.actionBtn, backgroundColor: '#00E676', borderColor: '#00E676', color: '#0F172A', boxShadow: '0 0 8px rgba(0,230,118,0.15)' }}>
                                    <Settings size={12} /> Editar
                                </button>
                                <button onClick={() => handleView(league)} style={{ ...S.actionBtn, backgroundColor: 'transparent', borderColor: '#475569', color: '#F8FAFC' }}>
                                    <Eye size={12} /> Ver
                                </button>
                                <button onClick={() => handleTransfer(league)} style={{ ...S.actionBtn, backgroundColor: 'transparent', borderColor: '#475569', color: '#F8FAFC' }} title="Transferir">
                                    <RefreshCw size={12} />
                                </button>
                                <button onClick={() => handleManageLimit(league)} style={{ ...S.actionBtn, backgroundColor: 'transparent', borderColor: '#FACC15', color: '#FACC15' }} title="Gestionar Cupos">
                                    <CreditCard size={12} />
                                </button>
                                <button onClick={() => handleDelete(league)} style={{ ...S.actionBtn, backgroundColor: 'rgba(255,23,68,0.08)', borderColor: '#FF1744', color: '#FF1744', flex: 0.4 }}>
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>
                    );
                })
            )}

            {selectedLeague && (
                <>
                    <EditLeagueDialog league={selectedLeague} open={editDialogOpen} onOpenChange={setEditDialogOpen} onSuccess={handleSuccess} />
                    <ViewLeagueDialog league={selectedLeague} open={viewDialogOpen} onOpenChange={setViewDialogOpen} />
                    <TransferOwnerDialog league={selectedLeague} open={transferDialogOpen} onOpenChange={setTransferDialogOpen} onSuccess={handleSuccess} />
                    <ManageLeagueLimitDialog league={selectedLeague} open={limitDialogOpen} onOpenChange={setLimitDialogOpen} onSuccess={handleSuccess} />
                </>
            )}

            <CreateLeagueDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} onSuccess={handleSuccess} />
        </div>
    );
}