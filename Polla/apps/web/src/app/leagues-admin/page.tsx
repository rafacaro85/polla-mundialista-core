"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
// Asumo que Header y Sidebar existen o se usan en Layout.
// Si no, improviso un header simple o uso el layout global dashboard
import { Settings, Users, Trophy } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export default function LeaguesAdminListPage() {
    const router = useRouter();
    const { user } = useAppStore();
    const [leagues, setLeagues] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAmindLeagues = async () => {
            try {
                setLoading(true);
                const { data } = await api.get('/leagues/my');
                // Filtrar solo las que soy Admin (isAdmin = true)
                const adminLeagues = data.filter((l: any) => l.isAdmin);
                setLeagues(adminLeagues);
            } catch (error) {
                console.error('Error fetching leagues', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchAmindLeagues();
        }
    }, [user]);

    return (
        <div className="min-h-screen bg-[#0F172A] pb-20">
            {/* Header simple */}
            <div className="bg-[#1E293B] border-b border-slate-700 p-4 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-2 text-white">
                    <Settings className="text-emerald-500" />
                    <h1 className="font-bold font-russo text-lg">PANEL ADMIN POLLAS</h1>
                </div>
                <button onClick={() => router.push('/dashboard')} className="text-xs text-slate-400 hover:text-white">
                    Volver al Dashboard
                </button>
            </div>

            <div className="p-4 max-w-md mx-auto space-y-4">
                <p className="text-slate-400 text-sm mb-4">
                    Selecciona una polla para gestionar sus configuraciones, premios y participantes.
                </p>

                {loading ? (
                    <div className="text-center text-slate-500 py-10">Cargando tus pollas...</div>
                ) : leagues.length === 0 ? (
                    <div className="text-center bg-[#1E293B] p-8 rounded-2xl border border-slate-700">
                        <Trophy className="mx-auto text-slate-600 mb-2 h-10 w-10" />
                        <h3 className="text-white font-bold">No administras ninguna polla</h3>
                        <p className="text-slate-500 text-xs mt-2">Crea una nueva polla para comenzar.</p>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="mt-4 bg-emerald-500 text-[#0F172A] font-bold py-2 px-6 rounded-full text-xs"
                        >
                            Crear Polla
                        </button>
                    </div>
                ) : (
                    leagues.map((league) => (
                        <div
                            key={league.id}
                            className="bg-[#1E293B] border border-slate-700 rounded-xl p-4 flex flex-col gap-4 shadow-lg hover:border-emerald-500/50 transition-all cursor-pointer"
                            onClick={() => router.push(`/league-admin/${league.id}`)}
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-[#0F172A] rounded-lg border border-slate-600 flex items-center justify-center shrink-0">
                                    <span className="font-russo text-slate-400 text-xl">{league.name.charAt(0).toUpperCase()}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-white font-bold truncate">{league.name}</h3>
                                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                                        <span className="flex items-center gap-1"><Users size={10} /> {league.members || league.participantCount || 0} Miembros</span>
                                        <span className="text-emerald-500 font-bold px-2 py-0.5 bg-emerald-500/10 rounded-full text-[10px]">ADMIN</span>
                                    </div>
                                </div>
                                <Settings className="text-slate-500" size={20} />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
