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
            // Con httpOnly cookies, no podemos verificar el token desde JS.
            // Intentamos sincronizar el usuario desde el servidor (enviará la cookie automáticamente).
            if (!user) {
                try {
                    await syncUserFromServer();
                } catch {
                    // Sin sesión activa → redirigir al login con el código de invitación
                    const code = params?.code ? String(params.code) : '';
                    if (code) {
                        document.cookie = `pendingInviteCode=${code}; path=/; max-age=3600; SameSite=Lax`;
                        const callbackUrl = `/invite/${code}`;
                        router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
                    } else {
                        router.push('/login');
                    }
                    return;
                }
            }

            setChecked(true);
        };

        checkAuth();
    }, [user, syncUserFromServer, router, params]);

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
