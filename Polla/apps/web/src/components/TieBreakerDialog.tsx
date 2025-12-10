import React, { useState } from 'react';
import axios from 'axios';
import { Trophy, Save, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface TieBreakerDialogProps {
    isOpen: boolean;
    onClose: () => void;
    leagueId: string;
    currentGuess?: number | null;
    onSuccess: () => void;
}

export default function TieBreakerDialog({ isOpen, onClose, leagueId, currentGuess, onSuccess }: TieBreakerDialogProps) {
    const [guess, setGuess] = useState<string>(currentGuess?.toString() || '');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!guess) {
            toast.error('Ingresa un valor');
            return;
        }

        const value = parseInt(guess);
        if (isNaN(value) || value < 0) {
            toast.error('Valor inválido');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/tie-breaker`,
                { guess: value },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Predicción guardada');
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Error al guardar');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#1E293B] border border-[#334155] rounded-2xl w-full max-w-sm p-6 shadow-2xl relative animate-in zoom-in-95">

                {/* Header */}
                <div className="text-center mb-6">
                    <div className="mx-auto w-12 h-12 bg-[#00E676]/10 rounded-full flex items-center justify-center mb-3 border border-[#00E676]/30">
                        <Trophy className="text-[#00E676]" size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-white font-russo uppercase tracking-wider">
                        Desempate
                    </h2>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                        Predice el total de goles del Mundial. En caso de empate en puntos, ¡ganará quien se acerque más!
                    </p>
                </div>

                {/* Input */}
                <div className="mb-6">
                    <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-2 block">
                        Goles Totales
                    </label>
                    <input
                        type="number"
                        value={guess}
                        onChange={(e) => setGuess(e.target.value)}
                        placeholder="Ej. 160"
                        className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-3 text-white font-bold text-center text-2xl focus:outline-none focus:border-[#00E676] transition-all placeholder:text-slate-600"
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl text-xs uppercase transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 bg-[#00E676] hover:bg-[#00C853] text-[#0F172A] font-bold py-3 rounded-xl text-xs uppercase transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,230,118,0.4)]"
                    >
                        {loading ? 'Guardando...' : (
                            <>
                                <Save size={16} />
                                Guardar
                            </>
                        )}
                    </button>
                </div>

                {/* Info */}
                <div className="mt-4 flex items-center gap-2 justify-center text-[10px] text-slate-500 bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                    <AlertCircle size={12} />
                    <span>Puedes cambiar esto hasta que inicie el torneo.</span>
                </div>

            </div>
        </div>
    );
}
