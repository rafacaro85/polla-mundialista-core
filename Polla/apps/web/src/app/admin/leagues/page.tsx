'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Building2, Users, TrendingUp, Search, Filter, Settings } from 'lucide-react';
import api from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { CreateEnterpriseLeagueForm } from '@/components/admin/CreateEnterpriseLeagueForm';

export default function AdminLeaguesPage() {
    const router = useRouter();
    const { user } = useAppStore();
    const [loading, setLoading] = useState(true);
    const [leagues, setLeagues] = useState<any[]>([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // Check if user is Super Admin
        if (user && user.role !== 'SUPER_ADMIN') {
            router.push('/dashboard');
            return;
        }

        fetchLeagues();
    }, [user, router]);

    const fetchLeagues = async () => {
        try {
            const { data } = await api.get('/admin/leagues'); // You'll need to create this endpoint
            setLeagues(data);
        } catch (error) {
            console.error('Error fetching leagues:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLeagues = leagues.filter(league =>
        league.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        league.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = {
        total: leagues.length,
        active: leagues.filter(l => l.isEnterpriseActive).length,
        participants: leagues.reduce((sum, l) => sum + (l.participantCount || 0), 0),
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0F172A] text-white">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                        <Building2 className="text-indigo-400" size={32} />
                        Gestión de Empresas B2B
                    </h1>
                    <p className="text-slate-400">
                        Panel de control para crear y administrar clientes corporativos
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-[#1E293B] border border-slate-700 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm mb-1">Total Empresas</p>
                                <p className="text-3xl font-bold text-white">{stats.total}</p>
                            </div>
                            <div className="p-3 bg-indigo-500/10 rounded-lg">
                                <Building2 className="text-indigo-400" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#1E293B] border border-slate-700 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm mb-1">Activas</p>
                                <p className="text-3xl font-bold text-green-400">{stats.active}</p>
                            </div>
                            <div className="p-3 bg-green-500/10 rounded-lg">
                                <TrendingUp className="text-green-400" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#1E293B] border border-slate-700 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm mb-1">Participantes</p>
                                <p className="text-3xl font-bold text-blue-400">{stats.participants}</p>
                            </div>
                            <div className="p-3 bg-blue-500/10 rounded-lg">
                                <Users className="text-blue-400" size={24} />
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
                            placeholder="Buscar por nombre de empresa..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-[#1E293B] border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                        />
                    </div>

                    {/* Create Button */}
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30"
                    >
                        <Plus size={20} />
                        Nueva Empresa
                    </button>
                </div>

                {/* Leagues Table */}
                <div className="bg-[#1E293B] border border-slate-700 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#0F172A] border-b border-slate-700">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        Empresa
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        Plan
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        Participantes
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
                                {filteredLeagues.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                            {searchTerm ? 'No se encontraron empresas' : 'No hay empresas creadas aún'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLeagues.map((league) => (
                                        <tr key={league.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-bold text-white">{league.companyName || league.name}</p>
                                                    <p className="text-sm text-slate-500">/{league.accessCodePrefix}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-bold">
                                                    {league.packageType || 'BASIC'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-white font-bold">{league.participantCount || 0}</span>
                                                <span className="text-slate-500 text-sm"> / {league.maxParticipants}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {league.isEnterpriseActive ? (
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
                                                <button
                                                    onClick={() => router.push(`/leagues/${league.id}/admin`)}
                                                    className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20"
                                                >
                                                    <Settings size={16} />
                                                    Gestionar
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

            {/* Create Form Modal */}
            {showCreateForm && (
                <CreateEnterpriseLeagueForm
                    onClose={() => setShowCreateForm(false)}
                    onSuccess={fetchLeagues}
                />
            )}
        </div>
    );
}
