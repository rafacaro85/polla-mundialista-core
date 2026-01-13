import React from 'react';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';

interface PendingInviteBannerProps {
    inviteCode: string;
    onDiscard: () => void;
    onProcess: () => void;
}

export const PendingInviteBanner: React.FC<PendingInviteBannerProps> = ({ inviteCode, onDiscard, onProcess }) => {
    return (
        <div className="bg-indigo-600 text-white p-4 mx-4 mt-4 rounded-xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 z-50 relative">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-full">
                    <PlusIcon className="w-6 h-6" />
                </div>
                <div>
                    <p className="font-bold">Tienes una invitación pendiente</p>
                    <p className="text-sm text-indigo-100">Código: {inviteCode}</p>
                </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
                <Button onClick={onDiscard} variant="ghost" className="flex-1 md:flex-none text-white hover:bg-white/20 hover:text-white">Ignorar</Button>
                <Button onClick={onProcess} className="flex-1 md:flex-none bg-white text-indigo-700 hover:bg-slate-100 font-bold">Ver Invitación</Button>
            </div>
        </div>
    );
};
