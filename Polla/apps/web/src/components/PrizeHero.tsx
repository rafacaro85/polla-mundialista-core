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
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-primary)]/20 to-[var(--brand-secondary)] flex flex-col items-center justify-center p-8 text-center">
                        {league.prizeDetails ? (
                            <div className="max-w-2xl animate-in zoom-in-95 duration-500">
                                <Trophy className="w-12 h-12 text-[var(--brand-primary)] mx-auto mb-4 opacity-80" />
                                <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight leading-snug font-russo">
                                    {league.prizeDetails}
                                </h3>
                            </div>
                        ) : (
                            <Trophy className="w-24 h-24 text-[var(--brand-primary)] opacity-50" />
                        )}
                    </div>
                )}
            </div>

            {/* Details Text (Only if Image exists AND Text exists) */}
            {league.prizeImageUrl && league.prizeDetails && (
                <div className="bg-[#1E293B] border border-white/5 p-4 rounded-xl shadow-lg flex items-start gap-4 animate-in slide-in-from-bottom-2">
                    <div className="p-2 bg-[var(--brand-primary)]/10 rounded-lg shrink-0">
                        <Trophy className="w-5 h-5 text-[var(--brand-primary)]" />
                    </div>
                    <div>
                        <h4 className="text-[var(--brand-primary)] text-xs font-black uppercase tracking-widest mb-1">Detalles del Premio</h4>
                        <p className="text-white text-sm leading-relaxed">{league.prizeDetails}</p>
                    </div>
                </div>
            )}
        </div>
    );
};
