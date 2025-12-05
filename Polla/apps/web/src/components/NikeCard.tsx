import { Info } from 'lucide-react';

export default function NikeCard() {
    return (
        <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-5 w-full relative overflow-hidden shadow-xl">
            {/* HEADER (Alineado a la Derecha como pidió el usuario) */}
            <div className="flex flex-col items-end mb-4">
                <span className="text-[#00E676] font-black tracking-widest text-xs font-russo uppercase">
                    GRUPO G
                </span>
                <span className="text-slate-400 text-[10px] font-bold tracking-wide">
                    22 NOV • 14:00
                </span>
            </div>
            {/* GRID DE EQUIPOS (3 Columnas) */}
            <div className="grid grid-cols-[1fr_80px_1fr] gap-2 items-start relative z-10">
                {/* LOCAL */}
                <div className="flex flex-col items-center gap-1">
                    <span className="text-3xl font-black text-white tracking-tighter leading-none font-russo">BRA</span>
                    <img src="https://flagcdn.com/w40/br.png" alt="Brazil" className="w-6 h-auto rounded-[2px] opacity-90 shadow-sm" />
                </div>
                {/* CENTRO (VS + Info) */}
                <div className="flex flex-col items-center justify-center pt-1">
                    {/* Icono Info Centrado */}
                    <div className="bg-[#0F172A] rounded-full p-1 mb-2 cursor-pointer hover:bg-slate-800 transition-colors">
                        <Info className="w-3 h-3 text-slate-400" />
                    </div>
                    <span className="text-slate-500 font-russo text-sm">VS</span>
                </div>
                {/* VISITANTE */}
                <div className="flex flex-col items-center gap-1">
                    <span className="text-3xl font-black text-white tracking-tighter leading-none font-russo">ARG</span>
                    <img src="https://flagcdn.com/w40/ar.png" alt="Argentina" className="w-6 h-auto rounded-[2px] opacity-90 shadow-sm" />
                </div>
            </div>
            {/* CAJA DE RESULTADO / INPUT (Footer) */}
            <div className="mt-5">
                {/* Esta es la caja que cambia de color. Ejemplo: Estado Fallido (Naranja) */}
                <div className="w-full h-12 bg-[#0F172A] rounded-lg border border-slate-700 flex items-center justify-center relative overflow-hidden">
                    {/* Input Placeholder */}
                    <input
                        type="text"
                        placeholder="-"
                        className="bg-transparent text-center text-white text-xl font-russo w-full h-full focus:outline-none focus:border-[#00E676] border border-transparent rounded-lg placeholder-slate-600"
                    />
                </div>
            </div>
        </div>
    );
}
