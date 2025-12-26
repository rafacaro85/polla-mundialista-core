"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface InviteHandlerProps {
    code: string;
}

export default function InviteHandler({ code }: InviteHandlerProps) {
    const router = useRouter();
    const [status, setStatus] = useState<'verifying' | 'joining' | 'input-required'>('verifying');
    const [previewData, setPreviewData] = useState<any>(null);
    const [department, setDepartment] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const verifyAndJoin = async () => {
            try {
                // 1. Verificar el código para saber qué tipo de liga es
                const { data } = await api.get(`/leagues/preview/${code}`);
                setPreviewData(data);

                // 2. Si es empresa, pedir departamento (detener auto-join)
                if (data.isEnterprise) {
                    setStatus('input-required');
                    return;
                }

                // 3. Si es normal, unirse directo
                setStatus('joining');
                await joinLeague(code);

            } catch (error: any) {
                console.error(error);
                // Si falla la previsualización, probablemente el código no existe
                toast.error('El enlace de invitación no es válido o ha expirado.');
                router.push('/dashboard');
            }
        };

        verifyAndJoin();
    }, [code, router]);

    const joinLeague = async (leagueCode: string, dept?: string) => {
        try {
            const { data } = await api.post('/leagues/join', {
                code: leagueCode,
                department: dept
            });

            toast.success(`¡Bienvenido a ${previewData?.name || 'la polla'}!`);

            // Limpiar invitación pendiente
            localStorage.removeItem('pendingInviteCode');
            document.cookie = "pendingInviteCode=; path=/; max-age=0";

            // Redirigir a la liga específica
            const targetUrl = `/leagues/${data.leagueId}`;

            // Fallback por si la respuesta no trae leagueId, usar dashboard general
            router.push(data.leagueId ? targetUrl : '/dashboard');

        } catch (error: any) {
            console.error('Join Error:', error);
            const msg = error.response?.data?.message || 'Error desconocido';

            // Manejar caso "Ya unido"
            if (msg.includes('ya eres miembro') || msg.includes('already a member')) {
                toast.info('Ya eres miembro de esta polla.');
                router.push('/dashboard');
                return;
            }

            // Mostrar error en pantalla en lugar de redirigir
            setStatus('error' as any); // Type cast rápido o actualizar estado
            setPreviewData((prev: any) => ({ ...prev, error: msg }));
        }
    };

    const handleEnterpriseSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!department.trim()) {
            toast.error('Por favor ingresa tu departamento/área');
            return;
        }
        setLoading(true);
        await joinLeague(code, department);
        setLoading(false);
    };

    if (status === 'error' as any) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0F172A] p-4">
                <div className="max-w-md w-full bg-[#1E293B] rounded-2xl p-8 border border-red-500/30 text-center shadow-2xl relative">
                    <div className="bg-red-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                        <span className="text-3xl">⚠️</span>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Hubo un problema</h2>
                    <p className="text-slate-300 mb-6">{previewData?.error || 'No pudimos unirte a la polla.'}</p>
                    <Button
                        onClick={() => router.push('/dashboard')}
                        className="w-full bg-slate-700 hover:bg-slate-600 text-white"
                    >
                        Ir al Inicio
                    </Button>
                </div>
            </div>
        );
    }

    if (status === 'input-required' && previewData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0F172A] p-4">
                <div className="max-w-md w-full bg-[#1E293B] rounded-2xl p-8 border border-[#334155] shadow-2xl">
                    <div className="text-center mb-6">
                        <div className="bg-[#00E676]/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#00E676]/20">
                            <Building2 className="w-8 h-8 text-[#00E676]" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">{previewData.name}</h2>
                        <p className="text-slate-400">Te estás uniendo a la polla corporativa de <span className="text-white font-medium">{previewData.companyName || 'tu empresa'}</span>.</p>
                    </div>

                    <form onSubmit={handleEnterpriseSubmit} className="space-y-4">
                        <div>
                            <Label className="text-slate-300 mb-1.5 block">Departamento / Área</Label>
                            <Input
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                                placeholder="Ej. Ventas, IT, Marketing..."
                                className="bg-[#0F172A] border-[#334155] text-white focus:ring-[#00E676] focus:border-[#00E676]"
                                autoFocus
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#00E676] hover:bg-[#00C853] text-[#0F172A] font-bold h-12 text-lg"
                        >
                            {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                            {loading ? 'Uniéndote...' : 'Completar Registro'}
                        </Button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0F172A] text-white space-y-6">
            <Loader2 className="w-12 h-12 text-[#00E676] animate-spin" />
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">
                    {status === 'verifying' ? 'Verificando invitación...' : 'Uniéndote a la polla...'}
                </h2>
                <p className="text-slate-400">Por favor espera un momento.</p>
            </div>
        </div>
    );
}
