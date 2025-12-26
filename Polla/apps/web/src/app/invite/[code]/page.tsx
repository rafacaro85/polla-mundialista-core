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
            const token = localStorage.getItem('token');
            if (!token) {
                // No token -> Redirect to Login
                const code = params?.code ? String(params.code) : '';
                if (code) {
                    localStorage.setItem('pendingInviteCode', code);
                    const callbackUrl = `/invite/${code}`;
                    router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
                } else {
                    router.push('/login');
                }
                return;
            }

            // If we have token but no user in store, try to sync
            if (!user) {
                try {
                    await syncUserFromServer();
                } catch (error) {
                    console.error("Auth Check Error:", error);
                    // Token might be invalid
                    router.push('/login');
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
