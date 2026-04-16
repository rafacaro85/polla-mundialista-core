"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
    X, Trophy, Check, Loader2, Play
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useTournament } from '@/hooks/useTournament';

interface CreateBusinessLeagueDialogProps {
    children?: React.ReactNode;
    onLeagueCreated?: () => void;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export const CreateBusinessLeagueDialog = ({ 
    onLeagueCreated, 
    children, 
    open: externalOpen, 
    onOpenChange 
}: CreateBusinessLeagueDialogProps) => {
    const { tournamentId: hookTournamentId } = useTournament();
    const router = useRouter();
    const [internalOpen, setInternalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form State
    const [leagueName, setLeagueName] = useState('');

    const isControlled = externalOpen !== undefined;
    const isOpen = isControlled ? externalOpen : internalOpen;
    
    const setIsOpen = (val: boolean) => {
        if (isControlled && onOpenChange) {
            onOpenChange(val);
        } else {
            setInternalOpen(val);
        }
    };

    const closeDialog = () => {
        setIsOpen(false);
        // Reset state after closing
        setTimeout(() => {
            setLoading(false);
            setLeagueName('');
        }, 300);
    };

    const handleCreateLeague = async () => {
        if (!leagueName.trim()) {
            toast.error('El nombre de la polla es obligatorio');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                name: leagueName,
                adminName: 'Admin',
                adminPhone: '0000000000',
                type: 'COMPANY',
                isEnterprise: true,
                packageType: 'MATCH',
                maxParticipants: 500,
                companyName: leagueName
            };

            const { data } = await api.post('/leagues', payload);
            
            toast.success('¡Polla Match Creada!', { description: 'Redirigiendo al Studio...' });
            
            if (onLeagueCreated) {
                onLeagueCreated();
            }

            setTimeout(() => {
                router.push(`/leagues/${data.id}/studio`);
                closeDialog();
            }, 1000);
            
        } catch (error: any) {
            let errorMsg = 'Error al crear la polla MATCH';
            if (error.response?.data?.message) {
                const msg = error.response.data.message;
                errorMsg = Array.isArray(msg) ? msg.join(' | ') : msg;
            }
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const STYLES = {
        overlay: "fixed inset-0 bg-[#0F172A]/90 backdrop-blur-md z-[100] flex items-center justify-center p-4",
        modal: "bg-[#1E293B] border border-[#334155] rounded-[32px] w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative",
        header: "p-6 border-b border-[#334155] flex justify-between items-center bg-[#1E293B] sticky top-0 z-10",
        body: "p-6 overflow-y-auto flex-1 custom-scrollbar",
        footer: "p-6 border-t border-[#334155] flex gap-4 bg-[#1E293B] sticky bottom-0 z-10",
        input: "w-full bg-[#0F172A] border-[#334155] focus:border-[#00E676] rounded-xl px-4 py-3 text-white placeholder:text-[#64748B] outline-none transition-all font-medium",
        label: "block text-[#94A3B8] text-[10px] font-bold uppercase tracking-wider mb-2 ml-1",
        btnPrimary: "flex-1 bg-[#00E676] hover:bg-[#00C853] text-[#0F172A] font-black uppercase py-4 rounded-xl shadow-lg shadow-[#00E676]/20 transition-all flex items-center justify-center gap-2 relative overflow-hidden",
    };

    if (!isOpen) {
        return <div onClick={() => setIsOpen(true)}>{children}</div>;
    }

    return (
        <div className={STYLES.overlay}>
            <div className={STYLES.modal}>
                <div className={STYLES.header}>
                    <div className="flex items-center gap-4">
                        <div className="bg-[#00E676]/10 p-2 rounded-xl text-[#00E676]">
                            <Trophy size={24} />
                        </div>
                        <div>
                            <h2 className="text-white font-russo text-xl uppercase leading-none">
                                Crear Polla Match
                            </h2>
                            <p className="text-[#94A3B8] text-[10px] font-bold uppercase tracking-widest mt-1">
                                Configuración Rápida
                            </p>
                        </div>
                    </div>
                    <button onClick={closeDialog} className="text-[#64748B] hover:text-white p-2">
                        <X size={20} />
                    </button>
                </div>

                <div className={STYLES.body}>
                    <div className="space-y-6">
                        {/* DATOS */}
                        <div>
                            <label className={STYLES.label}>Nombre de tu Polla Match</label>
                            <div className="relative">
                                <Trophy className="absolute left-4 top-1/2 -translate-y-1/2 text-[#475569] h-5 w-5" />
                                <input 
                                    className={`${STYLES.input} pl-12`}
                                    placeholder="Ej: Match Bar Central, Evento Tech..."
                                    value={leagueName}
                                    onChange={(e) => setLeagueName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>

                    </div>
                </div>

                <div className={STYLES.footer}>
                    <button 
                        onClick={handleCreateLeague}
                        className={STYLES.btnPrimary}
                        disabled={loading || !leagueName.trim()}
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <>
                                Crear y Activar <Play size={18} fill="currentColor" />
                            </>
                        )}
                    </button>
                </div>
            </div>
            
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #334155;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #475569;
                }
            `}</style>
        </div>
    );
};
