import React from 'react';
import { Lock, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EnterpriseLockProps {
    featureName: string;
}

export function EnterpriseLock({ featureName }: EnterpriseLockProps) {
    const handleContactSupport = () => {
        const text = `Hola, quiero activar las funciones Enterprise (${featureName}) para mi liga.`;
        window.open(`https://wa.me/573105973421?text=${encodeURIComponent(text)}`, '_blank');
    };

    return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-[#0F172A] border border-slate-800 rounded-xl m-4">
            <div className="bg-amber-500/10 p-4 rounded-full mb-4 ring-1 ring-amber-500/50">
                <Crown className="w-12 h-12 text-amber-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Función Enterprise Requerida</h3>
            <p className="text-sm text-slate-400 max-w-xs mb-6">
                El módulo de <span className="text-white font-bold">{featureName}</span> está reservado para cuentas verificadas.
            </p>
            <Button
                onClick={handleContactSupport}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold shadow-lg shadow-orange-500/20"
            >
                Activar Ahora vía WhatsApp
            </Button>
        </div>
    );
}
