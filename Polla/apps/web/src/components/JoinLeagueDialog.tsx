"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';
import PrizeCard from './PrizeCard';

interface JoinLeagueDialogProps {
    onLeagueJoined: () => void;
    children?: React.ReactNode;
}

export const JoinLeagueDialog: React.FC<JoinLeagueDialogProps> = ({ onLeagueJoined, children }) => {
    const [open, setOpen] = useState(false);
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [previewData, setPreviewData] = useState<any>(null);

    const handleVerify = async () => {
        if (!code.trim()) return;
        setLoading(true);
        try {
            const { data } = await api.get(`/leagues/preview/${code.trim().toUpperCase()}`);
            setPreviewData(data);
        } catch (error) {
            setPreviewData(null);
            toast.error('Liga no encontrada');
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async () => {
        if (!code.trim()) {
            toast.error('Por favor ingresa un código');
            return;
        }

        setLoading(true);
        try {
            await api.post('/leagues/join', { code: code.trim().toUpperCase() });
            toast.success('¡Te has unido a la liga!');
            await onLeagueJoined();
            setOpen(false);
            setCode('');
            setPreviewData(null);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Código inválido o liga llena');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) { setPreviewData(null); setCode(''); } }}>
            <DialogTrigger asChild>
                {children || (
                    <Button className="bg-carbon border border-slate-600 hover:bg-carbon/80 text-white font-bold">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Unirse
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="bg-[#0F172A] border-[#334155] text-white max-w-md p-0 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <div className="bg-gradient-to-b from-[#1E293B] to-[#0F172A] p-8 text-center border-b border-[#334155] relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00E676] to-transparent opacity-70"></div>
                    <DialogTitle className="text-2xl font-russo uppercase text-white tracking-wider drop-shadow-lg">
                        Unirse a una <span className="text-[#00E676]">Polla</span>
                    </DialogTitle>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-2">
                        Ingresa el código de acceso
                    </p>
                </div>

                <div className="p-6 space-y-6 bg-[#0F172A]">
                    <div>
                        <div className="flex gap-2 relative">
                            <Input
                                id="league-code"
                                value={code}
                                onChange={(e) => {
                                    setCode(e.target.value.toUpperCase());
                                    if (e.target.value.length === 6) {
                                        // Auto-verify optional
                                    }
                                }}
                                placeholder="CÓDIGO"
                                className="bg-[#1E293B] border-[#334155] text-white font-russo text-center text-3xl tracking-[0.3em] h-16 rounded-xl focus:border-[#00E676] focus:ring-[#00E676] transition-all placeholder:tracking-normal placeholder:text-slate-600 placeholder:text-lg"
                                maxLength={6}
                                disabled={loading || !!previewData}
                            />
                            {previewData && (
                                <Button
                                    onClick={() => { setPreviewData(null); setCode(''); }}
                                    variant="ghost"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-red-400 hover:text-red-300 hover:bg-transparent h-8 w-8 rounded-full"
                                >
                                    ✕
                                </Button>
                            )}
                        </div>

                        {!previewData && (
                            <Button
                                onClick={handleVerify}
                                disabled={loading || code.length < 6}
                                className="w-full mt-4 bg-[#334155] hover:bg-[#475569] text-white font-bold h-10 tracking-widest text-xs rounded-lg transition-all"
                            >
                                {loading ? 'VERIFICANDO...' : 'VERIFICAR CÓDIGO'}
                            </Button>
                        )}
                    </div>

                    {previewData && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-[#1E293B]/50 rounded-xl p-4 border border-[#334155]">
                            <div className="text-center mb-4">
                                <p className="text-[#00E676] text-[10px] bg-[#00E676]/10 inline-block px-3 py-1 rounded-full font-bold uppercase tracking-widest mb-3 border border-[#00E676]/20">Polla Encontrada</p>
                                <h3 className="text-2xl font-russo text-white mb-1">{previewData.name}</h3>
                                <p className="text-slate-400 text-xs font-bold uppercase">Admin: <span className="text-white">{previewData.creatorName}</span></p>
                            </div>

                            {(previewData.prizeImageUrl || previewData.prizeDetails) && (
                                <div className="mb-4">
                                    <PrizeCard
                                        imageUrl={previewData.prizeImageUrl}
                                        description={previewData.prizeDetails}
                                        logoUrl={previewData.brandingLogoUrl}
                                    />
                                </div>
                            )}

                            <Button
                                onClick={handleJoin}
                                disabled={loading}
                                className="w-full bg-[#00E676] text-[#0F172A] hover:bg-[#00C853] font-black h-12 text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(0,230,118,0.2)] rounded-xl transform hover:scale-[1.02] transition-all"
                            >
                                {loading ? 'UNIÉNDOSE...' : '¡ENTRAR A LA POLLA!'}
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
