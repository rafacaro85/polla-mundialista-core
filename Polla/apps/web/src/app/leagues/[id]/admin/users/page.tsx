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
    Edit2, // Added
    X, // Added
    Save // Added
} from 'lucide-react';
import api from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { BulkUserImport } from '@/components/admin/BulkUserImport';

export default function AdminUsersPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAppStore();
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
        } catch (error) {
            console.error('Error deleting participant:', error);
            alert('Error al eliminar usuario.');
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-brand-secondary border border-slate-700 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm mb-1">Total Participantes</p>
                                <p className="text-3xl font-bold text-white">{stats.total}</p>
                            </div>
                            <div className="p-3 bg-blue-500/10 rounded-lg">
                                <Users className="text-blue-400" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-brand-secondary border border-slate-700 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm mb-1">Activos</p>
                                <p className="text-3xl font-bold text-green-400">{stats.active}</p>
                            </div>
                            <div className="p-3 bg-green-500/10 rounded-lg">
                                <Shield className="text-green-400" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-brand-secondary border border-slate-700 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm mb-1">Pendientes</p>
                                <p className="text-3xl font-bold text-orange-400">{stats.pending}</p>
                            </div>
                            <div className="p-3 bg-orange-500/10 rounded-lg">
                                <Ban className="text-orange-400" size={24} />
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

                    {/* WhatsApp Invitation Button */}
                    <button
                        onClick={() => {
                            const appUrl = window.location.origin;
                            const code = league?.accessCodePrefix || league?.code;

                            if (!code) {
                                console.error('Falta el código de acceso en la liga:', league);
                                alert('Error: No se encontró el código de invitación para esta liga. Por favor recarga la página.');
                                return;
                            }

                            const leagueName = league?.companyName || league?.name || 'Polla Mundialista';
                            const inviteUrl = `${appUrl}/invite/${code}`;

                            // Formato mejorado para WhatsApp
                            const message = `¡Hola! Te invito a la Polla Mundialista de *${leagueName}*. 🏆\n\n` +
                                `Únete fácilmente dando clic aquí:\n👉 ${inviteUrl}\n\n` +
                                `O usa el código de acceso: *${code}*`;

                            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                            window.open(whatsappUrl, '_blank');
                        }}
                        disabled={loading}
                        className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Share2 size={20} />
                        Invitar por WhatsApp
                    </button>

                    {/* Bulk Import Button */}
                    <button
                        onClick={() => setShowBulkImport(true)}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
                    >
                        <Upload size={20} />
                        Importar Excel
                    </button>

                    {/* Add Single User */}
                    <button
                        className="px-6 py-3 bg-brand-primary hover:bg-brand-primary/80 text-brand-bg font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                        <UserPlus size={20} />
                        Agregar Usuario
                    </button>
                </div>

                {/* Users Table */}
                <div className="bg-brand-secondary border border-slate-700 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-brand-bg border-b border-slate-700">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        Usuario
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        Departamento
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        Puntos
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        Estado
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {filteredParticipants.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                            {searchTerm ? 'No se encontraron usuarios' : 'No hay participantes aún'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredParticipants.map((participant) => (
                                        <tr key={participant.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-bold text-white">
                                                        {participant.user?.fullName || participant.user?.nickname || 'Sin nombre'}
                                                    </p>
                                                    <p className="text-sm text-slate-500">{participant.user?.email}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-slate-300">
                                                    {participant.department || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-white font-bold">{participant.points || 0}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {participant.status === 'ACTIVE' ? (
                                                    <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-xs font-bold">
                                                        Activo
                                                    </span>
                                                ) : participant.status === 'BLOCKED' ? (
                                                    <span className="px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-xs font-bold">
                                                        Bloqueado
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-orange-500/10 text-orange-400 rounded-full text-xs font-bold">
                                                        Pendiente
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    {/* Editar */}
                                                    <button
                                                        onClick={() => handleEditClick(participant)}
                                                        className="p-2 bg-slate-700/50 hover:bg-brand-primary/20 text-slate-400 hover:text-brand-primary rounded-lg transition-colors"
                                                        title="Editar Información"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>

                                                    {/* Bloquear / Desbloquear */}
                                                    <button
                                                        onClick={() => handleToggleBlock(participant)}
                                                        className={`p-2 rounded-lg transition-colors ${participant.isBlocked || participant.status === 'BLOCKED' ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20'}`}
                                                        title={participant.isBlocked || participant.status === 'BLOCKED' ? "Desbloquear Usuario" : "Bloquear Usuario"}
                                                    >
                                                        {participant.isBlocked || participant.status === 'BLOCKED' ? <Shield size={18} /> : <Ban size={18} />}
                                                    </button>

                                                    {/* Eliminar */}
                                                    <button
                                                        onClick={() => handleDelete(participant)}
                                                        className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                                        title="Expulsar de la Liga"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
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
