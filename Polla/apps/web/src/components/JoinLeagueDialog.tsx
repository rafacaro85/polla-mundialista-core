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
}

export const JoinLeagueDialog: React.FC<JoinLeagueDialogProps> = ({ onLeagueJoined }) => {
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
                <Button className="bg-carbon border border-slate-600 hover:bg-carbon/80 text-white font-bold">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Unirse
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-carbon border-slate-700 text-white max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-signal font-russo text-center">Unirse a una Liga</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    <div>
                        <Label htmlFor="league-code" className="text-tactical text-center block mb-2">INGRESA EL CÓDIGO DE ACCESO</Label>
                        <div className="flex gap-2">
                            <Input
                                id="league-code"
                                value={code}
                                onChange={(e) => {
                                    setCode(e.target.value.toUpperCase());
                                    if (e.target.value.length === 6) {
                                        // Auto-verify on 6 chars could be nice, but let's stick to manual or effect
                                    }
                                }}
                                placeholder="Ej: ABC123"
                                className="bg-obsidian border-slate-600 text-white font-russo text-center text-2xl tracking-widest h-12"
                                maxLength={6}
                                disabled={loading || !!previewData}
                            />
                            {!previewData && (
                                <Button onClick={handleVerify} disabled={loading || code.length < 6} className="bg-signal text-obsidian font-bold">
                                    VERIFICAR
                                </Button>
                            )}
                            {previewData && (
                                <Button onClick={() => { setPreviewData(null); setCode(''); }} variant="ghost" className="text-red-400">
                                    X
                                </Button>
                            )}
                        </div>
                    </div>

                    {previewData && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="text-center mb-4">
                                <p className="text-tactical text-xs uppercase tracking-widest mb-1">LIGA ENCONTRADA</p>
                                <h3 className="text-xl font-bold text-white">{previewData.name}</h3>
                                <p className="text-slate-400 text-sm">Admin: {previewData.creatorName}</p>
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
                                className="w-full bg-signal text-obsidian hover:bg-signal/90 font-bold h-12 text-lg shadow-[0_0_20px_rgba(0,230,118,0.3)]"
                            >
                                {loading ? 'UNIÉNDOSE...' : '¡UNIRME AHORA!'}
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
