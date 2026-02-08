'use client';

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  RotateCcw, 
  Settings, 
  ChevronRight, 
  ChevronLeft, 
  Info,
  Trophy,
  Users,
  Sparkles,
  Command
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface DemoControlPanelProps {
    leagueId: string;
}

export function DemoControlPanel({ leagueId }: DemoControlPanelProps) {
    const [isOpen, setIsOpen] = useState(true);
    const [loading, setLoading] = useState(false);
    const [isDemo, setIsDemo] = useState(false);

    useEffect(() => {
        // En un caso real, esto vendría del metadata de la liga
        // Aquí lo activamos si el ID contiene 'demo'
        if (leagueId.includes('demo')) {
            setIsDemo(true);
        }
    }, [leagueId]);

    if (!isDemo) return null;

    const handleSimulate = async () => {
        setLoading(true);
        try {
            const { data } = await api.post('/demo/simulate');
            toast.success(`¡Partido Simulado! ${data.match}`, {
                description: `Fase: ${data.phase}. Los rankings se están actualizando.`,
                duration: 5000,
            });
            // Refrescar la página para ver cambios si es necesario, 
            // aunque el sistema de predicciones ya tiene SWR.
            // Opcional: window.location.reload();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'No hay más partidos para simular');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async () => {
        if (!confirm('¿Seguro que quieres reiniciar el demo? Se borrarán tus predicciones de prueba.')) return;
        setLoading(true);
        try {
            await api.post('/demo/reset');
            await api.post('/demo/start'); // Re-provision
            toast.success('Entorno demo reiniciado');
            window.location.reload();
        } catch (error) {
            toast.error('Error al reiniciar');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`fixed bottom-24 right-6 z-[100] transition-all duration-500 transform ${isOpen ? 'translate-x-0' : 'translate-x-[calc(100%-2.5rem)]'}`}>
            <div className="flex items-start">
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className="bg-[#00E676] text-[#0F172A] p-2 rounded-l-xl shadow-xl hover:bg-emerald-400 transition-colors mt-4"
                >
                    {isOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>

                <div className="bg-[#1E293B] border-2 border-[#00E676]/30 rounded-xl rounded-tl-none shadow-2xl p-5 w-72 backdrop-blur-md">
                    <div className="flex items-center gap-2 mb-4 border-b border-slate-700 pb-3">
                        <div className="bg-[#00E676]/10 p-2 rounded-lg">
                            <Command size={18} className="text-[#00E676]" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-sm uppercase tracking-wider">Demo Control</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Enterprise Sandbox</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button 
                            onClick={handleSimulate}
                            disabled={loading}
                            className="w-full bg-[#00E676] hover:bg-emerald-400 disabled:opacity-50 text-[#0F172A] font-black py-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                        >
                            <Play size={16} fill="currentColor" />
                            SIMULAR PARTIDO
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                            <button 
                                onClick={handleReset}
                                disabled={loading}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 px-1 rounded-lg flex items-center justify-center gap-1 text-[10px] transition-all"
                            >
                                <RotateCcw size={12} />
                                REINICIAR
                            </button>
                            <button 
                                onClick={() => toast.info('Modo simulación activado')}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 px-1 rounded-lg flex items-center justify-center gap-1 text-[10px] transition-all"
                            >
                                <Settings size={12} />
                                AJUSTES
                            </button>
                        </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-700">
                        <div className="flex items-center gap-2 mb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <Sparkles size={12} className="text-[#00E676]" /> Puntos del Demo
                        </div>
                        <ul className="space-y-2">
                            <li className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-500">Participantes Mock:</span>
                                <span className="text-white font-bold">10</span>
                            </li>
                            <li className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-500">Módulos Activos:</span>
                                <span className="text-[#00E676] font-bold">TODOS</span>
                            </li>
                        </ul>
                    </div>

                    <div className="mt-4 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg flex gap-2 items-start">
                        <Info size={14} className="text-blue-400 shrink-0 mt-0.5" />
                        <p className="text-[9px] text-blue-300 leading-tight">
                            Este panel solo es visible en el Demo Empresarial para simular el comportamiento real del torneo.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
