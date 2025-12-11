'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Loader2, ShieldAlert } from 'lucide-react';
import { AdminLeagueSettings } from '@/components/AdminLeagueSettings';

// In a real server component we would fetch data here.
// Since we are using client components for 'api' lib mostly, we will use a client wrapper for security 
// OR we can make this page.tsx client side
import { AdminLeagueSettings } from '@/components/AdminLeagueSettings';

export default function LeagueAdminPage() {
    const params = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [league, setLeague] = useState<any>(null);

    useEffect(() => {
        const checkAccess = async () => {
            try {
                // Fetch league to check role
                const { data: myLeagues } = await api.get('/leagues/my');
                const found = myLeagues.find((l: any) => l.id === params.id);

                if (!found) {
                    router.push('/dashboard');
                    return;
                }

                if (!found.isAdmin) {
                    // SECURITY REDIRECT
                    router.push(`/leagues/${params.id}`);
                    return;
                }

                setLeague(found);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        checkAccess();
    }, [params.id, router]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>;
    }

    if (!league) return null;

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <div className="mb-8 border-b border-slate-700 pb-4">
                <h1 className="text-3xl font-russo text-white uppercase flex items-center gap-3">
                    <ShieldAlert className="text-red-500" />
                    Panel de Administración
                </h1>
                <p className="text-slate-400 mt-2">
                    Configuración avanzada para <span className="text-white font-bold">{league.name}</span>
                </p>
            </div>

            {/* Reuse the existing Admin Settings Component which contains Tabs for Branding, Users, etc. */}
            <AdminLeagueSettings
                league={league}
                onUpdate={() => window.location.reload()} // Simple reload on update for now
                trigger={<></>} // No trigger needed, rendered directly
            />
        </div>
    );
}
