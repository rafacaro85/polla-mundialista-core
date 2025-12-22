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
    Share2
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
                            const code = league?.accessCodePrefix || '';
                            const leagueName = league?.companyName || league?.name || 'Polla';
                            const message = `¡Únete a nuestra Polla Mundialista 2026! 🏆\n\n` +
                                `Polla: ${leagueName}\n` +
                                `Código: ${code}\n\n` +
                                `Regístrate aquí: ${appUrl}/login`;
                            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                            window.open(whatsappUrl, '_blank');
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/30"
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
                                                ) : (
                                                    <span className="px-3 py-1 bg-orange-500/10 text-orange-400 rounded-full text-xs font-bold">
                                                        Pendiente
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button className="text-slate-400 hover:text-white transition-colors">
                                                    <MoreVertical size={20} />
                                                </button>
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
        </div>
    );
}
