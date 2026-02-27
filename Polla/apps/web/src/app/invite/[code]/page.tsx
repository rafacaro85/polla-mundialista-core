"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import InviteHandler from '@/components/InviteHandler';
import { Loader2 } from 'lucide-react';

export default function InvitePage() {
    const params = useParams();
    const router = useRouter();
    const { user, syncUserFromServer } = useAppStore();
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            // Evaluamos la sesión contra el servidor sin importar el localStorage
            const isAuth = await syncUserFromServer();
            
            if (!isAuth) {
                // Sin sesión activa → redirigir al login con el código
                const code = params?.code ? String(params.code) : '';
                if (code) {
                    document.cookie = `pendingInviteCode=${code}; path=/; max-age=3600; SameSite=Lax`;
                    const callbackUrl = encodeURIComponent(`/invite/${code}`);
                    router.push(`/login?callbackUrl=${callbackUrl}`);
                } else {
                    router.push('/login');
                }
                return;
            }

            setChecked(true);
        };

        checkAuth();
    }, [syncUserFromServer, router, params]);

    if (!checked) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0F172A]">
                <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
            </div>
        );
    }

    // Safely cast params.code
    const code = params?.code ? String(params.code) : '';

    return <InviteHandler code={code} />;
}
