import React from 'react';
import Image from 'next/image';
import { Trophy } from 'lucide-react';

export const PrizeHero = ({ league }: { league: any }) => {
    // Si no hay imagen ni detalles, no mostramos nada grande.
    // O mostramos un estado "Por Definir" si es Enterprise activo pero no configurado.
    if (!league) return null;

    // Si no es Enterprise, quizás no queramos Hero Section?
    // El requerimiento es "Para Enterprise".
    if (league.type !== 'COMPANY' && !league.isEnterprise) return null;

    return (
        <div className="w-full relative aspect-video md:aspect-[21/9] rounded-2xl overflow-hidden shadow-2xl mb-8 group bg-[var(--brand-secondary)] border border-white/10">
            {league.prizeImageUrl ? (
                <div className="relative w-full h-full">
                    <Image
                        src={league.prizeImageUrl}
                        alt="Premio Mayor"
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                </div>
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-primary)]/20 to-[var(--brand-secondary)] flex items-center justify-center">
                    <Trophy className="w-24 h-24 text-[var(--brand-primary)] opacity-50" />
                </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-6 select-none">
                <div className="transform translate-y-0 transition-transform">
                    {league.prizeDetails && (
                        <span className="inline-block px-3 py-1 bg-[var(--brand-primary)] text-[var(--brand-secondary)] text-xs font-bold uppercase rounded-full mb-2 shadow-lg shadow-[var(--brand-primary)]/20">
                            Premio Mayor
                        </span>
                    )}
                    <h2 className="text-2xl md:text-5xl font-russo text-white mb-2 drop-shadow-lg">
                        {league.prizeDetails || 'Premios Especiales'}
                    </h2>
                    {league.welcomeMessage && (
                        <p className="text-slate-300 text-sm md:text-lg max-w-2xl line-clamp-2">
                            {league.welcomeMessage}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
