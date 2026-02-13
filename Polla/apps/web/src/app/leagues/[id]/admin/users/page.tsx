'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Users,
    Upload,
    UserPlus,
    Search,
    MoreVertical,
    Shield,
    Ban,
    Trash2,

    Share2,
    Edit2,
    X,
    Save,
    Check // Added
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { BulkUserImport } from '@/components/admin/BulkUserImport';
import { useTournament } from '@/hooks/useTournament';


export default function AdminUsersPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAppStore();
    const { tournamentId } = useTournament();
    const [league, setLeague] = useState<any>(null);

    const [participants, setParticipants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showBulkImport, setShowBulkImport] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Edit State
    const [editingParticipant, setEditingParticipant] = useState<any>(null);
    const [editForm, setEditForm] = useState({ fullName: '', email: '', phoneNumber: '', department: '' });
    const [isSaving, setIsSaving] = useState(false);

    const handleEditClick = (participant: any) => {
        setEditingParticipant(participant);
        setEditForm({
            fullName: participant.user?.fullName || '',
            email: participant.user?.email || '',
            phoneNumber: participant.user?.phoneNumber || '',
            department: participant.department || ''
        });
    };

    const handleSaveParticipant = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingParticipant) return;
        setIsSaving(true);
        try {
            await api.patch(`/leagues/${params.id}/participants/${editingParticipant.user.id}`, editForm);
            // Refresh data
            await fetchData();
            setEditingParticipant(null);
        } catch (error) {
            console.error('Error updating participant:', error);
            alert('Error al actualizar participante. Verifica que el correo no esté duplicado.');
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [params.id]);

    const fetchData = async () => {
        try {
            // Check access (God Mode or League Admin)
            const isSuperAdmin = user?.role === 'SUPER_ADMIN';

            if (isSuperAdmin) {
                const { data: leagueData } = await api.get(`/leagues/${params.id}`);
                setLeague({ ...leagueData, isAdmin: true });
            } else {
                const { data: leagueData } = await api.get(`/leagues/${params.id}`);

                if (!leagueData || !leagueData.isAdmin) {
                    router.push(`/leagues/${params.id}`);
                    return;
                }

                setLeague(leagueData);
            }

            // Fetch participants
            const { data: participantsData } = await api.get(`/leagues/${params.id}/participants`);
            setParticipants(participantsData);

        } catch (error) {
            console.error('Error fetching data:', error);
            router.push('/dashboard');
        } finally {
            setLoading(false);
        }
    };



    const handleToggleBlock = async (participant: any) => {
        const action = participant.isBlocked ? 'desbloquear' : 'bloquear';
        if (!confirm(`¿Estás seguro de que deseas ${action} a ${participant.user?.fullName || 'este usuario'}?`)) return;

        try {
            await api.patch(`/leagues/${params.id}/participants/${participant.user.id}/toggle-block`);
            await fetchData();
        } catch (error) {
            console.error('Error toggling block:', error);
            alert('Error al cambiar estado del usuario.');
        }
    };

    const handleDelete = async (participant: any) => {
        if (!confirm(`¿ELIMINAR a ${participant.user?.fullName || 'este usuario'} de la liga?\n\nEsta acción borrará sus predicciones y puntaje. No se puede deshacer.`)) return;

        try {
            await api.delete(`/leagues/${params.id}/participants/${participant.user.id}`);
            await fetchData();
            toast.success('Usuario eliminado correctamente');
        } catch (error) {
            console.error('Error deleting participant:', error);
            alert('Error al eliminar usuario.');
        }
    };

    const handleApproveRequest = async (participant: any) => {
        try {
            await api.post(`/leagues/${params.id}/approve`, { userId: participant.user.id });
            toast.success(`Usuario ${participant.user.nickname} aprobado correctamente.`);
            await fetchData();
        } catch (error) {
            console.error('Error approving participant:', error);
            toast.error('Error al aprobar usuario.');
        }
    };

    const handleRejectRequest = async (participant: any) => {
        if (!confirm(`¿Rechazar solicitud de ${participant.user.fullName || participant.user.nickname}?`)) return;
        try {
            await api.post(`/leagues/${params.id}/reject`, { userId: participant.user.id });
            toast.success('Solicitud rechazada.');
            await fetchData();
        } catch (error) {
            console.error('Error rejecting participant:', error);
            toast.error('Error al rechazar usuario.');
        }
    };

    const handleTogglePaid = async (participant: any) => {
        try {
            await api.patch(`/leagues/${params.id}/participants/${participant.user.id}/toggle-payment`);
            // Optimistic update or refresh
            setParticipants(prev => prev.map(p => 
                p.id === participant.id ? { ...p, isPaid: !p.isPaid } : p
            ));
            toast.success(`Estado de pago actualizado para ${participant.user.nickname}`);
        } catch (error) {
            console.error('Error toggling payment:', error);
            toast.error('Error al actualizar estado de pago.');
        }
    };

    const filteredParticipants = participants.filter(p =>
        p.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = {
        total: participants.length,
        active: participants.filter(p => p.status === 'ACTIVE').length,
        blocked: participants.filter(p => p.status === 'BLOCKED' || p.isBlocked).length,
        pending: participants.filter(p => p.status === 'PENDING').length,
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-brand-bg flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-primary border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-bg text-brand-text">
            <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.push(`/leagues/${params.id}/admin`)}
                        className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-brand-primary transition-colors mb-6 group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Volver al Panel de Control
                    </button>

                    <div className="flex items-start justify-between flex-wrap gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-brand-text mb-2 flex items-center gap-3">
                                <Users className="text-brand-primary" size={32} />
                                Gestión de Participantes
                            </h1>
                            <p className="text-slate-400 text-sm md:text-base">
                                {league?.companyName || league?.name}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
                    <div className="bg-brand-secondary border border-slate-700 rounded-xl p-4 md:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-xs md:text-sm mb-1">Total</p>
                                <p className="text-2xl md:text-3xl font-bold text-white">{stats.total}</p>
                            </div>
                            <div className="p-2 md:p-3 bg-blue-500/10 rounded-lg">
                                <Users className="text-blue-400" size={20} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-brand-secondary border border-slate-700 rounded-xl p-4 md:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-xs md:text-sm mb-1">Activos</p>
                                <p className="text-2xl md:text-3xl font-bold text-green-400">{stats.active}</p>
                            </div>
                            <div className="p-2 md:p-3 bg-green-500/10 rounded-lg">
                                <Shield className="text-green-400" size={20} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-brand-secondary border border-slate-700 rounded-xl p-4 md:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-xs md:text-sm mb-1">Bloqueados</p>
                                <p className="text-2xl md:text-3xl font-bold text-red-500">{stats.blocked}</p>
                            </div>
                            <div className="p-2 md:p-3 bg-red-500/10 rounded-lg">
                                <Ban className="text-red-500" size={20} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-brand-secondary border border-slate-700 rounded-xl p-4 md:p-6 relative overflow-hidden">
                         {stats.pending > 0 && <div className="absolute top-0 right-0 w-3 h-3 bg-orange-500 rounded-full animate-ping"></div>}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-xs md:text-sm mb-1">Pendientes</p>
                                <p className="text-2xl md:text-3xl font-bold text-orange-500">{stats.pending}</p>
                            </div>
                            <div className="p-2 md:p-3 bg-orange-500/10 rounded-lg">
                                <UserPlus className="text-orange-500" size={20} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions Bar */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-3 text-slate-500" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email o departamento..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-brand-secondary border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                        />
                    </div>

                    {/* Buttons Group */}
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                        <button
                            onClick={() => {
                                const appUrl = window.location.origin;
                                const code = league?.accessCodePrefix || league?.code;
                                if (!code) return;
                                const leagueName = league?.companyName || league?.name || 'Polla';
                                const inviteUrl = `${appUrl}/invite/${code}`;
                                const isUCL = tournamentId === 'UCL2526';
                                const message = `¡Hola! Te invito a la Polla ${isUCL ? 'Champions' : 'Mundialista'} de *${leagueName}*. 🏆\n\nÚnete aquí: ${inviteUrl}\nCódigo: *${code}*`;
                                window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                            }}
                            className="px-4 py-3 bg-green-600/20 text-green-400 hover:bg-green-600 hover:text-white font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap border border-green-600/30"
                        >
                            <Share2 size={18} />
                            <span className="hidden md:inline">WhatsApp</span>
                        </button>

                        <button
                            onClick={() => setShowBulkImport(true)}
                            className="px-4 py-3 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap border border-blue-600/30"
                        >
                            <Upload size={18} />
                            <span className="hidden md:inline">Importar</span>
                        </button>

                        <button
                            className="px-4 py-3 bg-brand-primary/20 text-brand-primary hover:bg-brand-primary hover:text-brand-bg font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap border border-brand-primary/30"
                        >
                            <UserPlus size={18} />
                            <span className="hidden md:inline">Agregar</span>
                        </button>
                    </div>
                </div>

                {/* Users Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredParticipants.map((participant) => (
                        <div key={participant.id} className="bg-brand-secondary border border-slate-700 rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden hover:border-brand-primary/30 transition-colors group">
                             {/* Status Indicator Top Right */}
                            <div className="absolute top-4 right-4 flex items-center gap-2">
                                {/* Pago Check */}
                                <div 
                                    className={`relative z-10 cursor-pointer px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-all ${
                                        participant.isPaid 
                                            ? 'bg-green-500/10 border-green-500/50 text-green-400' 
                                            : 'bg-slate-800 border-slate-600 text-slate-500 hover:border-slate-400'
                                    }`}
                                    onClick={() => handleTogglePaid(participant)}
                                    title="Alternar estado de pago"
                                >
                                    {participant.isPaid ? 'PAGADO' : 'NO PAGADO'}
                                </div>
                                
                                {participant.status === 'ACTIVE' && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>}
                                {participant.status === 'BLOCKED' && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
                                {participant.status === 'PENDING' && <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>}
                            </div>

                            {/* User Info */}
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-brand-bg flex items-center justify-center border border-slate-600 overflow-hidden relative">
                                    {participant.user?.avatarUrl ? (
                                        <img src={participant.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-lg font-bold text-slate-400">
                                            {(participant.user?.fullName?.[0] || participant.user?.nickname?.[0] || '?').toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-white truncate max-w-[180px]">
                                        {participant.user?.fullName || participant.user?.nickname || 'Sin nombre'}
                                    </h3>
                                    <p className="text-xs text-slate-400 truncate">{participant.user?.email}</p>
                                    {participant.department && (
                                        <p className="text-xs text-brand-primary mt-0.5 font-medium">{participant.department}</p>
                                    )}
                                </div>
                            </div>

                            {/* Stats & Details */}
                            <div className="grid grid-cols-2 gap-2 py-3 border-y border-slate-700/50">
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Puntos</p>
                                    <p className="text-xl font-black text-white">{participant.points || 0}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Estado</p>
                                    <div className="flex justify-end mt-1">
                                        {participant.status === 'ACTIVE' ? (
                                            <span className="px-2 py-0.5 bg-green-500/10 text-green-400 rounded text-xs font-bold border border-green-500/20">Activo</span>
                                        ) : participant.status === 'BLOCKED' || participant.isBlocked ? (
                                            <span className="px-2 py-0.5 bg-red-500/10 text-red-500 rounded text-xs font-bold border border-red-500/20">Bloqueado</span>
                                        ) : (
                                            <span className="px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded text-xs font-bold border border-orange-500/20">Pendiente</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 mt-auto pt-1">
                                {participant.status === 'PENDING' ? (
                                    <>
                                        <button
                                            onClick={() => handleApproveRequest(participant)}
                                            className="flex-1 h-10 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                                        >
                                            <Check size={18} /> Aprobar
                                        </button>
                                        <button
                                            onClick={() => handleRejectRequest(participant)}
                                            className="h-10 w-10 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-red-500/20 text-slate-300 hover:text-red-400 transition-all border border-slate-600"
                                            title="Rechazar"
                                        >
                                            <X size={18} />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => handleEditClick(participant)}
                                            className="h-10 w-10 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-blue-500 text-slate-300 hover:text-white transition-all border border-slate-600"
                                            title="Editar"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        
                                        <button
                                            onClick={() => handleToggleBlock(participant)}
                                            className={`h-10 w-10 flex items-center justify-center rounded-lg transition-all border border-slate-600 ${
                                                participant.isBlocked || participant.status === 'BLOCKED'
                                                    ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white'
                                                    : 'bg-slate-700 text-slate-300 hover:bg-orange-500 hover:text-white'
                                            }`}
                                            title={participant.isBlocked || participant.status === 'BLOCKED' ? "Desbloquear" : "Bloquear"}
                                        >
                                            {participant.isBlocked || participant.status === 'BLOCKED' ? <Shield size={16} /> : <Ban size={16} />}
                                        </button>

                                        <button
                                            onClick={() => handleDelete(participant)}
                                            className="h-10 w-10 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-red-500 text-slate-300 hover:text-white transition-all border border-slate-600 ml-auto"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                    
                    {filteredParticipants.length === 0 && (
                        <div className="col-span-full py-12 text-center text-slate-500 bg-brand-secondary/50 rounded-2xl border border-slate-800 border-dashed">
                            <p>No se encontraron participantes.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Bulk Import Modal */}
            {showBulkImport && (
                <BulkUserImport
                    leagueId={params.id as string}
                    onClose={() => setShowBulkImport(false)}
                    onSuccess={() => {
                        fetchData();
                        setShowBulkImport(false);
                    }}
                />
            )}

            {/* Edit Participant Modal */}
            {editingParticipant && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-[#1E293B] border border-[#334155] rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-[#334155]">
                            <h2 className="text-xl font-bold text-white">Editar Participante</h2>
                            <button
                                onClick={() => setEditingParticipant(null)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveParticipant} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase">Nombre Completo</label>
                                <input
                                    type="text"
                                    value={editForm.fullName}
                                    onChange={e => setEditForm({ ...editForm, fullName: e.target.value })}
                                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg p-3 text-white focus:border-[#00E676] outline-none"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase">Correo Electrónico</label>
                                <input
                                    type="email"
                                    value={editForm.email}
                                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg p-3 text-white focus:border-[#00E676] outline-none"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase">Departamento / Área</label>
                                <input
                                    type="text"
                                    value={editForm.department}
                                    onChange={e => setEditForm({ ...editForm, department: e.target.value })}
                                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg p-3 text-white focus:border-[#00E676] outline-none"
                                    placeholder="Ej. Ventas"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase">Teléfono / WhatsApp</label>
                                <input
                                    type="text"
                                    value={editForm.phoneNumber}
                                    onChange={e => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg p-3 text-white focus:border-[#00E676] outline-none"
                                    placeholder="+57..."
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setEditingParticipant(null)}
                                    className="flex-1 py-3 bg-[#334155] text-white font-bold rounded-xl hover:bg-[#475569] transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 py-3 bg-[#00E676] text-[#0F172A] font-bold rounded-xl hover:bg-[#00C853] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
