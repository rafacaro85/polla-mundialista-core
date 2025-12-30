import React from 'react';
import Image from 'next/image';
import { Trophy } from 'lucide-react';

export const PrizeHero = ({ league }: { league: any }) => {
    // Si no hay imagen ni detalles, no mostramos nada grande.
    // O mostramos un estado "Por Definir" si es Enterprise activo pero no configurado.
    if (!league) return null;

    if (!league) return null;

    // Si tiene imagen o detalles, lo mostramos, independientemente del tipo.
    // Si es Enterprise, se mantiene el soporte. Si es Normal y tiene premio configurado, también.
    const hasPrizeBytes = league.prizeImageUrl || league.prizeDetails;
    const isEnterprise = league.type === 'COMPANY' || league.isEnterprise;

    if (!hasPrizeBytes && !isEnterprise) return null;

    return (
        <div className="w-full flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Image Container */}
            <div className="w-full relative aspect-[16/9] md:aspect-[21/9] rounded-2xl overflow-hidden shadow-2xl bg-[var(--brand-secondary)] border border-white/10 group">
                {league.prizeImageUrl ? (
                    <div className="relative w-full h-full">
                        <Image
                            src={league.prizeImageUrl}
                            alt="Premio Mayor"
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        {/* Subtle overlay only at the very bottom to separate from BG if needed */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                    </div>
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-primary)]/20 to-[var(--brand-secondary)] flex items-center justify-center">
                        <Trophy className="w-24 h-24 text-[var(--brand-primary)] opacity-50" />
                    </div>
                )}
            </div>

            {/* Text Content (Outside) */}
            <div className="flex flex-col gap-2 px-1">
                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-[var(--brand-primary)] text-[var(--brand-secondary)] text-[10px] font-black uppercase rounded shadow-lg shadow-[var(--brand-primary)]/30 tracking-widest">
                        Premio Mayor
                    </span>
                </div>

                <h2 className="text-2xl md:text-4xl font-black text-white uppercase italic tracking-tight leading-tight">
                    {league.prizeDetails || 'Premios Especiales'}
                </h2>

                {league.welcomeMessage && (
                    <p className="text-slate-400 text-sm md:text-base font-medium leading-relaxed italic border-l-2 border-[var(--brand-primary)]/30 pl-4 py-1">
                        "{league.welcomeMessage}"
                    </p>
                )}
            </div>
        </div>
    );
};
