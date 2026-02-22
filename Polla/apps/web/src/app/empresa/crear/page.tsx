'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ChevronLeft, ArrowRight, ShieldCheck, Star } from 'lucide-react';
import Link from 'next/link';
import { CreateBusinessLeagueDialog } from '@/components/CreateBusinessLeagueDialog';

export default function EmpresaCrearPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Abrir el modal automáticamente al cargar la página
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsModalOpen(true);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Fonts */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&family=Russo+One&display=swap');
                .font-russo { font-family: 'Russo One', sans-serif; }
            `}</style>

            {/* Background Glows */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00E676] rounded-full blur-[120px] opacity-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600 rounded-full blur-[120px] opacity-10 pointer-events-none" />

            {/* Content Placeholder while modal is initializing */}
            <div className="w-full max-w-2xl relative z-10 flex flex-col items-center text-center">
                <div className="mb-8 opacity-50">
                    <Link
                        href="/gateway"
                        className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
                    >
                        <ChevronLeft size={16} /> Volver al Gateway
                    </Link>
                </div>

                <div className="bg-[#1E293B] border border-[#334155] p-12 rounded-[40px] shadow-2xl flex flex-col items-center gap-6 max-w-md w-full">
                    <div className="w-20 h-20 bg-[#00E676]/10 rounded-3xl flex items-center justify-center text-[#00E676] animate-pulse">
                        <Building2 size={40} />
                    </div>
                    
                    <h1 className="text-3xl font-russo text-white uppercase tracking-wider">
                        Configura tu <span className="text-[#00E676]">Torneo Corporativo</span>
                    </h1>
                    
                    <p className="text-[#94A3B8] text-sm leading-relaxed">
                        Preparamos una experiencia premium para tu empresa. El configurador se abrirá en un momento...
                    </p>

                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="w-full bg-[#00E676] hover:bg-[#00C853] text-[#0F172A] font-black uppercase py-4 rounded-xl shadow-lg shadow-[#00E676]/20 transition-all flex items-center justify-center gap-2"
                    >
                        Abrir Configurador <ArrowRight size={20} />
                    </button>

                    <div className="flex items-center gap-2 text-[10px] text-[#475569] font-bold uppercase tracking-widest mt-2">
                        <ShieldCheck size={14} className="text-[#00E676]" />
                        Entorno Seguro & Enterprise Ready
                    </div>
                </div>

                {/* Footer Badges */}
                <div className="mt-12 flex gap-8 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
                    <div className="flex items-center gap-2 text-white font-bold text-xs">
                        <Star size={16} className="text-[#00E676]" />
                        PREMIUM STUDIO
                    </div>
                    <div className="flex items-center gap-2 text-white font-bold text-xs text-nowrap">
                        <Building2 size={16} className="text-[#00E676]" />
                        MARCA BLANCA
                    </div>
                </div>
            </div>

            {/* MODAL EMPRESARIAL */}
            <CreateBusinessLeagueDialog 
                open={isModalOpen} 
                onOpenChange={setIsModalOpen}
            />
        </div>
    );
}
