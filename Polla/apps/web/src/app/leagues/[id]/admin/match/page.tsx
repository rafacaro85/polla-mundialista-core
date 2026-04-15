'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import { MatchAdminPanel } from '@/components/admin/MatchAdminPanel';

export default function LeagueMatchAdminPage() {
    const params = useParams();
    const router = useRouter();
    const [league, setLeague] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const loadLeague = async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/leagues/${params.id}`);
            
            // Allow admin or someone checking as super admin access (API controls safety)
            setLeague(data);
        } catch (error) {
            router.push('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLeague();
    }, [params.id, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-brand-bg flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-primary border-t-transparent" />
            </div>
        );
    }

    if (!league) return null;

    return (
        <div className="min-h-screen bg-brand-bg text-brand-text">
            <div className="max-w-5xl mx-auto px-4 py-8">
                <div className="flex items-center gap-4 mb-8">
                    <button 
                        onClick={() => router.push(`/leagues/${params.id}/admin`)}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black italic uppercase tracking-wider text-white">
                            🎯 MODO MATCH
                        </h1>
                        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">
                            Panel Táctico Local
                        </p>
                    </div>
                </div>

                <div className="bg-[#0F172A] border border-slate-700/50 p-6 rounded-2xl shadow-xl">
                    <MatchAdminPanel league={league} onUpdate={loadLeague} />
                </div>
            </div>
        </div>
    );
}
