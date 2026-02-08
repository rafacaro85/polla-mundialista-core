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
        // Check for both Demo UUIDs
        const DEMO_ENTERPRISE_UUID = '00000000-0000-0000-0000-000000001337';
        const DEMO_SOCIAL_UUID = '00000000-0000-0000-0000-000000001338';
        if (leagueId.includes('demo') || leagueId === DEMO_ENTERPRISE_UUID || leagueId === DEMO_SOCIAL_UUID) {
            setIsDemo(true);
        }
    }, [leagueId]);

    if (!isDemo) return null;

    const handleSimulate = async (count: number = 1) => {
        setLoading(true);
        const promise = count > 1 
            ? api.post('/demo/simulate', { count })
            : api.post('/demo/simulate');

        toast.promise(promise, {
            loading: count > 1 ? `Simulando fase completa...` : 'Simulando partido...',
            success: (res: any) => {
                const data = res.data;
                // Auto-refresh after 1.5s to see changes
                setTimeout(() => window.location.reload(), 1500);

                if (count > 1) {
                    return `¡Fase Completa! Se avanzaron ${data.count} partidos.`;
                }
                return `¡Partido Simulado! ${data.match}`;
            },
            error: (err) => err.response?.data?.message || 'No hay más partidos para simular'
        });
        
        try {
            await promise;
        } catch (e) {
            // Error handled by toast.promise
        } finally {
            setLoading(false);
        }
    };

    const handleSimulatePhase = async () => {
        setLoading(true);
        const promise = api.post('/demo/simulate', { count: 999 }); // Large number to simulate entire phase

        toast.promise(promise, {
            loading: 'Simulando toda la fase...',
            success: (res: any) => {
                const data = res.data;
                setTimeout(() => window.location.reload(), 1500);
                return `¡Fase Completa! Se simularon ${data.count} partidos.`;
            },
            error: (err) => err.response?.data?.message || 'Error al simular fase'
        });
        
        try {
            await promise;
        } catch (e) {
            // Error handled by toast.promise
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async () => {
        if (!confirm('¿Seguro? Esto borrará tus predicciones Y los resultados del mundial para volver a empezar.')) return;
        setLoading(true);
        try {
            await api.post('/demo/reset');
            await api.post('/demo/start'); // Re-provision fresh
            toast.success('¡Demo Reiniciado! El mundial vuelve a empezar.');
            window.location.reload();
        } catch (error) {
            toast.error('Error al reiniciar');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBonus = async () => {
        const text = prompt('Pregunta Bonus (ej: ¿Quién será el campeón?):', '¿Quién será el goleador del torneo?');
        if (!text) return;
        
        setLoading(true);
        try {
            await api.post('/demo/bonus', { text, points: 50 });
            toast.success('¡Pregunta Bonus Creada!', {
                description: 'Los participantes ya pueden responderla.'
            });
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            toast.error('Error al crear bonus');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`fixed bottom-24 right-6 z-[100] transition-all duration-500 transform ${isOpen ? 'translate-x-0' : 'translate-x-[calc(100%-2rem)]'}`}>
            <div className="flex items-start">
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className="bg-[#00E676] text-[#0F172A] p-2 rounded-l-xl shadow-xl hover:bg-emerald-400 transition-colors mt-4"
                >
                    {isOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>

                <div className="bg-[#1E293B] border-2 border-[#00E676]/30 rounded-xl rounded-tl-none shadow-2xl p-5 w-80 backdrop-blur-md">
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
                        <div className="flex flex-col gap-2">
                             <button 
                                onClick={() => handleSimulate(1)}
                                disabled={loading}
                                className="w-full bg-[#00E676] hover:bg-emerald-400 disabled:opacity-50 text-[#0F172A] font-black py-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                            >
                                <Play size={16} fill="currentColor" />
                                SIMULAR 1 PARTIDO
                            </button>
                            <button 
                                onClick={handleSimulatePhase}
                                disabled={loading}
                                className="w-full bg-[#00E676]/20 border border-[#00E676]/30 hover:bg-[#00E676]/30 text-[#00E676] font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 text-xs"
                            >
                                <Sparkles size={14} />
                                SIMULAR TODA LA FASE
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <button 
                                onClick={handleReset}
                                disabled={loading}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 px-1 rounded-lg flex items-center justify-center gap-1 text-[10px] transition-all uppercase tracking-tighter"
                            >
                                <RotateCcw size={12} />
                                REINICIAR TODO
                            </button>
                            <button 
                                onClick={handleCreateBonus}
                                disabled={loading}
                                className="bg-purple-600/20 border border-purple-500/30 hover:bg-purple-500/30 text-purple-300 font-bold py-3 px-1 rounded-lg flex items-center justify-center gap-1 text-[10px] transition-all uppercase tracking-tighter"
                            >
                                <Sparkles size={12} />
                                CREAR BONUS
                            </button>
                        </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-700">
                        <div className="flex items-center gap-2 mb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <Info size={12} className="text-[#00E676]" /> Estado del Sandbox
                        </div>
                        <ul className="space-y-2">
                            <li className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-500">Participantes:</span>
                                <span className="text-white font-bold">10 Mock + Admin</span>
                            </li>
                            <li className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-500">Modo:</span>
                                <span className="text-[#00E676] font-bold">MÁXIMA VELOCIDAD</span>
                            </li>
                        </ul>
                    </div>

                    <div className="mt-4 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <p className="text-[9px] text-blue-300 leading-tight">
                            Este panel simula el paso del tiempo. Al simular partidos, verás como el ranking y las llaves se actualizan instantáneamente.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
