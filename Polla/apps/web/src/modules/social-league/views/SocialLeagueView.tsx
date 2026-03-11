'use client';
import React, { useEffect, useState } from 'react';
import { DashboardClient } from '@/components/DashboardClient';
import api from '@/lib/api';
import { Loader2, Shield } from 'lucide-react';
import { PaymentLockOverlay } from '@/components/dashboard/PaymentLockOverlay';
import { Button } from '@/components/ui/button';

export const SocialLeagueView = ({ leagueId }: { leagueId: string }) => {
    const [league, setLeague] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const { data } = await api.get(`/leagues/${leagueId}`);
                setLeague(data);
            } catch (e) {
                console.error('[SocialLeagueView] Error cargando liga:', e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [leagueId]);

    // Spinner mientras carga
    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0F172A]">
                <Loader2 className="animate-spin text-white" />
            </div>
        );
    }

    // PENDING_PAYMENT: mostrar módulo de pago directamente
    if (league?.userStatus === 'PENDING_PAYMENT' || league?.userStatus === 'REJECTED') {
        const type = (league.packageType || '').toLowerCase();
        const amount =
            type === 'parche' || type === 'amateur' ? 30000 :
            type === 'amigos' || type === 'semi-pro' ? 80000 :
            type === 'lider' || type === 'pro' ? 180000 :
            type === 'influencer' || type === 'elite' ? 350000 :
            50000;

        return (
            <div className="fixed inset-0 z-[9999] bg-[#0F172A] flex flex-col items-center justify-start overflow-y-auto">
                <PaymentLockOverlay
                    leagueName={league.name}
                    leagueId={league.id}
                    amount={amount}
                    packageId={league.packageType}
                />
            </div>
        );
    }

    // PENDING: solicitud enviada, esperando aprobación
    if (league?.userStatus === 'PENDING') {
        return (
            <div className="fixed inset-0 z-[9999] bg-[#0F172A]/90 backdrop-blur-sm flex items-start justify-center pt-24 p-6 text-center">
                <div className="bg-[#1E293B] border border-white/10 p-8 rounded-3xl shadow-2xl max-w-sm w-full relative overflow-hidden flex flex-col items-center justify-center">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-50"></div>
                    <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-orange-500/20">
                        <Shield className="w-8 h-8 text-orange-500" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2 uppercase italic tracking-tight">
                        SOLICITUD <span className="text-orange-500">RECIBIDA</span>
                    </h2>
                    <p className="text-slate-400 mb-6 text-sm leading-relaxed">
                        Tu solicitud para unirte a <span className="text-white font-bold">{league.name}</span> ha sido recibida exitosamente.
                    </p>
                    <div className="bg-orange-500/5 border border-orange-500/10 rounded-2xl p-4 mb-6">
                        <p className="text-xs text-orange-500 font-bold uppercase tracking-widest">Estado: Pendiente de Activación</p>
                        <p className="text-[10px] text-slate-500 mt-1">El administrador debe confirmar tu ingreso para que puedas empezar a jugar.</p>
                    </div>
                    <Button
                        variant="outline"
                        className="bg-transparent border-white/10 text-slate-300 hover:bg-white/5 hover:text-white w-full"
                        onClick={() => window.location.href = '/social/mis-pollas'}
                    >
                        Ir a Mis Pollas
                    </Button>
                </div>
            </div>
        );
    }

    // ACTIVE u otro estado: renderizar normalmente
    return (
        <div className="w-full min-h-screen bg-[#0F172A]">
            <DashboardClient defaultLeagueId={leagueId} initialTab="home" />
        </div>
    );
};
